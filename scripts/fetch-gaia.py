#!/usr/bin/env python3
"""
Gaia DR3 ingestion — Step 3 of Gaia DR3 extension.

Queries the ESA Gaia TAP API for real astrometric measurements,
converts to the existing coordinate system (1 unit = 1 parsec),
and writes packed binary chunks to public/data/gaia/.

Binary chunk format
───────────────────
Header (8 bytes):
  [0–3]  magic  = b"GAIA"
  [4–7]  count  = uint32 LE  (number of stars in this chunk)

Per-star record (32 bytes, 8 × float32 LE):
  [0–3]   x       (parsecs, equatorial Cartesian)
  [4–7]   y
  [8–11]  z
  [12–15] mag     (Gaia G-band apparent magnitude)
  [16–19] bvrp    (BP-RP colour index — approximate B-V available server-side)
  [20–23] dist_pc (1000 / parallax_mas)
  [24–27] ra      (degrees)
  [28–31] dec     (degrees)

Coordinate formula (matches existing Hipparcos/exoplanet pipeline):
  x = dist_pc * cos(dec_rad) * cos(ra_rad)
  y = dist_pc * sin(dec_rad)
  z = dist_pc * cos(dec_rad) * sin(ra_rad)

Usage
─────
  python3 scripts/fetch-gaia.py           # fetch all 6 RA chunks
  python3 scripts/fetch-gaia.py --dry-run # print queries, write nothing
  python3 scripts/fetch-gaia.py --chunk 2 # fetch a single chunk (0–5)

Output
──────
  public/data/gaia/chunk_000.bin … chunk_005.bin
  public/data/gaia/manifest.json
"""

import csv
import io
import json
import math
import os
import struct
import sys
import urllib.parse
import urllib.request

# ── Constants ──────────────────────────────────────────────────────────────────

MAGIC        = b"GAIA"
HEADER_FMT   = "<4sI"   # magic (4s) + count (uint32 LE)
HEADER_SIZE  = 8
STAR_FMT     = "<8f"    # 8 × float32 LE
STAR_SIZE    = 32

GAIA_TAP     = "https://gea.esac.esa.int/tap-server/tap/sync"
ID_BASE      = 4_000_000   # avoids collision: Hipparcos ≤100, Exoplanets ≥2M

# 6 chunks of 60° each — full sky
RA_CHUNKS = [(i * 60, (i + 1) * 60) for i in range(6)]

# Filters:
#   parallax   > 0.5 mas   → distance < 2 kpc
#   parallax_over_error > 5  → ≥ 5-sigma reliable distance
#   phot_g_mean_mag < 11    → ~300 k stars worldwide, manageable for rendering
ADQL_TEMPLATE = (
    "SELECT ra, dec, parallax, phot_g_mean_mag, bp_rp "
    "FROM gaiadr3.gaia_source "
    "WHERE ra >= {ra_min} AND ra < {ra_max} "
    "AND parallax IS NOT NULL "
    "AND parallax > 0.5 "
    "AND parallax_over_error > 5 "
    "AND phot_g_mean_mag IS NOT NULL "
    "AND phot_g_mean_mag < 11"
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def to_xyz(ra_deg: float, dec_deg: float, dist_pc: float):
    r = math.radians(ra_deg)
    d = math.radians(dec_deg)
    x = dist_pc * math.cos(d) * math.cos(r)
    y = dist_pc * math.sin(d)
    z = dist_pc * math.cos(d) * math.sin(r)
    return x, y, z


def fetch_chunk_csv(ra_min: int, ra_max: int) -> str:
    query = ADQL_TEMPLATE.format(ra_min=ra_min, ra_max=ra_max)
    params = urllib.parse.urlencode({
        "REQUEST": "doQuery",
        "LANG":    "ADQL",
        "FORMAT":  "csv",
        "QUERY":   query,
    }).encode()
    req = urllib.request.Request(GAIA_TAP, data=params, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent",   "StarData-GaiaIngestion/1.0")
    with urllib.request.urlopen(req, timeout=600) as resp:
        return resp.read().decode("utf-8")


def parse_csv(body: str) -> list:
    """Return list of (x, y, z, mag, bvrp, dist_pc, ra, dec) tuples."""
    stars = []
    reader = csv.DictReader(io.StringIO(body))
    for row in reader:
        try:
            parallax = float(row["parallax"])
            if parallax <= 0:
                continue
            dist_pc = 1000.0 / parallax
            ra      = float(row["ra"])
            dec     = float(row["dec"])
            mag     = float(row["phot_g_mean_mag"])
            bvrp_s  = row.get("bp_rp", "").strip()
            bvrp    = float(bvrp_s) if bvrp_s else 0.65
            x, y, z = to_xyz(ra, dec, dist_pc)
            stars.append((x, y, z, mag, bvrp, dist_pc, ra, dec))
        except (ValueError, KeyError):
            continue
    return stars


def write_chunk(path: str, stars: list) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(struct.pack(HEADER_FMT, MAGIC, len(stars)))
        for s in stars:
            f.write(struct.pack(STAR_FMT, *s))
    kb = os.path.getsize(path) // 1024
    print(f"  Written {path}  ({len(stars):,} stars, {kb:,} KB)")


def write_manifest(out_dir: str, chunk_files: list, total: int) -> None:
    manifest = {
        "version": 1,
        "catalog": "Gaia DR3",
        "filter":  "parallax>0.5, parallax_over_error>5, G<11",
        "chunks":  chunk_files,
        "total":   total,
        "id_base": ID_BASE,
        "star_size_bytes": STAR_SIZE,
    }
    path = os.path.join(out_dir, "manifest.json")
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"  Manifest → {path}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    args       = sys.argv[1:]
    dry_run    = "--dry-run" in args
    single     = None
    if "--chunk" in args:
        idx = args.index("--chunk")
        if idx + 1 < len(args):
            single = int(args[idx + 1])

    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir    = os.path.join(script_dir, "..", "public", "data", "gaia")

    print(f"Gaia DR3 ingestion  {'[DRY RUN] ' if dry_run else ''}→ {os.path.abspath(out_dir)}")
    print("Filters: parallax > 0.5 mas  |  SNR > 5  |  G < 11")
    print()

    chunk_files: list = []
    total = 0

    chunks_to_run = [RA_CHUNKS[single]] if single is not None else RA_CHUNKS
    chunk_indices = [single] if single is not None else list(range(len(RA_CHUNKS)))

    for chunk_idx, (ra_min, ra_max) in zip(chunk_indices, chunks_to_run):
        fname = f"chunk_{chunk_idx:03d}.bin"
        fpath = os.path.join(out_dir, fname)
        chunk_files.append(fname)

        if os.path.exists(fpath) and not dry_run:
            existing = (os.path.getsize(fpath) - HEADER_SIZE) // STAR_SIZE
            print(f"Chunk {chunk_idx}  RA {ra_min:3d}°–{ra_max:3d}°: already exists ({existing:,} stars), skipping.")
            total += existing
            continue

        print(f"Chunk {chunk_idx}  RA {ra_min:3d}°–{ra_max:3d}°: querying Gaia TAP …")
        if dry_run:
            q = ADQL_TEMPLATE.format(ra_min=ra_min, ra_max=ra_max)
            print(f"  [DRY RUN] ADQL: {q[:120]} …")
            continue

        try:
            body  = fetch_chunk_csv(ra_min, ra_max)
            stars = parse_csv(body)
            print(f"  Parsed: {len(stars):,} stars")
            write_chunk(fpath, stars)
            total += len(stars)
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)

    if not dry_run and chunk_files:
        write_manifest(out_dir, chunk_files, total)

    print(f"\nDone. Total stars across all chunks: {total:,}")


if __name__ == "__main__":
    main()
