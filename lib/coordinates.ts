// Coordinate conversion utilities

export const PC_TO_LY   = 3.26156;
export const PC_TO_AU   = 206264.8;
export const LY_TO_KM   = 9.461e12;
export const C_KM_S     = 299792.458; // km/s
export const VOYAGER_KM_S = 17.0;     // ~17 km/s

export function pcToLy(pc: number): number { return pc * PC_TO_LY; }
export function lyToPc(ly: number): number { return ly / PC_TO_LY; }
export function pcToAU(pc: number): number { return pc * PC_TO_AU; }

export function formatDistance(dist_pc: number, unit: 'pc' | 'ly' | 'au' = 'ly'): string {
  if (dist_pc === 0) return 'Here (0 distance)';
  if (unit === 'pc') {
    if (dist_pc < 0.001) return `${(dist_pc * PC_TO_AU).toFixed(1)} AU`;
    if (dist_pc < 1) return `${dist_pc.toFixed(4)} pc`;
    if (dist_pc < 1000) return `${dist_pc.toFixed(2)} pc`;
    return `${(dist_pc / 1000).toFixed(2)} kpc`;
  }
  if (unit === 'ly') {
    const ly = pcToLy(dist_pc);
    if (ly < 1) return `${(ly * 365.25).toFixed(1)} light-days`;
    if (ly < 1000) return `${ly.toFixed(2)} ly`;
    if (ly < 1e6) return `${(ly / 1000).toFixed(2)} kly`;
    return `${(ly / 1e6).toFixed(2)} Mly`;
  }
  // AU
  const au = pcToAU(dist_pc);
  if (au < 1000) return `${au.toFixed(1)} AU`;
  return `${(au / 1000).toFixed(2)} kAU`;
}

export function formatRA(ra_deg: number): string {
  const h = Math.floor(ra_deg / 15);
  const m = Math.floor((ra_deg / 15 - h) * 60);
  const s = ((ra_deg / 15 - h) * 60 - m) * 60;
  return `${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m ${s.toFixed(1).padStart(4,'0')}s`;
}

export function formatDec(dec_deg: number): string {
  const sign = dec_deg >= 0 ? '+' : '-';
  const abs = Math.abs(dec_deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2,'0')}° ${m.toString().padStart(2,'0')}' ${s.toFixed(1).padStart(4,'0')}"`;
}

export function distanceBetween(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export interface TravelTime {
  lightspeed_years: number;
  pct10c_years: number;
  pct01c_years: number;
  voyager_years: number;
}

export function calcTravelTime(dist_pc: number): TravelTime {
  const ly = pcToLy(dist_pc);
  const dist_km = ly * LY_TO_KM;
  const s_per_year = 365.25 * 24 * 3600;
  return {
    lightspeed_years: ly,
    pct10c_years: ly / 0.1,
    pct01c_years: ly / 0.01,
    voyager_years: dist_km / (VOYAGER_KM_S * s_per_year),
  };
}

export function formatTravelTime(years: number): string {
  if (years < 0.001) return `${(years * 365.25).toFixed(1)} days`;
  if (years < 1) return `${(years * 12).toFixed(1)} months`;
  if (years < 1000) return `${years.toFixed(1)} years`;
  if (years < 1e6) return `${(years / 1000).toFixed(2)}K years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(2)}M years`;
  return `${(years / 1e9).toFixed(2)}B years`;
}

// ── Derived stellar properties ────────────────────────────

/** Ballesteros (2012) temperature estimate from B-V color index */
export function estimateTemperature(bv: number): number {
  if (!isFinite(bv) || bv < -0.4) bv = -0.3;
  if (bv > 2.0) bv = 2.0;
  return Math.round(4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)));
}

export function formatTemperature(k: number): string {
  return k.toLocaleString() + ' K';
}

export function estimateMass(spectral: string): string {
  const cls = (spectral || '').toUpperCase()[0];
  switch (cls) {
    case 'O': return '15 – 90+ M☉';
    case 'B': return '2 – 15 M☉';
    case 'A': return '1.4 – 2.1 M☉';
    case 'F': return '1.04 – 1.4 M☉';
    case 'G': return '0.8 – 1.04 M☉';
    case 'K': return '0.45 – 0.8 M☉';
    case 'M': return '0.08 – 0.45 M☉';
    case 'L': case 'T': return '< 0.08 M☉ (brown dwarf)';
    default: return '—';
  }
}

export function estimateAge(spectral: string): string {
  const cls = (spectral || '').toUpperCase()[0];
  switch (cls) {
    case 'O': return '~3 – 10 Myr';
    case 'B': return '~30 Myr – 1 Gyr';
    case 'A': return '~1 – 3 Gyr';
    case 'F': return '~3 – 7 Gyr';
    case 'G': return '~5 – 12 Gyr';
    case 'K': return '~10 – 30 Gyr';
    case 'M': return '~50 – 200+ Gyr';
    default: return '—';
  }
}

/** Absolute magnitude from apparent magnitude and distance in parsecs */
export function absoluteMagnitude(mag: number, dist_pc: number): string {
  if (dist_pc <= 0) return mag.toFixed(2);
  const M = mag - 5 * Math.log10(dist_pc / 10);
  return M.toFixed(2);
}

/** Parallax in milliarcseconds from distance in parsecs */
export function parallaxFromDist(dist_pc: number): string {
  if (dist_pc <= 0) return '0 mas';
  return (1000 / dist_pc).toFixed(2) + ' mas';
}

// ── Constellation lookup ──────────────────────────────────

// All 88 IAU constellations with approximate center coordinates (RA in degrees, Dec in degrees)
const CONSTELLATION_CENTERS: { abbr: string; name: string; ra: number; dec: number }[] = [
  { abbr: 'And', name: 'Andromeda',             ra: 17,  dec:  38 },
  { abbr: 'Ant', name: 'Antlia',                ra: 153, dec: -33 },
  { abbr: 'Aps', name: 'Apus',                  ra: 242, dec: -75 },
  { abbr: 'Aqr', name: 'Aquarius',              ra: 339, dec: -11 },
  { abbr: 'Aql', name: 'Aquila',                ra: 297, dec:   3 },
  { abbr: 'Ara', name: 'Ara',                   ra: 259, dec: -53 },
  { abbr: 'Ari', name: 'Aries',                 ra: 28,  dec:  20 },
  { abbr: 'Aur', name: 'Auriga',                ra: 90,  dec:  42 },
  { abbr: 'Boo', name: 'Boötes',                ra: 219, dec:  31 },
  { abbr: 'Cae', name: 'Caelum',                ra: 70,  dec: -38 },
  { abbr: 'Cam', name: 'Camelopardalis',        ra: 90,  dec:  70 },
  { abbr: 'Cnc', name: 'Cancer',                ra: 130, dec:  20 },
  { abbr: 'CVn', name: 'Canes Venatici',        ra: 194, dec:  40 },
  { abbr: 'CMa', name: 'Canis Major',           ra: 101, dec: -22 },
  { abbr: 'CMi', name: 'Canis Minor',           ra: 115, dec:   6 },
  { abbr: 'Cap', name: 'Capricornus',           ra: 320, dec: -18 },
  { abbr: 'Car', name: 'Carina',                ra: 120, dec: -60 },
  { abbr: 'Cas', name: 'Cassiopeia',            ra: 12,  dec:  62 },
  { abbr: 'Cen', name: 'Centaurus',             ra: 183, dec: -48 },
  { abbr: 'Cep', name: 'Cepheus',               ra: 323, dec:  70 },
  { abbr: 'Cet', name: 'Cetus',                 ra: 26,  dec:  -7 },
  { abbr: 'Cha', name: 'Chamaeleon',            ra: 161, dec: -79 },
  { abbr: 'Cir', name: 'Circinus',              ra: 220, dec: -63 },
  { abbr: 'Col', name: 'Columba',               ra: 86,  dec: -35 },
  { abbr: 'Com', name: 'Coma Berenices',        ra: 193, dec:  22 },
  { abbr: 'CrA', name: 'Corona Australis',      ra: 283, dec: -41 },
  { abbr: 'CrB', name: 'Corona Borealis',       ra: 233, dec:  32 },
  { abbr: 'Crv', name: 'Corvus',                ra: 187, dec: -18 },
  { abbr: 'Crt', name: 'Crater',                ra: 170, dec: -14 },
  { abbr: 'Cru', name: 'Crux',                  ra: 187, dec: -60 },
  { abbr: 'Cyg', name: 'Cygnus',                ra: 309, dec:  42 },
  { abbr: 'Del', name: 'Delphinus',             ra: 309, dec:  12 },
  { abbr: 'Dor', name: 'Dorado',                ra: 80,  dec: -60 },
  { abbr: 'Dra', name: 'Draco',                 ra: 240, dec:  65 },
  { abbr: 'Equ', name: 'Equuleus',              ra: 318, dec:   7 },
  { abbr: 'Eri', name: 'Eridanus',              ra: 51,  dec: -20 },
  { abbr: 'For', name: 'Fornax',                ra: 45,  dec: -30 },
  { abbr: 'Gem', name: 'Gemini',                ra: 113, dec:  22 },
  { abbr: 'Gru', name: 'Grus',                  ra: 340, dec: -47 },
  { abbr: 'Her', name: 'Hercules',              ra: 258, dec:  27 },
  { abbr: 'Hor', name: 'Horologium',            ra: 48,  dec: -53 },
  { abbr: 'Hya', name: 'Hydra',                 ra: 156, dec: -14 },
  { abbr: 'Hyi', name: 'Hydrus',                ra: 30,  dec: -72 },
  { abbr: 'Ind', name: 'Indus',                 ra: 318, dec: -55 },
  { abbr: 'Lac', name: 'Lacerta',               ra: 337, dec:  46 },
  { abbr: 'Leo', name: 'Leo',                   ra: 165, dec:  13 },
  { abbr: 'LMi', name: 'Leo Minor',             ra: 158, dec:  33 },
  { abbr: 'Lep', name: 'Lepus',                 ra: 84,  dec: -19 },
  { abbr: 'Lib', name: 'Libra',                 ra: 229, dec: -15 },
  { abbr: 'Lup', name: 'Lupus',                 ra: 232, dec: -43 },
  { abbr: 'Lyn', name: 'Lynx',                  ra: 120, dec:  47 },
  { abbr: 'Lyr', name: 'Lyra',                  ra: 285, dec:  36 },
  { abbr: 'Men', name: 'Mensa',                 ra: 82,  dec: -77 },
  { abbr: 'Mic', name: 'Microscopium',          ra: 316, dec: -36 },
  { abbr: 'Mon', name: 'Monoceros',             ra: 109, dec:   0 },
  { abbr: 'Mus', name: 'Musca',                 ra: 190, dec: -70 },
  { abbr: 'Nor', name: 'Norma',                 ra: 243, dec: -50 },
  { abbr: 'Oct', name: 'Octans',                ra: 330, dec: -83 },
  { abbr: 'Oph', name: 'Ophiuchus',             ra: 258, dec:  -4 },
  { abbr: 'Ori', name: 'Orion',                 ra: 83,  dec:   5 },
  { abbr: 'Pav', name: 'Pavo',                  ra: 287, dec: -65 },
  { abbr: 'Peg', name: 'Pegasus',               ra: 341, dec:  19 },
  { abbr: 'Per', name: 'Perseus',               ra: 50,  dec:  45 },
  { abbr: 'Phe', name: 'Phoenix',               ra: 16,  dec: -49 },
  { abbr: 'Pic', name: 'Pictor',                ra: 82,  dec: -53 },
  { abbr: 'PsA', name: 'Piscis Austrinus',      ra: 338, dec: -30 },
  { abbr: 'Psc', name: 'Pisces',                ra: 8,   dec:  13 },
  { abbr: 'Pup', name: 'Puppis',                ra: 113, dec: -31 },
  { abbr: 'Pyx', name: 'Pyxis',                 ra: 133, dec: -27 },
  { abbr: 'Ret', name: 'Reticulum',             ra: 58,  dec: -62 },
  { abbr: 'Sge', name: 'Sagitta',               ra: 298, dec:  19 },
  { abbr: 'Sgr', name: 'Sagittarius',           ra: 283, dec: -28 },
  { abbr: 'Sco', name: 'Scorpius',              ra: 255, dec: -27 },
  { abbr: 'Scl', name: 'Sculptor',              ra: 10,  dec: -33 },
  { abbr: 'Sct', name: 'Scutum',                ra: 279, dec: -10 },
  { abbr: 'Ser', name: 'Serpens',               ra: 245, dec:  10 },
  { abbr: 'Sex', name: 'Sextans',               ra: 153, dec:  -2 },
  { abbr: 'Tau', name: 'Taurus',                ra: 68,  dec:  16 },
  { abbr: 'Tel', name: 'Telescopium',           ra: 272, dec: -49 },
  { abbr: 'TrA', name: 'Triangulum Australe',   ra: 249, dec: -65 },
  { abbr: 'Tri', name: 'Triangulum',            ra: 32,  dec:  32 },
  { abbr: 'Tuc', name: 'Tucana',                ra: 352, dec: -66 },
  { abbr: 'UMa', name: 'Ursa Major',            ra: 162, dec:  50 },
  { abbr: 'UMi', name: 'Ursa Minor',            ra: 230, dec:  77 },
  { abbr: 'Vel', name: 'Vela',                  ra: 136, dec: -47 },
  { abbr: 'Vir', name: 'Virgo',                 ra: 198, dec:  -4 },
  { abbr: 'Vol', name: 'Volans',                ra: 117, dec: -69 },
  { abbr: 'Vul', name: 'Vulpecula',             ra: 302, dec:  24 },
];

/** Approximate constellation from RA/Dec using nearest-center lookup */
export function getConstellation(ra: number, dec: number): string {
  const r1 = ra * Math.PI / 180;
  const d1 = dec * Math.PI / 180;
  let minD = Infinity, nearest = 'Unknown';
  for (const c of CONSTELLATION_CENTERS) {
    const r2 = c.ra * Math.PI / 180;
    const d2 = c.dec * Math.PI / 180;
    const dot = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(r1 - r2);
    const d = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (d < minD) { minD = d; nearest = c.name; }
  }
  return nearest;
}

/** Get approximate color hex from B-V index for the swatch display */
export function bvToColor(bv: number): string {
  // Map B-V to approximate RGB: blue stars (bv<0) → white-blue; red stars (bv>1.5) → deep red
  const t = Math.max(-0.4, Math.min(2.0, bv));
  if (t < 0) return '#9bb0ff';       // blue-white
  if (t < 0.3) return '#cad7ff';     // white-blue
  if (t < 0.6) return '#fff4e8';     // white-yellow (solar)
  if (t < 1.0) return '#ffd2a1';     // orange
  if (t < 1.5) return '#ffb347';     // orange-red
  return '#ff6a40';                  // deep red-orange
}
