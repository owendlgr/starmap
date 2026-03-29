import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface Planet {
  name: string;
  discMethod: string;
  discYear: number;
  discFacility: string;
  orbitalPeriod: number | null;  // days
  semiMajorAxis: number | null;  // AU
  radiusEarth: number | null;
  massEarth: number | null;
  eqTemp: number | null;          // K
  dist: number | null;            // pc
}

// Parse a CSV line respecting double-quoted fields
function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  result.push(cur.trim());
  return result;
}

function num(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// In-memory cache
let cache: Map<string, Planet[]> | null = null;

function loadCache(): Map<string, Planet[]> {
  if (cache) return cache;
  cache = new Map();
  try {
    const raw = readFileSync(join(process.cwd(), 'public/data/exoplanetdatanasa.csv'), 'utf8');
    const lines = raw.split('\n');
    let headers: string[] = [];
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      if (!headers.length) { headers = parseLine(line); continue; }
      const v = parseLine(line);
      if (v[headers.indexOf('default_flag')] !== '1') continue;
      const get = (k: string) => v[headers.indexOf(k)] ?? '';
      const host = get('hostname').toLowerCase();
      if (!host) continue;
      const p: Planet = {
        name:          get('pl_name'),
        discMethod:    get('discoverymethod'),
        discYear:      parseInt(get('disc_year')) || 0,
        discFacility:  get('disc_facility'),
        orbitalPeriod: num(get('pl_orbper')),
        semiMajorAxis: num(get('pl_orbsmax')),
        radiusEarth:   num(get('pl_rade')),
        massEarth:     num(get('pl_bmasse')),
        eqTemp:        num(get('pl_eqt')),
        dist:          num(get('sy_dist')),
      };
      const arr = cache.get(host) ?? [];
      // avoid duplicate planet names
      if (!arr.find(x => x.name === p.name)) arr.push(p);
      cache.set(host, arr);
    }
  } catch { /* file missing */ }
  return cache;
}

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host')?.toLowerCase().trim();
  if (!host) return NextResponse.json({ planets: [] });

  const db = loadCache();

  // Exact match first, then partial
  let planets = db.get(host) ?? null;
  if (!planets) {
    const keys = Array.from(db.keys());
    for (const key of keys) {
      if (key.includes(host) || host.includes(key)) { planets = db.get(key) ?? null; break; }
    }
  }

  return NextResponse.json({ planets: planets ?? [] });
}
