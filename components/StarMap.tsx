'use client';
import { useEffect, Suspense, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { StarField } from './StarField';
import { SelectionMarker, MeasureLine } from './SelectionMarker';
import { SceneGrid } from './SceneGrid';
import { useStore } from '@/lib/useStore';
import { formatDistance, pcToLy } from '@/lib/coordinates';
import type { Star, StarChunk } from '@/lib/types';

const CHUNKS = ['bright', 'medium', 'faint', 'deep'] as const;
// Named stars have real names; HIP-prefixed ones are catalog-only
const isNamed = (s: Star) => s.name && !s.name.startsWith('HIP ');

function DataLoader() {
  const { addStars } = useStore();

  useEffect(() => {
    const load = async (chunk: string, delay = 0) => {
      if (delay) await new Promise(r => setTimeout(r, delay));
      try {
        const res = await fetch(`/data/stars_${chunk}.json`);
        if (!res.ok) return;
        const data: StarChunk = await res.json();
        addStars(chunk, data.stars);
      } catch { /* silent */ }
    };
    load('bright', 0);
    load('medium', 400);
    load('faint', 1200);
    load('deep', 3000);
  }, [addStars]);

  return null;
}

function CameraManager() {
  const orbitRef = useRef<{ target: THREE.Vector3 }>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      // @ts-expect-error ref typing
      ref={orbitRef}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
      minDistance={0.01}
      maxDistance={50000}
      makeDefault
    />
  );
}

function SolarMarker() {
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#3d2e1e" />
      </mesh>
      <Html distanceFactor={10} position={[0.15, 0.15, 0]}>
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: '11px', color: '#1a1208',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          textShadow: '0 0 5px #f0ece0, 0 0 5px #f0ece0, 0 0 5px #f0ece0',
          fontStyle: 'italic',
        }}>
          Sol · 0 ly
        </div>
      </Html>
    </group>
  );
}

/** HTML labels for named stars — shown only when showLabels is on */
function StarLabels({ stars }: { stars: Star[] }) {
  const { showLabels, scaleUnit } = useStore();
  if (!showLabels) return null;

  const named = useMemo(() => stars.filter(isNamed), [stars]);

  return (
    <>
      {named.map(s => (
        <Html key={s.id} distanceFactor={10} position={[s.x + 0.18, s.y + 0.18, s.z]}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: '10px', color: '#1a1208',
            whiteSpace: 'nowrap', pointerEvents: 'none', lineHeight: 1.3,
            textShadow: '0 0 5px #f0ece0, 0 0 5px #f0ece0, 0 0 5px #f0ece0',
          }}>
            <span style={{ display: 'block', fontSize: '10px' }}>{s.name}</span>
            <span style={{ display: 'block', fontSize: '9px', color: '#7a6e5e' }}>
              {s.dist_pc > 0 ? formatDistance(s.dist_pc, scaleUnit) : 'here'}
            </span>
          </div>
        </Html>
      ))}
    </>
  );
}

/** Vertical depth lines from each named star to the Y=0 galactic plane */
function DepthLines({ stars }: { stars: Star[] }) {
  const { showDepthLines } = useStore();

  const geometry = useMemo(() => {
    // Include named stars + bright stars with y offset > threshold
    const targets = stars.filter(s => isNamed(s) || s.mag < 3.5);
    const pts: number[] = [];
    for (const s of targets) {
      if (Math.abs(s.y) < 0.05) continue; // skip stars on the plane
      pts.push(s.x, s.y, s.z);
      pts.push(s.x, 0,   s.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, [stars]);

  if (!showDepthLines) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#b8b0a4" transparent opacity={0.35} />
    </lineSegments>
  );
}

function Scene() {
  const { stars, selectedStar, measureTarget, setSelected } = useStore();

  return (
    <>
      <CameraManager />
      <SceneGrid />
      <SolarMarker />
      <StarField stars={stars} onSelect={setSelected} />
      <StarLabels stars={stars} />
      <DepthLines stars={stars} />
      {selectedStar && <SelectionMarker star={selectedStar} color="#5a3e1e" />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#2e5a6e" />}
      {selectedStar && measureTarget && (
        <MeasureLine from={selectedStar} to={measureTarget} />
      )}
    </>
  );
}

export function StarMap() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <DataLoader />
      <Canvas
        camera={{ fov: 60, near: 0.001, far: 200000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          logarithmicDepthBuffer: true,
        }}
        dpr={[1, 2]}
        style={{ background: '#f0ece0' }}
      >
        <color attach="background" args={['#f0ece0']} />
        <fog attach="fog" args={['#f0ece0', 80000, 200000]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
