'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useStore } from '@/lib/useStore';

// 10 light years per cell in parsecs
const CELL = 10 * 0.30660; // ~3.066 pc

// Grid extent: +/- 100 ly = +/- 30.66 pc
const EXTENT_LY = 100;
const EXTENT = EXTENT_LY * 0.30660; // ~30.66 pc
const STEPS = Math.round(EXTENT / CELL); // 10 steps per side (20 cells across)

/**
 * Builds a cubic wireframe cage grid.
 *
 * Strategy for the "cage" effect:
 * - Bottom face (Y = -EXTENT): full XZ grid
 * - Top face (Y = +EXTENT): full XZ grid
 * - Vertical lines connecting every grid intersection on top/bottom
 * - Four vertical wall faces: internal horizontal lines at each Y level
 *
 * Returns two geometries: edges (outer cube frame) and internals (inner lines).
 */
function buildCageGeometries(): {
  edgeGeo: THREE.BufferGeometry;
  internalGeo: THREE.BufferGeometry;
} {
  const edgePts: number[] = [];
  const internalPts: number[] = [];

  // Helper: is this coordinate on the outer boundary?
  const isEdge = (i: number) => i === -STEPS || i === STEPS;

  // ── Bottom face (Y = -EXTENT): full XZ grid ──
  const yBottom = -EXTENT;
  const yTop = EXTENT;

  for (let i = -STEPS; i <= STEPS; i++) {
    const coord = i * CELL;
    // Lines parallel to X at bottom
    const isEdgeLine = i === -STEPS || i === STEPS;
    const arr = isEdgeLine ? edgePts : internalPts;
    arr.push(-EXTENT, yBottom, coord, EXTENT, yBottom, coord);
    // Lines parallel to Z at bottom
    arr.push(coord, yBottom, -EXTENT, coord, yBottom, EXTENT);
  }

  // ── Top face (Y = +EXTENT): full XZ grid ──
  for (let i = -STEPS; i <= STEPS; i++) {
    const coord = i * CELL;
    const isEdgeLine = i === -STEPS || i === STEPS;
    const arr = isEdgeLine ? edgePts : internalPts;
    arr.push(-EXTENT, yTop, coord, EXTENT, yTop, coord);
    arr.push(coord, yTop, -EXTENT, coord, yTop, EXTENT);
  }

  // ── Vertical lines connecting top and bottom at every grid intersection ──
  for (let ix = -STEPS; ix <= STEPS; ix++) {
    for (let iz = -STEPS; iz <= STEPS; iz++) {
      const x = ix * CELL;
      const z = iz * CELL;
      const onEdge = isEdge(ix) || isEdge(iz);
      // Corner verticals and edge verticals go to edgePts
      const isCornerOrEdge = isEdge(ix) && isEdge(iz);
      const arr = isCornerOrEdge ? edgePts : onEdge ? edgePts : internalPts;
      arr.push(x, yBottom, z, x, yTop, z);
    }
  }

  // ── Horizontal lines on the 4 vertical wall faces (at each internal Y level) ──
  // These create the horizontal "rungs" on each wall face
  for (let iy = -STEPS + 1; iy < STEPS; iy++) {
    const y = iy * CELL;

    // Front wall (Z = +EXTENT): lines parallel to X
    internalPts.push(-EXTENT, y, EXTENT, EXTENT, y, EXTENT);
    // Back wall (Z = -EXTENT): lines parallel to X
    internalPts.push(-EXTENT, y, -EXTENT, EXTENT, y, -EXTENT);
    // Left wall (X = -EXTENT): lines parallel to Z
    internalPts.push(-EXTENT, y, -EXTENT, -EXTENT, y, EXTENT);
    // Right wall (X = +EXTENT): lines parallel to Z
    internalPts.push(EXTENT, y, -EXTENT, EXTENT, y, EXTENT);
  }

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(edgePts), 3)
  );

  const internalGeo = new THREE.BufferGeometry();
  internalGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(internalPts), 3)
  );

  return { edgeGeo, internalGeo };
}

// Darkened galactic plane (Y=0) — sized to match the cube
function buildPlaneGeometry(): THREE.BufferGeometry {
  const S = EXTENT;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([
        -S, 0, -S, S, 0, -S, S, 0, S,
        -S, 0, -S, S, 0, S, -S, 0, S,
      ]),
      3
    )
  );
  return geo;
}

// Galactic center direction: RA=266.4deg, Dec=-28.9deg in Cartesian
const GC_DIR = new THREE.Vector3(-0.055, -0.483, -0.874).normalize();
const GC_END = GC_DIR.clone().multiplyScalar(50);

function buildGCLineGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([0, 0, 0, GC_END.x, GC_END.y, GC_END.z]),
      3
    )
  );
  return geo;
}

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';

  const { edgeGeo, internalGeo } = useMemo(() => buildCageGeometries(), []);
  const planeGeo = useMemo(() => buildPlaneGeometry(), []);
  const gcLineGeo = useMemo(() => buildGCLineGeometry(), []);

  const lineColor = dark ? '#6a6058' : '#908878';
  const gcColor = dark ? '#d4a843' : '#8b6914';

  return (
    <group>
      {/* Outer cube edges — higher opacity */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.5}
        />
      </lineSegments>

      {/* Internal grid lines — lower opacity */}
      <lineSegments geometry={internalGeo}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.25}
        />
      </lineSegments>

      {/* Darkened galactic plane at Y=0 */}
      <mesh geometry={planeGeo}>
        <meshBasicMaterial
          color={dark ? '#000000' : '#8a8070'}
          transparent
          opacity={dark ? 0.55 : 0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Galactic center direction arrow */}
      <lineSegments geometry={gcLineGeo}>
        <lineBasicMaterial
          color={gcColor}
          transparent
          opacity={0.7}
        />
      </lineSegments>
      <Html
        position={[GC_END.x, GC_END.y, GC_END.z]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: gcColor,
            whiteSpace: 'nowrap',
            opacity: 0.85,
          }}
        >
          {'Galactic Center \u2192'}
        </span>
      </Html>
    </group>
  );
}
