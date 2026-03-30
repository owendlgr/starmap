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

// Axis lines on the galactic plane for orientation (X and Z through origin)
const AXIS_LEN = 12000; // parsecs

function buildAxisLines(): { xAxis: Float32Array; zAxis: Float32Array; yAxis: Float32Array } {
  const xAxis = new Float32Array([-AXIS_LEN, 0, 0, AXIS_LEN, 0, 0]);
  const zAxis = new Float32Array([0, 0, -AXIS_LEN, 0, 0, AXIS_LEN]);
  // Short vertical "up" indicator near origin
  const yAxis = new Float32Array([0, 0, 0, 0, 3, 0]);
  return { xAxis, zAxis, yAxis };
}

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  const rings = useMemo(() =>
    RING_RADII.map(r => ({ r, pts: buildRing(r) })),
  []);

  const axes = useMemo(() => buildAxisLines(), []);

  const ringColor = dark ? '#2a2420' : '#bab0a4';
  const axisColor = dark ? '#3a3028' : '#a8a090';
  const upColor   = dark ? '#4a3e30' : '#9a8e80';

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
            color={ringColor}
            transparent
            opacity={dark ? 0.45 : 0.5}
          />
        </line>
      ))}
      {/* X axis line (galactic plane reference) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[axes.xAxis, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={axisColor} transparent opacity={0.25} />
      </line>
      {/* Z axis line (galactic plane reference) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[axes.zAxis, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={axisColor} transparent opacity={0.25} />
      </line>
      {/* Short "up" indicator at origin */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[axes.yAxis, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={upColor} transparent opacity={0.35} />
      </line>
    </group>
  );
}
