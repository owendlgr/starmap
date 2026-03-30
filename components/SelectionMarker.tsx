'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';

interface Props {
  star: Star;
  color?: string;
}

export function SelectionMarker({ star, color = '#c8a96a' }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;
    const s = 1 + 0.08 * Math.sin(t.current * 2.5);
    ref.current.scale.setScalar(s);
    if (glowRef.current) {
      const gs = 1 + 0.12 * Math.sin(t.current * 1.8);
      glowRef.current.scale.setScalar(gs);
    }
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      {/* Outer glow ring */}
      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.75, 1.0, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner selection ring */}
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.68, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-1.2, 0, 0, -0.7, 0, 0, 0.7, 0, 0, 1.2, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.55} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -1.2, 0, 0, -0.7, 0, 0, 0.7, 0, 0, 1.2, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.55} />
      </line>
    </group>
  );
}

interface MeasureLineProps {
  from: Star;
  to: Star;
}

export function MeasureLine({ from, to }: MeasureLineProps) {
  // Memoize Float32Array to avoid allocation on every render
  const pts = useMemo(
    () => new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]),
    [from.x, from.y, from.z, to.x, to.y, to.z]
  );
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#c8a96a" transparent opacity={0.6} linewidth={1} />
    </line>
  );
}
