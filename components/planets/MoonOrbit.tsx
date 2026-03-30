'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePlanetStore } from '@/lib/stores/planetStore';
import { scaledRadius } from './SolarSystem';
import type { PlanetData, MoonData } from '@/lib/types';

/** Scale moon distances relative to planet size */
function moonOrbitRadius(moon: MoonData, planetRadius: number): number {
  const planetScaled = scaledRadius(planetRadius);
  // Map moon distance to a visible range around the planet
  const maxMoonDist = 4000000; // ~4M km covers most major moons
  const normalizedDist = Math.log10(moon.distanceKm / 1000 + 1);
  return planetScaled * 1.5 + normalizedDist * 0.3;
}

function moonSize(moon: MoonData): number {
  return Math.max(0.04, Math.log10(moon.radius + 1) * 0.06);
}

/* ── Single moon ──────────────────────────────────────────── */

function Moon({ moon, planetRadius }: { moon: MoonData; planetRadius: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const timeScale = usePlanetStore((s) => s.timeScale);
  const showLabels = usePlanetStore((s) => s.showLabels);

  const orbitR = moonOrbitRadius(moon, planetRadius);
  const size = moonSize(moon);

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
        <ringGeometry args={[orbitR - 0.005, orbitR + 0.005, 64]} />
        <meshBasicMaterial color="#8888a0" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Moon sphere */}
      <group position={[orbitR, 0, 0]}>
        <mesh>
          <sphereGeometry args={[size, 16, 16]} />
          <meshStandardMaterial color="#c0c0c8" roughness={0.8} />
        </mesh>

        {/* Show labels for major moons (radius > 200km) always; others when labels toggled on */}
        {(showLabels || moon.radius > 200) && (
          <Html
            position={[0, size + 0.12, 0]}
            center
            style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: moon.radius > 200 ? '#b0b0c8' : '#8888a0',
                textShadow: '0 0 4px rgba(0,0,0,0.9)',
              }}
            >
              {moon.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/* ── All moons for a planet ───────────────────────────────── */

export function MoonOrbit({ planet }: { planet: PlanetData }) {
  return (
    <group>
      {planet.moons.map((moon) => (
        <Moon key={moon.id} moon={moon} planetRadius={planet.radius} />
      ))}
    </group>
  );
}
