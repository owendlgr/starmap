'use client';

import { useRef, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyStore } from '@/lib/stores/galaxyStore';
import { galaxyTypeColor } from '@/lib/data/galaxyCatalog';
import { MilkyWayOutline } from './MilkyWayOutline';
import type { GalaxyData, GalaxyType } from '@/lib/types';

/* ══════════════════════════════════════════════════════════════
   Procedural 3D galaxy particle generators.
   Each function returns a Float32Array of [x, y, z, ...] positions
   distributed to match the morphology of that galaxy type.
   ══════════════════════════════════════════════════════════════ */

/** Seeded pseudo-random for deterministic galaxies. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Simple hash of string → seed integer. */
function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return (h >>> 0) + 1;
}

/** Gaussian random from uniform pair (Box-Muller). */
function gaussian(rng: () => number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/* ── Spiral galaxy ─────────────────────────────────────────── */

function generateSpiral(count: number, rng: () => number): Float32Array {
  const pts = new Float32Array(count * 3);
  const arms = 2 + Math.floor(rng() * 2); // 2-3 arms
  const twist = 2.5 + rng() * 1.5;        // tightness
  const diskH = 0.02;                      // thin disk

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (i < count * 0.2) {
      // Central bulge — 20% of particles
      const r = Math.abs(gaussian(rng)) * 0.12;
      const theta = rng() * Math.PI * 2;
      const phi = rng() * Math.PI * 2;
      pts[i3]     = r * Math.sin(phi) * Math.cos(theta);
      pts[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      pts[i3 + 2] = r * Math.cos(phi);
    } else {
      // Arm particles
      const arm = Math.floor(rng() * arms);
      const armOffset = (arm / arms) * Math.PI * 2;
      const dist = 0.05 + rng() * 0.45;                    // 0.05–0.50
      const angle = armOffset + dist * twist;
      const spread = 0.03 * (0.5 + dist);                  // wider at edge
      const dx = gaussian(rng) * spread;
      const dy = gaussian(rng) * diskH * (0.5 + dist);
      const dz = gaussian(rng) * spread;
      pts[i3]     = Math.cos(angle) * dist + dx;
      pts[i3 + 1] = dy;
      pts[i3 + 2] = Math.sin(angle) * dist + dz;
    }
  }
  return pts;
}

/* ── Elliptical galaxy ─────────────────────────────────────── */

function generateElliptical(count: number, rng: () => number): Float32Array {
  const pts = new Float32Array(count * 3);
  const ax = 0.25 + rng() * 0.1;  // semi-axes
  const ay = 0.20 + rng() * 0.08;
  const az = 0.18 + rng() * 0.08;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // 3D gaussian — concentrated in center, diffuse at edge
    pts[i3]     = gaussian(rng) * ax * 0.4;
    pts[i3 + 1] = gaussian(rng) * ay * 0.4;
    pts[i3 + 2] = gaussian(rng) * az * 0.4;
  }
  return pts;
}

/* ── Lenticular galaxy ─────────────────────────────────────── */

function generateLenticular(count: number, rng: () => number): Float32Array {
  const pts = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (i < count * 0.35) {
      // Bulge (35%)
      const r = Math.abs(gaussian(rng)) * 0.1;
      const theta = rng() * Math.PI * 2;
      const phi = rng() * Math.PI;
      pts[i3]     = r * Math.sin(phi) * Math.cos(theta);
      pts[i3 + 1] = r * Math.cos(phi) * 0.5;
      pts[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    } else {
      // Disk (65%) — flat with no spiral structure
      const dist = 0.05 + rng() * 0.4;
      const angle = rng() * Math.PI * 2;
      const diskH = 0.008 * (1 + dist);
      pts[i3]     = Math.cos(angle) * dist + gaussian(rng) * 0.015;
      pts[i3 + 1] = gaussian(rng) * diskH;
      pts[i3 + 2] = Math.sin(angle) * dist + gaussian(rng) * 0.015;
    }
  }
  return pts;
}

/* ── Irregular galaxy ──────────────────────────────────────── */

function generateIrregular(count: number, rng: () => number): Float32Array {
  const pts = new Float32Array(count * 3);
  // 2-4 random clumps
  const clumps = 2 + Math.floor(rng() * 3);
  const cx: number[] = [], cy: number[] = [], cz: number[] = [], cr: number[] = [];
  for (let c = 0; c < clumps; c++) {
    cx.push((rng() - 0.5) * 0.3);
    cy.push((rng() - 0.5) * 0.2);
    cz.push((rng() - 0.5) * 0.3);
    cr.push(0.06 + rng() * 0.12);
  }

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const c = Math.floor(rng() * clumps);
    pts[i3]     = cx[c] + gaussian(rng) * cr[c];
    pts[i3 + 1] = cy[c] + gaussian(rng) * cr[c] * 0.7;
    pts[i3 + 2] = cz[c] + gaussian(rng) * cr[c];
  }
  return pts;
}

/* ── Dwarf galaxy ──────────────────────────────────────────── */

function generateDwarf(count: number, rng: () => number): Float32Array {
  const pts = new Float32Array(count * 3);
  const r = 0.08 + rng() * 0.06;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    pts[i3]     = gaussian(rng) * r;
    pts[i3 + 1] = gaussian(rng) * r * 0.8;
    pts[i3 + 2] = gaussian(rng) * r;
  }
  return pts;
}

/* ── Generator dispatcher ──────────────────────────────────── */

function generateGalaxyParticles(
  galaxy: GalaxyData,
  count: number,
): Float32Array {
  const rng = seededRandom(hashSeed(galaxy.id));
  const gtype = (galaxy.galaxyType ?? galaxy.type ?? '').toLowerCase();

  if (gtype.includes('spiral')) return generateSpiral(count, rng);
  if (gtype.includes('elliptical')) return generateElliptical(count, rng);
  if (gtype.includes('lenticular')) return generateLenticular(count, rng);
  if (gtype.includes('irregular')) return generateIrregular(count, rng);
  if (gtype.includes('dwarf')) return generateDwarf(count, rng);
  return generateElliptical(count, rng); // fallback
}

/* ── Shared glow texture for particles ─────────────────────── */

let _glowTex: THREE.CanvasTexture | null = null;
function glowTexture(): THREE.CanvasTexture {
  if (_glowTex) return _glowTex;
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.04)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  _glowTex = new THREE.CanvasTexture(c);
  _glowTex.needsUpdate = true;
  return _glowTex;
}

/* ── Constants ─────────────────────────────────────────────── */

const LOCAL_GROUP_MPC = 1.5;
const LABEL_MAG_THRESHOLD = 8;

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

/* ── Particle count by brightness ──────────────────────────── */

function particleCount(mag: number, isLocalGroup: boolean): number {
  // Bright nearby → more particles, faint distant → fewer
  const base = Math.max(40, Math.round(400 - (mag - 1) * 30));
  return isLocalGroup ? Math.min(600, base * 2) : Math.min(400, base);
}

/* ── Scale factor by magnitude ─────────────────────────────── */

function galaxyScale(mag: number, isLocalGroup: boolean): number {
  const base = Math.max(0.15, 1.2 - (mag - 1) * 0.08);
  return isLocalGroup ? base * 1.3 : base;
}

/* ── Single 3D galaxy ──────────────────────────────────────── */

function GalaxyModel({ galaxy }: { galaxy: GalaxyData }) {
  const groupRef = useRef<THREE.Group>(null);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);
  const selectedGalaxy = useGalaxyStore((s) => s.selectedGalaxy);
  const showLabels = useGalaxyStore((s) => s.showLabels);

  const isSelected = selectedGalaxy?.id === galaxy.id;
  const isLocalGroup = (galaxy.distanceMpc ?? 20) < LOCAL_GROUP_MPC;
  const mag = galaxy.magnitude ?? 12;

  const color = useMemo(() => {
    return new THREE.Color(galaxyTypeColor(galaxy.galaxyType ?? galaxy.type.toLowerCase()));
  }, [galaxy.type, galaxy.galaxyType]);

  const count = useMemo(() => particleCount(mag, isLocalGroup), [mag, isLocalGroup]);
  const scale = useMemo(() => galaxyScale(mag, isLocalGroup), [mag, isLocalGroup]);

  // Generate deterministic particle positions
  const geometry = useMemo(() => {
    const positions = generateGalaxyParticles(galaxy, count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Per-particle opacity: brighter near center
    const opacities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      opacities[i] = Math.max(0.3, 1 - dist * 2.5);
    }
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    return geo;
  }, [galaxy, count]);

  const tex = useMemo(() => glowTexture(), []);

  // Deterministic tilt so each galaxy faces a unique direction
  const tilt = useMemo(() => {
    const rng = seededRandom(hashSeed(galaxy.id + '_tilt'));
    return new THREE.Euler(
      (rng() - 0.5) * Math.PI * 0.6,
      rng() * Math.PI * 2,
      (rng() - 0.5) * Math.PI * 0.3,
    );
  }, [galaxy.id]);

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

  // Slow rotation + distance-based label check
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.0008;

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

  // Particle size — smaller for faint, larger for bright
  const ptSize = Math.max(0.008, 0.04 - mag * 0.002);

  return (
    <group position={[x, y, z]}>
      <group ref={groupRef} rotation={tilt} scale={[scale, scale, scale]}>
        <points geometry={geometry} onClick={handleClick}>
          <pointsMaterial
            map={tex}
            color={color}
            size={ptSize}
            transparent
            opacity={isSelected ? 1 : 0.85}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      </group>

      {/* Invisible click sphere for easier selection */}
      <mesh visible={false} onClick={handleClick}>
        <sphereGeometry args={[scale * 0.35, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* Selection X marker */}
      {isSelected && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-0.25, -0.25, 0, 0.25, 0.25, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#44ff88" transparent opacity={0.85} />
          </line>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-0.25, 0.25, 0, 0.25, -0.25, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#44ff88" transparent opacity={0.85} />
          </line>
        </>
      )}

      {labelVisible && (
        <Html
          position={[0, scale * 0.4 + 0.1, 0]}
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

/* ── Scene contents ─────────────────────────────────────────── */

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
      <ambientLight intensity={0.4} />
      <Stars radius={100} depth={60} count={2500} factor={3} fade speed={0.3} />

      {showMilkyWay && <MilkyWayOutline />}

      {filtered.map((g) => (
        <GalaxyModel key={g.id} galaxy={g} />
      ))}

      <mesh visible={false} onClick={handleMiss}>
        <sphereGeometry args={[200, 8, 8]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        minDistance={0.5}
        maxDistance={80}
      />
    </>
  );
}

/* ── Canvas wrapper ─────────────────────────────────────────── */

export function GalaxyScene() {
  return (
    <Canvas
      camera={{ position: [6, 4, 10], fov: 55, near: 0.01, far: 500 }}
      style={{ width: '100%', height: '100%', background: '#050508' }}
      gl={{ antialias: true }}
    >
      <SceneContents />
    </Canvas>
  );
}
