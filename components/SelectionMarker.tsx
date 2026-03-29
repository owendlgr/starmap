'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';

interface Props {
  star: Star;
  color?: string;
}

export function SelectionMarker({ star, color = '#5a3e1e' }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;
    const s = 1 + 0.06 * Math.sin(t.current * 2.5);
    ref.current.scale.setScalar(s);
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-1.1, 0, 0, -0.7, 0, 0, 0.7, 0, 0, 1.1, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.45} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -1.1, 0, 0, -0.7, 0, 0, 0.7, 0, 0, 1.1, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.45} />
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
      <lineBasicMaterial color="#5a3e1e" transparent opacity={0.55} linewidth={1} />
    </line>
  );
}
