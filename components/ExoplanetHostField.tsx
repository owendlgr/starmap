'use client';
import { useMemo, useCallback, useEffect } from 'react';
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
  float scaled = aSize * uPixelRatio * clamp(220.0 / dist, 0.2, 4.0);
  gl_PointSize = clamp(scaled * 1.6, 3.0, 22.0);
  vAlpha = clamp(aSize / 4.5, 0.45, 1.0);
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
  float inner = smoothstep(0.24, 0.29, r);
  float outer = 1.0 - smoothstep(0.43, 0.49, r);
  float ring  = inner * outer;
  if (ring < 0.05) discard;
  gl_FragColor = vec4(uColor, vAlpha * ring);
}
`;

interface Props {
  stars: Star[];
}

export function ExoplanetHostField({ stars }: Props) {
  const { gl } = useThree();
  const { setSelected, mode, setMeasureTarget, theme, showExoplanets } = useStore();

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
    const star = idMap.get(ev.intersections[0].index);
    if (!star) return;
    if (mode === 'measure') setMeasureTarget(star); else setSelected(star);
  }, [idMap, mode, setSelected, setMeasureTarget]);

  if (!showExoplanets) return null;
  return <points geometry={geometry} material={material} onClick={handleClick} />;
}
