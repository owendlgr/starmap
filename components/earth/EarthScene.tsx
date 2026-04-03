'use client';
import { useRef, useMemo, Suspense, } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { LaunchSiteMarkers } from './LaunchSites';
import { TrajectoryArcs } from './TrajectoryArcs';
import { useEarthStore } from '@/lib/stores/earthStore';
import type { LaunchSite } from '@/lib/types';

const EARTH_RADIUS = 1;

/**
 * Dark monochrome Earth globe — default when no mission is selected.
 * Shows dark landmass outlines via texture, very muted.
 */
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
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial color="#1a3a5a" roughness={0.8} metalness={0.1} />
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.15, 0.35, 0.6, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
  }, []);

  return (
    <mesh material={material}>
      <sphereGeometry args={[EARTH_RADIUS * 1.12, 64, 64]} />
    </mesh>
  );
}

/** Same coordinate conversion as LaunchSites/TrajectoryArcs */
function geoToVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function GridLines() {
  const showGrid = useEarthStore((s) => s.showGrid);
  const lines = useMemo(() => {
    const positions: number[] = [];
    const r = EARTH_RADIUS * 1.001;

    // Latitude lines every 30 degrees
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lng = -180; lng <= 180; lng += 2) {
        const [x, y, z] = geoToVec3(lat, lng, r);
        positions.push(x, y, z);
      }
    }

    // Longitude lines every 30 degrees
    for (let lng = -180; lng < 180; lng += 30) {
      for (let lat = -90; lat <= 90; lat += 2) {
        const [x, y, z] = geoToVec3(lat, lng, r);
        positions.push(x, y, z);
      }
    }

    return new Float32Array(positions);
  }, []);

  if (!showGrid) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#0f3040" size={0.003} transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

interface EarthSceneProps {
  launchSites?: LaunchSite[];
  onSelectSite?: (site: LaunchSite) => void;
}

export function EarthScene({ launchSites = [], onSelectSite }: EarthSceneProps) {
  const selectedMission = useEarthStore((s) => s.selectedMission);
  const showTrajectories = useEarthStore((s) => s.showTrajectories);
  const showAtmosphere = useEarthStore((s) => s.showAtmosphere);

  // Only show trajectory for the selected mission
  const trajectoryMissions = useMemo(() => {
    if (!selectedMission || !showTrajectories) return [];
    return [selectedMission];
  }, [selectedMission, showTrajectories]);

  const handleSelectSite = onSelectSite ?? (() => {});

  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.5], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#050508' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <directionalLight position={[-3, -1, -3]} intensity={0.25} color="#4a6aff" />

      <Stars radius={100} depth={50} count={4000} factor={3} fade speed={0.3} />

      <group>
        <EarthGlobe />
        {showAtmosphere && <AtmosphereGlow />}
        <GridLines />
        <LaunchSiteMarkers
          sites={launchSites}
          earthRadius={EARTH_RADIUS}
          onSelectSite={handleSelectSite}
        />
        {trajectoryMissions.length > 0 && (
          <TrajectoryArcs missions={trajectoryMissions} earthRadius={EARTH_RADIUS} />
        )}
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={1.5}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </Canvas>
  );
}

// Default export for dynamic import compat
export default EarthScene;
