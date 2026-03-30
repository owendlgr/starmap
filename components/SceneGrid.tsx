'use client';
import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/useStore';

const RING_RADII = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000];
const RING_SEGS = 128;

const LABELED_RINGS = [
  { r: 10, label: '10 pc' },
  { r: 100, label: '100 pc' },
  { r: 1000, label: '1 kpc' },
  { r: 10000, label: '10 kpc' },
];

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  // Build all geometry as a single lineSegments buffer for reliability
  const geometry = useMemo(() => {
    const pts: number[] = [];

    // Distance rings
    for (const r of RING_RADII) {
      for (let i = 0; i < RING_SEGS; i++) {
        const a0 = (i / RING_SEGS) * Math.PI * 2;
        const a1 = ((i + 1) / RING_SEGS) * Math.PI * 2;
        pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r);
        pts.push(Math.cos(a1) * r, 0, Math.sin(a1) * r);
      }
    }

    // Grid cross-hatch lines on galactic plane
    const gridSteps = [-1000, -500, -100, -50, -10, -5, 5, 10, 50, 100, 500, 1000];
    for (const v of gridSteps) {
      const len = Math.abs(v);
      // Lines parallel to Z axis
      pts.push(v, 0, -len, v, 0, len);
      // Lines parallel to X axis
      pts.push(-len, 0, v, len, 0, v);
    }

    // Main axes (through origin, full length)
    const AXIS_LEN = 15000;
    pts.push(-AXIS_LEN, 0, 0, AXIS_LEN, 0, 0); // X axis
    pts.push(0, 0, -AXIS_LEN, 0, 0, AXIS_LEN); // Z axis

    // Vertical "up" indicator
    pts.push(0, 0, 0, 0, 8, 0);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, []);

  const color = dark ? '#5a4e3e' : '#8a7e6e';
  const labelColor = dark ? '#7a6e5e' : '#6a5e4e';

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </lineSegments>

      {/* Distance labels */}
      {LABELED_RINGS.map(({ r, label }) => (
        <Html
          key={r}
          position={[r * 0.71, 0.3, r * 0.71]}
          distanceFactor={Math.max(10, r * 0.3)}
          style={{ pointerEvents: 'none', zIndex: 2 }}
          zIndexRange={[5, 0]}
        >
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: labelColor,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity: 0.9,
            textShadow: dark
              ? '0 0 6px #0a0806, 0 0 6px #0a0806'
              : '0 0 6px #f0ece0, 0 0 6px #f0ece0',
          }}>
            {label}
          </div>
        </Html>
      ))}
    </group>
  );
}
