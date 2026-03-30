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

// ── GLSL — improved with distance fade + circular sprites ──
const VERT = `
attribute float aSize;
attribute float aMag;
varying float vAlpha;
uniform float uPixelRatio;
uniform float uMagLimit;
uniform float uFlatten;
void main() {
  if (aMag > uMagLimit) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec3 pos = position;
  pos.y = mix(pos.y, 0.0, uFlatten);
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float camDist = length(mvPos.xyz);

  // Smooth distance attenuation
  float distAtten = clamp(300.0 / camDist, 0.1, 4.0);
  float scaled = aSize * uPixelRatio * distAtten;
  gl_PointSize = clamp(scaled, 1.0, 18.0);

  // Fade dim Gaia stars at distance to reduce visual noise
  float baseFade = clamp(aSize / 5.5, 0.2, 0.8);
  float distFade = smoothstep(60000.0, 15000.0, camDist);
  vAlpha = baseFade * mix(distFade, 1.0, clamp(aSize / 3.0, 0.0, 1.0));

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
  // Soft circular sprite with slight glow
  float core = 1.0 - smoothstep(0.0, 0.25, r);
  float halo = (1.0 - smoothstep(0.18, 0.5, r)) * 0.4;
  float brightness = core + halo;
  gl_FragColor = vec4(uColor, vAlpha * brightness);
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
function buildGeomBuffers(buf: ArrayBuffer, count: number): { pos: Float32Array; sizes: Float32Array; mags: Float32Array } {
  // Float32Array view starting after the 8-byte header
  const floats = new Float32Array(buf, HEADER_BYTES, count * STAR_FLOATS);
  const pos   = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const mags  = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const f   = i * STAR_FLOATS;
    pos[i*3]   = floats[f];      // x
    pos[i*3+1] = floats[f + 1];  // y
    pos[i*3+2] = floats[f + 2];  // z
    mags[i]    = floats[f + 3];   // raw magnitude
    sizes[i]   = Math.max(0.3, 3.5 - floats[f + 3] * 0.28); // derived from mag
  }
  return { pos, sizes, mags };
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
  const geometry = useMemo(() => {
    const { pos, sizes, mags } = buildGeomBuffers(chunk.buf, chunk.count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,   3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aMag',     new THREE.BufferAttribute(mags,  1));
    geo.computeBoundingSphere();
    return geo;
  }, [chunk]);

  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  // Gaia stars are background-only — no click handler, no raycast
  return <points geometry={geometry} material={material} frustumCulled raycast={() => {}} />;
}

// ── Main GaiaField component ──────────────────────────────
export function GaiaField() {
  const { gl } = useThree();
  const { theme, showGaia, magLimit, flattenAmount } = useStore();
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
        uMagLimit:   { value: 12.0 },
        uFlatten:    { value: 0.0 },
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

  useEffect(() => {
    material.uniforms.uMagLimit.value = magLimit;
  }, [magLimit, material]);

  useEffect(() => {
    material.uniforms.uFlatten.value = flattenAmount;
  }, [flattenAmount, material]);

  // Load chunks progressively: 2 at a time to avoid saturating bandwidth
  // and blocking higher-priority resources (main stars, exoplanets).
  // Deferred until after initial scene renders via requestIdleCallback.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const startLoad = () => {
      fetch('/data/gaia/manifest.json')
        .then(r => { if (!r.ok) throw new Error('no manifest'); return r.json(); })
        .then(async (manifest: { chunks: string[]; id_base: number }) => {
          const base = manifest.id_base ?? 4_000_000;
          const CONCURRENCY = 2;
          const names = manifest.chunks;

          // Load in batches of CONCURRENCY to avoid bandwidth saturation
          for (let i = 0; i < names.length; i += CONCURRENCY) {
            const batch = names.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(
              batch.map(name =>
                fetch(`/data/gaia/${name}`)
                  .then(r => { if (!r.ok) throw new Error(`chunk ${name} not found`); return r.arrayBuffer(); })
              )
            );
            for (const result of results) {
              if (result.status !== 'fulfilled') continue;
              const buf = result.value;
              const count = readChunkMeta(buf);
              if (count === null || count === 0) continue;
              setChunks(prev => {
                const offset = base + prev.reduce((s, c) => s + c.count, 0);
                return [...prev, { buf, count, globalOffset: offset }];
              });
            }
          }
        })
        .catch(() => {}); // no Gaia data yet — silent
    };

    // Defer Gaia loading to let initial scene render first
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(startLoad, { timeout: 3000 });
    } else {
      setTimeout(startLoad, 500);
    }
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
