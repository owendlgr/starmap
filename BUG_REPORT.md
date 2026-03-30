# StarData Bug Report & Fix Instructions for Claude Code

Generated from live site analysis at https://stardata.space on March 31, 2026.
Reference design: worldmonitor.app (specs in UI_VERIFICATION_PROMPT.md).

---

## CRITICAL BUGS (Broken functionality)

### BUG 1: Earth Globe Has No Texture — Just a Dark Sphere
**Page**: `/earth`
**File**: `components/earth/EarthScene.tsx`
**Problem**: The globe renders as a plain dark blue sphere (`#0a2a3a`) with no Earth map texture. There are no texture files in `/public/textures/`. The globe needs an actual Earth surface texture so users can see continents, oceans, and recognize where launch sites are.
**Fix**:
1. Download a high-res Earth daymap texture (e.g., from NASA Visible Earth or Solar System Scope — CC-BY 4.0)
2. Save to `public/textures/earth_daymap.jpg`
3. In `EarthScene.tsx`, use `useLoader(TextureLoader, '/textures/earth_daymap.jpg')` and apply as the `map` property on the sphere material
4. Also consider adding a night lights texture and cloud overlay for visual quality
5. The grid lines (lat/lon at 30° intervals) can stay as a toggle but should NOT be the primary visual

### BUG 2: Missions API Returns Only ~100 Future Launches, No Past Missions
**Page**: `/earth`
**File**: `app/api/missions/route.ts`, line 170
**Problem**: The Launch Library 2 API call is `https://ll.thespacedevs.com/2.2.0/launch/?limit=100&offset=0&ordering=-net`. This returns only the most recent/upcoming 100 launches. There is no `missions.json` pre-generated file in `/public/data/`, so the API is the only source. The status bar shows "100 LAUNCHES" and every mission badge shows "TO BE DETE..." (To Be Determined) — confirming these are future scheduled launches, not historical ones.
**Fix**:
1. Create `scripts/fetch_missions.py` that paginates through the FULL LL2 API history:
   - Use `https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=100&offset=0` for PAST launches
   - Use `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=100&offset=0` for UPCOMING launches
   - Paginate ALL pages (follow `next` URL in response) — there are ~7,000+ historical launches
   - Merge both sets and save to `public/data/missions.json`
2. In `app/api/missions/route.ts`:
   - Change `fetchLL2()` to query BOTH `/launch/previous/` and `/launch/upcoming/` endpoints
   - Increase limit or paginate to get all available data
   - The existing `loadLocalData()` function already handles `missions.json` — just ensure the file exists
3. Add `npm run fetch-missions` to package.json scripts (it's already referenced but the Python script doesn't exist or doesn't output correctly)
4. The fallback dataset of ~50 landmark missions should remain as a last resort

### BUG 3: No Flight Path Arcs / Trajectory Rendering on Globe
**Page**: `/earth`
**Files**: `components/earth/EarthScene.tsx`, `lib/stores/earthStore.ts`
**Problem**: The `showTrajectories` flag exists in the earth store but NO trajectory rendering code exists in the scene. Launch sites show as dots on the globe but there are no arcs, lines, or animated flight paths between launch sites and orbits.
**Fix**:
1. Create `components/earth/TrajectoryArcs.tsx`:
   - For each mission with a known orbit type, draw a 3D arc from the launch site coordinates upward and outward
   - Use `THREE.CubicBezierCurve3` or `THREE.QuadraticBezierCurve3` to create arcs
   - Arc height/direction based on orbit type:
     - LEO: short arc rising ~200km equivalent above surface
     - GTO/GEO: tall arc reaching higher altitude
     - Lunar/Heliocentric: arc that extends beyond the globe frame
   - Color arcs by agency or status
   - Animate with a shader or moving point along the curve
2. Wire the `showTrajectories` toggle in the layer panel to show/hide arcs
3. On mission selection, highlight that mission's arc

### BUG 4: Planet Textures Not Loading — Flat Color Spheres
**Page**: `/planets`
**Files**: `components/planets/PlanetMesh.tsx`, `lib/data/planets.ts`
**Problem**: Planet data in `lib/data/planets.ts` references texture filenames (e.g., `mercury.jpg`, `venus.jpg`, `earth_day.jpg`) but the `/public/textures/` directory is EMPTY. Planets render as plain colored spheres — Mercury is gray, Venus is tan, Earth is blue, etc. This looks childish and unscientific.
**Fix**:
1. Create `scripts/download_textures.py`:
   - Download from Solar System Scope (https://www.solarsystemscope.com/textures/) — CC-BY 4.0 license
   - Save to `public/textures/planets/`:
     - `mercury.jpg`, `venus_surface.jpg`, `venus_atmosphere.jpg`
     - `earth_daymap.jpg`, `earth_nightmap.jpg`, `earth_clouds.jpg`
     - `mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `saturn_ring.png`
     - `uranus.jpg`, `neptune.jpg`, `moon.jpg`, `sun.jpg`
2. Update `PlanetMesh.tsx`:
   - Use `useLoader(TextureLoader, planet.texture)` to load each planet's texture
   - Apply as `map` on `meshStandardMaterial`
   - Keep `color` as fallback if texture fails to load
   - For Saturn/Uranus/Neptune rings, apply ring texture to `RingGeometry`
3. Add CC-BY 4.0 attribution for Solar System Scope in the Sources modal

### BUG 5: Planet Scaling Looks Unrealistic — "Childish" Appearance
**Page**: `/planets`
**Files**: `components/planets/SolarSystem.tsx`, `components/planets/PlanetMesh.tsx`
**Problem**: The current logarithmic scaling makes all planets look roughly similar in size. Jupiter and Saturn don't dominate the view the way they should. The Sun is a plain white sphere. Combined with the flat colors (Bug 4), the whole scene looks like a children's diagram, not a data visualization.
**Fix**:
1. Adjust the radius scaling formula to better represent relative sizes:
   - Inner planets (Mercury–Mars) should be visibly smaller
   - Gas giants (Jupiter, Saturn) should be significantly larger
   - Use a power-law scaling: `displayRadius = realRadius^0.4 * scaleFactor` instead of current formula
2. The Sun should have an emissive glow shader, NOT a plain white sphere:
   - Use `meshBasicMaterial` with `color: '#FDB813'` and a glow sprite/bloom effect
3. Saturn's rings need to be more prominent with proper texture and transparency
4. Add subtle ambient lighting from the Sun's position (point light at Sun center)

### BUG 6: Planet Click Should Zoom In and Show Moon Orbits
**Page**: `/planets`
**Files**: `components/planets/SolarSystem.tsx`, `components/planets/MoonOrbit.tsx`
**Problem**: Clicking a planet flies the camera closer, but the experience doesn't feel like "entering" the planet's system. Moons are only shown when a toggle is enabled AND a planet is selected — they should be visible automatically on zoom-in. The zoom distance (`r * 6 + 2`) is too far for inner planets and too close for gas giants.
**Fix**:
1. On planet click:
   - Animate camera to orbit the selected planet at a distance proportional to its actual moon system extent
   - Automatically show moons when zoomed in (don't require a separate toggle)
   - Show moon orbit lines as dashed ellipses around the planet
   - Label major moons (Io, Europa, Ganymede, Callisto for Jupiter; Titan, Enceladus for Saturn; etc.)
2. Adjust fly-to distance per planet:
   - Mercury/Venus/Mars: `r * 4` (small systems, get close)
   - Earth: `r * 5` (show Moon orbit)
   - Jupiter/Saturn: `r * 8` (large moon systems need more room)
   - Uranus/Neptune: `r * 6`
3. Add a "back to overview" button or double-click to deselect

---

## MAJOR BUGS (Significant UX issues)

### BUG 7: Earth Page — Layer Panel Overlaps Mission Search/List
**Page**: `/earth`
**Files**: `app/earth/page.tsx`
**Problem**: The left layer panel (LAYERS + AGENCY filters) sits on top of the mission list, making it hard to scroll missions without accidentally interacting with the layer panel. The z-index or layout positioning is wrong.
**Fix**:
1. The layer panel should float over the MAP CANVAS only, not over the mission list
2. Mission list should be in its own column to the left of the canvas
3. Layout should be: `[Mission List (scrollable, ~280px)] [Canvas (flex-grow)] [Detail Panel (430px, conditional)]`
4. The AGENCY filter checkboxes in the layer panel should move INTO the mission list header as collapsible filters

### BUG 8: Earth Page — All Mission Status Badges Show "TO BE DETE..."
**Page**: `/earth`
**File**: `components/earth/MissionList.tsx`
**Problem**: Every mission card shows a truncated "TO BE DETE..." badge (meaning "To Be Determined"). This is because all 100 missions are future/upcoming launches with undetermined dates. Even when past data is available, the badge text is being truncated.
**Fix**:
1. First fix Bug 2 (get historical missions with actual status data)
2. In `MissionList.tsx`, ensure the status badge shows the full text or use abbreviations:
   - "Success" → green badge
   - "Failed" → red badge
   - "Partial Failure" → orange badge
   - "To Be Determined" → gray badge (show "TBD" not truncated text)
3. Ensure the badge container has `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` OR just use short status codes

### BUG 9: Galaxy Map — Overlapping Labels Are Unreadable
**Page**: `/galaxies`
**Files**: `components/galaxies/GalaxyScene.tsx`
**Problem**: Galaxy labels stack on top of each other, especially in the center where the Local Group is dense. "YOU ARE HERE", "Andromeda Galaxy", "Triangulum Galaxy", "Large Magellanic Cloud", and dozens of dwarf galaxies all overlap into an unreadable mess.
**Fix**:
1. Implement label collision detection — hide labels that overlap other labels
2. Only show labels for the ~20 most prominent/bright galaxies by default
3. Show additional labels on zoom-in when galaxies spread apart
4. Use a priority system: Named galaxies (Andromeda, Sombrero, etc.) > Messier/NGC > Dwarf/DDO
5. The "YOU ARE HERE" marker should be a distinct icon (crosshair or marker), not just red text competing with galaxy labels

### BUG 10: Galaxy Map — Galaxies Rendered as Flat Colored Circles
**Page**: `/galaxies`
**Files**: `components/galaxies/GalaxyScene.tsx`
**Problem**: All 171 galaxies are rendered as simple colored circles (spheres). Spiral galaxies look the same as ellipticals. There's no visual distinction by morphological type beyond color coding.
**Fix**:
1. Use different sprite textures per galaxy type:
   - Spiral: Use a spiral galaxy sprite texture (top-down view with arms)
   - Elliptical: Use a smooth ellipse/blob texture
   - Irregular: Use an asymmetric blob texture
   - Dwarf: Small point sprite
2. Billboard-orient sprites to always face the camera
3. Size sprites by absolute magnitude (brighter = larger)
4. Add a subtle glow/bloom to major galaxies (Andromeda, M81, Centaurus A, etc.)

### BUG 11: Galaxy Map — Only 171 Galaxies
**Page**: `/galaxies`
**File**: `lib/data/galaxyCatalog.ts`
**Problem**: The dataset contains only 171 galaxies hardcoded in `galaxyCatalog.ts`. This is a tiny fraction of available data. The Nearby Galaxy Catalog alone has 869 galaxies, and Cosmicflows-4 has 55,000+.
**Fix**:
1. Create `scripts/fetch_nearby_galaxies.py`:
   - Query HEASARC for the full Nearby Galaxy Catalog (869 galaxies)
   - Download fields: name, ra, dec, distance, morph_type, abs_mag_b, log_stellar_mass, ang_diam_maj
   - Save to `public/data/galaxies.json`
2. Update `GalaxyScene.tsx` to load from the JSON file instead of the hardcoded catalog
3. Consider adding a second layer with 2MRS data (43,000+ galaxies) as distant backdrop points

---

## UI/STYLE BUGS (Doesn't match worldmonitor.app design)

### BUG 12: Star Map Page Was Imported from Pre-Rebuild Codebase Without UI Changes
**Page**: `/stars`
**Problem**: The entire star map scene and its components were brought over from the OLD codebase without being rebuilt to match the new worldmonitor.app-inspired design system. The 3D canvas, star rendering, constellation lines, and interaction patterns are all pre-rebuild code. Specifically:
- The layer panel is wider than 180px and extends too far down the page (past the viewport fold) — it should be `180px wide, max-height 300px` with scroll
- The zoom control is a vertical slider on the LEFT side — worldmonitor uses `+`/`−`/`⌂` buttons (32px squares) on the RIGHT side of the canvas
- There are no bottom panels (worldmonitor has a split bottom area for data feeds)
- No legend bar at the bottom of the canvas showing star type/color meanings
- No map controls (home/reset button) on the right edge
- The star rendering, selection UX, and camera behavior all need review against the new design language
- The constellation lines are thin tan/gold lines — these should be styled to match the new color system (use `var(--accent-green)` or a subtle `rgba(255,255,255,0.15)`)
**Fix**:
1. Constrain layer panel to `width: 180px; max-height: 300px; overflow-y: auto;` per worldmonitor spec
2. Replace the left zoom slider with right-side `+`/`−`/`⌂` button group (32px squares, `bg: rgb(20,20,20)`, `border: 1px solid rgb(42,42,42)`)
3. Add a legend bar at the bottom of the canvas showing: `● O-type  ● B-type  ● A-type  ● F-type  ● G-type  ● K-type  ● M-type` with spectral colors
4. Add a bottom panel area (even if initially minimal — e.g., recent star selections, quick stats)
5. Review star selection interaction — selected star should show detail in the 430px right sidebar matching the worldmonitor detail panel style
6. Constellation lines should use the new color palette, not the pre-rebuild gold/tan

### BUG 13: No Footer on Any Page
**All pages**
**Problem**: worldmonitor.app has a thin footer (`30px`, `font-size: 10px`, `color: rgb(68, 68, 68)`) with brand name, version, and links. StarData has no footer at all.
**Fix**:
1. Add a `Footer.tsx` component to the `AppShell`:
   - Left: "STARDATA V2.0 · @YAHYA"
   - Right: Links (Sources, GitHub, About)
   - Style per UI_VERIFICATION_PROMPT.md Section 9

---

## SUMMARY TABLE

| # | Severity | Page | Issue | Root Cause |
|---|----------|------|-------|------------|
| 1 | CRITICAL | Earth | Globe is a dark sphere, no map | No Earth texture file |
| 2 | CRITICAL | Earth | Only 100 future launches, no history | API queries upcoming only, no missions.json |
| 3 | CRITICAL | Earth | No flight path arcs on globe | Trajectory rendering not implemented |
| 4 | CRITICAL | Planets | Planets are flat colored spheres | No texture files in /public/textures/ |
| 5 | CRITICAL | Planets | Unrealistic sizing, childish look | Scaling formula + no Sun glow + no textures |
| 6 | CRITICAL | Planets | No meaningful zoom-to-planet + moons | Zoom distance wrong, moons hidden by default |
| 7 | MAJOR | Earth | Layer panel overlaps mission list | Z-index / layout positioning |
| 8 | MAJOR | Earth | All badges show "TO BE DETE..." | Only future missions loaded |
| 9 | MAJOR | Galaxies | Labels overlap, unreadable center | No collision detection |
| 10 | MAJOR | Galaxies | Galaxies are plain circles | No morphology-based sprites |
| 11 | MAJOR | Galaxies | Only 171 galaxies | Hardcoded catalog, should use HEASARC |
| 12 | STYLE | Stars | Not fully restyled to new UI | Imported without UI alignment |
| 13 | STYLE | All | No footer | Footer component missing |

## EXECUTION PRIORITY

1. **Fix textures first** (Bugs 1, 4) — download textures, wire them up. Biggest visual impact.
2. **Fix missions data** (Bug 2) — create the Python fetch script, generate missions.json with historical data.
3. **Implement trajectory arcs** (Bug 3) — add arc rendering to the globe.
4. **Fix planet zoom + moons** (Bugs 5, 6) — scaling, Sun glow, auto-show moons on zoom.
5. **Fix galaxy labels + sprites** (Bugs 9, 10, 11) — collision detection, expand dataset.
6. **Fix Earth layout** (Bugs 7, 8) — panel overlap, status badges.
7. **UI alignment** (Bugs 12, 13) — star map restyling, footer.

## FILES TO CREATE
- `scripts/download_textures.py` — download planet + Earth textures
- `scripts/fetch_missions.py` — paginate full LL2 launch history
- `scripts/fetch_nearby_galaxies.py` — query HEASARC for 869+ galaxies
- `components/earth/TrajectoryArcs.tsx` — flight path arc rendering
- `components/layout/Footer.tsx` — site footer
- `public/textures/planets/*.jpg` — planet texture files
- `public/textures/earth_daymap.jpg` — Earth map texture
- `public/data/missions.json` — full mission history
- `public/data/galaxies.json` — expanded galaxy catalog
