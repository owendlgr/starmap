'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyStore } from '@/lib/stores/galaxyStore';
import { galaxyTypeColor } from '@/lib/data/galaxyCatalog';
import { MilkyWayOutline } from './MilkyWayOutline';
import type { GalaxyData } from '@/lib/types';

/* ── Procedural gradient textures per morphology ─────────── */

const TEX_SIZE = 128;

/** Create a soft radial gradient on a canvas — the core of every galaxy sprite. */
function makeGradientCanvas(
  shape: 'circle' | 'ellipse' | 'spiral' | 'irregular',
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TEX_SIZE;
  c.height = TEX_SIZE;
  const ctx = c.getContext('2d')!;
  const cx = TEX_SIZE / 2;
  const cy = TEX_SIZE / 2;
  const r = TEX_SIZE / 2;

  if (shape === 'spiral') {
    // Core glow + faint spiral hint
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.08, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.15)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.04)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // Add two faint spiral arm arcs
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath();
      const startAngle = arm * Math.PI;
      for (let t = 0; t < 120; t++) {
        const angle = startAngle + t * 0.06;
        const dist = 8 + t * 0.38;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (shape === 'ellipse') {
    // Smooth elliptical falloff
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.1, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  } else if (shape === 'irregular') {
    // Asymmetric blob using offset gradients
    const grad1 = ctx.createRadialGradient(cx - 8, cy + 5, 0, cx, cy, r * 0.8);
    grad1.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad1.addColorStop(0.25, 'rgba(255,255,255,0.4)');
    grad1.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    grad1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    const grad2 = ctx.createRadialGradient(cx + 12, cy - 8, 0, cx + 12, cy - 8, r * 0.5);
    grad2.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad2.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    grad2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  } else {
    // Circle — default soft dot
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.12, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    grad.addColorStop(0.65, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  }
  return c;
}

/** Cached textures — one per shape, shared across all galaxies. */
const textureCache = new Map<string, THREE.CanvasTexture>();

function getGalaxyTexture(shape: 'circle' | 'ellipse' | 'spiral' | 'irregular'): THREE.CanvasTexture {
  if (textureCache.has(shape)) return textureCache.get(shape)!;
  const canvas = makeGradientCanvas(shape);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  textureCache.set(shape, tex);
  return tex;
}

function getShapeForType(galaxy: GalaxyData): 'circle' | 'ellipse' | 'spiral' | 'irregular' {
  const gtype = (galaxy.galaxyType ?? galaxy.type ?? '').toLowerCase();
  if (gtype.includes('spiral')) return 'spiral';
  if (gtype.includes('elliptical') || gtype.includes('lenticular')) return 'ellipse';
  if (gtype.includes('irregular')) return 'irregular';
  return 'circle'; // dwarf, unknown
}

/* ── Distance threshold for Local Group ─────────────────── */

const LOCAL_GROUP_MPC = 1.5;

/* ── Well-known galaxy names that always show labels ────── */

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

const LABEL_MAG_THRESHOLD = 8;

/* ── Sprite scale per morphology ────────────────────────── */

function spriteScale(galaxy: GalaxyData, base: number): [number, number, number] {
  const gtype = (galaxy.galaxyType ?? galaxy.type ?? '').toLowerCase();
  if (gtype.includes('spiral')) return [base * 1.4, base, 1];
  if (gtype.includes('elliptical')) return [base, base, 1];
  if (gtype.includes('lenticular')) return [base * 1.3, base * 0.6, 1];
  if (gtype.includes('irregular')) return [base * 1.1, base * 0.85, 1];
  if (gtype.includes('dwarf')) return [base * 0.6, base * 0.6, 1];
  return [base * 0.8, base * 0.8, 1];
}

/* ── Single galaxy ──────────────────────────────────────── */

function GalaxyPoint({ galaxy }: { galaxy: GalaxyData }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);
  const selectedGalaxy = useGalaxyStore((s) => s.selectedGalaxy);
  const showLabels = useGalaxyStore((s) => s.showLabels);

  const color = useMemo(() => {
    const gtype = galaxy.galaxyType ?? galaxy.type.toLowerCase();
    return galaxyTypeColor(gtype);
  }, [galaxy.type, galaxy.galaxyType]);

  const texture = useMemo(() => getGalaxyTexture(getShapeForType(galaxy)), [galaxy]);

  const isSelected = selectedGalaxy?.id === galaxy.id;
  const isLocalGroup = (galaxy.distanceMpc ?? 20) < LOCAL_GROUP_MPC;
  const mag = galaxy.magnitude ?? 12;

  const size = useMemo(() => {
    const base = Math.max(0.04, 0.35 - (mag - 3) * 0.025);
    return isLocalGroup ? base * 1.2 : base;
  }, [mag, isLocalGroup]);

  const shouldShowLabel = useMemo(() => {
    if (!showLabels) return false;
    if (isSelected) return true;
    if (isWellKnown(galaxy.name)) return true;
    if (mag < LABEL_MAG_THRESHOLD) return true;
    return false;
  }, [showLabels, isSelected, galaxy.name, mag]);

  const [showDistanceLabel, setShowDistanceLabel] = useState(false);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setSelectedGalaxy(galaxy);
    },
    [galaxy, setSelectedGalaxy],
  );

  const scale = useMemo(() => spriteScale(galaxy, size * 3), [galaxy, size]);

  useFrame(({ camera }) => {
    if (!spriteRef.current) return;
    if (isSelected) {
      const s = 1 + 0.1 * Math.sin(Date.now() * 0.003);
      spriteRef.current.scale.set(scale[0] * s, scale[1] * s, 1);
    } else {
      spriteRef.current.scale.set(scale[0], scale[1], 1);
    }
    if (showLabels && !shouldShowLabel) {
      const dist = camera.position.distanceTo(
        new THREE.Vector3(galaxy.x ?? 0, galaxy.y ?? 0, galaxy.z ?? 0),
      );
      setShowDistanceLabel(dist < 5);
    }
  });

  const x = galaxy.x ?? 0;
  const y = galaxy.y ?? 0;
  const z = galaxy.z ?? 0;
  const labelVisible = shouldShowLabel || showDistanceLabel;

  return (
    <group position={[x, y, z]}>
      <sprite ref={spriteRef} scale={scale} onClick={handleClick}>
        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={isSelected ? 1 : isLocalGroup ? 0.9 : 0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Selection X marker */}
      {isSelected && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-0.3, -0.3, 0, 0.3, 0.3, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#44ff88" transparent opacity={0.85} />
          </line>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-0.3, 0.3, 0, 0.3, -0.3, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#44ff88" transparent opacity={0.85} />
          </line>
        </>
      )}

      {labelVisible && (
        <Html
          position={[0, size * 1.5 + 0.12, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
        >
          <span style={{
            fontFamily: '"SF Mono", Monaco, monospace',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: isSelected ? '#44ff88' : 'rgba(204,204,238,0.7)',
            textShadow: '0 0 6px rgba(0,0,0,0.9)',
          }}>
            {galaxy.name}
          </span>
        </Html>
      )}
    </group>
  );
}

/* ── Scene contents ─────────────────────────────────────── */

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

/* ── Canvas wrapper ─────────────────────────────────────── */

export function GalaxyScene() {
  return (
    <Canvas
      camera={{ position: [6, 4, 10], fov: 55, near: 0.1, far: 500 }}
      style={{ width: '100%', height: '100%', background: '#050508' }}
      gl={{ antialias: true }}
    >
      <SceneContents />
    </Canvas>
  );
}
