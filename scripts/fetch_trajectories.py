#!/usr/bin/env python3
"""
Fetch real spacecraft trajectories from NASA JPL Horizons API (SPICE-backed).
Outputs trajectory data as JSON for the StarData.Space mission dashboard.

Usage:
    python3 scripts/fetch_trajectories.py
    python3 scripts/fetch_trajectories.py --dry-run    # show what would be fetched

NASA Horizons API docs: https://ssd-api.jpl.nasa.gov/doc/horizons.html
SPICE IDs: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/naif_ids.html
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
import re
from datetime import datetime, timedelta
from pathlib import Path

# ═══════════════════════════════════════════════════════════
# SPACECRAFT CATALOG — NAIF/SPICE IDs mapped to our mission IDs
# ═══════════════════════════════════════════════════════════

SPACECRAFT = [
    # ── Interplanetary / Deep Space ──────────────────────────
    {
        'mission_id': 'voyager-1',
        'horizons_id': '-31',
        'name': 'Voyager 1',
        'start': '1977-09-06',
        'stop': '2026-01-01',
        'step': '30d',        # monthly points
        'center': '500@10',   # Sun-centered
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'voyager-2',
        'horizons_id': '-32',
        'name': 'Voyager 2',
        'start': '1977-08-21',
        'stop': '2026-01-01',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'pioneer-10',
        'horizons_id': '-23',
        'name': 'Pioneer 10',
        'start': '1972-03-04',
        'stop': '2003-01-23',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'pioneer-11',
        'horizons_id': '-24',
        'name': 'Pioneer 11',
        'start': '1973-04-07',
        'stop': '1995-09-30',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'new-horizons',
        'horizons_id': '-98',
        'name': 'New Horizons',
        'start': '2006-01-20',
        'stop': '2026-01-01',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'cassini-huygens',
        'horizons_id': '-82',
        'name': 'Cassini',
        'start': '1997-10-16',
        'stop': '2017-09-15',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'galileo',
        'horizons_id': '-77',
        'name': 'Galileo',
        'start': '1989-10-20',
        'stop': '2003-09-21',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'dawn',
        'horizons_id': '-203',
        'name': 'Dawn',
        'start': '2007-09-28',
        'stop': '2018-10-31',
        'step': '14d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'rosetta',
        'horizons_id': '-226',
        'name': 'Rosetta',
        'start': '2004-03-03',
        'stop': '2016-09-30',
        'step': '14d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'europa-clipper',
        'horizons_id': '-159',
        'name': 'Europa Clipper',
        'start': '2024-10-15',
        'stop': '2026-03-01',
        'step': '7d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'mars-perseverance',
        'horizons_id': '-168',
        'name': 'Mars 2020 (cruise)',
        'start': '2020-07-31',
        'stop': '2021-02-18',
        'step': '1d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'curiosity',
        'horizons_id': '-76',
        'name': 'MSL Curiosity (cruise)',
        'start': '2011-11-27',
        'stop': '2012-08-06',
        'step': '1d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'hayabusa2',
        'horizons_id': '-37',
        'name': 'Hayabusa2',
        'start': '2014-12-04',
        'stop': '2020-12-06',
        'step': '14d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': 'jwst',
        'horizons_id': '-170',
        'name': 'JWST',
        'start': '2021-12-26',
        'stop': '2022-02-15',
        'step': '1d',
        'center': '500@399',   # Earth-centered
        'coord': 'geocentric',
    },

    # ── Lunar missions (Earth-centered) ──────────────────────
    {
        'mission_id': 'artemis-1',
        'horizons_id': '-199',
        'name': 'Artemis I / Orion',
        'start': '2022-11-16',
        'stop': '2022-12-12',
        'step': '6h',
        'center': '500@399',
        'coord': 'geocentric',
    },

    # ── Planet reference orbits (for context) ────────────────
    {
        'mission_id': '_earth_orbit',
        'horizons_id': '399',
        'name': 'Earth',
        'start': '2020-01-01',
        'stop': '2021-01-01',
        'step': '10d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': '_mars_orbit',
        'horizons_id': '499',
        'name': 'Mars',
        'start': '2020-01-01',
        'stop': '2022-01-01',
        'step': '10d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': '_jupiter_orbit',
        'horizons_id': '599',
        'name': 'Jupiter',
        'start': '2020-01-01',
        'stop': '2032-01-01',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
    {
        'mission_id': '_saturn_orbit',
        'horizons_id': '699',
        'name': 'Saturn',
        'start': '1997-01-01',
        'stop': '2027-01-01',
        'step': '30d',
        'center': '500@10',
        'coord': 'heliocentric',
    },
]

# ═══════════════════════════════════════════════════════════
# HORIZONS API CLIENT
# ═══════════════════════════════════════════════════════════

HORIZONS_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api'
AU_TO_KM = 149597870.7
RATE_LIMIT_DELAY = 1.5  # seconds between requests (be nice to JPL)


def fetch_horizons(spacecraft):
    """Fetch vector ephemeris from NASA Horizons API."""
    params = {
        'format': 'json',
        'COMMAND': f"'{spacecraft['horizons_id']}'",
        'OBJ_DATA': "'NO'",
        'MAKE_EPHEM': "'YES'",
        'EPHEM_TYPE': "'VECTORS'",
        'CENTER': f"'{spacecraft['center']}'",
        'START_TIME': f"'{spacecraft['start']}'",
        'STOP_TIME': f"'{spacecraft['stop']}'",
        'STEP_SIZE': f"'{spacecraft['step']}'",
        'VEC_TABLE': "'2'",          # position + velocity
        'REF_PLANE': "'ECLIPTIC'",
        'REF_SYSTEM': "'ICRF'",
        'OUT_UNITS': "'AU-D'",       # AU and days
        'VEC_LABELS': "'YES'",
        'CSV_FORMAT': "'YES'",
    }

    query = '&'.join(f'{k}={v}' for k, v in params.items())
    url = f'{HORIZONS_URL}?{query}'

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'StarData.Space/1.0 (trajectory-fetch)'})
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        return data
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.reason}')
        return None
    except Exception as e:
        print(f'  Error: {e}')
        return None


def parse_vectors(result_text):
    """Parse Horizons vector table from result text."""
    points = []

    # Find the data block between $$SOE and $$EOE
    soe_match = result_text.find('$$SOE')
    eoe_match = result_text.find('$$EOE')
    if soe_match == -1 or eoe_match == -1:
        return points

    data_block = result_text[soe_match + 5:eoe_match].strip()

    # CSV format: JDTDB, Calendar Date (TDB), X, Y, Z, VX, VY, VZ,
    for line in data_block.split('\n'):
        line = line.strip()
        if not line or line.startswith('*'):
            continue

        parts = [p.strip() for p in line.split(',') if p.strip()]
        if len(parts) < 5:
            continue

        try:
            jd = float(parts[0])
            date_str = parts[1].strip()
            x = float(parts[2])  # AU
            y = float(parts[3])  # AU
            z = float(parts[4])  # AU

            # Parse the date string (format: A.D. 2020-Jan-01 00:00:00.0000)
            iso_date = ''
            date_match = re.search(r'(\d{4})-(\w{3})-(\d{2})\s+(\d{2}:\d{2})', date_str)
            if date_match:
                year, mon_str, day, time_str = date_match.groups()
                months = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
                mon = months.get(mon_str, '01')
                iso_date = f'{year}-{mon}-{day}T{time_str}:00Z'

            # Distance from center
            dist_au = (x**2 + y**2 + z**2) ** 0.5

            points.append({
                'jd': round(jd, 4),
                'date': iso_date,
                'x': round(x, 8),
                'y': round(y, 8),
                'z': round(z, 8),
                'dist_au': round(dist_au, 6),
            })
        except (ValueError, IndexError):
            continue

    return points


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def main():
    dry_run = '--dry-run' in sys.argv
    output_dir = Path(__file__).parent.parent / 'public' / 'data'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / 'trajectories.json'

    print(f'StarData.Space — SPICE Trajectory Fetcher')
    print(f'=========================================')
    print(f'Spacecraft to fetch: {len(SPACECRAFT)}')
    print(f'Output: {output_file}')
    print(f'Source: NASA JPL Horizons (SPICE kernels)')
    print()

    if dry_run:
        print('DRY RUN — would fetch:')
        for sc in SPACECRAFT:
            print(f'  {sc["name"]:30s}  ID={sc["horizons_id"]:6s}  {sc["start"]} → {sc["stop"]}  step={sc["step"]}')
        return

    results = {}
    success_count = 0
    fail_count = 0

    for i, sc in enumerate(SPACECRAFT):
        print(f'[{i+1}/{len(SPACECRAFT)}] Fetching {sc["name"]}  (NAIF {sc["horizons_id"]})  {sc["start"]} → {sc["stop"]}...')

        data = fetch_horizons(sc)
        if data is None:
            print(f'  ✗ Failed to fetch')
            fail_count += 1
            time.sleep(RATE_LIMIT_DELAY)
            continue

        result_text = data.get('result', '')
        points = parse_vectors(result_text)

        if not points:
            print(f'  ✗ No data points parsed')
            # Check for error messages
            if 'No ephemeris' in result_text or 'ERROR' in result_text:
                err_lines = [l for l in result_text.split('\n') if 'error' in l.lower() or 'no eph' in l.lower()]
                for el in err_lines[:3]:
                    print(f'    {el.strip()}')
            fail_count += 1
            time.sleep(RATE_LIMIT_DELAY)
            continue

        results[sc['mission_id']] = {
            'name': sc['name'],
            'horizons_id': sc['horizons_id'],
            'coord': sc['coord'],
            'center': sc['center'],
            'start': sc['start'],
            'stop': sc['stop'],
            'point_count': len(points),
            'points': points,
        }

        print(f'  ✓ {len(points)} points  ({points[0]["date"][:10]} → {points[-1]["date"][:10]})  dist: {points[0]["dist_au"]:.2f} → {points[-1]["dist_au"]:.2f} AU')
        success_count += 1
        time.sleep(RATE_LIMIT_DELAY)

    # Write output
    output = {
        'generated': datetime.utcnow().isoformat() + 'Z',
        'source': 'NASA JPL Horizons API (SPICE kernels)',
        'api_url': 'https://ssd.jpl.nasa.gov/api/horizons.api',
        'spacecraft_count': success_count,
        'trajectories': results,
    }

    with open(output_file, 'w') as f:
        json.dump(output, f, separators=(',', ':'))

    file_size = output_file.stat().st_size
    print()
    print(f'Done! {success_count} succeeded, {fail_count} failed')
    print(f'Output: {output_file} ({file_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
