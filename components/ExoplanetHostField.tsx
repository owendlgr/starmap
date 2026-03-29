'use client';
import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';

// Ring/hollow-dot shader — visually distinct from solid star dots
const VERT = `
attribute float aSize;
varying float vAlpha;
uniform float uPixelRatio;

void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mvPos.z, 0.1);
  float scaled = aSize * uPixelRatio * clamp(220.0 / dist, 0.2, 4.0);
  gl_PointSize = clamp(scaled * 1.4, 2.0, 16.0);
  vAlpha = clamp(aSize / 4.5, 0.45, 1.0);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = `
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float r = length(center);
  if (r > 0.5) discard;
  // Hollow ring: opaque band between inner=0.28 and outer=0.46
  float inner = smoothstep(0.24, 0.29, r);
  float outer = 1.0 - smoothstep(0.43, 0.49, r);
  float ring  = inner * outer;
  if (ring < 0.05) discard;
  float alpha = vAlpha * ring;
  gl_FragColor = vec4(0.10, 0.07, 0.03, alpha);
}
`;

interface Props {
  stars: Star[];
}

export function ExoplanetHostField({ stars }: Props) {
  const { gl } = useThree();
  const { setSelected, mode, setMeasureTarget } = useStore();

  const [geometry, idMap] = useMemo(() => {
    const n = stars.length;
    const pos   = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const map   = new Map<number, Star>();

    stars.forEach((s, i) => {
      pos[i*3] = s.x; pos[i*3+1] = s.y; pos[i*3+2] = s.z;
      sizes[i] = s.size;
      map.set(i, s);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.computeBoundingSphere();
    return [geo, map];
  }, [stars]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uPixelRatio: { value: gl.getPixelRatio() } },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }), [gl]);

  const handleClick = useCallback((e: THREE.Event) => {
    const ev = e as unknown as { intersections: { index: number }[] };
    if (!ev.intersections?.length) return;
    const star = idMap.get(ev.intersections[0].index);
    if (!star) return;
    if (mode === 'measure') setMeasureTarget(star);
    else setSelected(star);
  }, [idMap, mode, setSelected, setMeasureTarget]);

  return <points geometry={geometry} material={material} onClick={handleClick} />;
}
