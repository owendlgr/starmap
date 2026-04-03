/**
 * Trajectory data loader — loads SPICE-derived trajectory data
 * from pre-fetched NASA Horizons data (public/data/trajectories.json).
 */

export interface TrajectoryPoint {
  jd: number;       // Julian Date
  date: string;     // ISO date
  x: number;        // AU (heliocentric ecliptic) or km (geocentric)
  y: number;        // AU or km
  z: number;        // AU or km
  dist_au: number;  // distance from center body
}

export interface TrajectoryData {
  name: string;
  horizons_id: string;
  coord: 'heliocentric' | 'geocentric';
  center: string;
  start: string;
  stop: string;
  point_count: number;
  points: TrajectoryPoint[];
}

export interface TrajectoryDatabase {
  generated: string;
  source: string;
  spacecraft_count: number;
  trajectories: Record<string, TrajectoryData>;
}

let cachedData: TrajectoryDatabase | null = null;
let loadPromise: Promise<TrajectoryDatabase | null> | null = null;

/**
 * Load trajectory data from pre-fetched JSON.
 * Caches after first load.
 */
export async function loadTrajectories(): Promise<TrajectoryDatabase | null> {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/data/trajectories.json')
    .then((res) => {
      if (!res.ok) return null;
      return res.json() as Promise<TrajectoryDatabase>;
    })
    .then((data) => {
      cachedData = data;
      return data;
    })
    .catch(() => null);

  return loadPromise;
}

/**
 * Get trajectory data for a specific mission ID.
 */
export function getTrajectory(db: TrajectoryDatabase | null, missionId: string): TrajectoryData | null {
  if (!db) return null;
  return db.trajectories[missionId] ?? null;
}

/**
 * Get planet reference orbit for context rendering.
 */
export function getPlanetOrbit(db: TrajectoryDatabase | null, planet: 'earth' | 'mars' | 'jupiter' | 'saturn'): TrajectoryData | null {
  if (!db) return null;
  return db.trajectories[`_${planet}_orbit`] ?? null;
}

/**
 * Check if a mission has real SPICE trajectory data available.
 */
export function hasRealTrajectory(db: TrajectoryDatabase | null, missionId: string): boolean {
  if (!db) return false;
  return missionId in db.trajectories;
}
