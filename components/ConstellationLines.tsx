'use client';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { Star } from '@/lib/types';
import { useStore } from '@/lib/useStore';

// Constellation stick-figure lines: pairs of Hipparcos catalogue numbers.
// Major constellations visible from both hemispheres.
const LINE_PAIRS: [number, number][] = [
  // ── Orion ──
  [27989, 25336],   // Betelgeuse - Bellatrix
  [27989, 26311],   // Betelgeuse - Alnilam
  [25336, 26311],   // Bellatrix - Alnilam
  [26311, 26727],   // Alnilam - Alnitak
  [26727, 24436],   // Alnitak - Rigel
  [25336, 24436],   // Bellatrix - Rigel
  [27366, 26727],   // Saiph - Alnitak

  // ── Ursa Major (Big Dipper) ──
  [54061, 53910],   // Dubhe - Merak
  [53910, 58001],   // Merak - Phecda
  [58001, 59774],   // Phecda - Megrez
  [59774, 62956],   // Megrez - Alioth
  [62956, 65378],   // Alioth - Mizar
  [65378, 67301],   // Mizar - Alkaid

  // ── Cassiopeia ──
  [746,  4427],     // Caph - Navi
  [4427, 6686],     // Navi - Ruchbah
  [6686, 8886],     // Ruchbah - Segin
  [4427, 4436],     // Navi - Schedar

  // ── Gemini ──
  [36850, 37826],   // Castor - Pollux
  [36850, 31592],   // Castor - Mebsuda
  [37826, 31681],   // Pollux - Alhena

  // ── Taurus ──
  [21421, 25428],   // Aldebaran - Elnath

  // ── Canis Major ──
  [32349, 30324],   // Sirius - Murzim
  [32349, 33579],   // Sirius - Adhara
  [33579, 34444],   // Adhara - Wezen

  // ── Scorpius ──
  [80763, 85927],   // Antares - Shaula
  [80763, 78401],   // Antares - Yed Prior
  [85927, 86670],   // Shaula - Lesath

  // ── Centaurus ──
  [68702, 71683],   // Hadar - Alpha Centauri A
  [68702, 68933],   // Hadar - Menkent

  // ── Andromeda ──
  [677,  5447],     // Alpheratz - Mirach
  [5447, 9640],     // Mirach - Almach

  // ── Pegasus (Great Square) ──
  [677,  1067],     // Alpheratz - Algenib
  [1067, 113963],   // Algenib - Scheat/Markab
  [677,  113881],   // Alpheratz - Markab

  // ── Virgo ──
  [61941, 65474],   // Porrima - Spica

  // ── Aquarius ──
  [106278, 109074], // Sadalsuud - Sadalmelik

  // ── Leo ──
  [49669, 50583],   // Regulus - Eta Leo
  [57632, 54872],   // Denebola - Zosma

  // ── Cygnus (Northern Cross) ──
  [102098, 95947],  // Deneb - Sadr
  [95947, 102488],  // Sadr - Albireo

  // ── Lyra ──
  [91262, 91971],   // Vega - Sheliak

  // ── Aquila ──
  [97649, 97278],   // Altair - Tarazed

  // ── Perseus ──
  [15863, 14576],   // Mirfak - Algol

  // ── Sagittarius (Teapot) ──
  [90185, 89931],   // Kaus Australis - Kaus Media
  [92855, 90185],   // Nunki - Kaus Australis

  // ── Corona Borealis ──
  [76267, 75097],   // Alphecca - Pherkad (approximate)

  // ── Boötes ──
  [69673, 72105],   // Arcturus - Izar
  [69673, 69974],   // Arcturus - Muphrid

  // ── Crux (Southern Cross) ──
  [60718, 62434],   // Acrux - Mimosa

  // ── Canis Minor ──
  // (Procyon is standalone - no second bright star with HIP in our data)
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

  const { geometry, lineCount } = useMemo(() => {
    const pts: number[] = [];
    let count = 0;
    for (const [h1, h2] of LINE_PAIRS) {
      const a = hipMap.get(h1);
      const b = hipMap.get(h2);
      if (!a || !b) continue;
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      count++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return { geometry: geo, lineCount: count };
  }, [hipMap]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: theme === 'dark' ? '#d4bc7a' : '#4a3e2e',
    transparent: true,
    opacity: 0.85,
  }), [theme]);

  useEffect(() => {
    material.color.set(theme === 'dark' ? '#d4bc7a' : '#4a3e2e');
    material.opacity = 0.85;
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
