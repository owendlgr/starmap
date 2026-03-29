'use client';
/**
 * GaiaField — renders Gaia DR3 stars without creating JS objects.
 *
 * The key difference from the old GaiaLoader approach:
 *   OLD: fetch → 1.1M Star objects → Zustand (massive freeze)
 *   NEW: fetch → typed Float32Array slices → GPU buffer directly
 *
 * Data never enters the Zustand store. Each binary chunk becomes its own
 * THREE.Points, loaded progressively as chunks arrive in parallel.
 * A Star object is created only on click (one at a time).
 */
import { useEffect, useRef, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/lib/useStore';
import type { Star } from '@/lib/types';

// ── Binary format constants ───────────────────────────────
// Header: "GAIA" (4 bytes) + count uint32 (4 bytes) = 8 bytes
// Per star: 8 × float32 = 32 bytes
//   [0]=x [1]=y [2]=z [3]=mag [4]=bvrp [5]=dist_pc [6]=ra [7]=dec
const HEADER_BYTES = 8;
const STAR_FLOATS  = 8;
const STAR_BYTES   = STAR_FLOATS * 4; // 32

// ── GLSL (same as StarField) ──────────────────────────────
const VERT = `
attribute float aSize;
varying float vAlpha;
uniform float uPixelRatio;
void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mvPos.z, 0.1);
  float scaled = aSize * uPixelRatio * clamp(220.0 / dist, 0.2, 4.0);
  gl_PointSize = clamp(scaled, 1.5, 20.0);
  vAlpha = clamp(aSize / 5.5, 0.25, 0.85);
  gl_Position = projectionMatrix * mvPos;
}
`;
const FRAG = `
varying float vAlpha;
uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float alpha = vAlpha * (1.0 - smoothstep(0.28, 0.5, r));
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ── Validate & read chunk header ──────────────────────────
function readChunkMeta(buf: ArrayBuffer): number | null {
  if (buf.byteLength < HEADER_BYTES) return null;
  const header = new Uint8Array(buf, 0, 4);
  if (header[0] !== 71 || header[1] !== 65 || header[2] !== 73 || header[3] !== 65) return null; // "GAIA"
  const count = new DataView(buf).getUint32(4, true);
  if (buf.byteLength < HEADER_BYTES + count * STAR_BYTES) return null;
  return count;
}

// ── Build position + size Float32Arrays directly from raw buffer ──
// Uses typed array view — no DataView overhead, no per-star object creation.
function buildGeomBuffers(buf: ArrayBuffer, count: number): { pos: Float32Array; sizes: Float32Array } {
  // Float32Array view starting after the 8-byte header
  const floats = new Float32Array(buf, HEADER_BYTES, count * STAR_FLOATS);
  const pos   = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const f   = i * STAR_FLOATS;
    pos[i*3]   = floats[f];      // x
    pos[i*3+1] = floats[f + 1];  // y
    pos[i*3+2] = floats[f + 2];  // z
    sizes[i]   = Math.max(0.3, 3.5 - floats[f + 3] * 0.28); // derived from mag
  }
  return { pos, sizes };
}

// ── Reconstruct one Star on click (cheap — only called once per click) ──
function readStarFromBuffer(buf: ArrayBuffer, localIdx: number, globalIdx: number): Star {
  const floats = new Float32Array(buf, HEADER_BYTES + localIdx * STAR_BYTES, STAR_FLOATS);
  return {
    id:       4_000_000 + globalIdx,
    name:     `Gaia DR3 ${4_000_000 + globalIdx}`,
    x:        floats[0], y: floats[1], z: floats[2],
    mag:      floats[3],
    bv:       floats[4] * 0.85,
    spectral: '',
    type:     'Star',
    dist_pc:  floats[5],
    ra:       floats[6],
    dec:      floats[7],
    size:     Math.max(0.3, 3.5 - floats[3] * 0.28),
    color:    [0.10, 0.07, 0.03],
    catalog:  'Gaia DR3',
    hip:      0,
  };
}

// ── Per-chunk Points component ────────────────────────────
interface ChunkData { buf: ArrayBuffer; count: number; globalOffset: number }

function GaiaChunk({ chunk, material }: { chunk: ChunkData; material: THREE.ShaderMaterial }) {
  const { mode, setSelected, setMeasureTarget } = useStore();

  const geometry = useMemo(() => {
    const { pos, sizes } = buildGeomBuffers(chunk.buf, chunk.count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,   3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [chunk]);

  const handleClick = (e: THREE.Event) => {
    const ev = e as unknown as { intersections: { index: number }[] };
    if (!ev.intersections?.length) return;
    const localIdx = ev.intersections[0].index;
    if (localIdx == null) return;
    const star = readStarFromBuffer(chunk.buf, localIdx, chunk.globalOffset + localIdx);
    if (mode === 'measure') setMeasureTarget(star); else setSelected(star);
  };

  return <points geometry={geometry} material={material} onClick={handleClick} />;
}

// ── Main GaiaField component ──────────────────────────────
export function GaiaField() {
  const { gl } = useThree();
  const { theme, showGaia } = useStore();
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const loadedRef = useRef(false);

  // Shared material for all chunks — update uniform on theme change
  const material = useMemo(() => {
    const dark = theme === 'dark';
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uPixelRatio: { value: gl.getPixelRatio() },
        uColor:      { value: new THREE.Color(dark ? 0.82 : 0.12, dark ? 0.77 : 0.08, dark ? 0.67 : 0.04) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useEffect(() => {
    const dark = theme === 'dark';
    material.uniforms.uColor.value.setRGB(
      dark ? 0.82 : 0.12, dark ? 0.77 : 0.08, dark ? 0.67 : 0.04,
    );
  }, [theme, material]);

  // Load all chunks in parallel, add each to state as it arrives
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetch('/data/gaia/manifest.json')
      .then(r => { if (!r.ok) throw new Error('no manifest'); return r.json(); })
      .then((manifest: { chunks: string[]; id_base: number }) => {
        const base = manifest.id_base ?? 4_000_000;
        // Kick off all chunk fetches in parallel; compute globalOffset from accumulated state
        manifest.chunks.forEach((name) => {
          fetch(`/data/gaia/${name}`)
            .then(r => { if (!r.ok) throw new Error(`chunk ${name} not found`); return r.arrayBuffer(); })
            .then(buf => {
              const count = readChunkMeta(buf);
              if (count === null || count === 0) return;
              // Compute offset from already-loaded chunks so IDs don't collide
              setChunks(prev => {
                const offset = base + prev.reduce((s, c) => s + c.count, 0);
                return [...prev, { buf, count, globalOffset: offset }];
              });
            })
            .catch(() => {});
        });
      })
      .catch(() => {}); // no Gaia data yet — silent
  }, []);

  if (chunks.length === 0 || !showGaia) return null;

  return (
    <>
      {chunks.map((chunk, i) => (
        <GaiaChunk key={i} chunk={chunk} material={material} />
      ))}
    </>
  );
}
