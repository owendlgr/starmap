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

export interface MissionStage {
  name: string;            // e.g. "Launch", "Trans-Lunar Injection", "Lunar Orbit"
  date?: string;           // ISO date of this stage
  description?: string;
  status?: 'completed' | 'active' | 'upcoming' | 'failed';
}

export interface MissionWaypoint {
  label: string;           // e.g. "Earth", "Mars Gravity Assist", "Jupiter Flyby"
  date?: string;           // ISO date of flyby/arrival
  lat?: number;            // latitude at body (if applicable)
  lng?: number;            // longitude at body (if applicable)
  distanceAU?: number;     // distance from Sun at this point
  body?: string;           // celestial body name
  description?: string;    // additional info about this waypoint
}

export interface CrewMember {
  name: string;
  role: string;            // e.g. "Commander", "Pilot", "Mission Specialist"
  agency?: string;
  nationality?: string;
}

export type MissionCategory = 'crewed' | 'robotic' | 'cargo' | 'satellite' | 'test' | 'planetary' | 'observatory' | 'other';
export type MissionDestination = 'LEO' | 'GEO' | 'lunar' | 'mars' | 'venus' | 'jupiter' | 'saturn' | 'outer' | 'sun' | 'asteroid' | 'comet' | 'interstellar' | 'other';
export type MissionStatus = 'success' | 'partial' | 'failed' | 'active' | 'upcoming' | 'in-transit' | 'ended';

export interface Mission {
  id: string;
  name: string;
  agency: string;
  agencyCountry?: string;
  status: string;
  statusCategory?: MissionStatus;
  date: string;            // ISO date
  endDate?: string;        // ISO date (if mission has ended)
  launchSite: {
    name: string;
    latitude: number;
    longitude: number;
  };
  rocket: string;
  orbit?: string;
  description?: string;
  imageUrl?: string;
  patchUrl?: string;       // mission patch image
  missionType?: string;
  category?: MissionCategory;
  destination?: MissionDestination;
  isDeepSpace?: boolean;   // true if beyond Earth orbit
  isActive?: boolean;      // true if currently operational
  crew?: CrewMember[];
  stages?: MissionStage[];
  waypoints?: MissionWaypoint[];
  telemetry?: TelemetryPoint[];
  payload?: string;
  massKg?: number;         // payload mass in kg
  costUSD?: number;        // mission cost in USD
  nasaUrl?: string;        // link to NASA mission page
  wikiUrl?: string;        // link to Wikipedia
}

export interface LaunchSite {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  launchCount?: number;
}

/* ── Mission filter state ────────────────────────────────── */

export interface MissionFilters {
  search: string;
  agency: string;          // 'all' or agency name
  category: MissionCategory | 'all';
  destination: MissionDestination | 'all';
  status: MissionStatus | 'all';
  dateRange: [number, number] | null; // [startYear, endYear]
}

/* ── App types ────────────────────────────────────────────── */

export type AppPage = 'missions' | 'planets' | 'stars' | 'galaxies' | 'streams';
export type ThemeMode = 'light' | 'dark';

/* ── Navigation ──────────────────────────────────────────── */

export interface NavItem {
  id: AppPage;
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

/* ── Search result (cross-section global search) ─────────── */

export interface GlobalSearchResult {
  id: string;
  type: AppPage | 'moon' | 'asteroid' | 'exoplanet';
  name: string;
  subtitle: string;
  href: string;
}
