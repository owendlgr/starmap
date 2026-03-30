'use client';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';
import { buildConstellationPairs } from '@/lib/constellations';

interface Props {
  stars: Star[];
}

/**
 * Group stars by constellation (via RA/Dec proximity), then connect
 * the brightest stars within each constellation by nearest-neighbor chains.
 */
export function ConstellationLines({ stars }: Props) {
  const { showConstellations, theme, flattenAmount } = useStore();

  const { geometry, lineCount } = useMemo(() => {
    // Build dynamic constellation pairs (curated + auto-connected)
    const allPairs = buildConstellationPairs(stars);

    const hipMap = new Map<number, Star>();
    for (const s of stars) {
      if (s.hip) hipMap.set(s.hip, s);
    }

    const pts: number[] = [];
    let count = 0;

    for (const [h1, h2] of allPairs) {
      const a = hipMap.get(h1);
      const b = hipMap.get(h2);
      if (!a || !b) continue;
      const ay = a.y * (1 - flattenAmount);
      const by = b.y * (1 - flattenAmount);
      pts.push(a.x, ay, a.z, b.x, by, b.z);
      count++;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return { geometry: geo, lineCount: count };
  }, [stars, flattenAmount]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: theme === 'dark' ? '#e0c878' : '#3a2e1e',
    transparent: true,
    opacity: 1.0,
  }), [theme]);

  useEffect(() => {
    material.color.set(theme === 'dark' ? '#e0c878' : '#3a2e1e');
    material.opacity = 1.0;
  }, [theme, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (!showConstellations || lineCount === 0) return null;

  return <lineSegments geometry={geometry} material={material} />;
}
