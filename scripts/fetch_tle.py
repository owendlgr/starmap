#!/usr/bin/env python3
"""
Fetch TLE (Two-Line Element) data from CelesTrak for Earth-orbit objects.
These represent active satellites and historical objects with known orbits.

Outputs to public/data/tle_catalog.json

CelesTrak: https://celestrak.org
TLE Format: https://en.wikipedia.org/wiki/Two-line_element_set
"""

import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# CelesTrak TLE catalog URLs (free, no auth)
TLE_SOURCES = [
    {
        'name': 'Space Stations',
        'url': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
        'category': 'station',
    },
    {
        'name': 'Active Satellites',
        'url': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json',
        'category': 'active',
    },
    {
        'name': 'Last 30 Days Launches',
        'url': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=json',
        'category': 'recent',
    },
    # Specific high-interest objects
    {
        'name': 'ISS (Zarya)',
        'url': 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json',
        'category': 'station',
    },
    {
        'name': 'Hubble',
        'url': 'https://celestrak.org/NORAD/elements/gp.php?CATNR=20580&FORMAT=json',
        'category': 'telescope',
    },
    {
        'name': 'Tiangong',
        'url': 'https://celestrak.org/NORAD/elements/gp.php?CATNR=48274&FORMAT=json',
        'category': 'station',
    },
]

# Map of NORAD catalog numbers to our mission IDs for direct matching
NORAD_TO_MISSION = {
    25544: 'zarya',           # ISS
    20580: 'sts-31',          # Hubble (deployed by STS-31)
    48274: 'css-tianhe',      # Tiangong
}


def fetch_json(url, name):
    """Fetch JSON from CelesTrak."""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'StarData.Space/1.0 (TLE-fetch)',
        })
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        return data
    except Exception as e:
        print(f'  Error fetching {name}: {e}')
        return None


def tle_to_entry(obj, category):
    """Convert CelesTrak GP JSON object to our TLE format."""
    return {
        'norad_id': obj.get('NORAD_CAT_ID'),
        'name': obj.get('OBJECT_NAME', '').strip(),
        'epoch': obj.get('EPOCH', ''),
        'inclination': obj.get('INCLINATION'),
        'raan': obj.get('RA_OF_ASC_NODE'),       # Right Ascension of Ascending Node
        'eccentricity': obj.get('ECCENTRICITY'),
        'arg_perigee': obj.get('ARG_OF_PERICENTER'),
        'mean_anomaly': obj.get('MEAN_ANOMALY'),
        'mean_motion': obj.get('MEAN_MOTION'),     # revs/day
        'tle_line1': obj.get('TLE_LINE1', ''),
        'tle_line2': obj.get('TLE_LINE2', ''),
        'category': category,
        # Derived
        'period_min': 1440.0 / obj.get('MEAN_MOTION', 1) if obj.get('MEAN_MOTION') else None,
        'apogee_km': obj.get('APOAPSIS'),
        'perigee_km': obj.get('PERIAPSIS'),
    }


def main():
    dry_run = '--dry-run' in sys.argv
    output_dir = Path(__file__).parent.parent / 'public' / 'data'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / 'tle_catalog.json'

    print('StarData.Space — TLE Catalog Fetcher')
    print('=====================================')
    print(f'Sources: {len(TLE_SOURCES)}')
    print(f'Output: {output_file}')
    print()

    if dry_run:
        for src in TLE_SOURCES:
            print(f'  Would fetch: {src["name"]}')
        return

    all_entries = {}  # keyed by NORAD ID to dedupe
    source_counts = {}

    for i, src in enumerate(TLE_SOURCES):
        print(f'[{i+1}/{len(TLE_SOURCES)}] Fetching {src["name"]}...')
        data = fetch_json(src['url'], src['name'])

        if data is None:
            continue

        if not isinstance(data, list):
            data = [data]

        count = 0
        for obj in data:
            norad = obj.get('NORAD_CAT_ID')
            if not norad:
                continue
            entry = tle_to_entry(obj, src['category'])
            # Only overwrite if we don't have it yet, or this is a more specific source
            if norad not in all_entries or src['category'] in ('station', 'telescope'):
                all_entries[norad] = entry
                count += 1

        source_counts[src['name']] = count
        print(f'  ✓ {count} objects')
        time.sleep(1)  # rate limit

    # Build output — only include objects with valid TLE data
    valid = {k: v for k, v in all_entries.items() if v.get('tle_line1') and v.get('tle_line2')}

    # Add NORAD → mission ID mappings
    for norad, mission_id in NORAD_TO_MISSION.items():
        if norad in valid:
            valid[norad]['mission_id'] = mission_id

    output = {
        'generated': datetime.utcnow().isoformat() + 'Z',
        'source': 'CelesTrak (NORAD TLE via GP JSON)',
        'total_objects': len(valid),
        'sources': source_counts,
        # Only include key objects to keep file size reasonable
        # Full catalog would be huge — instead keep stations, telescopes, and recent launches
        'objects': list(valid.values()),
    }

    # Filter to manageable size: stations + recent + named objects only
    priority_objects = [
        o for o in output['objects']
        if o['category'] in ('station', 'telescope')
        or o.get('mission_id')
        or o['category'] == 'recent'
    ]

    # Cap at 500 objects
    if len(priority_objects) > 500:
        priority_objects = priority_objects[:500]

    output['objects'] = priority_objects
    output['total_objects'] = len(priority_objects)

    with open(output_file, 'w') as f:
        json.dump(output, f, separators=(',', ':'))

    file_size = output_file.stat().st_size
    print()
    print(f'Done! {len(priority_objects)} TLE objects saved')
    print(f'Output: {output_file} ({file_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
