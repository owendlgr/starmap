'use client';
import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { LaunchSiteMarkers } from './LaunchSites';
import { TrajectoryArcs } from './TrajectoryArcs';
import { useEarthStore } from '@/lib/stores/earthStore';
import type { LaunchSite } from '@/lib/types';

const EARTH_RADIUS = 1;

function TexturedEarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, '/textures/earth_daymap.jpg');

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function FallbackEarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial
        color="#0a2a3a"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function EarthGlobe() {
  return (
    <Suspense fallback={<FallbackEarthGlobe />}>
      <TexturedEarthGlobe />
    </Suspense>
  );
}

function AtmosphereGlow() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.2, 0.5, 0.8, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
  }, []);

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[EARTH_RADIUS * 1.15, 64, 64]} />
    </mesh>
  );
}

function GridLines() {
  const lines = useMemo(() => {
    const positions: number[] = [];
    const r = EARTH_RADIUS * 1.001;

    // Latitude lines every 30 degrees
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (lat * Math.PI) / 180;
      for (let lng = 0; lng <= 360; lng += 2) {
        const theta = (lng * Math.PI) / 180;
        positions.push(
          r * Math.cos(phi) * Math.cos(theta),
          r * Math.sin(phi),
          r * Math.cos(phi) * Math.sin(theta)
        );
      }
    }

    // Longitude lines every 30 degrees
    for (let lng = 0; lng < 360; lng += 30) {
      const theta = (lng * Math.PI) / 180;
      for (let lat = -90; lat <= 90; lat += 2) {
        const phi = (lat * Math.PI) / 180;
        positions.push(
          r * Math.cos(phi) * Math.cos(theta),
          r * Math.sin(phi),
          r * Math.cos(phi) * Math.sin(theta)
        );
      }
    }

    return new Float32Array(positions);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={lines.length / 3}
          array={lines}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#1a4a5a"
        size={0.003}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function AutoRotate() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });
  return <group ref={groupRef} />;
}

interface EarthSceneProps {
  launchSites: LaunchSite[];
  onSelectSite: (site: LaunchSite) => void;
}

export default function EarthScene({ launchSites, onSelectSite }: EarthSceneProps) {
  const missions = useEarthStore((s) => s.missions);
  const showTrajectories = useEarthStore((s) => s.showTrajectories);

  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.5], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#08080d' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <directionalLight position={[-3, -1, -3]} intensity={0.2} color="#4a6aff" />

      <Stars radius={100} depth={50} count={3000} factor={3} fade speed={0.5} />

      <group>
        <EarthGlobe />
        <AtmosphereGlow />
        <GridLines />
        <LaunchSiteMarkers
          sites={launchSites}
          earthRadius={EARTH_RADIUS}
          onSelectSite={onSelectSite}
        />
        {showTrajectories && (
          <TrajectoryArcs
            missions={missions}
            earthRadius={EARTH_RADIUS}
          />
        )}
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={1.5}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}
