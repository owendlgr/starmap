# StarMap Dataset Reference & Integration Guide

This document specifies the exact datasets to use for each page of the StarMap rebuild, and how Claude Code should integrate them.

---

## PAGE 2 — SPACE MISSIONS (Earth View / Mapbox Globe)

### Primary Datasets

**1. Launch Library 2 API — Mission Metadata (ALL countries/companies)**
- **URL**: `https://ll.thespacedevs.com/2.2.0/`
- **Docs**: `https://ll.thespacedevs.com/docs`
- **Format**: REST API, JSON
- **Cost**: Free (no auth required)
- **What it gives you**: Launch dates, rockets, agencies (NASA, ESA, SpaceX, Roscosmos, ISRO, JAXA, CNSA, etc.), launch pad coordinates (lat/lon), mission descriptions, status, orbit type
- **Use for**: Mission list, sidebar data, launch site markers on the Mapbox globe

**2. Launch Dashboard API — Real Telemetry / Trajectory Data**
- **URL**: `https://github.com/shahar603/Launch-Dashboard-API`
- **Format**: REST API, JSON
- **Cost**: Free, open source
- **What it gives you**: Time-series telemetry extracted from official launch webcasts — altitude, velocity, downrange distance, acceleration at each timestamp
- **Use for**: Rendering actual flight paths from launch site outward. Convert (time, altitude, downrange_distance) into 3D arc trajectories on the globe.
- **Note**: Integrated with Launch Library 2 IDs, so you can join the two datasets.

**3. CelesTrak — Orbital TLE Data (for satellites in orbit)**
- **URL**: `https://celestrak.org/NORAD/elements/`
- **Format**: TLE, JSON, CSV, XML
- **Cost**: Free
- **What it gives you**: Two-Line Element sets for all tracked satellites — enough to propagate full orbital paths using SGP4
- **Use for**: Drawing orbital paths around the globe for any satellite/mission after it reaches orbit

**4. JPL Horizons API — Interplanetary Mission Trajectories**
- **URL**: `https://ssd-api.jpl.nasa.gov/doc/horizons.html`
- **Format**: REST API, JSON/CSV
- **Cost**: Free
- **What it gives you**: Ephemeris data (position/velocity vectors) for 239+ spacecraft at any date range
- **Use for**: Deep-space mission paths (Voyager, New Horizons, Mars missions, etc.)

### Integration Instructions for Claude Code

```
SPACE MISSIONS — IMPLEMENTATION PLAN

1. DATA PIPELINE (scripts/ directory):
   a. Create `scripts/fetch_missions.py`:
      - Hit Launch Library 2 API: GET https://ll.thespacedevs.com/2.2.0/launch/?limit=100&offset=0
      - Paginate through ALL launches
      - Extract: id, name, net (date), pad.latitude, pad.longitude, pad.name,
        rocket.configuration.name, launch_service_provider.name,
        launch_service_provider.country_code, mission.orbit.name, status.name
      - Save to data/missions.json

   b. Create `scripts/fetch_telemetry.py`:
      - For each mission ID from step (a), check Launch Dashboard API for telemetry
      - GET https://api.launchdashboard.space/v2/launches/{ll2_id}
      - Extract time-series: [{t, altitude, velocity, downrange_distance}, ...]
      - Save to data/mission_telemetry.json (keyed by mission ID)

   c. Create `scripts/fetch_tle.py`:
      - GET https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json
      - Save to data/satellite_orbits.json

2. DATA SCHEMA (lib/types.ts):
   interface Mission {
     id: string;
     name: string;
     date: string;
     launchSite: { lat: number; lon: number; name: string };
     provider: { name: string; country: string };
     rocket: string;
     orbit: string;
     status: string;
     telemetry?: TelemetryPoint[];
   }

   interface TelemetryPoint {
     time: number;      // seconds from launch
     altitude: number;  // km
     velocity: number;  // m/s
     downrange: number; // km
   }

3. RENDERING (components/):
   - EarthView.tsx: Mapbox GL JS globe with dark style
   - MissionMarkers.tsx: Plot launch sites as markers using pad lat/lon
   - MissionArc.tsx: For missions WITH telemetry, convert (downrange, altitude)
     into a 3D arc from the launch site coordinates using the launch azimuth.
     Use Mapbox custom layers or deck.gl ArcLayer.
   - MissionSidebar.tsx: Show full mission details on selection

4. SGP4 FOR ORBITAL PATHS:
   - npm install satellite.js
   - Use satellite.js to propagate TLE data into lat/lon/alt positions
   - Draw orbital ground tracks on the Mapbox globe as GeoJSON LineStrings

5. TRAJECTORY CONVERSION FORMULA:
   Given launch site (lat, lon) and telemetry (downrange_km, altitude_km):
   - Estimate launch azimuth from orbit inclination
   - For each telemetry point, compute destination point:
     new_lat = asin(sin(lat)*cos(d) + cos(lat)*sin(d)*cos(azimuth))
     new_lon = lon + atan2(sin(azimuth)*sin(d)*cos(lat), cos(d)-sin(lat)*sin(new_lat))
     where d = downrange_km / 6371 (Earth radius)
   - Plot as 3D line with altitude as the Z component
```

---

## PAGE 3 — PLANETARY SYSTEM (Planets + Moons)

### Primary Datasets

**1. JPL Horizons API — Orbital Elements (Planets)**
- **URL**: `https://ssd-api.jpl.nasa.gov/doc/horizons.html`
- **What it gives you**: Keplerian orbital elements (a, e, i, Omega, omega, M) for all 8 planets at any epoch
- **Use for**: Computing planet positions and drawing orbit ellipses in Three.js

**2. NASA Planetary Fact Sheets — Physical Properties**
- **URL**: `https://nssdc.gsfc.nasa.gov/planetary/factsheet/`
- **What it gives you**: Mass, radius, density, gravity, rotation period, axial tilt, atmospheric composition, temperature, number of moons, ring system info
- **Use for**: Sidebar data, scaling planet spheres, rotation animation speeds

**3. JPL Planetary Satellite Mean Orbital Elements — Moon Orbits**
- **URL**: `https://ssd.jpl.nasa.gov/sats/elem/`
- **What it gives you**: Semi-major axis, eccentricity, inclination, period for ALL ~290 known moons
- **Use for**: Drawing moon orbits around their parent planets

**4. JPL Planetary Satellite Physical Parameters — Moon Properties**
- **URL**: `https://ssd.jpl.nasa.gov/sats/phys_par/`
- **What it gives you**: Radius, mass, density, albedo, magnitude for all known moons
- **Use for**: Sizing moon objects, sidebar info

**5. Solar System Scope — Planet Textures**
- **URL**: `https://www.solarsystemscope.com/textures/`
- **License**: CC-BY 4.0 (free, with attribution)
- **What it gives you**: Equirectangular projection PNG textures for all 8 planets, Moon, and Sun — calibrated against real mission imagery
- **Use for**: Three.js SphereGeometry texture mapping

**6. NASA 3D Resources (supplementary)**
- **URL**: `https://science.nasa.gov/3d-resources/`
- **What it gives you**: glTF 2.0 models with Draco compression for planets, moons, asteroids
- **Use for**: Alternative to texture-mapped spheres if you want higher fidelity

### Integration Instructions for Claude Code

```
PLANETARY SYSTEM — IMPLEMENTATION PLAN

1. DATA PIPELINE (scripts/ directory):
   a. Create `scripts/fetch_planet_data.py`:
      - Scrape NASA Planetary Fact Sheets OR use Horizons API
      - For Horizons: query each planet (Mercury=199, Venus=299, Earth=399,
        Mars=499, Jupiter=599, Saturn=699, Uranus=799, Neptune=899)
      - Request ELEMENTS table type for orbital elements
      - Request VECTORS for current position
      - Save to data/planets.json

   b. Create `scripts/fetch_moon_data.py`:
      - Scrape JPL Satellite Mean Elements page (https://ssd.jpl.nasa.gov/sats/elem/)
      - Scrape JPL Satellite Physical Parameters (https://ssd.jpl.nasa.gov/sats/phys_par/)
      - Parse HTML tables (use BeautifulSoup)
      - Join orbital + physical data by moon name
      - Save to data/moons.json

   c. Download textures:
      - Create `scripts/download_textures.py`
      - Download from Solar System Scope into public/textures/planets/
      - Files: sun.jpg, mercury.jpg, venus_surface.jpg, earth_daymap.jpg,
        mars.jpg, jupiter.jpg, saturn.jpg, saturn_ring.png,
        uranus.jpg, neptune.jpg, moon.jpg

2. DATA SCHEMA (lib/types.ts):
   interface Planet {
     id: string;
     name: string;
     orbitalElements: {
       semiMajorAxis: number;  // AU
       eccentricity: number;
       inclination: number;    // degrees
       longAscNode: number;    // degrees
       argPerihelion: number;  // degrees
       meanAnomaly: number;    // degrees at epoch
       period: number;         // days
     };
     physical: {
       radius: number;         // km
       mass: number;           // kg
       density: number;        // g/cm3
       gravity: number;        // m/s2
       rotationPeriod: number; // hours
       axialTilt: number;      // degrees
       temperature: number;    // K (mean)
       atmosphere: string;
     };
     texture: string;          // path to texture file
     hasRings: boolean;
     moonCount: number;
   }

   interface Moon {
     id: string;
     name: string;
     parentPlanet: string;
     orbitalElements: {
       semiMajorAxis: number;  // km (from planet center)
       eccentricity: number;
       inclination: number;    // degrees
       period: number;         // days
     };
     physical: {
       radius: number;         // km
       mass?: number;          // kg (unknown for some small moons)
       albedo?: number;
       density?: number;       // g/cm3
     };
   }

3. RENDERING (components/):
   - SolarSystem.tsx: Main Three.js scene with OrbitControls
   - PlanetMesh.tsx: Textured sphere per planet
     * Use THREE.SphereGeometry + THREE.MeshStandardMaterial with map texture
     * Scale radii logarithmically (actual scale makes inner planets invisible)
     * Rotate each planet based on rotationPeriod and axialTilt
   - OrbitPath.tsx: Draw elliptical orbit lines
     * Convert Keplerian elements to points on an ellipse:
       r = a(1-e^2) / (1 + e*cos(trueAnomaly))
     * Generate ~360 points per orbit, transform by inclination + ascending node
     * Use THREE.Line with dashed material
   - MoonSystem.tsx: For each planet, render its moons orbiting around it
     * Use instanced rendering for planets with many moons (Jupiter: 95, Saturn: 146)
     * Small moons can be point sprites; major moons as small spheres
   - SaturnRings.tsx: THREE.RingGeometry with saturn_ring.png texture
   - PlanetSidebar.tsx: Physical data, atmosphere, moon list

4. POSITION COMPUTATION (lib/orbitalMechanics.ts):
   - Implement Kepler equation solver: M = E - e*sin(E) (Newton-Raphson)
   - Convert mean anomaly -> eccentric anomaly -> true anomaly -> position
   - Transform from orbital plane to 3D scene coordinates
   - Animate by advancing mean anomaly over time: M(t) = M0 + (2*PI/period)*t

5. SCALE STRATEGY:
   - Use logarithmic distance scaling: displayDist = log10(realDist_AU) * scaleFactor
   - Use exaggerated planet radii: displayRadius = realRadius^0.3 * scaleFactor
   - This keeps everything visible while preserving relative ordering
```

---

## PAGE 4 — GALAXY MAP (Nearby Galaxies)

### Primary Datasets

**1. Updated Nearby Galaxy Catalog (Karachentsev et al. 2013) — Core Dataset**
- **URL**: `https://heasarc.gsfc.nasa.gov/W3Browse/galaxy-catalog/neargalcat.html`
- **Format**: Queryable database, downloadable as CSV/VOTable
- **Cost**: Free
- **What it gives you**: 869 galaxies within 11 Mpc (~36 million light-years) — RA, Dec, distance (Mpc), morphological type, angular diameter, magnitudes, stellar mass, HI mass, radial velocity, surface brightness
- **Use for**: Primary 3D galaxy positions. This is the gold standard for nearby galaxies with individually measured distances (not just redshift estimates).

**2. Cosmicflows-4 / Extragalactic Distance Database — Extended Dataset**
- **URL**: `https://edd.ifa.hawaii.edu/`
- **Format**: VOTable, ASCII tables
- **Cost**: Free
- **What it gives you**: 55,877 galaxies with distances up to ~300 Mpc (~1 billion light-years), using multiple measurement methods (Tully-Fisher, Fundamental Plane, etc.)
- **Use for**: Extended galaxy field beyond the local volume. Use as an outer shell of thousands of galaxies.

**3. 2MASS Redshift Survey (2MRS) — Full-Sky Coverage**
- **URL**: `https://data.nasa.gov/dataset/2mass-redshift-survey-2mrs-catalog`
- **Format**: CSV
- **Cost**: Free
- **What it gives you**: 43,533 galaxies with redshifts (and thus distances) across the entire sky
- **Use for**: All-sky backdrop layer with uniform coverage

**4. OpenNGC — Software-Ready Catalog**
- **URL**: `https://github.com/mattiaverga/OpenNGC`
- **Format**: CSV (GitHub), Python package (PyOngc)
- **License**: CC-BY-SA-4.0
- **What it gives you**: NGC/IC objects with coordinates, morphology, radial velocity, major/minor axis, Hubble classification
- **Use for**: Well-known named galaxies (Andromeda, Triangulum, etc.) with structured data ready for code

### Integration Instructions for Claude Code

```
GALAXY MAP — IMPLEMENTATION PLAN

1. DATA PIPELINE (scripts/ directory):
   a. Create `scripts/fetch_nearby_galaxies.py`:
      - Query HEASARC for the neargalcat table:
        GET https://heasarc.gsfc.nasa.gov/cgi-bin/W3Browse/w3query.pl
        with params: tablehead=neargalcat&Fields=name,ra,dec,distance,morph_type,
        abs_mag_b,log_stellar_mass,ang_diam_maj&displaymode=BatchDisplay&
        ResultMax=0&Action=Query&Format=CSV
      - Save to data/nearby_galaxies.csv

   b. Create `scripts/fetch_extended_galaxies.py`:
      - Download 2MRS catalog from NASA Open Data
      - Parse CSV, extract: name, RA, Dec, redshift, Ks magnitude
      - Compute distance: d_Mpc = (cz / H0) where c=299792 km/s, H0=70 km/s/Mpc
      - Save to data/extended_galaxies.csv

   c. Create `scripts/process_galaxies.py`:
      - Load both datasets
      - Convert RA/Dec/Distance to Cartesian (x, y, z) for Three.js:
        x = d * cos(Dec) * cos(RA)
        y = d * cos(Dec) * sin(RA)
        z = d * sin(Dec)
      - Assign galaxy type categories: Spiral, Elliptical, Irregular, Dwarf
      - Output data/galaxies.json with layered structure

2. DATA SCHEMA (lib/types.ts):
   interface Galaxy {
     id: string;
     name: string;
     ra: number;           // degrees
     dec: number;          // degrees
     distance: number;     // Mpc
     position: [number, number, number]; // Cartesian x,y,z
     type: 'spiral' | 'elliptical' | 'irregular' | 'dwarf' | 'unknown';
     morphology?: string;  // Hubble type (Sa, Sb, E0, etc.)
     magnitude?: number;   // absolute B magnitude
     angularSize?: number; // arcminutes
     stellarMass?: number; // log solar masses
     radialVelocity?: number; // km/s
   }

3. RENDERING (components/):
   - GalaxyMap.tsx: Main Three.js scene
   - GalaxyField.tsx: InstancedMesh or Points for bulk rendering
     * Layer 1: Nearby (< 11 Mpc, ~869 galaxies) — larger sprites, clickable
     * Layer 2: Extended (11-300 Mpc, up to ~55,000) — small point sprites
     * Color by type: spirals=blue, ellipticals=red/orange, irregular=green
     * Size by magnitude (brighter = larger sprite)
   - GalaxySprite.tsx: Billboard sprite with galaxy icon
     * Use different sprite textures per morphology type
     * Spiral icon for Sa/Sb/Sc, ellipse icon for E0-E7, irregular blob for Irr
   - MilkyWayMarker.tsx: "You Are Here" indicator at origin
   - GalaxySidebar.tsx: Name, type, distance, mass, velocity on selection
   - GalaxyLabels.tsx: CSS2DRenderer labels for major named galaxies
     (Andromeda, LMC, SMC, Triangulum, etc.)

4. CAMERA & NAVIGATION:
   - OrbitControls centered on Milky Way position (origin)
   - Logarithmic depth buffer for extreme distance range
   - Fog/fade for distant galaxies
   - Click raycasting for galaxy selection

5. SCALE STRATEGY:
   - 1 unit in Three.js = 1 Mpc
   - Nearby galaxies (< 11 Mpc) within a small sphere around origin
   - Extended galaxies form the cosmic web structure outward
   - Use logarithmic scaling for camera zoom to traverse scales
```

---

## SUMMARY: RECOMMENDED DATASETS PER PAGE

| Page | Primary Dataset | What It Provides | Format |
|------|----------------|-------------------|--------|
| **Missions** | Launch Library 2 API | All launches, all countries, pad coordinates | JSON API |
| **Missions** | Launch Dashboard API | Real flight telemetry (altitude, velocity, downrange) | JSON API |
| **Missions** | CelesTrak | Satellite orbital elements (TLE) for orbit rendering | JSON/TLE |
| **Missions** | JPL Horizons | Deep-space mission ephemerides | JSON API |
| **Planets** | JPL Horizons API | Orbital elements for all 8 planets | JSON API |
| **Planets** | NASA Fact Sheets | Physical properties (mass, radius, atmosphere, etc.) | HTML (scrape) |
| **Moons** | JPL Satellite Elements | Orbital elements for all ~290 moons | HTML (scrape) |
| **Moons** | JPL Satellite Phys Params | Radius, mass, albedo for all moons | HTML (scrape) |
| **Textures** | Solar System Scope | Planet texture PNGs (CC-BY 4.0) | PNG images |
| **Galaxies** | Nearby Galaxy Catalog | 869 galaxies < 11 Mpc with measured distances | CSV |
| **Galaxies** | Cosmicflows-4 / EDD | 55,877 galaxies < 300 Mpc | VOTable/CSV |
| **Galaxies** | 2MRS | 43,533 galaxies full-sky | CSV |

## NPM PACKAGES NEEDED

```bash
npm install satellite.js    # SGP4 propagation for satellite orbits
npm install three            # Already installed — 3D rendering
npm install mapbox-gl        # Already configured — Earth globe view
npm install @deck.gl/core @deck.gl/layers  # Optional: arc layers for trajectories
```

## PYTHON PACKAGES FOR DATA PIPELINES

```bash
pip install requests beautifulsoup4 astropy pandas numpy
```

## KEY NOTES FOR CLAUDE CODE

1. **All data scripts go in `scripts/`** and output to `data/` — matching existing project convention
2. **All data must be pre-generated** at build time — do not call APIs at runtime from the browser
3. **Add npm run commands** to package.json for each new script (e.g., `npm run fetch-missions`)
4. **Respect rate limits**: Launch Library 2 allows 15 req/sec; Horizons has no hard limit but be reasonable
5. **Attribution**: Solar System Scope textures require CC-BY 4.0 attribution — add to the app footer
6. **No placeholder data** — every number rendered in the UI must come from these verified scientific sources
