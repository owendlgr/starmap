"""
Fetch mission data from Launch Library 2 API.
Paginates through launches, extracts key fields, saves to public/data/missions.json
Rate limit: 15 requests/hour on free tier, so fetch in batches.
"""
import requests
import json
import time
import os

BASE = "https://ll.thespacedevs.com/2.2.0/launch/"

def fetch_all_launches(limit=100, max_pages=10):
    """Fetch launches, paginating up to max_pages."""
    launches = []
    offset = 0
    for page in range(max_pages):
        url = f"{BASE}?limit={limit}&offset={offset}&ordering=-net"
        print(f"Fetching page {page+1} (offset={offset})...")
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        for r in results:
            pad = r.get("pad", {})
            provider = r.get("launch_service_provider", {})
            mission = r.get("mission") or {}
            orbit = (mission.get("orbit") or {})
            launches.append({
                "id": r.get("id", ""),
                "name": r.get("name", ""),
                "date": r.get("net", ""),
                "status": (r.get("status") or {}).get("name", "Unknown"),
                "agency": provider.get("name", "Unknown"),
                "agencyCountry": provider.get("country_code", ""),
                "rocket": (r.get("rocket", {}).get("configuration", {}) or {}).get("name", "Unknown"),
                "orbit": orbit.get("name", ""),
                "description": mission.get("description", ""),
                "imageUrl": r.get("image", ""),
                "launchSite": {
                    "name": pad.get("name", "Unknown"),
                    "latitude": float(pad.get("latitude", 0)),
                    "longitude": float(pad.get("longitude", 0)),
                },
            })
        if not data.get("next"):
            break
        offset += limit
        time.sleep(4)  # respect rate limit
    return launches

if __name__ == "__main__":
    launches = fetch_all_launches()
    output_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "missions.json")
    with open(output_path, "w") as f:
        json.dump(launches, f)
    print(f"Saved {len(launches)} missions to {output_path}")
