"""
Fetch Nearby Galaxy Catalog from NASA HEASARC.
Source: Karachentsev et al. 2013, "Updated Nearby Galaxy Catalog"
869 galaxies within 11 Mpc with measured distances.

Usage:
    python3 scripts/fetch_nearby_galaxies.py

Outputs:
    lib/data/nearbyGalaxies.json
"""

import requests
import csv
import json
import io
import math
import sys
import os

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "lib", "data", "nearbyGalaxies.json"
)

HEASARC_URL = "https://heasarc.gsfc.nasa.gov/cgi-bin/W3Browse/w3query.pl"


def fetch_nearby_galaxies():
    """Query HEASARC for the neargalcat table."""
    params = {
        "tablehead": "name=neargalcat",
        "Fields": "name,ra,dec,distance,morph_type,abs_mag_b,log_stellar_mass,ang_diam_maj,velocity",
        "displaymode": "BatchDisplay",
        "ResultMax": "0",
        "Action": "Query",
        "Format": "CSV",
    }

    print("Fetching from HEASARC neargalcat...")
    try:
        resp = requests.get(HEASARC_URL, params=params, timeout=60)
        resp.raise_for_status()
    except Exception as e:
        print(f"HEASARC request failed: {e}")
        print("Falling back to inline dataset.")
        return None

    text = resp.text.strip()
    if not text or "Error" in text[:200]:
        print("HEASARC returned an error or empty response. Using fallback.")
        return None

    reader = csv.DictReader(io.StringIO(text))
    galaxies = []
    idx = 0

    for row in reader:
        try:
            name = (row.get("name") or "").strip()
            if not name:
                continue

            ra = safe_float(row.get("ra"))
            dec = safe_float(row.get("dec"))
            dist = safe_float(row.get("distance"))

            if ra is None or dec is None or dist is None:
                continue

            morph = (row.get("morph_type") or "").strip()
            abs_mag = safe_float(row.get("abs_mag_b"))
            log_mass = safe_float(row.get("log_stellar_mass"))
            ang_diam = safe_float(row.get("ang_diam_maj"))
            velocity = safe_float(row.get("velocity"))

            gtype = categorize_morphology(morph)
            x, y, z = ra_dec_dist_to_xyz(ra, dec, dist)

            galaxies.append(
                {
                    "id": f"ngc-{idx}",
                    "name": name,
                    "type": morph or gtype.capitalize(),
                    "galaxyType": gtype,
                    "hubbleType": morph if morph else None,
                    "ra": round(ra, 4),
                    "dec": round(dec, 4),
                    "distanceMpc": round(dist, 3),
                    "absMagnitude": round(abs_mag, 2) if abs_mag is not None else None,
                    "stellarMass": round(log_mass, 2) if log_mass is not None else None,
                    "majorAxis": round(ang_diam, 1) if ang_diam is not None else None,
                    "radialVelocity": round(velocity, 0) if velocity is not None else None,
                    "x": round(x, 4),
                    "y": round(y, 4),
                    "z": round(z, 4),
                }
            )
            idx += 1
        except Exception:
            continue

    print(f"Parsed {len(galaxies)} galaxies from HEASARC.")
    return galaxies


def categorize_morphology(morph: str) -> str:
    """Convert morphological type string to a category."""
    if not morph:
        return "unknown"
    m = morph.strip().upper()
    if m.startswith(("S0", "SB0")):
        return "lenticular"
    if m.startswith(("S", "SA", "SB", "SC")):
        return "spiral"
    if m.startswith(("E", "CD")):
        return "elliptical"
    if "IR" in m or "IM" in m or "IBM" in m:
        return "irregular"
    if "D" in m.lower() or "SPH" in m:
        return "dwarf"
    return "unknown"


def ra_dec_dist_to_xyz(ra_deg: float, dec_deg: float, dist_mpc: float):
    """Convert RA/Dec/Distance to Cartesian coordinates (Mpc)."""
    ra = math.radians(ra_deg)
    dec = math.radians(dec_deg)
    x = dist_mpc * math.cos(dec) * math.cos(ra)
    y = dist_mpc * math.sin(dec)
    z = dist_mpc * math.cos(dec) * math.sin(ra)
    return (x, y, z)


def safe_float(val):
    """Parse a float, returning None on failure."""
    if val is None:
        return None
    try:
        v = float(str(val).strip())
        if math.isnan(v) or math.isinf(v):
            return None
        return v
    except (ValueError, TypeError):
        return None


def main():
    galaxies = fetch_nearby_galaxies()

    if galaxies is None:
        print("No data fetched. Output file not written.")
        print("The app uses the hardcoded catalog in lib/data/galaxyCatalog.ts as fallback.")
        sys.exit(0)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(galaxies, f, indent=2)

    print(f"Wrote {len(galaxies)} galaxies to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
