'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';

interface Props {
  star: Star;
  color?: string;
}

export function SelectionMarker({ star, color = '#f5e6c8' }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;
    // Slowly pulse the ring
    const s = 1 + 0.08 * Math.sin(t.current * 2.5);
    ref.current.scale.setScalar(s);
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      {/* Selection ring */}
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.75, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Cross hair lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-1.2, 0, 0, -0.8, 0, 0, 0.8, 0, 0, 1.2, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -1.2, 0, 0, -0.8, 0, 0, 0.8, 0, 0, 1.2, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
    </group>
  );
}

interface MeasureLineProps {
  from: Star;
  to: Star;
}

export function MeasureLine({ from, to }: MeasureLineProps) {
  const pts = new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#c8b88a" transparent opacity={0.6} linewidth={1} />
    </line>
  );
}
