'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A semi-transparent disc at the origin representing the Milky Way / observer position.
 * Slowly rotates to give a sense of orientation.
 */
export function MilkyWayOutline() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.45, 48]} />
        <meshBasicMaterial
          color="#4a9eff"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#4a9eff" transparent opacity={0.6} />
      </mesh>

      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.46, 48]} />
        <meshBasicMaterial
          color="#4a9eff"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Crosshair label */}
      <Html position={[0, 0.35, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1,
              color: '#ff4444',
              textShadow: '0 0 6px rgba(0,0,0,0.9)',
            }}
          >
            ⊕
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.45rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#ff4444',
              textShadow: '0 0 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            You are here
          </span>
        </div>
      </Html>
    </group>
  );
}
