'use client';
import { useEffect, Suspense, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { StarField } from './StarField';
import { SelectionMarker, MeasureLine } from './SelectionMarker';
import { SceneGrid } from './SceneGrid';
import { useStore } from '@/lib/useStore';
import type { Star, StarChunk } from '@/lib/types';

const CHUNKS = ['bright', 'medium', 'faint', 'deep'] as const;

function DataLoader() {
  const { addStars } = useStore();

  useEffect(() => {
    // Load bright stars immediately, others deferred
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
  const { camera } = useThree();
  const orbitRef = useRef<{ target: THREE.Vector3 }>(null);

  // Default camera position: 20 pc from Earth, looking at origin
  useEffect(() => {
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      // @ts-expect-error: ref typing
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

function SolarSystemMarker() {
  // Small bright dot at origin = Sol / Earth
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshBasicMaterial color="#ffe87c" />
    </mesh>
  );
}

function Scene() {
  const { stars, selectedStar, measureTarget, setSelected } = useStore();

  const handleSelect = (star: Star) => {
    setSelected(star);
  };

  return (
    <>
      <CameraManager />
      <SceneGrid />
      <SolarSystemMarker />
      <StarField stars={stars} onSelect={handleSelect} />
      {selectedStar && <SelectionMarker star={selectedStar} color="#f5e6c8" />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#a8d8ea" />}
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
        style={{ background: '#00000f' }}
      >
        <color attach="background" args={['#00000f']} />
        <fog attach="fog" args={['#00000f', 80000, 200000]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
