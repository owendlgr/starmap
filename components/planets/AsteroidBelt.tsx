'use client';
import { useMemo } from 'react';
import * as THREE from 'three';

const AU = 10; // must match SolarSystem.tsx

/**
 * Asteroid Belt — particle cloud between Mars and Jupiter (2.2–3.3 AU).
 */
export function AsteroidBelt() {
  const particles = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const au = 2.2 + Math.random() * 1.1;
      const r = (au + (Math.random() - 0.5) * 0.3) * AU;
      const theta = Math.random() * Math.PI * 2;
      const incl = (Math.random() - 0.5) * 0.3;

      const idx = i * 3;
      positions[idx] = Math.cos(theta) * r;
      positions[idx + 1] = Math.sin(incl) * r * 0.05; // very flat
      positions[idx + 2] = Math.sin(theta) * r;
    }

    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#5a5a4a" size={0.04} transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

/**
 * Kuiper Belt — particle cloud beyond Neptune (30–55 AU).
 */
export function KuiperBelt() {
  const particles = useMemo(() => {
    const count = 8000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const au = 30 + Math.random() * 25;
      const r = (au + (Math.random() - 0.5) * 2) * AU;
      const theta = Math.random() * Math.PI * 2;
      const incl = (Math.random() - 0.5) * 0.4;

      const idx = i * 3;
      positions[idx] = Math.cos(theta) * r;
      positions[idx + 1] = Math.sin(incl) * r * 0.08;
      positions[idx + 2] = Math.sin(theta) * r;
    }

    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#3a3a4a" size={0.03} transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}
