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
