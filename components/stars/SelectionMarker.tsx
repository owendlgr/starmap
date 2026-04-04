'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Star } from '@/lib/types';

interface Props {
  star: Star;
  color?: string;
  flattenAmount?: number;
}

export function SelectionMarker({ star, color = '#44ff88', flattenAmount = 0 }: Props) {
  return (
    <group position={[star.x, star.y * (1 - flattenAmount), star.z]}>
      {/* X marker — two diagonal lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-0.8, -0.8, 0, 0.8, 0.8, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.85} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-0.8, 0.8, 0, 0.8, -0.8, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.85} />
      </line>
    </group>
  );
}

interface MeasureLineProps {
  from: Star;
  to: Star;
  flattenAmount?: number;
}

export function MeasureLine({ from, to, flattenAmount = 0 }: MeasureLineProps) {
  // Memoize Float32Array to avoid allocation on every render
  const pts = useMemo(
    () => new Float32Array([from.x, from.y * (1 - flattenAmount), from.z, to.x, to.y * (1 - flattenAmount), to.z]),
    [from.x, from.y, from.z, to.x, to.y, to.z, flattenAmount]
  );
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#44ff88" transparent opacity={0.6} linewidth={1} />
    </line>
  );
}
