'use client';

import { useRef, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyStore } from '@/lib/stores/galaxyStore';
import { galaxyTypeColor } from '@/lib/data/galaxyCatalog';
import { MilkyWayOutline } from './MilkyWayOutline';
import type { GalaxyData } from '@/lib/types';

/* ── Distance threshold for Local Group vs Local Volume ──── */

const LOCAL_GROUP_MPC = 1.5;

/* ── Well-known galaxy names that always show labels ─────── */

const WELL_KNOWN_NAMES = [
  'andromeda', 'triangulum', 'sombrero', 'whirlpool', 'pinwheel',
  'cartwheel', 'sunflower', 'black eye', 'cigar', 'bode',
  'centaurus', 'sculptor', 'fornax', 'sagittarius', 'canis major',
  'large magellanic', 'small magellanic', 'lmc', 'smc',
  'messier 31', 'messier 33', 'messier 51', 'messier 81',
  'messier 82', 'messier 87', 'messier 104',
  'ngc 253', 'ngc 5128', 'ic 1613',
];

function isWellKnown(name: string): boolean {
  const lower = name.toLowerCase();
  return WELL_KNOWN_NAMES.some((wk) => lower.includes(wk));
}

/* ── Magnitude threshold for default label visibility ────── */

const LABEL_MAG_THRESHOLD = 8;

/* ── Scale ratios per galaxy type ────────────────────────── */

function getGalaxySpriteScale(
  galaxy: GalaxyData,
  baseSize: number,
): [number, number, number] {
  const gtype = galaxy.galaxyType ?? galaxy.type.toLowerCase();

  if (gtype.includes('spiral')) {
    return [baseSize * 1.5, baseSize, 1];
  }
  if (gtype.includes('elliptical')) {
    return [baseSize, baseSize, 1];
  }
  if (gtype.includes('irregular')) {
    return [baseSize * 1.2, baseSize * 0.9, 1];
  }
  if (gtype.includes('dwarf')) {
    return [baseSize * 0.5, baseSize * 0.5, 1];
  }
  if (gtype.includes('lenticular')) {
    return [baseSize * 1.3, baseSize * 0.7, 1];
  }
  // unknown — roughly circular
  return [baseSize, baseSize, 1];
}

/* ── Single galaxy point ─────────────────────────────────── */

function GalaxyPoint({ galaxy }: { galaxy: GalaxyData }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);
  const selectedGalaxy = useGalaxyStore((s) => s.selectedGalaxy);
  const showLabels = useGalaxyStore((s) => s.showLabels);

  const color = useMemo(() => {
    const gtype = galaxy.galaxyType ?? galaxy.type.toLowerCase();
    return galaxyTypeColor(gtype);
  }, [galaxy.type, galaxy.galaxyType]);

  const isSelected = selectedGalaxy?.id === galaxy.id;
  const isLocalGroup = (galaxy.distanceMpc ?? 20) < LOCAL_GROUP_MPC;
  const mag = galaxy.magnitude ?? 12;

  // Size based on magnitude and distance layer
  const size = useMemo(() => {
    const base = Math.max(0.06, 0.5 - (mag - 3) * 0.035);
    return isLocalGroup ? base * 1.2 : base;
  }, [mag, isLocalGroup]);

  // Whether to show label: well-known always, bright (mag < 8) always, others only when close
  const shouldShowLabel = useMemo(() => {
    if (!showLabels) return false;
    if (isSelected) return true;
    if (isWellKnown(galaxy.name)) return true;
    if (mag < LABEL_MAG_THRESHOLD) return true;
    return false;
  }, [showLabels, isSelected, galaxy.name, mag]);

  // For dimmer galaxies, show label only when camera is near
  const [showDistanceLabel, setShowDistanceLabel] = useState(false);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setSelectedGalaxy(galaxy);
    },
    [galaxy, setSelectedGalaxy],
  );

  // Sprite scale based on morphology
  const spriteScale = useMemo(
    () => getGalaxySpriteScale(galaxy, size * 4),
    [galaxy, size],
  );

  // Glow for bright galaxies (mag < 5)
  const showGlow = mag < 5;

  useFrame(({ camera }) => {
    if (!spriteRef.current) return;

    // Pulse when selected
    if (isSelected) {
      const s = 1 + 0.15 * Math.sin(Date.now() * 0.004);
      spriteRef.current.scale.set(
        spriteScale[0] * s,
        spriteScale[1] * s,
        1,
      );
    } else {
      spriteRef.current.scale.set(spriteScale[0], spriteScale[1], 1);
    }

    // Distance-based label visibility for non-prominent galaxies
    if (showLabels && !shouldShowLabel) {
      const gx = galaxy.x ?? 0;
      const gy = galaxy.y ?? 0;
      const gz = galaxy.z ?? 0;
      const dist = camera.position.distanceTo(new THREE.Vector3(gx, gy, gz));
      setShowDistanceLabel(dist < 5);
    }
  });

  const x = galaxy.x ?? 0;
  const y = galaxy.y ?? 0;
  const z = galaxy.z ?? 0;

  const labelVisible = shouldShowLabel || showDistanceLabel;

  return (
    <group position={[x, y, z]}>
      {/* Main galaxy sprite with morphology-based scale */}
      <sprite
        ref={spriteRef}
        scale={spriteScale}
        onClick={handleClick}
      >
        <spriteMaterial
          color={color}
          transparent
          opacity={isSelected ? 1 : isLocalGroup ? 0.9 : 0.75}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Extra glow for bright galaxies (mag < 5) */}
      {showGlow && (
        <sprite scale={[size * 8, size * 8, 1]}>
          <spriteMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.4 : 0.25}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation={true}
          />
        </sprite>
      )}

      {labelVisible && (
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
