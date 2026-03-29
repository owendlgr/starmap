'use client';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';

// Constellation stick-figure lines: pairs of Hipparcos catalogue numbers.
// Only pairs where both stars exist in stars_verified.json are included.
const LINE_PAIRS: [number, number][] = [
  // Orion
  [27989, 25336],   // Betelgeuse - Bellatrix (shoulders)
  [27989, 26311],   // Betelgeuse - Alnilam (belt center)
  [25336, 26311],   // Bellatrix - Alnilam
  [26311, 26727],   // Alnilam - Alnitak (belt)
  [26727, 24436],   // Alnitak - Rigel (foot)

  // Cassiopeia
  [746,  4427],     // Caph - Navi
  [4427, 6686],     // Navi - Ruchbah

  // Ursa Major (Big Dipper handle + partial cup)
  [54061, 62956],   // Dubhe - Alioth
  [62956, 67301],   // Alioth - Alkaid

  // Perseus
  [15863, 14576],   // Mirfak - Algol

  // Gemini
  [36850, 37826],   // Castor - Pollux
  [36850, 31592],   // Castor - Mebsuda (foot)
  [37826, 31681],   // Pollux - Alhena (foot)

  // Taurus
  [21421, 25428],   // Aldebaran - Elnath

  // Canis Major
  [32349, 30324],   // Sirius - Murzim
  [32349, 33579],   // Sirius - Adhara
  [33579, 34444],   // Adhara - Wezen

  // Scorpius
  [80763, 85927],   // Antares - Shaula

  // Centaurus
  [68702, 71683],   // Hadar - Alpha Centauri A
  [68702, 68933],   // Hadar - Menkent

  // Andromeda
  [677,  5447],     // Alpheratz - Mirach
  [5447, 9640],     // Mirach - Almach

  // Pegasus (square + Enif)
  [677,  1067],     // Alpheratz - Algenib
  [1067, 113963],   // Algenib - Markab

  // Virgo
  [61941, 65474],   // Porrima - Spica

  // Aquarius
  [106278, 109074], // Sadalsuud - Sadalmelik
];

interface Props {
  stars: Star[];
}

export function ConstellationLines({ stars }: Props) {
  const { showConstellations, theme } = useStore();

  const hipMap = useMemo(() => {
    const m = new Map<number, Star>();
    for (const s of stars) if (s.hip) m.set(s.hip, s);
    return m;
  }, [stars]);

  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const [h1, h2] of LINE_PAIRS) {
      const a = hipMap.get(h1);
      const b = hipMap.get(h2);
      if (!a || !b) continue;
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, [hipMap]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: theme === 'dark' ? '#7a6e5e' : '#8a7e6e',
    transparent: true,
    opacity: 0.55,
  }), [theme]);

  useEffect(() => {
    material.color.set(theme === 'dark' ? '#7a6e5e' : '#8a7e6e');
  }, [theme, material]);

  if (!showConstellations) return null;

  return <lineSegments geometry={geometry} material={material} />;
}
