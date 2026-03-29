'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/lib/useStore';

// Concentric distance rings in the XZ plane at meaningful parsec radii.
// These are readable at all zoom levels unlike a flat gridHelper.
const RING_RADII = [1, 10, 100, 1000, 10000]; // parsecs
const RING_SEGS = 128;

function buildRing(r: number): Float32Array {
  const pts = new Float32Array((RING_SEGS + 1) * 3);
  for (let i = 0; i <= RING_SEGS; i++) {
    const a = (i / RING_SEGS) * Math.PI * 2;
    pts[i * 3]     = Math.cos(a) * r;
    pts[i * 3 + 1] = 0;
    pts[i * 3 + 2] = Math.sin(a) * r;
  }
  return pts;
}

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  const rings = useMemo(() =>
    RING_RADII.map(r => ({ r, pts: buildRing(r) })),
  []);

  return (
    <group>
      {rings.map(({ r, pts }) => (
        <line key={r}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[pts, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={dark ? '#2a2420' : '#bab0a4'}
            transparent
            opacity={dark ? 0.45 : 0.5}
          />
        </line>
      ))}
    </group>
  );
}
