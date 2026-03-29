import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Star } from '@/lib/types';

// B-V estimate from spectral class first letter
function spectralToBV(spec: string): number {
  const cls = (spec || '').toUpperCase()[0];
  switch (cls) {
    case 'O': return -0.33;
    case 'B': return -0.17;
    case 'A': return  0.15;
    case 'F': return  0.44;
    case 'G': return  0.65;
    case 'K': return  1.00;
    case 'M': return  1.45;
    default:  return  0.65; // assume solar-like
  }
}

// RA/Dec (degrees) + distance (pc) → Cartesian (same convention as Python catalog)
function toXYZ(ra: number, dec: number, dist: number): [number, number, number] {
  const r = ra  * Math.PI / 180;
  const d = dec * Math.PI / 180;
  return [
    dist * Math.cos(d) * Math.cos(r),
    dist * Math.sin(d),
    dist * Math.cos(d) * Math.sin(r),
  ];
}

// Minimal CSV line parser (respects double-quoted fields)
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  out.push(cur.trim());
  return out;
}

function num(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ── Cache ─────────────────────────────────────────────────
let cache: Star[] | null = null;

function buildHostStars(): Star[] {
  if (cache) return cache;

  const raw = readFileSync(join(process.cwd(), 'public/data/exoplanetdatanasa.csv'), 'utf8');
  const lines = raw.split('\n');

  let headers: string[] = [];
  const seen = new Set<string>();  // deduplicate by hostname
  const stars: Star[] = [];
  let idBase = 2_000_000;

  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    if (!headers.length) { headers = parseLine(line); continue; }

    const v = parseLine(line);
    const get = (k: string) => v[headers.indexOf(k)] ?? '';

    // Only canonical rows
    if (get('default_flag') !== '1') continue;

    const hostname = get('hostname').trim();
    if (!hostname || seen.has(hostname)) continue;

    const ra   = num(get('ra'));
    const dec  = num(get('dec'));
    const dist = num(get('sy_dist'));
    if (ra == null || dec == null || dist == null || dist <= 0) continue;

    const vmag = num(get('sy_vmag')) ?? 10;
    const spec = get('st_spectype').trim() || 'G';
    const syPnum = parseInt(get('sy_pnum')) || 1;

    const [x, y, z] = toXYZ(ra, dec, dist);
    const bv = spectralToBV(spec);
    // Slightly larger size than background stars to make them findable
    const size = Math.max(0.8, 5.5 - vmag * 0.45);

    stars.push({
      id: idBase++,
      name: hostname,
      type: `Exoplanet Host (${syPnum} planet${syPnum !== 1 ? 's' : ''})`,
      x, y, z,
      ra, dec,
      dist_pc: dist,
      mag: vmag,
      bv,
      spectral: spec,
      catalog: 'NASA Exoplanet Archive',
      hip: 0,
      size,
      color: [0.1, 0.07, 0.03] as [number, number, number],
    });

    seen.add(hostname);
  }

  cache = stars;
  return stars;
}

export async function GET() {
  try {
    const stars = buildHostStars();
    return NextResponse.json({ stars, count: stars.length });
  } catch (err) {
    console.error('exoplanet-stars:', err);
    return NextResponse.json({ stars: [], count: 0 });
  }
}
