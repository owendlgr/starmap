'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { PLANETS } from '@/lib/data/planets';
import { DWARF_PLANETS } from '@/lib/data/dwarfPlanets';
import { usePlanetStore } from '@/lib/stores/planetStore';
import { orbitPoints } from '@/lib/orbitalMechanics';
import { scaledDistance } from './SolarSystem';
import type { PlanetData } from '@/lib/types';

/** Convert AU position to scene coordinates using logarithmic scaling */
function auToScene(pos: { x: number; y: number; z: number }): [number, number, number] {
  const rAU = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  if (rAU < 1e-10) return [0, 0, 0];
  const rScaled = scaledDistance(rAU);
  const scale = rScaled / rAU;
  // Map ecliptic x,y,z -> scene x,z,y (y-up in Three.js)
  return [pos.x * scale, pos.z * scale, pos.y * scale];
}

function OrbitLine({ planet }: { planet: PlanetData }) {
  const points = useMemo(() => {
    if (!planet.orbitalElements) {
      // Fallback: simple circle at scaled distance
      const dist = scaledDistance(planet.distanceAU);
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 360; i++) {
        const angle = (i / 360) * Math.PI * 2;
        pts.push([Math.cos(angle) * dist, 0, Math.sin(angle) * dist]);
      }
      return pts;
    }

    // Generate proper elliptical orbit from Keplerian elements
    const auPts = orbitPoints(planet.orbitalElements, 360);
    return auPts.map((p) => auToScene(p));
  }, [planet]);

  return (
    <Line
      points={points}
      color={planet.color}
      transparent
      opacity={0.25}
      lineWidth={0.5}
    />
  );
}

export function OrbitLines() {
  const showDwarfPlanets = usePlanetStore((s) => s.showDwarfPlanets);

  return (
    <group>
      {PLANETS.map((planet) => (
        <OrbitLine key={planet.id} planet={planet} />
      ))}
      {showDwarfPlanets && DWARF_PLANETS.map((planet) => (
        <OrbitLine key={planet.id} planet={planet} />
      ))}
    </group>
  );
}
