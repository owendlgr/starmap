'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { PLANETS } from '@/lib/data/planets';
import { DWARF_PLANETS } from '@/lib/data/dwarfPlanets';
import { usePlanetStore } from '@/lib/stores/planetStore';
import { orbitalPosition, orbitPoints } from '@/lib/orbitalMechanics';
import { AsteroidBelt, KuiperBelt } from './AsteroidBelt';
import type { PlanetData, MoonData } from '@/lib/types';

/*
 * SCALE: 1 AU = 10 scene units.
 * At this scale, planets are invisible dots — exactly as they should be.
 * Earth radius = 4.26e-5 AU = 0.000426 units. We render them as
 * fixed-size points at system overview, textured spheres only when zoomed in.
 */
const AU = 10; // scene units per AU

/** Convert AU distance to scene units */
export function scaledDistance(distanceAU: number): number {
  return distanceAU * AU;
}

/**
 * Planet radius in scene units.
 * Real scale: Earth = 0.000426 units (invisible at system view).
 * We exaggerate just enough to see dots — Jupiter ~0.15, Earth ~0.04.
 * At system scale these are tiny specs. You zoom in to see detail.
 */
export function scaledRadius(radiusKm: number): number {
  // Use sqrt scaling so gas giants aren't absurdly larger than terrestrials
  // Jupiter (69911 km) → ~0.15, Earth (6371 km) → ~0.04, Mercury (2440 km) → ~0.03
  return Math.max(0.02, Math.sqrt(radiusKm / 69911) * 0.15);
}

/** Convert orbital position (AU) to scene coordinates */
function auToScene(pos: { x: number; y: number; z: number }): [number, number, number] {
  // SPICE/Kepler ecliptic: x,y in ecliptic plane, z perpendicular
  // Three.js: y is up
  return [pos.x * AU, pos.z * AU, pos.y * AU];
}

/**
 * Shared live planet positions — PlanetBody writes each frame,
 * CameraController reads to accurately track moving planets.
 */
const planetLivePositions = new Map<string, THREE.Vector3>();

/**
 * Known moon textures. Moon sphere uses these when zoomed in;
 * falls back to flat color gracefully if file is missing.
 */
const MOON_TEXTURES: Record<string, string> = {
  // Earth
  moon:       'moon.jpg',
  // Mars
  phobos:     'phobos.jpg',
  deimos:     'deimos.jpg',
  // Jupiter — Galilean
  io:         'io.jpg',
  europa:     'europa.jpg',
  ganymede:   'ganymede.jpg',
  callisto:   'callisto.jpg',
  // Saturn
  titan:      'titan.jpg',
  // Neptune
  triton:     'triton.jpg',
};

/**
 * Boost a hex color so orbit lines are always clearly visible.
 * Clamps HSL lightness to a minimum of 0.58 so dark hues
 * (Mercury brown, Neptune navy) still read against black space.
 */
function orbitColor(hex: string): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  if (hsl.l < 0.58) {
    c.setHSL(hsl.h, Math.min(hsl.s + 0.1, 1), 0.58);
  }
  return '#' + c.getHexString();
}

/* ── Sun ──────────────────────────────────────────────────── */

function Sun() {
  // Sun real radius = 0.00465 AU = 0.0465 units. Show slightly exaggerated.
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.08} />
      </mesh>
      <pointLight intensity={3} distance={500} decay={0.3} color="#FDB813" />
    </group>
  );
}

/* ── Orbit ellipse (thin line) ───────────────────────────── */

function OrbitEllipse({ planet, color }: { planet: PlanetData; color?: string }) {
  const lineObj = useMemo(() => {
    const resolvedColor = color || orbitColor(planet.color);
    const opacity = planet.type === 'dwarf' ? 0.42 : 0.72;

    if (!planet.orbitalElements) {
      // Simple circle fallback
      const pts: THREE.Vector3[] = [];
      const r = planet.distanceAU * AU;
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: resolvedColor, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    }

    const auPts = orbitPoints(planet.orbitalElements, 256);
    const scenePts = auPts.map(p => new THREE.Vector3(p.x * AU, p.z * AU, p.y * AU));
    const geo = new THREE.BufferGeometry().setFromPoints(scenePts);
    const mat = new THREE.LineBasicMaterial({ color: resolvedColor, transparent: true, opacity });
    return new THREE.Line(geo, mat);
  }, [planet, color]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.LineBasicMaterial).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

/* ── Planet texture loader (graceful fallback) ───────────── */

function usePlanetTexture(textureName: string | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!textureName) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      `/textures/${textureName}`,
      (tex) => setTexture(tex),
      undefined,
      () => setTexture(null), // silently ignore missing textures
    );
  }, [textureName]);

  return texture;
}

/* ── Planet body (dot at system scale, sphere when zoomed) ── */

function PlanetBody({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null!);
  const sphereRef = useRef<THREE.Mesh>(null!);
  const timeScale = usePlanetStore((s) => s.timeScale);
  const daysSinceJ2000 = usePlanetStore((s) => s.daysSinceJ2000);
  const showLabels = usePlanetStore((s) => s.showLabels);
  const showMoons = usePlanetStore((s) => s.showMoons);
  const selectedPlanet = usePlanetStore((s) => s.selectedPlanet);
  const setSelectedPlanet = usePlanetStore((s) => s.setSelectedPlanet);
  const setCameraTarget = usePlanetStore((s) => s.setCameraTarget);
  const elapsedRef = useRef(daysSinceJ2000);
  const initializedRef = useRef(false);

  const { camera } = useThree();
  const [isZoomed, setIsZoomed] = useState(false);
  const texture = usePlanetTexture(isZoomed ? planet.texture : undefined);

  const isSelected = selectedPlanet?.id === planet.id;
  const radius = scaledRadius(planet.radius);
  const tiltRad = planet.axialTilt * THREE.MathUtils.DEG2RAD;

  // Initialize live position entry
  useEffect(() => {
    planetLivePositions.set(planet.id, new THREE.Vector3(planet.distanceAU * AU, 0, 0));
    return () => { planetLivePositions.delete(planet.id); };
  }, [planet.id, planet.distanceAU]);

  useFrame((state, delta) => {
    if (!groupRef.current || !planet.orbitalElements) return;

    if (!initializedRef.current) {
      elapsedRef.current = daysSinceJ2000;
      initializedRef.current = true;
    }

    if (timeScale > 0) {
      elapsedRef.current += delta * timeScale;
    }

    const pos = orbitalPosition(planet.orbitalElements, elapsedRef.current);
    const scene = auToScene(pos);
    groupRef.current.position.set(scene[0], scene[1], scene[2]);

    // Write current world position for CameraController
    groupRef.current.getWorldPosition(
      planetLivePositions.get(planet.id) ?? new THREE.Vector3()
    );

    // Axial rotation of the sphere
    if (sphereRef.current && planet.rotationPeriod !== 0) {
      const rotDir = planet.rotationPeriod < 0 ? -1 : 1;
      const rotDays = Math.abs(planet.rotationPeriod) / 24; // hours → days
      const rotSpeed = (2 * Math.PI) / Math.max(0.001, rotDays);
      if (timeScale > 0) {
        sphereRef.current.rotation.y += rotDir * rotSpeed * delta * timeScale;
      } else {
        // Slow idle spin when paused so the planet looks 3-D
        sphereRef.current.rotation.y += rotDir * 0.08 * delta;
      }
    }

    // Check if camera is close enough to show texture
    const dist = camera.position.distanceTo(groupRef.current.position);
    const threshold = Math.max(radius * 20, 1.5);
    setIsZoomed(dist < threshold);
  });

  const handleSelect = (e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (isSelected) {
      setSelectedPlanet(null);
      setCameraTarget(null);
    } else {
      setSelectedPlanet(planet);
      setCameraTarget(planet.id);
    }
  };

  const fallbackPos = planet.orbitalElements
    ? [0, 0, 0] as [number, number, number]
    : [planet.distanceAU * AU, 0, 0] as [number, number, number];

  return (
    <group ref={groupRef} position={fallbackPos}>
      {/* Axial tilt wrapper — planet body tilts independently of orbit */}
      <group rotation={[0, 0, tiltRad]}>
        {/* Planet sphere — rotates around its (tilted) local Y axis */}
        <mesh
          ref={sphereRef}
          onClick={handleSelect}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          {texture ? (
            <meshStandardMaterial map={texture} />
          ) : (
            <meshBasicMaterial color={planet.color} />
          )}
        </mesh>

        {/* Larger invisible hitbox for easier clicking */}
        <mesh onClick={handleSelect} visible={false}>
          <sphereGeometry args={[Math.max(radius * 3, 0.18), 8, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* Selection ring — stays in orbital plane (not tilted) */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.8, radius * 2.2, 32]} />
          <meshBasicMaterial color="#44ff88" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Label — click anywhere on it to zoom to planet */}
      {showLabels && (
        <Html
          position={[0, radius + 0.18, 0]}
          center
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            onClick={handleSelect}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'default'; }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase',
              color: isSelected ? '#44ff88' : '#ccccee',
              textShadow: '0 0 4px #000, 0 0 8px #000',
              whiteSpace: 'nowrap',
              padding: '3px 6px',
              cursor: 'pointer',
            }}
          >
            {planet.name}
          </div>
          {isSelected && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '7px',
              color: '#aaa', textAlign: 'center',
              textShadow: '0 0 3px #000',
            }}>
              {planet.distanceAU.toFixed(2)} AU
            </div>
          )}
        </Html>
      )}

      {/* Moons — only when selected */}
      {showMoons && isSelected && planet.moons.length > 0 && (
        <MoonSystem planet={planet} />
      )}
    </group>
  );
}

/* ── Moon system (shown when planet is selected) ─────────── */

function MoonSystem({ planet }: { planet: PlanetData }) {
  const planetR = scaledRadius(planet.radius);
  const showLabels = usePlanetStore((s) => s.showLabels);
  const timeScale = usePlanetStore((s) => s.timeScale);

  return (
    <group>
      {planet.moons.map((moon) => (
        <MoonBody
          key={moon.id}
          moon={moon}
          planetRadius={planetR}
          planetKmRadius={planet.radius}
          timeScale={timeScale}
          showLabels={showLabels}
        />
      ))}
    </group>
  );
}

function MoonBody({ moon, planetRadius, planetKmRadius, timeScale, showLabels }: {
  moon: MoonData; planetRadius: number; planetKmRadius: number;
  timeScale: number; showLabels: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  // Real proportional orbit distance.
  // orbitR preserves the ratio: moon_distance_km / planet_radius_km,
  // mapped onto the planet's rendered scene radius.
  // Example: Moon at 384,400 km, Earth radius 6,371 km → ratio 60.3 → ~2.73 scene units
  const orbitR = planetRadius * (moon.distanceKm / planetKmRadius);

  // Moon size uses the same sqrt-scaled formula as planets for consistency.
  const moonR = scaledRadius(moon.radius);

  // Orbit ring half-width scales with planet so it's visible on all planets
  const ringW = Math.max(0.001, planetRadius * 0.012);

  // Texture for known major moons
  const moonTexture = usePlanetTexture(MOON_TEXTURES[moon.id]);

  useFrame((_, delta) => {
    if (groupRef.current && timeScale > 0) {
      const period = Math.abs(moon.orbitalPeriod);
      const speed = period > 0 ? (2 * Math.PI) / (period * 2) : 0;
      const dir = moon.orbitalPeriod < 0 ? -1 : 1;
      groupRef.current.rotation.y += speed * delta * timeScale * dir * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitR - ringW, orbitR + ringW, 64]} />
        <meshBasicMaterial color="#6666aa" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      {/* Moon body */}
      <group position={[orbitR, 0, 0]}>
        <mesh>
          <sphereGeometry args={[moonR, 16, 16]} />
          {moonTexture ? (
            <meshStandardMaterial map={moonTexture} />
          ) : (
            <meshBasicMaterial color="#c0c0cc" />
          )}
        </mesh>
        {(showLabels || moon.radius > 200) && (
          <Html position={[0, moonR + Math.max(0.008, planetRadius * 0.15), 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '6px', fontWeight: 600,
              color: moon.radius > 500 ? '#ccccee' : '#9999bb',
              textShadow: '0 0 4px #000, 0 0 8px #000',
              whiteSpace: 'nowrap',
            }}>
              {moon.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/* ── Camera fly-to ───────────────────────────────────────── */

function CameraController() {
  const { camera, controls } = useThree();
  const cameraTarget = usePlanetStore((s) => s.cameraTarget);
  const lerpProgress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const targetCamPos = useRef(new THREE.Vector3());
  const prevTarget = useRef<string | null>(null);
  const isAnimating = useRef(false);

  useFrame(() => {
    if (!cameraTarget) return;

    const livePos = planetLivePositions.get(cameraTarget);
    if (!livePos) return;

    const planet = [...PLANETS, ...DWARF_PLANETS].find(p => p.id === cameraTarget);
    if (!planet) return;

    // Orbit controls — update target to the planet so the user can orbit around it
    // after fly-to completes. Cast to any since r3f types vary by version.
    const oc = controls as any;
    if (oc?.target) {
      oc.target.lerp(livePos, 0.08);
      oc.update?.();
    }

    const r = scaledRadius(planet.radius);
    // Compute the outermost inner/mid moon orbit in scene units so the camera
    // parks at a sensible distance (Galilean zone, not Himalia).
    // We use the outermost moon whose distanceKm < 5 × planet radius × 100
    // (i.e. within ~10 Hill radii — inner system only).
    let moonExtent = r * 8; // minimum standoff = 8× planet radius
    if (planet.moons.length > 0) {
      // Only consider moons within ~2,000 planetary radii to avoid wild standoff
      // from distant irregulars (Himalia, Phoebe, etc).
      const CUTOFF = planet.radius * 2000;
      for (const m of planet.moons) {
        if (m.distanceKm <= CUTOFF) {
          const mOrbit = r * (m.distanceKm / planet.radius);
          if (mOrbit > moonExtent) moonExtent = mOrbit;
        }
      }
    }
    const offset = Math.max(moonExtent * 1.6, 0.4);
    const desired = livePos.clone().add(new THREE.Vector3(offset, offset * 0.4, offset * 0.7));

    if (prevTarget.current !== cameraTarget) {
      prevTarget.current = cameraTarget;
      startPos.current.copy(camera.position);
      targetCamPos.current.copy(desired);
      lerpProgress.current = 0;
      isAnimating.current = true;
    }

    targetCamPos.current.copy(desired);

    if (isAnimating.current) {
      // Adaptive step: short trips animate slowly, long trips (outer planets) animate faster.
      const totalDist = startPos.current.distanceTo(targetCamPos.current);
      const step = Math.max(0.012, Math.min(0.06, 60 / Math.max(totalDist, 1)));
      lerpProgress.current = Math.min(lerpProgress.current + step, 1);
      camera.position.lerpVectors(startPos.current, targetCamPos.current, lerpProgress.current);
      if (lerpProgress.current >= 1) isAnimating.current = false;
    }
  });

  return null;
}

/* ── Scene ───────────────────────────────────────────────── */

function SceneContents() {
  const showOrbits = usePlanetStore((s) => s.showOrbits);
  const showDwarfPlanets = usePlanetStore((s) => s.showDwarfPlanets);
  const showAsteroidBelt = usePlanetStore((s) => s.showAsteroidBelt);
  const showKuiperBelt = usePlanetStore((s) => s.showKuiperBelt);

  return (
    <>
      <ambientLight intensity={0.15} />
      <Sun />

      {/* Orbits */}
      {showOrbits && PLANETS.map((p) => <OrbitEllipse key={p.id + '-orbit'} planet={p} />)}
      {showOrbits && showDwarfPlanets && DWARF_PLANETS.map((p) => <OrbitEllipse key={p.id + '-orbit'} planet={p} />)}

      {/* Planets */}
      {PLANETS.map((p) => <PlanetBody key={p.id} planet={p} />)}
      {showDwarfPlanets && DWARF_PLANETS.map((p) => <PlanetBody key={p.id} planet={p} />)}

      {/* Belts */}
      {showAsteroidBelt && <AsteroidBelt />}
      {showKuiperBelt && <KuiperBelt />}

      <Stars radius={1000} depth={500} count={3000} factor={6} saturation={0} fade speed={0.3} />
      <CameraController />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.05}
        maxDistance={5000}
        maxPolarAngle={Math.PI * 0.95}
      />
    </>
  );
}

/* ── Canvas ──────────────────────────────────────────────── */

export function SolarSystem() {
  return (
    <Canvas
      camera={{
        position: [0, 40, 60],  // ~6 AU above and back — sees inner solar system
        fov: 50,
        near: 0.001,
        far: 10000,
      }}
      style={{ width: '100%', height: '100%', background: '#050508' }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContents />
    </Canvas>
  );
}
