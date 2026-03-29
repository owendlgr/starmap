#!/usr/bin/env python3
"""
Star catalog generator for the 3D star map.
Generates a realistic dataset combining:
  - Named bright stars with real HIP/Tycho coordinates
  - Statistically distributed faint stars (~Milky Way density profile)
Output: public/data/stars.json (chunks by magnitude band)
"""

import json, math, random, os

random.seed(42)

# ── Real named/bright stars ────────────────────────────────────────────────
# (name, RA_deg, Dec_deg, parallax_mas, Vmag, BV, spectral_type, HIP_id)
NAMED_STARS = [
    ("Sun",                0.0,      0.0,      0.0,      -26.74,  0.65, "G2V",   0),
    ("Sirius",             101.2872, -16.7162, 379.21,   -1.46,   0.00, "A1V",   32349),
    ("Canopus",            95.9879,  -52.6958, 10.43,    -0.74,   0.15, "A9II",  30438),
    ("Alpha Centauri A",   219.9020, -60.8358, 742.12,   -0.01,   0.71, "G2V",   71683),
    ("Arcturus",           213.9154, 19.1822,  88.83,    -0.05,   1.23, "K1III", 69673),
    ("Vega",               279.2348, 38.7837,  130.23,   0.03,    0.00, "A0V",   91262),
    ("Capella",            79.1723,  45.9980,  77.29,    0.08,    0.80, "G8III", 24608),
    ("Rigel",              78.6345,  -8.2016,  4.22,     0.13,   -0.03, "B8Ia",  24436),
    ("Procyon",            114.8276, 5.2249,   285.93,   0.34,    0.43, "F5IV",  37279),
    ("Betelgeuse",         88.7929,  7.4070,   6.55,     0.42,    1.77, "M1Ia",  27989),
    ("Achernar",           24.4285,  -57.2367, 22.68,    0.46,   -0.16, "B3V",   7588),
    ("Hadar",              210.9559, -60.3731, 6.21,     0.61,   -0.23, "B1II",  68702),
    ("Altair",             297.6958, 8.8683,   194.95,   0.76,    0.22, "A7V",   97649),
    ("Acrux",              186.6497, -63.0990, 10.17,    0.77,   -0.24, "B0IV",  60718),
    ("Aldebaran",          68.9802,  16.5093,  50.09,    0.86,    1.54, "K5III", 21421),
    ("Spica",              201.2983, -11.1614, 12.44,    0.97,   -0.24, "B1V",   65474),
    ("Antares",            247.3519, -26.4320, 5.89,     1.06,    1.83, "M1Ib",  80763),
    ("Pollux",             116.3289, 28.0262,  96.74,    1.15,    1.00, "K0III", 37826),
    ("Fomalhaut",          344.4127, -29.6223, 130.08,   1.17,    0.09, "A4V",   113368),
    ("Deneb",              310.3580, 45.2803,  2.31,     1.25,    0.09, "A2Ia",  102098),
    ("Mimosa",             191.9303, -59.6885, 9.25,     1.25,   -0.24, "B0III", 62434),
    ("Regulus",            152.0930, 11.9672,  42.09,    1.36,   -0.11, "B7V",   49669),
    ("Adhara",             104.6565, -28.9720, 7.57,     1.50,   -0.21, "B2Ia",  33579),
    ("Castor",             113.6497, 31.8883,  63.27,    1.57,    0.04, "A2V",   36850),
    ("Shaula",             263.4022, -37.1038, 4.64,     1.62,   -0.22, "B2IV",  85927),
    ("Bellatrix",          81.2827,  6.3497,   12.92,    1.64,   -0.22, "B2III", 25336),
    ("Elnath",             81.5732,  28.6074,  24.89,    1.65,   -0.13, "B7III", 25428),
    ("Miaplacidus",        138.2999, -69.7172, 29.34,    1.68,    0.07, "A2V",   45238),
    ("Alnilam",            84.0534,  -1.2019,  2.43,     1.69,   -0.19, "B0Ia",  26311),
    ("Alnitak",            85.1896,  -1.9426,  3.99,     1.74,   -0.21, "O9Ib",  26727),
    ("Alioth",             193.5073, 55.9598,  40.30,    1.76,   -0.02, "A0p",   62956),
    ("Dubhe",              165.9319, 61.7511,  26.38,    1.81,    1.06, "K0III", 54061),
    ("Mirfak",             51.0808,  49.8612,  5.51,     1.81,    0.48, "F5Ib",  15863),
    ("Wezen",              107.0978, -26.3932, 1.82,     1.83,    0.67, "F8Ia",  34444),
    ("Polaris",            37.9529,  89.2641,  7.54,     1.97,    0.64, "F7Ib",  11767),
    ("Avior",              125.6284, -59.5095, 5.64,     1.86,    1.28, "K3III", 41037),
    ("Alkaid",             206.8852, 49.3134,  32.39,    1.85,   -0.19, "B3V",   67301),
    ("Sargas",             264.3297, -42.9978, 8.44,     1.86,    0.40, "F1II",  86228),
    ("Menkent",            211.6708, -36.3700, 54.95,    2.06,    1.02, "K0III", 68933),
    ("Atria",              252.1662, -69.0278, 8.35,     1.91,    1.44, "K2Ib",  82273),
    ("Alhena",             99.4279,  16.3993,  32.12,    1.93,    0.00, "A0IV",  31681),
    ("Peacock",            306.4122, -56.7350, 17.80,    1.93,   -0.20, "B2IV",  100751),
    ("Alsephina",          130.8059, -54.7084, 30.57,    1.93,    0.04, "A2V",   42913),
    ("Murzim",             95.6748,  -17.9559, 5.07,     1.98,   -0.24, "B1III", 30324),
    ("Alphard",            141.8965, -8.6586,  18.40,    1.99,    1.44, "K3III", 46390),
    ("Hamal",              31.7933,  23.4624,  49.48,    2.01,    1.15, "K2III", 9884),
    ("Diphda",             10.8973,  -17.9866, 34.02,    2.04,    1.02, "K0IV",  3419),
    ("Proxima Centauri",   217.4290, -62.6795, 768.50,  11.13,    1.90, "M5V",   70890),
    ("Barnard's Star",     269.4521, 4.6933,   548.31,   9.54,    1.57, "M4Ve",  87937),
    ("Wolf 359",           164.1203, 7.0151,   414.54,  13.53,    2.03, "M6Ve",  54035),
    ("Lalande 21185",      168.8668, 36.2019,  392.64,   7.47,    1.52, "M2V",   54211),
    ("Luyten 726-8 A",     24.7545,  -17.9436, 373.70,  12.41,    1.98, "M5.5Ve",0),
    ("Sirius B",           101.2872, -16.7162, 379.21,   8.44,   -0.04, "DA2",   32349),
    ("Ross 154",           283.8569, -23.8344, 336.17,  10.43,    1.77, "M3.5V", 0),
    ("Ross 248",           356.3312, 44.1789,  316.00,  12.29,    1.91, "M6Ve",  0),
    ("Epsilon Eridani",    53.2327,  -9.4583,  310.94,   3.73,    0.88, "K2V",   16537),
    ("Lacaille 9352",      346.4684, -35.8530, 303.89,   7.34,    1.52, "M1.5V", 114046),
    ("Ross 128",           176.9301, 0.8021,   298.70,  11.13,    1.73, "M4V",   57548),
    ("61 Cygni A",         316.7313, 38.7497,  286.94,   5.21,    1.18, "K5V",   104214),
    ("Tau Ceti",           26.0171,  -15.9375, 273.96,   3.50,    0.72, "G8V",   8102),
    ("Epsilon Indi",       330.8400, -56.7867, 275.79,   4.69,    1.06, "K5Ve",  108870),
    ("YZ Ceti",            16.5540,  -16.6666, 269.30,  12.02,    1.89, "M4.5V", 5643),
    ("Luyten's Star",      113.3131, 5.2259,   263.50,   9.86,    1.68, "M3.5V", 0),
    ("Kapteyn's Star",     77.8437,  -45.0175, 255.63,   8.86,    1.57, "M1V",   24186),
    ("Gliese 1",           0.8913,   -37.3597, 229.32,   8.55,    1.56, "M2V",   439),
    ("Van Maanen's Star",  36.4337,  5.4076,   232.00,  12.36,   -0.04, "DZ7",   0),
    ("Mira",               34.8367,  -2.9777,  9.30,     6.47,    1.50, "M7IIIe",10826),
    ("Rigil Kentaurus B",  219.9020, -60.8358, 742.12,   1.33,    0.88, "K1V",   71681),
    ("Rasalhague",         263.7334, 12.5600,  69.84,    2.08,    0.15, "A5III", 86032),
    ("Kaus Australis",     276.0430, -34.3846, 22.55,    1.85,    0.06, "B9.5V", 90185),
    ("Nunki",              283.8164, -26.2967, 14.28,    2.02,   -0.20, "B2.5V", 92855),
    ("Sabik",              258.0379, -15.7247, 25.48,    2.43,    0.06, "A2V",   84012),
    ("Izar",               221.2463, 27.0742,  44.10,    2.35,    1.00, "K0II",  72105),
    ("Alphecca",           233.6720, 26.7146,  43.46,    2.23,    0.03, "A0V",   76267),
    ("Unukalhai",          236.0669, 6.4255,   42.76,    2.65,    1.17, "K2III", 77070),
    ("Ras Algethi",        258.6619, 14.3892,  8.52,     3.13,    1.15, "M5Ib",  84345),
    ("Pherkad",            230.1823, 71.8340,  38.78,    3.05,    0.00, "A3III", 75097),
    ("Thuban",             211.0931, 64.3758,  10.76,    3.67,    0.10, "A0III", 68756),
    ("Enif",               326.0428, 9.8750,   4.85,     2.40,    1.52, "K2Ib",  107315),
    ("Gienah",             183.7863, -17.5419, 21.27,    2.59,   -0.11, "B8III", 59803),
    ("Porrima",            190.4153, -1.4493,  83.84,    2.74,    0.36, "F0V",   61941),
    ("Algorab",            187.4660, -16.5153, 37.00,    2.94,   -0.05, "B9.5V", 60965),
    ("Alchiba",            180.9978, -24.7286, 66.19,    4.02,    0.38, "F2V",   59316),
    ("Mesartim",           28.6600,  19.2936,  20.22,    3.88,   -0.10, "B9V",   8832),
    ("Sheratan",           28.6602,  20.8082,  58.91,    2.64,    0.13, "A5V",   8903),
    ("Menkar",             45.5699,  4.0897,   14.82,    2.53,    1.64, "M2III", 14135),
    ("Algol",              47.0422,  40.9557,  34.10,    2.12,   -0.05, "B8V",   14576),
    ("Mirach",             17.4330,  35.6205,  16.36,    2.07,    1.57, "M0III", 5447),
    ("Almach",             30.9745,  42.3296,  9.19,     2.10,    1.36, "K3II",  9640),
    ("Alpheratz",          2.0969,   29.0907,  33.62,    2.07,   -0.11, "B9p",   677),
    ("Caph",               2.2943,   59.1498,  59.57,    2.27,    0.34, "F2III", 746),
    ("Ruchbah",            21.4543,  60.2353,  32.61,    2.68,    0.13, "A5V",   6686),
    ("Segin",              28.5983,  63.6700,  14.14,    3.35,   -0.15, "B3IV",  8886),
    ("Navi",               14.1771,  60.7165,  5.63,     2.47,   -0.15, "B0.5IV",4427),
    ("Scheat",             345.9437, 28.0828,  19.56,    2.42,    1.67, "M2II",  113963),
    ("Markab",             346.1901, 15.2054,  23.36,    2.49,   -0.03, "B9III", 113963),
    ("Algenib",            3.3090,   15.1836,  3.35,     2.83,   -0.23, "B2IV",  1067),
    ("Deneb Kaitos",       10.8973,  -17.9866, 34.02,    2.04,    1.02, "K0IV",  3419),
    ("Sadalbari",          340.6497, 33.7171,  10.96,    3.48,    0.60, "G5II",  113197),
    ("Sadalsuud",          322.8900, -5.5712,  7.13,     2.90,    0.83, "G0Ib",  106278),
    ("Sadalmelik",         331.4462, -0.3198,  9.04,     2.96,    0.99, "G2Ib",  109074),
    ("Sadachbia",          335.4141, -1.3875,  16.04,    3.85,    0.36, "A3V",   110395),
    ("Albali",             316.6635, -9.4957,  18.89,    3.77,    0.28, "A2V",   104459),
    ("Skat",               340.5302, -15.8208, 20.28,    3.27,    0.13, "A3V",   112158),
    ("Ancha",              341.8143, -7.7836,  18.73,    4.17,    1.00, "K0III", 112440),
    ("Sirius in Argo",      95.9879, -52.6958, 10.43,   -0.74,    0.15, "A9II",  30438),
    ("Mekbuda",            100.9832, 20.5704,  3.40,     3.78,    0.90, "G0Ib",  31592),
    ("Propus",             93.7155,  22.5065,  16.84,    3.29,    1.60, "M6III", 29655),
    ("Mebsuda",            99.4279,  25.1311,  14.13,    2.98,    1.40, "G8Ib",  31592),
]


def bv_to_rgb(bv: float) -> tuple:
    """Convert B-V color index to normalized RGB float tuple."""
    bv = max(-0.4, min(2.0, bv))
    if bv < 0.0:      r, g, b = 0.7 + 0.3*(-bv/0.4), 0.8 + 0.2*(-bv/0.4), 1.0
    elif bv < 0.3:    r, g, b = 1.0, 1.0, 0.9 - 0.2*(bv/0.3)
    elif bv < 0.6:    r, g, b = 1.0, 0.9 - 0.1*((bv-0.3)/0.3), 0.7 - 0.3*((bv-0.3)/0.3)
    elif bv < 1.0:    r, g, b = 1.0, 0.8 - 0.3*((bv-0.6)/0.4), 0.4 - 0.3*((bv-0.6)/0.4)
    elif bv < 1.5:    r, g, b = 1.0, 0.5 - 0.3*((bv-1.0)/0.5), 0.1
    else:             r, g, b = 1.0, 0.2, 0.05
    return (round(r, 4), round(g, 4), round(b, 4))


def star_to_xyz(ra_deg: float, dec_deg: float, parallax_mas: float):
    """RA/Dec/parallax → (x, y, z) in parsecs. Returns None if no distance."""
    if parallax_mas <= 0:
        return None
    distance_pc = 1000.0 / parallax_mas
    ra_r  = math.radians(ra_deg)
    dec_r = math.radians(dec_deg)
    x = distance_pc * math.cos(dec_r) * math.cos(ra_r)
    y = distance_pc * math.cos(dec_r) * math.sin(ra_r)
    z = distance_pc * math.sin(dec_r)
    return (round(x, 6), round(y, 6), round(z, 6))


def mag_to_size(vmag: float) -> float:
    """Visual magnitude → normalized point size [0.5, 6]."""
    return round(max(0.5, min(6.0, 6.0 - vmag * 0.6)), 3)


def spectral_to_type_label(sptype: str) -> str:
    first = sptype[0] if sptype else '?'
    mapping = {'O':'O (blue supergiant)', 'B':'B (blue/white)', 'A':'A (white)',
               'F':'F (yellow-white)', 'G':'G (yellow)', 'K':'K (orange)',
               'M':'M (red)', 'D':'White dwarf', 'W':'Wolf-Rayet', 'L':'L (brown dwarf)'}
    return mapping.get(first, 'Unknown')


def generate_named_stars():
    """Process the curated named star list."""
    stars = []
    # Sun is special: place at origin
    stars.append({
        "id": 0, "name": "Sun",
        "x": 0.0, "y": 0.0, "z": 0.0,
        "mag": -26.74, "bv": 0.65, "spectral": "G2V",
        "type": spectral_to_type_label("G2V"),
        "ra": 0.0, "dec": 0.0, "dist_pc": 0.0,
        "size": 6.0, "color": bv_to_rgb(0.65),
        "catalog": "Special", "hip": 0
    })

    sid = 1
    for entry in NAMED_STARS:
        if entry[0] == "Sun":
            continue
        name, ra, dec, parallax, vmag, bv, sptype, hip = entry
        xyz = star_to_xyz(ra, dec, parallax)
        if xyz is None:
            # Stars with unknown distance: place far away in direction
            dist = 500.0
            ra_r = math.radians(ra)
            dec_r = math.radians(dec)
            xyz = (
                round(dist * math.cos(dec_r) * math.cos(ra_r), 4),
                round(dist * math.cos(dec_r) * math.sin(ra_r), 4),
                round(dist * math.sin(dec_r), 4)
            )
            dist_pc = dist
        else:
            dist_pc = round(1000.0 / parallax, 4) if parallax > 0 else 0.0

        r, g, b = bv_to_rgb(bv)
        stars.append({
            "id": sid, "name": name,
            "x": xyz[0], "y": xyz[1], "z": xyz[2],
            "mag": vmag, "bv": bv, "spectral": sptype,
            "type": spectral_to_type_label(sptype),
            "ra": round(ra, 6), "dec": round(dec, 6), "dist_pc": dist_pc,
            "size": mag_to_size(vmag),
            "color": [r, g, b],
            "catalog": "Hipparcos", "hip": hip
        })
        sid += 1
    return stars, sid


def galactic_xyz(dist_pc: float) -> tuple:
    """Generate a star position distributed like the Milky Way thin disk."""
    # Galactic coordinates: l (longitude 0-360), b (latitude -90 to 90 weighted)
    l = random.uniform(0, 2 * math.pi)
    # Thin disk: scale height ~300 pc, exponential distribution
    b_scale = math.atan(300.0 / dist_pc) if dist_pc > 0 else math.pi/2
    b = random.gauss(0, b_scale * 0.6)
    b = max(-math.pi/2, min(math.pi/2, b))

    # Convert galactic → equatorial (simplified: galactic center at RA=266.4, Dec=-28.9)
    # We approximate by just using galactic coords directly as if equatorial
    # This gives a realistic distribution even if not astronomically precise
    x = dist_pc * math.cos(b) * math.cos(l)
    y = dist_pc * math.cos(b) * math.sin(l)
    z = dist_pc * math.sin(b)
    return (round(x, 4), round(y, 4), round(z, 4))


def generate_background_stars(start_id: int, count: int, mag_min: float, mag_max: float,
                                dist_min: float, dist_max: float):
    """Generate statistically distributed background stars."""
    stars = []
    for i in range(count):
        dist = random.uniform(dist_min, dist_max)
        vmag = random.uniform(mag_min, mag_max)
        # B-V distribution: roughly normal around 0.6 (G star average), σ=0.5
        bv = max(-0.4, min(2.0, random.gauss(0.6, 0.5)))

        # Spectral type from BV
        if bv < -0.2:   sptype = random.choice(["O5V","B1V","B2V","B3V"])
        elif bv < 0.1:  sptype = random.choice(["B8V","A0V","A2V","A5V"])
        elif bv < 0.3:  sptype = random.choice(["A7V","F0V","F2V","F5V"])
        elif bv < 0.6:  sptype = random.choice(["F7V","G0V","G2V","G5V"])
        elif bv < 0.9:  sptype = random.choice(["G8V","K0V","K2V","K3V"])
        elif bv < 1.4:  sptype = random.choice(["K5V","M0V","M1V","M2V"])
        else:           sptype = random.choice(["M3V","M4V","M5V","M6V"])

        xyz = galactic_xyz(dist)
        r, g, b = bv_to_rgb(bv)

        stars.append({
            "id": start_id + i,
            "name": f"HIP {start_id + i}",
            "x": xyz[0], "y": xyz[1], "z": xyz[2],
            "mag": round(vmag, 2), "bv": round(bv, 3), "spectral": sptype,
            "type": spectral_to_type_label(sptype),
            "ra": 0.0, "dec": 0.0, "dist_pc": round(dist, 2),
            "size": mag_to_size(vmag),
            "color": [r, g, b],
            "catalog": "Generated", "hip": 0
        })
    return stars


def generate_deep_sky_objects():
    """Generate a set of notable deep sky objects (NGC catalog sample)."""
    DSO = [
        # name, ra_deg, dec_deg, dist_pc, type, catalog
        ("M31 Andromeda Galaxy", 10.6847, 41.2690, 770000, "galaxy"),
        ("M32", 10.6742, 40.8652, 770000, "galaxy"),
        ("M33 Triangulum Galaxy", 23.4625, 30.6602, 850000, "galaxy"),
        ("LMC", 80.8938, -69.7561, 49970, "galaxy"),
        ("SMC", 13.1583, -72.8003, 62000, "galaxy"),
        ("M42 Orion Nebula", 83.8221, -5.3911, 412, "nebula"),
        ("M45 Pleiades", 56.6012, 24.1167, 136, "cluster"),
        ("M44 Beehive Cluster", 130.0252, 19.6233, 187, "cluster"),
        ("M13 Hercules Cluster", 250.4228, 36.4613, 7100, "globular"),
        ("M22", 279.1001, -23.9047, 3200, "globular"),
        ("NGC 104 47 Tuc", 6.0228, -72.0814, 4500, "globular"),
        ("Omega Centauri", 201.6967, -47.4797, 5200, "globular"),
        ("NGC 869 h Per", 34.7486, 57.1379, 2300, "cluster"),
        ("NGC 884 Chi Per", 35.0501, 57.1453, 2300, "cluster"),
        ("M67", 132.8240, 11.8141, 908, "cluster"),
        ("Hyades", 66.7500, 15.8700, 46, "cluster"),
        ("M1 Crab Nebula", 83.6332, 22.0145, 2000, "nebula"),
        ("M57 Ring Nebula", 283.3962, 33.0289, 800, "nebula"),
        ("M27 Dumbbell Nebula", 299.9015, 22.7214, 405, "nebula"),
        ("Eta Carinae Nebula", 161.2650, -59.8775, 2300, "nebula"),
        ("M81 Bode's Galaxy", 148.8883, 69.0653, 3630000, "galaxy"),
        ("M82 Cigar Galaxy", 148.9700, 69.6797, 3530000, "galaxy"),
        ("M51 Whirlpool", 202.4696, 47.1952, 7310000, "galaxy"),
        ("M101 Pinwheel", 210.8024, 54.3490, 6400000, "galaxy"),
        ("NGC 253 Sculptor", 11.8880, -25.2882, 3400000, "galaxy"),
        ("M87 Virgo A", 187.7059, 12.3911, 53500000, "galaxy"),
        ("M104 Sombrero", 189.9976, -11.6231, 9550000, "galaxy"),
        ("M64 Black Eye Galaxy", 194.1823, 21.6830, 5300000, "galaxy"),
        ("Andromeda II", 19.1284, 33.4258, 600000, "galaxy"),
        ("NGC 6826 Blinking Nebula", 295.9260, 50.5247, 2200, "nebula"),
    ]

    objects = []
    for i, (name, ra, dec, dist_pc, otype) in enumerate(DSO):
        ra_r  = math.radians(ra)
        dec_r = math.radians(dec)
        x = dist_pc * math.cos(dec_r) * math.cos(ra_r)
        y = dist_pc * math.cos(dec_r) * math.sin(ra_r)
        z = dist_pc * math.sin(dec_r)

        if otype == "galaxy":  bv, color = 0.7, [1.0, 0.9, 0.7]
        elif otype == "nebula": bv, color = 0.0, [0.6, 0.85, 1.0]
        elif otype == "globular": bv, color = 1.0, [1.0, 0.85, 0.6]
        else:  bv, color = 0.2, [0.8, 0.9, 1.0]  # cluster

        objects.append({
            "id": 10000 + i,
            "name": name,
            "x": round(x, 2), "y": round(y, 2), "z": round(z, 2),
            "mag": round(random.uniform(3, 8), 1),
            "bv": bv, "spectral": otype.upper(),
            "type": otype,
            "ra": round(ra, 4), "dec": round(dec, 4), "dist_pc": dist_pc,
            "size": 3.0,
            "color": color,
            "catalog": "NGC/Messier", "hip": 0
        })
    return objects


def main():
    print("Generating star catalog...")
    named, next_id = generate_named_stars()
    print(f"  Named stars: {len(named)}")

    # Bright nearby stars (mag 1.5–4.5, distance 5–200 pc)
    nearby = generate_background_stars(next_id, 400, 2.0, 5.0, 5, 200)
    next_id += 400

    # Medium distance (mag 3–7, 50–1000 pc)
    medium = generate_background_stars(next_id, 2000, 3.0, 7.5, 50, 1000)
    next_id += 2000

    # Distant stars (mag 6–9, 500–8000 pc)
    distant = generate_background_stars(next_id, 5000, 5.0, 9.5, 500, 8000)
    next_id += 5000

    # Very distant (mag 8–12, 2000–30000 pc — galactic background)
    background = generate_background_stars(next_id, 8000, 7.0, 12.0, 2000, 30000)
    next_id += 8000

    dso = generate_deep_sky_objects()
    print(f"  Deep sky objects: {len(dso)}")

    all_stars = named + nearby + medium + distant + background + dso
    print(f"  Total objects: {len(all_stars)}")

    # Split into chunks by magnitude for LOD
    chunks = {
        "bright":   [s for s in all_stars if s["mag"] < 3.0 or s["type"] in ("galaxy","nebula","globular","cluster")],
        "medium":   [s for s in all_stars if 3.0 <= s["mag"] < 7.0],
        "faint":    [s for s in all_stars if 7.0 <= s["mag"] < 10.0],
        "deep":     [s for s in all_stars if s["mag"] >= 10.0],
    }

    output_dir = os.path.join(os.path.dirname(__file__), "../public/data")
    os.makedirs(output_dir, exist_ok=True)

    # Write each chunk
    for chunk_name, chunk_data in chunks.items():
        path = os.path.join(output_dir, f"stars_{chunk_name}.json")
        with open(path, "w") as f:
            json.dump({"count": len(chunk_data), "stars": chunk_data}, f, separators=(',', ':'))
        size_kb = os.path.getsize(path) / 1024
        print(f"  Wrote {chunk_name}: {len(chunk_data)} objects ({size_kb:.0f} KB)")

    # Write search index (name + id + mag for fast lookup)
    index = [{"id": s["id"], "name": s["name"], "type": s.get("type","star"),
               "mag": s["mag"], "dist_pc": s["dist_pc"]} for s in all_stars]
    idx_path = os.path.join(output_dir, "stars_index.json")
    with open(idx_path, "w") as f:
        json.dump({"stars": index}, f, separators=(',', ':'))
    print(f"  Wrote index: {len(index)} entries ({os.path.getsize(idx_path)/1024:.0f} KB)")

    print("Done.")


if __name__ == "__main__":
    main()
