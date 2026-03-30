'use client';

import { useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { PLANETS } from '@/lib/data/planets';
import { usePlanetStore } from '@/lib/stores/planetStore';
import { orbitalPosition } from '@/lib/orbitalMechanics';
import { PlanetMesh } from './PlanetMesh';
import { OrbitLines } from './OrbitLines';
import { MoonOrbit } from './MoonOrbit';
import type { PlanetData } from '@/lib/types';

/** Logarithmic distance scaling so inner + outer planets are all visible */
export function scaledDistance(distanceAU: number): number {
  return Math.log10(distanceAU * 100 + 1) * 3;
}

/** Logarithmic radius scaling for planet sizes */
export function scaledRadius(radiusKm: number): number {
  return Math.log10(radiusKm / 1000 + 1) * 0.4;
}

/** Convert AU position to scene coordinates using logarithmic scaling */
function auToScene(pos: { x: number; y: number; z: number }): [number, number, number] {
  // Compute radial distance in AU, apply log scaling, then preserve direction
  const rAU = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  if (rAU < 1e-10) return [0, 0, 0];
  const rScaled = scaledDistance(rAU);
  const scale = rScaled / rAU;
  // Map ecliptic x,y,z -> scene x,z,y (y-up in Three.js)
  return [pos.x * scale, pos.z * scale, pos.y * scale];
}

/* ── Camera fly-to controller ─────────────────────────────── */

function CameraController() {
  const { camera } = useThree();
  const cameraTarget = usePlanetStore((s) => s.cameraTarget);
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const lerpFactor = useRef(0);

  useFrame(() => {
    if (cameraTarget) {
      const planet = PLANETS.find((p) => p.id === cameraTarget);
      if (planet) {
        const dist = scaledDistance(planet.distanceAU);
        const r = scaledRadius(planet.radius);
        const offset = r * 6 + 2;
        const dest = new THREE.Vector3(dist + offset, offset * 0.5, offset * 0.4);

        if (!targetPos.current || !targetPos.current.equals(dest)) {
          targetPos.current = dest;
          lerpFactor.current = 0;
        }

        if (lerpFactor.current < 1) {
          lerpFactor.current = Math.min(lerpFactor.current + 0.02, 1);
          camera.position.lerp(targetPos.current, lerpFactor.current * 0.08 + 0.02);
        }
      }
    }
  });

  return null;
}

/* ── Orbiting planet wrapper (handles Keplerian orbital position) ── */

function OrbitingPlanet({ planet }: { planet: PlanetData }) {
  const groupRef = useRef<THREE.Group>(null!);
  const timeScale = usePlanetStore((s) => s.timeScale);
  const showMoons = usePlanetStore((s) => s.showMoons);
  const selectedPlanet = usePlanetStore((s) => s.selectedPlanet);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current && planet.orbitalElements) {
      // Accumulate elapsed time in "days" — delta is in seconds,
      // scale so 1 real second = ~1 day at timeScale 1
      elapsedRef.current += delta * timeScale * 1.0;
      const pos = orbitalPosition(planet.orbitalElements, elapsedRef.current);
      const scene = auToScene(pos);
      groupRef.current.position.set(scene[0], scene[1], scene[2]);
    }
  });

  const isSelected = selectedPlanet?.id === planet.id;

  // Fallback position for planets without orbital elements
  const fallbackDist = scaledDistance(planet.distanceAU);

  return (
    <group ref={groupRef} position={planet.orbitalElements ? [0, 0, 0] : [fallbackDist, 0, 0]}>
      <PlanetMesh planet={planet} />
      {showMoons && isSelected && planet.moons.length > 0 && (
        <MoonOrbit planet={planet} />
      )}
    </group>
  );
}

/* ── Sun component ────────────────────────────────────────── */

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshBasicMaterial color="#fff5e0" />
      <pointLight intensity={3} distance={200} decay={0.5} color="#fff5e0" />
    </mesh>
  );
}

/* ── Scene contents ───────────────────────────────────────── */

function SceneContents() {
  const showOrbits = usePlanetStore((s) => s.showOrbits);

  return (
    <>
      <ambientLight intensity={0.15} />
      <Sun />

      {PLANETS.map((planet) => (
        <OrbitingPlanet key={planet.id} planet={planet} />
      ))}

      {showOrbits && <OrbitLines />}

      <Stars radius={300} depth={100} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <CameraController />
    </>
  );
}

/* ── Exported Canvas ──────────────────────────────────────── */

export function SolarSystem() {
  return (
    <Canvas
      camera={{ position: [20, 12, 20], fov: 50, near: 0.01, far: 1000 }}
      style={{ width: '100%', height: '100%', background: '#08080d' }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContents />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={200}
        maxPolarAngle={Math.PI * 0.85}
      />
    </Canvas>
  );
}
