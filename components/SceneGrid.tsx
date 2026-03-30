'use client';
import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/useStore';

// Distance rings at meaningful parsec radii
const RING_RADII = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000];
const RING_SEGS = 128;

// Grid lines on the XZ plane (galactic plane)
const GRID_LINES = [
  // Inner grid: ±10 pc, step 5
  ...[-10, -5, 5, 10].map(v => ({ axis: 'x' as const, pos: v, len: 10 })),
  ...[-10, -5, 5, 10].map(v => ({ axis: 'z' as const, pos: v, len: 10 })),
  // Mid grid: ±100 pc, step 50
  ...[-100, -50, 50, 100].map(v => ({ axis: 'x' as const, pos: v, len: 100 })),
  ...[-100, -50, 50, 100].map(v => ({ axis: 'z' as const, pos: v, len: 100 })),
  // Outer grid: ±1000 pc, step 500
  ...[-1000, -500, 500, 1000].map(v => ({ axis: 'x' as const, pos: v, len: 1000 })),
  ...[-1000, -500, 500, 1000].map(v => ({ axis: 'z' as const, pos: v, len: 1000 })),
];

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

function buildGridLines(): Float32Array {
  const pts: number[] = [];
  for (const line of GRID_LINES) {
    if (line.axis === 'x') {
      pts.push(line.pos, 0, -line.len, line.pos, 0, line.len);
    } else {
      pts.push(-line.len, 0, line.pos, line.len, 0, line.pos);
    }
  }
  // Main axes (longer, through origin)
  const AXIS_LEN = 15000;
  pts.push(-AXIS_LEN, 0, 0, AXIS_LEN, 0, 0); // X axis
  pts.push(0, 0, -AXIS_LEN, 0, 0, AXIS_LEN); // Z axis
  return new Float32Array(pts);
}

// Labels for key distance rings
const LABELED_RINGS = [
  { r: 10, label: '10 pc' },
  { r: 100, label: '100 pc' },
  { r: 1000, label: '1 kpc' },
  { r: 10000, label: '10 kpc' },
];

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  const rings = useMemo(() =>
    RING_RADII.map(r => ({ r, pts: buildRing(r) })),
  []);

  const gridLines = useMemo(() => buildGridLines(), []);

  const ringColor = dark ? '#4a4038' : '#9a9088';
  const gridColor = dark ? '#2a2420' : '#c0b8b0';
  const axisColor = dark ? '#5a4e3e' : '#8a7e6e';
  const labelColor = dark ? '#7a6e5e' : '#6a5e4e';

  return (
    <group>
      {/* Distance rings */}
      {rings.map(({ r, pts }) => (
        <line key={r}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={r <= 100 ? axisColor : ringColor}
            transparent
            opacity={r <= 10 ? 0.7 : r <= 100 ? 0.6 : 0.45}
          />
        </line>
      ))}

      {/* Grid cross-hatch lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={gridColor} transparent opacity={0.2} />
      </lineSegments>

      {/* Vertical "up" indicator */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0, 0, 5, 0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={dark ? '#8a7e6e' : '#6a5e4e'} transparent opacity={0.5} />
      </line>

      {/* Distance labels */}
      {LABELED_RINGS.map(({ r, label }) => (
        <Html
          key={r}
          position={[r * 0.71, 0, r * 0.71]}
          distanceFactor={Math.max(10, r * 0.3)}
          style={{ pointerEvents: 'none', zIndex: 2 }}
          zIndexRange={[5, 0]}
        >
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 'bold',
            color: labelColor,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity: 0.8,
            textShadow: dark
              ? '0 0 4px #0a0806, 0 0 4px #0a0806'
              : '0 0 4px #f0ece0, 0 0 4px #f0ece0',
          }}>
            {label}
          </div>
        </Html>
      ))}
    </group>
  );
}
