'use client';
import { useMemo, useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';

// ── Spectral type to RGB color mapping ───────────────────
// B=blue, O=blue-white, A=white, F=yellow-white, G=yellow, K=orange, M=red
function spectralToColor(spectral: string, bv: number): [number, number, number] {
  const s = spectral?.charAt(0)?.toUpperCase() ?? '';
  switch (s) {
    case 'O': return [0.62, 0.69, 1.0];   // blue-white
    case 'B': return [0.67, 0.75, 1.0];   // blue
    case 'A': return [0.85, 0.87, 1.0];   // white
    case 'F': return [1.0,  0.96, 0.85];  // yellow-white
    case 'G': return [1.0,  0.90, 0.65];  // yellow
    case 'K': return [1.0,  0.76, 0.45];  // orange
    case 'M': return [1.0,  0.55, 0.35];  // red
    default: {
      // Fallback: derive from B-V color index
      if (bv < 0.0)  return [0.65, 0.72, 1.0];
      if (bv < 0.3)  return [0.85, 0.88, 1.0];
      if (bv < 0.6)  return [1.0,  0.96, 0.85];
      if (bv < 1.0)  return [1.0,  0.85, 0.58];
      if (bv < 1.4)  return [1.0,  0.72, 0.42];
      return [1.0, 0.55, 0.35];
    }
  }
}

const VERT = `
attribute float aSize;
attribute float aMag;
attribute vec3  aStarColor;
varying float vAlpha;
varying vec3  vColor;
uniform float uPixelRatio;
uniform float uTime;
uniform float uMagLimit;
uniform float uFlatten;

void main() {
  if (aMag > uMagLimit) {
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(0.0);
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec3 pos = position;
  pos.y = mix(pos.y, 0.0, uFlatten);
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float camDist = length(mvPos.xyz);

  // Magnitude-based size: bright stars (low mag) are larger
  float magFactor = clamp(1.0 - (aMag - (-1.0)) / 8.0, 0.15, 1.0);
  float basePx = aSize * uPixelRatio * (0.6 + magFactor * 0.8);

  // Distance attenuation: smooth falloff instead of pop in/out
  float distAtten = clamp(300.0 / camDist, 0.15, 5.0);
  float scaled = basePx * distAtten;
  gl_PointSize = clamp(scaled, 1.5, 28.0);

  // Subtle twinkle effect
  gl_PointSize *= 1.0 + 0.04 * sin(uTime * 2.5 + float(gl_VertexID) * 13.7);

  // Alpha: bright stars stay opaque, dim stars fade at distance
  float magAlpha = clamp(magFactor * 1.2, 0.3, 1.0);
  float distFade = smoothstep(80000.0, 20000.0, camDist);
  // Dim stars (high mag) fade sooner
  float dimFade = mix(distFade, 1.0, magFactor);
  vAlpha = magAlpha * clamp(dimFade, 0.0, 1.0);

  vColor = aStarColor;
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = `
varying float vAlpha;
varying vec3  vColor;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float r = length(center);
  if (r > 0.5) discard;

  // Circular point sprite with soft glow halo
  float core = 1.0 - smoothstep(0.0, 0.22, r);
  float halo = (1.0 - smoothstep(0.15, 0.5, r)) * 0.45;
  float brightness = core + halo;

  // Brighter core, dimmer halo for glow effect
  float alpha = vAlpha * brightness;
  gl_FragColor = vec4(vColor * (0.8 + core * 0.4), alpha);
}
`;

interface Props {
  stars: Star[];
  onSelect: (star: Star) => void;
}

export function StarField({ stars, onSelect }: Props) {
  const { gl } = useThree();
  const { mode, setMeasureTarget, showHipparcos, theme, magLimit, setHoveredStar, flattenAmount } = useStore();
  const pointsRef = useRef<THREE.Points>(null);
  const prevGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const filtered = useMemo(() => showHipparcos ? stars : [], [stars, showHipparcos]);

  const [geometry, idMap] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = filtered.length;
    const pos    = new Float32Array(n * 3);
    const sizes  = new Float32Array(n);
    const mags   = new Float32Array(n);
    const colors = new Float32Array(n * 3);
    const map    = new Map<number, Star>();
    filtered.forEach((s, i) => {
      pos[i*3] = s.x; pos[i*3+1] = s.y; pos[i*3+2] = s.z;
      sizes[i] = s.size;
      mags[i]  = s.mag;
      const [cr, cg, cb] = spectralToColor(s.spectral, s.bv);
      colors[i*3] = cr; colors[i*3+1] = cg; colors[i*3+2] = cb;
      map.set(i, s);
    });
    geo.setAttribute('position',  new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize',     new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aMag',      new THREE.BufferAttribute(mags, 1));
    geo.setAttribute('aStarColor', new THREE.BufferAttribute(colors, 3));
    geo.computeBoundingSphere();
    // Dispose previous geometry to prevent GPU memory leak
    if (prevGeoRef.current && prevGeoRef.current !== geo) {
      prevGeoRef.current.dispose();
    }
    prevGeoRef.current = geo;
    return [geo, map];
  }, [filtered]);

  // Dispose geometry and material on unmount
  useEffect(() => {
    return () => {
      prevGeoRef.current?.dispose();
    };
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uPixelRatio: { value: gl.getPixelRatio() },
        uTime: { value: 0.0 },
        uMagLimit: { value: 12.0 },
        uFlatten: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  // Blend spectral colors with theme base color
  useEffect(() => {
    const dark = theme === 'dark';
    if (!geometry.attributes.aStarColor) return;
    const colors = geometry.attributes.aStarColor as THREE.BufferAttribute;
    const blendFactor = 0.3; // 30% theme base, 70% spectral
    for (let i = 0; i < filtered.length; i++) {
      const s = filtered[i];
      const [sr, sg, sb] = spectralToColor(s.spectral, s.bv);
      let fr: number, fg: number, fb: number;
      if (dark) {
        // Dark mode: mix(spectral, warmWhite, 0.3) — 70% spectral, 30% warm white
        fr = sr * (1 - blendFactor) + 0.92 * blendFactor;
        fg = sg * (1 - blendFactor) + 0.88 * blendFactor;
        fb = sb * (1 - blendFactor) + 0.82 * blendFactor;
      } else {
        // Light mode: mix(spectral * 0.15, darkBrown, 0.3) — darkened spectral tones
        fr = (sr * 0.15) * (1 - blendFactor) + 0.08 * blendFactor;
        fg = (sg * 0.15) * (1 - blendFactor) + 0.06 * blendFactor;
        fb = (sb * 0.15) * (1 - blendFactor) + 0.04 * blendFactor;
      }
      colors.setXYZ(i, fr, fg, fb);
    }
    colors.needsUpdate = true;
    // Also switch blending mode: additive for dark (glow), normal for light (solid)
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  }, [theme, geometry, filtered, material]);

  // Update twinkle time and magnitude limit uniforms each frame
  useFrame(() => {
    material.uniforms.uTime.value = performance.now() / 1000.0;
    material.uniforms.uMagLimit.value = magLimit;
    material.uniforms.uFlatten.value = flattenAmount;
  });

  const handleClick = useCallback((e: THREE.Event) => {
    const ev = e as unknown as { intersections: { index: number }[] };
    if (!ev.intersections?.length) return;
    const idx = ev.intersections[0].index;
    if (idx == null) return;
    const star = idMap.get(idx);
    if (!star) return;
    if (mode === 'measure') setMeasureTarget(star); else onSelect(star);
  }, [idMap, mode, onSelect, setMeasureTarget]);

  const handlePointerOver = useCallback((e: THREE.Event) => {
    const ev = e as unknown as { intersections: { index: number }[] };
    if (!ev.intersections?.length) return;
    const idx = ev.intersections[0].index;
    const star = idMap.get(idx);
    if (star) setHoveredStar(star);
  }, [idMap, setHoveredStar]);

  const handlePointerOut = useCallback(() => {
    setHoveredStar(null);
  }, [setHoveredStar]);

  return <points ref={pointsRef} geometry={geometry} material={material} onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} frustumCulled />;
}
