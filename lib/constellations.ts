import type { Star } from './types';
import { getConstellation } from './coordinates';

/**
 * Build constellation line pairs from star data.
 * Groups ALL stars by constellation (via RA/Dec), takes the brightest
 * in each group, and chains them by nearest-neighbor on the sky.
 * Every constellation with 2+ bright stars gets lines.
 */
export function buildConstellationPairs(stars: Star[]): [number, number][] {
  // Group stars by constellation
  const groups = new Map<string, Star[]>();
  for (const s of stars) {
    if (s.dist_pc <= 0 || s.mag > 7) continue;
    const c = getConstellation(s.ra, s.dec);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(s);
  }

  const pairs: [number, number][] = [];
  const pairSet = new Set<string>();

  groups.forEach((group) => {
    // Sort by magnitude (brightest first), take top 8
    const bright = group.sort((a, b) => a.mag - b.mag).slice(0, 8);
    if (bright.length < 2) return;

    // Connect via nearest-neighbor chain starting from brightest
    const used = new Set<number>();
    let current = bright[0];
    used.add(current.id);

    for (let i = 1; i < bright.length; i++) {
      let nearest: Star | null = null;
      let minAngDist = Infinity;
      for (const candidate of bright) {
        if (used.has(candidate.id)) continue;
        const dra = (current.ra - candidate.ra) * Math.cos(current.dec * Math.PI / 180);
        const ddec = current.dec - candidate.dec;
        const angDist = Math.sqrt(dra * dra + ddec * ddec);
        if (angDist < minAngDist) {
          minAngDist = angDist;
          nearest = candidate;
        }
      }
      if (!nearest || minAngDist > 40) break;
      const key = `${Math.min(current.id, nearest.id)}-${Math.max(current.id, nearest.id)}`;
      if (!pairSet.has(key)) {
        pairs.push([current.id, nearest.id]);
        pairSet.add(key);
      }
      used.add(nearest.id);
      current = nearest;
    }
  });

  return pairs;
}

// Keep backward compatibility export
export const CONSTELLATION_PAIRS = [] as [number, number][];
