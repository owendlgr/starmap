'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyStore } from '@/lib/stores/galaxyStore';
import { galaxyTypeColor } from '@/lib/data/galaxyCatalog';
import { MilkyWayOutline } from './MilkyWayOutline';
import type { GalaxyData } from '@/lib/types';

/* ── Distance threshold for Local Group vs Local Volume ──── */

const LOCAL_GROUP_MPC = 1.5;

/* ── Single galaxy point ─────────────────────────────────── */

function GalaxyPoint({ galaxy }: { galaxy: GalaxyData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);
  const selectedGalaxy = useGalaxyStore((s) => s.selectedGalaxy);
  const showLabels = useGalaxyStore((s) => s.showLabels);

  const color = useMemo(() => {
    const gtype = galaxy.galaxyType ?? galaxy.type.toLowerCase();
    return galaxyTypeColor(gtype);
  }, [galaxy.type, galaxy.galaxyType]);

  const isSelected = selectedGalaxy?.id === galaxy.id;
  const isLocalGroup = (galaxy.distanceMpc ?? 20) < LOCAL_GROUP_MPC;

  // Size based on magnitude and distance layer
  const size = useMemo(() => {
    const mag = galaxy.magnitude ?? 12;
    const base = Math.max(0.06, 0.5 - (mag - 3) * 0.035);
    // Local Group galaxies are slightly larger for visibility
    return isLocalGroup ? base * 1.2 : base;
  }, [galaxy.magnitude, isLocalGroup]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setSelectedGalaxy(galaxy);
    },
    [galaxy, setSelectedGalaxy],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    if (isSelected) {
      const s = size * (1 + 0.15 * Math.sin(Date.now() * 0.004));
      meshRef.current.scale.setScalar(s / size);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  const x = galaxy.x ?? 0;
  const y = galaxy.y ?? 0;
  const z = galaxy.z ?? 0;

  return (
    <group position={[x, y, z]}>
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[size, 10, 10]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 1 : isLocalGroup ? 0.9 : 0.75}
        />
      </mesh>

      {/* Glow sprite */}
      <sprite scale={[size * 4, size * 4, 1]}>
        <spriteMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.35 : isLocalGroup ? 0.2 : 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {showLabels && (
        <Html
          position={[0, size + 0.15, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isLocalGroup ? '0.55rem' : '0.45rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: isSelected ? '#4a9eff' : 'rgba(228,228,236,0.7)',
              textShadow: '0 0 4px rgba(0,0,0,0.8)',
            }}
          >
            {galaxy.name}
          </span>
        </Html>
      )}
    </group>
  );
}

/* ── Scene contents ──────────────────────────────────────── */

function SceneContents() {
  const galaxies = useGalaxyStore((s) => s.galaxies);
  const maxMagnitude = useGalaxyStore((s) => s.maxMagnitude);
  const filterType = useGalaxyStore((s) => s.filterType);
  const showMilkyWay = useGalaxyStore((s) => s.showMilkyWay);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);

  const filtered = useMemo(() => {
    return galaxies.filter((g) => {
      if (g.magnitude != null && g.magnitude > maxMagnitude) return false;
      if (filterType !== 'all') {
        // Match on galaxyType enum OR the raw type string
        const gtype = g.galaxyType ?? '';
        const rawType = g.type.toLowerCase();
        if (filterType === 'spiral' && gtype !== 'spiral' && !rawType.includes('spiral')) return false;
        if (filterType === 'elliptical' && gtype !== 'elliptical' && !rawType.includes('elliptical')) return false;
        if (filterType === 'irregular' && gtype !== 'irregular' && !rawType.includes('irregular')) return false;
        if (filterType === 'lenticular' && gtype !== 'lenticular' && !rawType.includes('lenticular')) return false;
        if (filterType === 'dwarf' && gtype !== 'dwarf' && !rawType.includes('dwarf')) return false;
      }
      return true;
    });
  }, [galaxies, maxMagnitude, filterType]);

  const handleMiss = useCallback(() => {
    setSelectedGalaxy(null);
  }, [setSelectedGalaxy]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <Stars radius={100} depth={60} count={2000} factor={3} fade speed={0.5} />

      {showMilkyWay && <MilkyWayOutline />}

      {filtered.map((g) => (
        <GalaxyPoint key={g.id} galaxy={g} />
      ))}

      {/* Click on empty space deselects */}
      <mesh visible={false} onClick={handleMiss}>
        <sphereGeometry args={[200, 8, 8]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        minDistance={1}
        maxDistance={80}
      />
    </>
  );
}

/* ── Exported canvas wrapper ─────────────────────────────── */

export function GalaxyScene() {
  return (
    <Canvas
      camera={{ position: [6, 4, 10], fov: 55, near: 0.1, far: 500 }}
      style={{ width: '100%', height: '100%', background: '#08080d' }}
      gl={{ antialias: true }}
    >
      <SceneContents />
    </Canvas>
  );
}
