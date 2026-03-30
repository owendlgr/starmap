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
    // Build constellation pairs by grouping stars by constellation name
    const allPairs = buildConstellationPairs(stars);

    // Build ID lookup
    const idMap = new Map<number, Star>();
    for (const s of stars) idMap.set(s.id, s);

    const pts: number[] = [];
    let count = 0;

    for (const [id1, id2] of allPairs) {
      const a = idMap.get(id1);
      const b = idMap.get(id2);
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
