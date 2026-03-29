'use client';
import { useMemo, useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';

const VERT = `
attribute float aSize;
varying float vAlpha;
uniform float uPixelRatio;

void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mvPos.z, 0.1);
  float basePx = aSize * uPixelRatio;
  float scaled = basePx * clamp(220.0 / dist, 0.2, 4.0);
  gl_PointSize = clamp(scaled, 2.0, 22.0);
  vAlpha = clamp(aSize / 5.5, 0.35, 1.0);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = `
varying float vAlpha;
uniform vec3 uColor;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float r = length(center);
  if (r > 0.5) discard;
  float alpha = vAlpha * (1.0 - smoothstep(0.28, 0.5, r));
  gl_FragColor = vec4(uColor, alpha);
}
`;

interface Props {
  stars: Star[];
  onSelect: (star: Star) => void;
}

export function StarField({ stars, onSelect }: Props) {
  const { gl } = useThree();
  const { mode, setMeasureTarget, showHipparcos, theme } = useStore();
  const pointsRef = useRef<THREE.Points>(null);

  const filtered = useMemo(() => showHipparcos ? stars : [], [stars, showHipparcos]);

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

  const material = useMemo(() => {
    const dark = theme === 'dark';
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uPixelRatio: { value: gl.getPixelRatio() },
        uColor:      { value: new THREE.Color(dark ? 0.85 : 0.10, dark ? 0.80 : 0.07, dark ? 0.70 : 0.03) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  // Update color uniform when theme changes without recreating the material
  useEffect(() => {
    const dark = theme === 'dark';
    material.uniforms.uColor.value.setRGB(
      dark ? 0.85 : 0.10,
      dark ? 0.80 : 0.07,
      dark ? 0.70 : 0.03,
    );
  }, [theme, material]);

  const handleClick = useCallback((e: THREE.Event) => {
    const ev = e as unknown as { intersections: { index: number }[] };
    if (!ev.intersections?.length) return;
    const idx = ev.intersections[0].index;
    if (idx == null) return;
    const star = idMap.get(idx);
    if (!star) return;
    if (mode === 'measure') setMeasureTarget(star); else onSelect(star);
  }, [idMap, mode, onSelect, setMeasureTarget]);

  return <points ref={pointsRef} geometry={geometry} material={material} onClick={handleClick} />;
}
