#!/usr/bin/env python3
"""
Fetch comprehensive mission data from Launch Library 2 API.
Saves to public/data/missions.json for reliable offline access.

Fetches: all crewed missions + all notable robotic missions + recent launches
Target: 400+ missions

LL2 API: https://ll.thespacedevs.com/2.2.0/
"""

import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

LL2_BASE = 'https://ll.thespacedevs.com/2.2.0'
RATE_LIMIT = 1.5  # seconds between requests


def fetch_page(url):
    """Fetch a single page from LL2 API."""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'StarData.Space/1.0 (mission-fetch)',
        })
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read())
    except Exception as e:
        print(f'  Error: {e}')
        return None


def fetch_all_pages(base_url, max_pages=20):
    """Fetch all pages from a paginated LL2 endpoint."""
    results = []
    url = base_url
    page = 1

    while url and page <= max_pages:
        print(f'  Page {page}...', end=' ', flush=True)
        data = fetch_page(url)
        if not data:
            break

        batch = data.get('results', [])
        results.extend(batch)
        print(f'{len(batch)} results (total: {len(results)})')

        url = data.get('next')
        page += 1
        if url:
            time.sleep(RATE_LIMIT)

    return results


def normalize(r):
    """Convert LL2 launch record to our Mission format."""
    pad = r.get('pad') or {}
    provider = r.get('launch_service_provider') or {}
    mission = r.get('mission') or {}
    orbit = (mission.get('orbit') or {})

    return {
        'id': str(r.get('id', '')),
        'name': r.get('name', ''),
        'date': r.get('net', ''),
        'status': (r.get('status') or {}).get('name', 'Unknown'),
        'agency': provider.get('name', 'Unknown'),
        'agencyCountry': provider.get('country_code', ''),
        'rocket': (r.get('rocket') or {}).get('configuration', {}).get('name', 'Unknown'),
        'orbit': orbit.get('name', ''),
        'description': mission.get('description', ''),
        'imageUrl': r.get('image', ''),
        'missionType': mission.get('type', ''),
        'launchSite': {
            'name': pad.get('name', 'Unknown'),
            'latitude': float(pad.get('latitude', 0) or 0),
            'longitude': float(pad.get('longitude', 0) or 0),
        },
    }


def main():
    dry_run = '--dry-run' in sys.argv
    output_dir = Path(__file__).parent.parent / 'public' / 'data'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / 'missions.json'

    print('StarData.Space — Comprehensive Mission Fetcher')
    print('===============================================')

    if dry_run:
        print('DRY RUN — would fetch crewed + notable robotic + recent missions')
        return

    all_missions = []

    # 1. All crewed missions (this is a specific LL2 filter)
    print('\n[1/3] Fetching crewed spaceflight missions...')
    crewed = fetch_all_pages(
        f'{LL2_BASE}/launch/previous/?limit=100&offset=0&ordering=-net&launch_service_provider__type=1,2,3&mission__type=1',
        max_pages=5
    )
    # Also try the human spaceflight specific endpoint
    print('\n[1b/3] Fetching human spaceflight launches...')
    crewed2 = fetch_all_pages(
        f'{LL2_BASE}/launch/previous/?limit=100&offset=0&ordering=-net&include_suborbital=true&is_crewed=true',
        max_pages=5
    )
    crewed_combined = crewed + crewed2

    # 2. Notable past missions (all agencies, sorted by date)
    print('\n[2/3] Fetching all past launches...')
    past = fetch_all_pages(
        f'{LL2_BASE}/launch/previous/?limit=100&offset=0&ordering=-net',
        max_pages=4
    )

    # 3. Upcoming missions
    print('\n[3/3] Fetching upcoming launches...')
    upcoming = fetch_all_pages(
        f'{LL2_BASE}/launch/upcoming/?limit=100&offset=0&ordering=net',
        max_pages=2
    )

    # Combine and dedupe
    seen_ids = set()
    for batch in [crewed_combined, past, upcoming]:
        for r in batch:
            rid = str(r.get('id', ''))
            if rid and rid not in seen_ids:
                seen_ids.add(rid)
                m = normalize(r)
                if m['name'] and m['date']:
                    all_missions.append(m)

    # Sort by date descending
    all_missions.sort(key=lambda m: m['date'], reverse=True)

    print(f'\n--- Results ---')
    print(f'Crewed: {len(crewed_combined)} raw')
    print(f'Past: {len(past)} raw')
    print(f'Upcoming: {len(upcoming)} raw')
    print(f'Deduped total: {len(all_missions)} missions')

    # Save
    with open(output_file, 'w') as f:
        json.dump(all_missions, f, indent=1)

    file_size = output_file.stat().st_size
    print(f'\nSaved: {output_file} ({file_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
