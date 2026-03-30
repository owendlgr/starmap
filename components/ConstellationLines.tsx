'use client';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';
import { getConstellation } from '@/lib/coordinates';

interface Props {
  stars: Star[];
}

/**
 * Group stars by constellation (via RA/Dec proximity), then connect
 * the brightest stars within each constellation by nearest-neighbor chains.
 */
export function ConstellationLines({ stars }: Props) {
  const { showConstellations, theme } = useStore();

  const { geometry, lineCount } = useMemo(() => {
    // Group stars by constellation, keeping only the brightest per group
    const groups = new Map<string, Star[]>();
    for (const s of stars) {
      if (s.dist_pc <= 0) continue; // skip Sol
      const c = getConstellation(s.ra, s.dec);
      if (!groups.has(c)) groups.set(c, []);
      groups.get(c)!.push(s);
    }

    const pts: number[] = [];
    let count = 0;

    groups.forEach((group) => {
      // Sort by magnitude (brightest first) and take top 8 per constellation
      const bright = group
        .filter(s => s.mag < 6)
        .sort((a, b) => a.mag - b.mag)
        .slice(0, 8);

      if (bright.length < 2) return;

      // Connect via nearest-neighbor chain starting from brightest
      const used = new Set<number>();
      let current = bright[0];
      used.add(current.id);

      for (let i = 1; i < bright.length; i++) {
        // Find nearest unused star (by angular separation on sky)
        let nearest: Star | null = null;
        let minDist = Infinity;
        for (const candidate of bright) {
          if (used.has(candidate.id)) continue;
          const dra = (current.ra - candidate.ra) * Math.cos(current.dec * Math.PI / 180);
          const ddec = current.dec - candidate.dec;
          const angDist = Math.sqrt(dra * dra + ddec * ddec);
          if (angDist < minDist) {
            minDist = angDist;
            nearest = candidate;
          }
        }
        if (!nearest || minDist > 30) break; // don't connect stars >30° apart
        pts.push(current.x, current.y, current.z, nearest.x, nearest.y, nearest.z);
        count++;
        used.add(nearest.id);
        current = nearest;
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return { geometry: geo, lineCount: count };
  }, [stars]);

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
