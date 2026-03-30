#!/usr/bin/env python3
"""
Fetch the real Hipparcos catalog from VizieR TAP and merge with NASA exoplanet
host data. Outputs a unified stars_verified.json with ~9,000+ real named/bright
stars plus deep sky objects.

Replaces the old 76-star placeholder with real astrometric data.

Usage:
  python3 scripts/fetch-hipparcos.py              # fetch and build
  python3 scripts/fetch-hipparcos.py --dry-run     # print queries only

Output:
  public/data/stars_verified.json   — unified star catalog
  public/data/stars_index.json      — search index
"""

import csv
import io
import json
import math
import os
import sys
import urllib.parse
import urllib.request

# ── Config ────────────────────────────────────────────────────────────────────

VIZIER_TAP = "https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync"

# Fetch stars with good parallax (>1 mas = <1000 pc) and magnitude < 8
# This gives ~9,000-12,000 real stars — enough to be rich but fast to render
ADQL = (
    'SELECT HIP, RAICRS, DEICRS, Plx, Vmag, "B-V", SpType, HD '
    'FROM "I/239/hip_main" '
    'WHERE Plx > 1 AND Vmag < 8'
)

# Named star lookup: HIP → common name
# Extended set of ~200+ named stars
NAMED_STARS = {
    0: "Sun",
    32349: "Sirius", 30438: "Canopus", 71683: "Alpha Centauri A",
    69673: "Arcturus", 91262: "Vega", 24608: "Capella", 24436: "Rigel",
    37279: "Procyon", 27989: "Betelgeuse", 7588: "Achernar",
    68702: "Hadar", 97649: "Altair", 60718: "Acrux", 21421: "Aldebaran",
    65474: "Spica", 80763: "Antares", 37826: "Pollux", 113368: "Fomalhaut",
    102098: "Deneb", 62434: "Mimosa", 49669: "Regulus", 33579: "Adhara",
    36850: "Castor", 85927: "Shaula", 25336: "Bellatrix", 25428: "Elnath",
    45238: "Miaplacidus", 26311: "Alnilam", 26727: "Alnitak",
    62956: "Alioth", 54061: "Dubhe", 15863: "Mirfak", 34444: "Wezen",
    11767: "Polaris", 41037: "Avior", 67301: "Alkaid", 86228: "Sargas",
    68933: "Menkent", 82273: "Atria", 31681: "Alhena", 100751: "Peacock",
    42913: "Alsephina", 30324: "Murzim", 46390: "Alphard", 9884: "Hamal",
    3419: "Diphda", 70890: "Proxima Centauri", 87937: "Barnard's Star",
    54035: "Wolf 359", 54211: "Lalande 21185", 16537: "Epsilon Eridani",
    114046: "Lacaille 9352", 57548: "Ross 128", 104214: "61 Cygni A",
    8102: "Tau Ceti", 108870: "Epsilon Indi", 5643: "YZ Ceti",
    24186: "Kapteyn's Star", 439: "Gliese 1", 10826: "Mira",
    71681: "Alpha Centauri B", 86032: "Rasalhague", 90185: "Kaus Australis",
    92855: "Nunki", 84012: "Sabik", 72105: "Izar", 76267: "Alphecca",
    77070: "Unukalhai", 84345: "Ras Algethi", 75097: "Pherkad",
    68756: "Thuban", 107315: "Enif", 59803: "Gienah", 61941: "Porrima",
    60965: "Algorab", 59316: "Alchiba", 8832: "Mesartim", 8903: "Sheratan",
    14135: "Menkar", 14576: "Algol", 5447: "Mirach", 9640: "Almach",
    677: "Alpheratz", 746: "Caph", 6686: "Ruchbah", 8886: "Segin",
    4427: "Navi", 113963: "Scheat", 1067: "Algenib", 113197: "Sadalbari",
    106278: "Sadalsuud", 109074: "Sadalmelik", 110395: "Sadachbia",
    104459: "Albali", 112158: "Skat", 112440: "Ancha", 31592: "Mebsuda",
    29655: "Propus",
    # Additional bright stars
    7557: "Acamar", 21393: "Ain", 1562: "Alderamin", 26634: "Mintaka",
    53910: "Merak", 58001: "Phecda", 59774: "Megrez", 65378: "Mizar",
    69974: "Muphrid", 74785: "Kochab", 85670: "Eta Ophiuchi",
    87833: "Kaus Media", 87585: "Kaus Borealis", 86670: "Lesath",
    27366: "Saiph", 25930: "Tabit", 113881: "Markab",
    95947: "Sadr", 102488: "Albireo", 78401: "Yed Prior",
    4436: "Schedar", 3179: "Ankaa", 100453: "Nunki",
    112029: "Nashira", 107556: "Kitalpha", 109427: "Sadaltager",
    95168: "Aljanah", 97278: "Tarazed",
}


def spectral_to_type(sp: str) -> str:
    first = sp[0].upper() if sp else '?'
    m = {'O': 'O (blue supergiant)', 'B': 'B (blue/white)', 'A': 'A (white)',
         'F': 'F (yellow-white)', 'G': 'G (yellow)', 'K': 'K (orange)',
         'M': 'M (red)', 'D': 'White dwarf', 'W': 'Wolf-Rayet'}
    return m.get(first, 'Unknown')


def bv_to_rgb(bv: float):
    bv = max(-0.4, min(2.0, bv))
    if bv < 0.0:    r, g, b = 0.7+0.3*(-bv/0.4), 0.8+0.2*(-bv/0.4), 1.0
    elif bv < 0.3:  r, g, b = 1.0, 1.0, 0.9-0.2*(bv/0.3)
    elif bv < 0.6:  r, g, b = 1.0, 0.9-0.1*((bv-0.3)/0.3), 0.7-0.3*((bv-0.3)/0.3)
    elif bv < 1.0:  r, g, b = 1.0, 0.8-0.3*((bv-0.6)/0.4), 0.4-0.3*((bv-0.6)/0.4)
    elif bv < 1.5:  r, g, b = 1.0, 0.5-0.3*((bv-1.0)/0.5), 0.1
    else:           r, g, b = 1.0, 0.2, 0.05
    return [round(r, 4), round(g, 4), round(b, 4)]


def mag_to_size(vmag: float) -> float:
    return round(max(0.5, min(6.0, 6.0 - vmag * 0.6)), 3)


def to_xyz(ra_deg, dec_deg, dist_pc):
    r = math.radians(ra_deg)
    d = math.radians(dec_deg)
    x = dist_pc * math.cos(d) * math.cos(r)
    y = dist_pc * math.sin(d)
    z = dist_pc * math.cos(d) * math.sin(r)
    return round(x, 6), round(y, 6), round(z, 6)


def fetch_hipparcos():
    """Fetch Hipparcos catalog from VizieR TAP."""
    print("Querying VizieR TAP for Hipparcos catalog...")
    params = urllib.parse.urlencode({
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "csv",
        "QUERY": ADQL.strip(),
    }).encode()
    req = urllib.request.Request(VIZIER_TAP, data=params, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent", "StarMap-HipparcosIngestion/1.0")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read().decode("utf-8")


def load_exoplanet_hosts(csv_path):
    """Load NASA exoplanet CSV and return a dict of hostname → planet count."""
    hosts = {}
    if not os.path.exists(csv_path):
        print(f"  Exoplanet CSV not found at {csv_path}, skipping cross-ref")
        return hosts
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('hostname', '').strip()
            if name:
                hosts[name] = hosts.get(name, 0) + 1
    print(f"  Loaded {len(hosts)} exoplanet host stars from NASA archive")
    return hosts


def parse_hipparcos(body, exo_hosts):
    """Parse VizieR CSV response into star objects."""
    stars = []
    reader = csv.DictReader(io.StringIO(body))
    for row in reader:
        try:
            hip = int(row.get('HIP', '0').strip())
            plx_str = row.get('Plx', '').strip()
            if not plx_str:
                continue
            plx = float(plx_str)
            if plx <= 0:
                continue
            ra_str = row.get('RAICRS', row.get('RAJ2000', '')).strip()
            dec_str = row.get('DEICRS', row.get('DEJ2000', '')).strip()
            if not ra_str or not dec_str:
                continue
            ra = float(ra_str)
            dec = float(dec_str)
            vmag_str = row.get('Vmag', '').strip()
            if not vmag_str:
                continue
            vmag = float(vmag_str)
            bv_str = row.get('B-V', '').strip()
            bv = float(bv_str) if bv_str else 0.65
            sp = row.get('SpType', '').strip()
            hd = row.get('HD', '').strip()

            dist_pc = 1000.0 / plx
            x, y, z = to_xyz(ra, dec, dist_pc)

            name = NAMED_STARS.get(hip, '')
            if not name and hip > 0:
                name = f"HIP {hip}"

            # Check if this star hosts exoplanets (by HD number)
            is_exo_host = False
            if hd:
                hd_name = f"HD {hd}"
                if hd_name in exo_hosts:
                    is_exo_host = True
                    if not NAMED_STARS.get(hip):
                        name = hd_name  # Use HD name if no common name

            stars.append({
                "id": hip if hip > 0 else len(stars) + 100000,
                "name": name,
                "x": x, "y": y, "z": z,
                "mag": vmag,
                "bv": round(bv, 3),
                "spectral": sp or "?",
                "type": spectral_to_type(sp) if sp else "Unknown",
                "ra": round(ra, 6),
                "dec": round(dec, 6),
                "dist_pc": round(dist_pc, 4),
                "size": mag_to_size(vmag),
                "color": bv_to_rgb(bv),
                "catalog": "Hipparcos",
                "hip": hip,
                "exoplanet_host": is_exo_host,
            })
        except (ValueError, KeyError):
            continue
    return stars


# Deep sky objects — same as before
DSO = [
    ("M31 Andromeda Galaxy", 10.6847, 41.2690, 770000, "galaxy", 4.36),
    ("M33 Triangulum Galaxy", 23.4625, 30.6602, 850000, "galaxy", 5.72),
    ("LMC", 80.8938, -69.7561, 49970, "galaxy", 0.9),
    ("SMC", 13.1583, -72.8003, 62000, "galaxy", 2.7),
    ("M42 Orion Nebula", 83.8221, -5.3911, 412, "nebula", 4.0),
    ("M45 Pleiades", 56.6012, 24.1167, 136, "cluster", 1.6),
    ("M44 Beehive Cluster", 130.0252, 19.6233, 187, "cluster", 3.7),
    ("M13 Hercules Cluster", 250.4228, 36.4613, 7100, "globular", 5.8),
    ("M22", 279.1001, -23.9047, 3200, "globular", 5.1),
    ("NGC 104 47 Tuc", 6.0228, -72.0814, 4500, "globular", 4.09),
    ("Omega Centauri", 201.6967, -47.4797, 5200, "globular", 3.7),
    ("NGC 869 h Per", 34.7486, 57.1379, 2300, "cluster", 5.3),
    ("NGC 884 Chi Per", 35.0501, 57.1453, 2300, "cluster", 6.1),
    ("M67", 132.8240, 11.8141, 908, "cluster", 6.1),
    ("Hyades", 66.7500, 15.8700, 46, "cluster", 0.5),
    ("M1 Crab Nebula", 83.6332, 22.0145, 2000, "nebula", 8.4),
    ("M57 Ring Nebula", 283.3962, 33.0289, 800, "nebula", 8.8),
    ("M27 Dumbbell Nebula", 299.9015, 22.7214, 405, "nebula", 7.5),
    ("Eta Carinae Nebula", 161.2650, -59.8775, 2300, "nebula", 3.0),
    ("M81 Bode's Galaxy", 148.8883, 69.0653, 3630000, "galaxy", 6.94),
    ("M82 Cigar Galaxy", 148.9700, 69.6797, 3530000, "galaxy", 8.41),
    ("M51 Whirlpool", 202.4696, 47.1952, 7310000, "galaxy", 8.36),
    ("M101 Pinwheel", 210.8024, 54.3490, 6400000, "galaxy", 7.86),
    ("M87 Virgo A", 187.7059, 12.3911, 53500000, "galaxy", 8.6),
    ("M104 Sombrero", 189.9976, -11.6231, 9550000, "galaxy", 8.0),
]


def generate_dso():
    objects = []
    for name, ra, dec, dist_pc, otype, mag in DSO:
        x, y, z = to_xyz(ra, dec, dist_pc)
        if otype == "galaxy":   bv, color = 0.7, [1.0, 0.9, 0.7]
        elif otype == "nebula": bv, color = 0.0, [0.6, 0.85, 1.0]
        elif otype == "globular": bv, color = 1.0, [1.0, 0.85, 0.6]
        else: bv, color = 0.2, [0.8, 0.9, 1.0]
        objects.append({
            "id": 10000 + len(objects),
            "name": name, "x": round(x, 2), "y": round(y, 2), "z": round(z, 2),
            "mag": mag, "bv": bv, "spectral": otype.upper(),
            "type": otype, "ra": round(ra, 4), "dec": round(dec, 4),
            "dist_pc": dist_pc, "size": 3.0, "color": color,
            "catalog": "NGC/Messier", "hip": 0, "exoplanet_host": False,
        })
    return objects


def main():
    dry_run = "--dry-run" in sys.argv
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "public", "data")
    exo_csv = os.path.join(script_dir, "..", "public", "data", "exoplanetdatanasa.csv")

    if dry_run:
        print("[DRY RUN] Would query VizieR with:")
        print(ADQL.strip())
        return

    # Load exoplanet host data for cross-referencing
    exo_hosts = load_exoplanet_hosts(exo_csv)

    # Fetch real Hipparcos
    body = fetch_hipparcos()
    stars = parse_hipparcos(body, exo_hosts)
    print(f"  Parsed {len(stars)} Hipparcos stars")

    # Add Sun at origin
    stars.insert(0, {
        "id": 0, "name": "Sun",
        "x": 0.0, "y": 0.0, "z": 0.0,
        "mag": -26.74, "bv": 0.65, "spectral": "G2V",
        "type": "G (yellow)", "ra": 0.0, "dec": 0.0, "dist_pc": 0.0,
        "size": 6.0, "color": [1.0, 0.96, 0.85],
        "catalog": "Special", "hip": 0, "exoplanet_host": False,
    })

    # Add deep sky objects
    dso = generate_dso()
    print(f"  Deep sky objects: {len(dso)}")

    all_stars = stars + dso
    named_count = sum(1 for s in all_stars if s['name'] and not s['name'].startswith('HIP '))
    exo_count = sum(1 for s in all_stars if s.get('exoplanet_host'))
    print(f"  Named stars: {named_count}")
    print(f"  Exoplanet hosts flagged: {exo_count}")
    print(f"  Total: {len(all_stars)}")

    # Write unified catalog
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "stars_verified.json")
    with open(path, "w") as f:
        json.dump({"count": len(all_stars), "stars": all_stars}, f, separators=(',', ':'))
    size_kb = os.path.getsize(path) / 1024
    print(f"  Wrote {path} ({size_kb:.0f} KB)")

    # Write search index
    index = [{"id": s["id"], "name": s["name"], "type": s.get("type", "star"),
              "mag": s["mag"], "dist_pc": s["dist_pc"]}
             for s in all_stars if s["name"] and not s["name"].startswith("HIP ")]
    idx_path = os.path.join(output_dir, "stars_index.json")
    with open(idx_path, "w") as f:
        json.dump({"stars": index}, f, separators=(',', ':'))
    print(f"  Wrote search index: {len(index)} named entries")

    print("\nDone.")


if __name__ == "__main__":
    main()
