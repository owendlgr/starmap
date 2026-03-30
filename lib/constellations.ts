import type { Star } from './types';
import { getConstellation } from './coordinates';

// Hardcoded high-quality stick figure pairs (HIP IDs)
// These are curated and look correct; auto-connect fills gaps
const CURATED_PAIRS: [number, number][] = [
  // Orion
  [27989, 25336], [27989, 26311], [25336, 26311], [26311, 26727],
  [26727, 24436], [25336, 24436], [27366, 26727],
  // Ursa Major
  [54061, 53910], [53910, 58001], [58001, 59774], [59774, 62956],
  [62956, 65378], [65378, 67301],
  // Cassiopeia
  [746, 4427], [4427, 6686], [6686, 8886], [4427, 4436],
  // Cygnus
  [102098, 95947], [95947, 102488],
  // Gemini
  [36850, 37826], [36850, 31592], [37826, 31681],
  // Taurus
  [21421, 25428],
  // Canis Major
  [32349, 30324], [32349, 33579], [33579, 34444],
  // Scorpius
  [80763, 85927], [85927, 86670],
  // Centaurus
  [68702, 71683], [68702, 68933],
  // Crux
  [60718, 62434],
  // Andromeda
  [677, 5447], [5447, 9640],
  // Pegasus
  [677, 1067], [1067, 113963], [113963, 113881],
  // Perseus
  [15863, 14576],
  // Virgo
  [61941, 65474],
  // Boötes
  [69673, 72105], [69673, 69974],
  // Aquarius
  [106278, 109074],
  // Sagittarius
  [90185, 89931], [92855, 90185],
  // Lyra
  [91262, 91971],
  // Aquila
  [97649, 97278],
  // Aries
  [9884, 8903], [8903, 8832],
  // Corvus
  [59803, 60965],
  // Ophiuchus
  [86032, 84012],
  // Ursa Minor
  [11767, 74785],
];

/**
 * Build constellation line pairs dynamically from star data.
 * Uses curated pairs as base, then auto-connects brightest stars
 * in each constellation that don't already have lines.
 */
export function buildConstellationPairs(stars: Star[]): [number, number][] {
  // Start with curated pairs
  const pairs: [number, number][] = [...CURATED_PAIRS];
  const pairSet = new Set(pairs.map(([a, b]) => `${Math.min(a,b)}-${Math.max(a,b)}`));

  // Group stars by constellation
  const groups = new Map<string, Star[]>();
  for (const s of stars) {
    if (s.dist_pc <= 0 || !s.hip || s.hip <= 0) continue;
    if (s.mag > 6) continue; // only bright stars for constellation lines
    const c = getConstellation(s.ra, s.dec);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(s);
  }

  // For each constellation, connect the brightest stars via nearest-neighbor
  groups.forEach((group) => {
    // Sort by magnitude (brightest first), take top 6
    const bright = group.sort((a, b) => a.mag - b.mag).slice(0, 6);
    if (bright.length < 2) return;

    // Check if this constellation already has curated pairs
    const hipSet = new Set(bright.map(s => s.hip));
    const hasCurated = CURATED_PAIRS.some(([h1, h2]) => hipSet.has(h1) && hipSet.has(h2));
    if (hasCurated) return; // curated pairs exist, skip auto-connect

    // Auto-connect via nearest-neighbor chain
    const used = new Set<number>();
    let current = bright[0];
    used.add(current.hip);

    for (let i = 1; i < bright.length; i++) {
      let nearest: Star | null = null;
      let minAngDist = Infinity;
      for (const candidate of bright) {
        if (used.has(candidate.hip)) continue;
        const dra = (current.ra - candidate.ra) * Math.cos(current.dec * Math.PI / 180);
        const ddec = current.dec - candidate.dec;
        const angDist = Math.sqrt(dra * dra + ddec * ddec);
        if (angDist < minAngDist) {
          minAngDist = angDist;
          nearest = candidate;
        }
      }
      if (!nearest || minAngDist > 25) break;
      const key = `${Math.min(current.hip, nearest.hip)}-${Math.max(current.hip, nearest.hip)}`;
      if (!pairSet.has(key)) {
        pairs.push([current.hip, nearest.hip]);
        pairSet.add(key);
      }
      used.add(nearest.hip);
      current = nearest;
    }
  });

  return pairs;
}

// Re-export the curated pairs for backward compatibility
export const CONSTELLATION_PAIRS = CURATED_PAIRS;
