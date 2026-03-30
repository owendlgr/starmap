'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePlanetStore } from '@/lib/stores/planetStore';
import { scaledRadius } from './SolarSystem';
import type { PlanetData } from '@/lib/types';

interface PlanetMeshProps {
  planet: PlanetData;
}

export function PlanetMesh({ planet }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const showLabels = usePlanetStore((s) => s.showLabels);
  const selectedPlanet = usePlanetStore((s) => s.selectedPlanet);
  const setSelectedPlanet = usePlanetStore((s) => s.setSelectedPlanet);
  const setCameraTarget = usePlanetStore((s) => s.setCameraTarget);
  const timeScale = usePlanetStore((s) => s.timeScale);

  const radius = scaledRadius(planet.radius);
  const isSelected = selectedPlanet?.id === planet.id;

  // Axial rotation
  useFrame((_, delta) => {
    if (meshRef.current && timeScale > 0) {
      const rotSpeed = planet.rotationPeriod !== 0
        ? (2 * Math.PI) / (Math.abs(planet.rotationPeriod) * 0.5)
        : 0;
      const direction = planet.rotationPeriod < 0 ? -1 : 1;
      meshRef.current.rotation.y += rotSpeed * delta * timeScale * direction * 0.1;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isSelected) {
      setSelectedPlanet(null);
      setCameraTarget(null);
    } else {
      setSelectedPlanet(planet);
      setCameraTarget(planet.id);
    }
  }, [planet, isSelected, setSelectedPlanet, setCameraTarget]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  const displayRadius = hovered ? radius * 1.12 : radius;

  return (
    <group>
      {/* Planet sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        rotation={[0, 0, (planet.axialTilt * Math.PI) / 180]}
        scale={[displayRadius, displayRadius, displayRadius]}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={0.7}
          metalness={0.1}
          emissive={hovered || isSelected ? planet.color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : isSelected ? 0.15 : 0}
        />
      </mesh>

      {/* Rings for Saturn, Uranus, Neptune */}
      {planet.hasRings && (
        <mesh
          rotation={[
            Math.PI / 2 + (planet.axialTilt * Math.PI) / 180 * 0.3,
            0,
            0,
          ]}
        >
          <ringGeometry args={[radius * 1.4, radius * 2.2, 64]} />
          <meshBasicMaterial
            color={planet.color}
            side={THREE.DoubleSide}
            transparent
            opacity={planet.id === 'saturn' ? 0.5 : 0.15}
          />
        </mesh>
      )}

      {/* Label */}
      {showLabels && (
        <Html
          position={[0, displayRadius + 0.3, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isSelected ? 'var(--accent)' : hovered ? '#e4e4ec' : '#8888a0',
              textShadow: '0 0 6px rgba(0,0,0,0.8)',
            }}
          >
            {planet.name}
          </div>
        </Html>
      )}
    </group>
  );
}
