'use client';
import { useEffect, Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { StarField } from './StarField';
import { ExoplanetHostField } from './ExoplanetHostField';
import { SelectionMarker, MeasureLine } from './SelectionMarker';
import { SceneGrid } from './SceneGrid';
import { useStore } from '@/lib/useStore';
import { formatDistance } from '@/lib/coordinates';
import type { Star, StarChunk } from '@/lib/types';

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

function ExoplanetLoader({ onLoad }: { onLoad: (stars: Star[]) => void }) {
  const { setExoHostCount } = useStore();
  useEffect(() => {
    fetch('/api/exoplanet-stars')
      .then(r => r.json())
      .then((d: { stars: Star[] }) => {
        if (d.stars?.length) {
          onLoad(d.stars);
          setExoHostCount(d.stars.length);
        }
      })
      .catch(() => {/* silent */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function CameraManager() {
  const { camera } = useThree();
  const controlsRef = useRef<{ target: THREE.Vector3; object: THREE.Camera; update: () => void } | null>(null);
  const { cameraResetTick, zoomTarget, setZoomTarget } = useStore();
  const lastResetTick = useRef(0);

  useEffect(() => {
    camera.position.set(0, 8, 28);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Handle center/reset trigger
  useEffect(() => {
    if (cameraResetTick === lastResetTick.current) return;
    lastResetTick.current = cameraResetTick;
    camera.position.set(0, 8, 28);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    setZoomTarget(28);
  }, [cameraResetTick, camera, setZoomTarget]);

  // Smooth zoom toward zoomTarget
  useFrame(() => {
    const pos = camera.position;
    const currentDist = pos.length();
    if (Math.abs(currentDist - zoomTarget) < 0.01) return;
    const newDist = currentDist + (zoomTarget - currentDist) * 0.08;
    pos.normalize().multiplyScalar(newDist);
    if (controlsRef.current) controlsRef.current.update();
  });

  return (
    <OrbitControls
      // @ts-expect-error ref typing
      ref={controlsRef}
      enableDamping
      dampingFactor={0.10}
      rotateSpeed={0.45}
      zoomSpeed={1.0}
      panSpeed={0.6}
      minDistance={0.005}
      maxDistance={60000}
      makeDefault
    />
  );
}

function SolarMarker() {
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#3d2e1e" />
      </mesh>
      <Html
        distanceFactor={10}
        position={[0.2, 0.2, 0]}
        style={{ zIndex: 5, pointerEvents: 'none' }}
      >
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: '11px', fontWeight: 'bold',
          color: '#1a1208', whiteSpace: 'nowrap',
          textShadow: '0 0 6px #f0ece0, 0 0 6px #f0ece0, 0 0 6px #f0ece0',
          fontStyle: 'italic', lineHeight: 1.3,
        }}>
          Sol · 0 ly
        </div>
      </Html>
    </group>
  );
}

function StarLabels({ stars }: { stars: Star[] }) {
  const { showLabels, scaleUnit } = useStore();
  const named = useMemo(() => stars.filter(isNamed), [stars]);

  if (!showLabels || named.length === 0) return null;

  return (
    <>
      {named.map(s => (
        <Html
          key={s.id}
          distanceFactor={10}
          position={[s.x + 0.2, s.y + 0.2, s.z]}
          style={{ zIndex: 5, pointerEvents: 'none' }}
        >
          <div style={{
            fontFamily: 'Georgia, serif', fontWeight: 'bold',
            color: '#1a1208', whiteSpace: 'nowrap', lineHeight: 1.35,
            textShadow: '0 0 6px #f0ece0, 0 0 6px #f0ece0, 0 0 8px #f0ece0',
            pointerEvents: 'none',
          }}>
            <span style={{ display: 'block', fontSize: '10px' }}>{s.name}</span>
            <span style={{ display: 'block', fontSize: '9px', color: '#5a4e3e' }}>
              {s.dist_pc > 0 ? formatDistance(s.dist_pc, scaleUnit) : 'here'}
            </span>
          </div>
        </Html>
      ))}
    </>
  );
}

function DepthLines({ stars }: { stars: Star[] }) {
  const { showDepthLines } = useStore();
  const geometry = useMemo(() => {
    const targets = stars.filter(s => isNamed(s) || s.mag < 3.5);
    const pts: number[] = [];
    for (const s of targets) {
      if (Math.abs(s.y) < 0.05) continue;
      pts.push(s.x, s.y, s.z, s.x, 0, s.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, [stars]);

  if (!showDepthLines) return null;
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#b0a898" transparent opacity={0.32} />
    </lineSegments>
  );
}

function Scene({ exoHosts }: { exoHosts: Star[] }) {
  const { stars, selectedStar, measureTarget, setSelected } = useStore();
  return (
    <>
      <CameraManager />
      <SceneGrid />
      <SolarMarker />
      <StarField stars={stars} onSelect={setSelected} />
      {exoHosts.length > 0 && <ExoplanetHostField stars={exoHosts} />}
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
  const [exoHosts, setExoHosts] = useState<Star[]>([]);
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <DataLoader />
      <ExoplanetLoader onLoad={setExoHosts} />
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
          <Scene exoHosts={exoHosts} />
        </Suspense>
      </Canvas>
    </div>
  );
}
