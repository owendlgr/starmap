'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/lib/useStore';

// 10 light years per cell in parsecs
const CELL = 10 * 0.30660; // ~3.066 pc

// Grid extends far enough to feel infinite (fog hides the edges).
// We draw lines at 10 ly intervals across a large span.
// To keep vertex count sane, we only draw lines on the XZ galactic plane
// and a few vertical (Y) reference planes.
const EXTENT = 1500; // pc — well beyond visible range (fog starts at 80,000 but stars are within ~1000 pc)
const STEPS = Math.ceil(EXTENT / CELL); // ~490 lines per axis direction

function buildGridGeometry(): THREE.BufferGeometry {
  const pts: number[] = [];

  // ── XZ plane grid (the main "floor" grid at every Y=0) ──
  // Lines parallel to X (varying Z)
  for (let i = -STEPS; i <= STEPS; i++) {
    const z = i * CELL;
    pts.push(-EXTENT, 0, z, EXTENT, 0, z);
  }
  // Lines parallel to Z (varying X)
  for (let i = -STEPS; i <= STEPS; i++) {
    const x = i * CELL;
    pts.push(x, 0, -EXTENT, x, 0, EXTENT);
  }

  // ── XY plane grid (vertical wall at Z=0) ──
  // Lines parallel to X (varying Y)
  for (let i = -STEPS; i <= STEPS; i++) {
    const y = i * CELL;
    pts.push(-EXTENT, y, 0, EXTENT, y, 0);
  }
  // Lines parallel to Y (varying X)
  for (let i = -STEPS; i <= STEPS; i++) {
    const x = i * CELL;
    pts.push(x, -EXTENT, 0, x, EXTENT, 0);
  }

  // ── YZ plane grid (vertical wall at X=0) ──
  // Lines parallel to Z (varying Y)
  for (let i = -STEPS; i <= STEPS; i++) {
    const y = i * CELL;
    pts.push(0, y, -EXTENT, 0, y, EXTENT);
  }
  // Lines parallel to Y (varying Z)
  for (let i = -STEPS; i <= STEPS; i++) {
    const z = i * CELL;
    pts.push(0, -EXTENT, z, 0, EXTENT, z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
  return geo;
}

// Darkened galactic plane (Y=0)
function buildPlaneGeometry(): THREE.BufferGeometry {
  const S = EXTENT;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -S, 0, -S,  S, 0, -S,  S, 0, S,
    -S, 0, -S,  S, 0, S,  -S, 0, S,
  ]), 3));
  return geo;
}

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  const gridGeo = useMemo(() => buildGridGeometry(), []);
  const planeGeo = useMemo(() => buildPlaneGeometry(), []);

  return (
    <group>
      {/* 10 ly cell grid on 3 major planes */}
      <lineSegments geometry={gridGeo}>
        <lineBasicMaterial
          color={dark ? '#4a4038' : '#a09888'}
          transparent
          opacity={0.4}
        />
      </lineSegments>

      {/* Darkened galactic plane at Y=0 */}
      <mesh geometry={planeGeo}>
        <meshBasicMaterial
          color={dark ? '#0a0806' : '#c8c0b0'}
          transparent
          opacity={dark ? 0.3 : 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
