'use client';
import { useMemo, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';

// Paper/ink mode: dark dots on light background
const VERT = `
attribute float aSize;
attribute float aId;

varying float vAlpha;

uniform float uPixelRatio;

void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mvPos.z, 0.1);

  float basePx = aSize * uPixelRatio;
  float scaled = basePx * clamp(220.0 / dist, 0.2, 4.0);
  gl_PointSize = clamp(scaled, 1.2, 14.0);

  // Brighter (lower magnitude = higher aSize) stars are more opaque
  vAlpha = clamp(aSize / 5.5, 0.35, 1.0);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = `
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float r = length(center);
  if (r > 0.5) discard;
  float alpha = vAlpha * (1.0 - smoothstep(0.28, 0.5, r));
  // Dark ink color — no spectral color on the map itself (shown in panel)
  gl_FragColor = vec4(0.10, 0.07, 0.03, alpha);
}
`;

interface Props {
  stars: Star[];
  onSelect: (star: Star) => void;
}

export function StarField({ stars, onSelect }: Props) {
  const { gl } = useThree();
  const { mode, setMeasureTarget, showStars, showGalaxies, showNebulae, showClusters } = useStore();
  const pointsRef = useRef<THREE.Points>(null);

  const filtered = useMemo(() => stars.filter(s => {
    const t = s.type?.toLowerCase() || '';
    if (t.includes('galaxy')) return showGalaxies;
    if (t.includes('nebula')) return showNebulae;
    if (t.includes('cluster') || t.includes('globular')) return showClusters;
    return showStars;
  }), [stars, showStars, showGalaxies, showNebulae, showClusters]);

  const [geometry, idMap] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = filtered.length;
    const pos   = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const map   = new Map<number, Star>();

    filtered.forEach((s, i) => {
      pos[i*3] = s.x; pos[i*3+1] = s.y; pos[i*3+2] = s.z;
      sizes[i] = s.size;
      map.set(i, s);
    });

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.computeBoundingSphere();
    return [geo, map];
  }, [filtered]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uPixelRatio: { value: gl.getPixelRatio() },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }), [gl]);

  const handleClick = useCallback((e: THREE.Event) => {
    const ev = e as unknown as { intersections: { index: number }[] };
    const intersections = ev.intersections;
    if (!intersections || intersections.length === 0) return;
    const idx = intersections[0].index;
    if (idx == null) return;
    const star = idMap.get(idx);
    if (!star) return;

    if (mode === 'measure') {
      setMeasureTarget(star);
    } else {
      onSelect(star);
    }
  }, [idMap, mode, onSelect, setMeasureTarget]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
    />
  );
}
