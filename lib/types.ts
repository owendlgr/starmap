/* ── Star types (existing) ────────────────────────────────── */

export interface Star {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  mag: number;
  bv: number;
  spectral: string;
  type: string;
  ra: number;
  dec: number;
  dist_pc: number;
  size: number;
  color: [number, number, number];
  catalog: string;
  hip: number;
}

export interface StarChunk {
  count: number;
  stars: Star[];
}

export interface SearchEntry {
  id: number;
  name: string;
  type: string;
  mag: number;
  dist_pc: number;
}

export type ScaleUnit = 'pc' | 'ly' | 'au';
export type InteractionMode = 'explore' | 'measure';

/* ── Planet types ─────────────────────────────────────────── */

export interface OrbitalElements {
  semiMajorAxis: number;   // AU (planets) or km (moons)
  eccentricity: number;
  inclination: number;     // degrees
  longAscNode: number;     // degrees (Omega)
  argPerihelion: number;   // degrees (omega)
  meanAnomaly: number;     // degrees at epoch
  period: number;          // days
}

export interface PlanetData {
  id: string;
  name: string;
  type: 'planet' | 'dwarf';
  mass: number;            // 10^24 kg
  radius: number;          // km
  density: number;         // g/cm^3
  distanceAU: number;      // semi-major axis AU
  orbitalPeriod: number;   // days
  rotationPeriod: number;  // hours
  eccentricity: number;
  inclination: number;     // degrees
  axialTilt: number;       // degrees
  meanTemp: number;        // Kelvin
  gravity: number;         // m/s^2
  escapeVelocity: number;  // km/s
  hasRings: boolean;
  atmosphere: string[];
  moons: MoonData[];
  texture: string;         // filename in /textures/
  color: string;           // hex fallback color
  orbitalElements?: OrbitalElements;
}

export interface MoonData {
  id: string;
  name: string;
  parentPlanet?: string;
  radius: number;          // km
  distanceKm: number;      // orbital distance from parent
  orbitalPeriod: number;   // days
  mass: number;            // 10^20 kg
  eccentricity?: number;
  inclination?: number;    // degrees
  albedo?: number;
  density?: number;        // g/cm^3
}

/* ── Galaxy types ─────────────────────────────────────────── */

export type GalaxyType = 'spiral' | 'elliptical' | 'irregular' | 'dwarf' | 'lenticular' | 'unknown';

export interface GalaxyData {
  id: string;
  name: string;
  altName?: string;        // NGC/IC/Messier number
  type: string;            // raw morphology string
  galaxyType?: GalaxyType; // categorized type
  hubbleType?: string;     // Sa, Sb, E0, etc.
  ra: number;              // degrees
  dec: number;             // degrees
  distanceMpc?: number;    // megaparsecs
  magnitude?: number;      // apparent or absolute mag
  absMagnitude?: number;   // absolute B magnitude
  majorAxis?: number;      // arcminutes
  minorAxis?: number;      // arcminutes
  constellation?: string;
  stellarMass?: number;    // log solar masses
  radialVelocity?: number; // km/s
  x?: number;              // computed cartesian (Mpc)
  y?: number;
  z?: number;
}

/* ── Mission types ────────────────────────────────────────── */

export interface TelemetryPoint {
  time: number;            // seconds from launch
  altitude: number;        // km
  velocity: number;        // m/s
  downrange: number;       // km
}

export interface Mission {
  id: string;
  name: string;
  agency: string;
  agencyCountry?: string;
  status: string;
  date: string;            // ISO date
  launchSite: {
    name: string;
    latitude: number;
    longitude: number;
  };
  rocket: string;
  orbit?: string;
  description?: string;
  imageUrl?: string;
  missionType?: string;
  telemetry?: TelemetryPoint[];
}

export interface LaunchSite {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  launchCount?: number;
}

/* ── App types ────────────────────────────────────────────── */

export type AppPage = 'stars' | 'earth' | 'planets' | 'galaxies';
export type ThemeMode = 'light' | 'dark';
