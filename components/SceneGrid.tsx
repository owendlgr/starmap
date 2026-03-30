'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/lib/useStore';

// 1 light year = 0.30660 parsecs
const LY = 0.30660;

// Build a 10×10×10 ly grid centered on origin, in all 3 dimensions
// Each cell is 1 ly. Grid extends from -5 ly to +5 ly on each axis.
function buildGrid3D(): Float32Array {
  const pts: number[] = [];
  const HALF = 5; // ±5 ly from origin
  const STEP = 1; // 1 ly per grid line

  // Lines parallel to X axis (vary Y and Z)
  for (let y = -HALF; y <= HALF; y += STEP) {
    for (let z = -HALF; z <= HALF; z += STEP) {
      pts.push(-HALF * LY, y * LY, z * LY, HALF * LY, y * LY, z * LY);
    }
  }
  // Lines parallel to Y axis (vary X and Z)
  for (let x = -HALF; x <= HALF; x += STEP) {
    for (let z = -HALF; z <= HALF; z += STEP) {
      pts.push(x * LY, -HALF * LY, z * LY, x * LY, HALF * LY, z * LY);
    }
  }
  // Lines parallel to Z axis (vary X and Y)
  for (let x = -HALF; x <= HALF; x += STEP) {
    for (let y = -HALF; y <= HALF; y += STEP) {
      pts.push(x * LY, y * LY, -HALF * LY, x * LY, y * LY, HALF * LY);
    }
  }

  return new Float32Array(pts);
}

// Build the Y=0 galactic plane as a visible quad
function buildGalacticPlane(): Float32Array {
  const S = 200; // 200 pc extent
  // Two triangles forming a quad on the XZ plane at Y=0
  return new Float32Array([
    -S, 0, -S,  S, 0, -S,  S, 0, S,
    -S, 0, -S,  S, 0, S,  -S, 0, S,
  ]);
}

// Extended axis lines beyond the grid
function buildAxes(): Float32Array {
  const L = 500; // parsecs
  return new Float32Array([
    // X axis (red-ish direction)
    -L, 0, 0, L, 0, 0,
    // Y axis (vertical / up)
    0, -L, 0, 0, L, 0,
    // Z axis
    0, 0, -L, 0, 0, L,
  ]);
}

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  const grid3D = useMemo(() => buildGrid3D(), []);
  const plane = useMemo(() => buildGalacticPlane(), []);
  const axes = useMemo(() => buildAxes(), []);

  const gridGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(grid3D, 3));
    return geo;
  }, [grid3D]);

  const planeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(plane, 3));
    return geo;
  }, [plane]);

  const axesGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(axes, 3));
    return geo;
  }, [axes]);

  return (
    <group>
      {/* 10×10×10 ly 3D grid */}
      <lineSegments geometry={gridGeo}>
        <lineBasicMaterial
          color={dark ? '#6a5e4e' : '#7a6e5e'}
          transparent
          opacity={0.6}
        />
      </lineSegments>

      {/* Darkened Y=0 galactic plane */}
      <mesh geometry={planeGeo}>
        <meshBasicMaterial
          color={dark ? '#0a0806' : '#d8d0c0'}
          transparent
          opacity={dark ? 0.35 : 0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Axis lines extending beyond grid */}
      <lineSegments geometry={axesGeo}>
        <lineBasicMaterial
          color={dark ? '#9a8e7e' : '#5a4e3e'}
          transparent
          opacity={0.8}
        />
      </lineSegments>
    </group>
  );
}
