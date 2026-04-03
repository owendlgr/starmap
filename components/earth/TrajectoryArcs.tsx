'use client';
import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { Mission } from '@/lib/types';
import { loadTrajectories, getTrajectory, type TrajectoryDatabase } from '@/lib/trajectoryLoader';

/**
 * Convert geographic lat/lng to Three.js Vector3.
 * Verified to match THREE.SphereGeometry UV mapping exactly.
 */
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Get orbit altitude and inclination for computed trajectories */
function getOrbitParams(orbit: string | undefined): { height: number; inclination: number } {
  if (!orbit) return { height: 0.25, inclination: 28.5 };
  const o = orbit.toLowerCase();
  if (o.includes('suborbital')) return { height: 0.06, inclination: 28.5 };
  if (o.includes('low earth') || o.includes('leo')) return { height: 0.12, inclination: 51.6 };
  if (o.includes('sun-synchronous') || o.includes('sso')) return { height: 0.15, inclination: 97.4 };
  if (o.includes('medium earth') || o.includes('meo')) return { height: 0.3, inclination: 55.0 };
  if (o.includes('geostationary') || o.includes('geo') || o.includes('gto')) return { height: 0.5, inclination: 0 };
  if (o.includes('lunar') || o.includes('moon')) return { height: 0.9, inclination: 28.5 };
  if (o.includes('heliocentric') || o.includes('mars') || o.includes('l1') || o.includes('l2') || o.includes('interstellar'))
    return { height: 1.5, inclination: 28.5 };
  return { height: 0.25, inclination: 28.5 };
}

/** Color based on mission status */
function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('success')) return '#44ff88';
  if (s.includes('partial')) return '#f39c12';
  if (s.includes('fail')) return '#e74c3c';
  if (s.includes('active') || s.includes('transit')) return '#44ff88';
  if (s.includes('go') || s.includes('tbd')) return '#3b82f6';
  return '#8888a0';
}

/**
 * Generate a clean arc from launch site upward.
 * Simple quadratic bezier — launch point → apex → end point.
 */
function generateArcPoints(
  lat: number, lng: number, earthRadius: number,
  height: number, inclination: number
): THREE.Vector3[] {
  const numPoints = 48;
  const points: THREE.Vector3[] = [];

  const startPos = latLngToVector3(lat, lng, earthRadius * 1.002);
  const startDir = startPos.clone().normalize();

  // Build local frame at launch site
  const up = startDir.clone();
  let east = new THREE.Vector3(0, 1, 0).cross(up);
  if (east.length() < 0.01) east = new THREE.Vector3(1, 0, 0).cross(up);
  east.normalize();
  const north = up.clone().cross(east).normalize();

  // Launch azimuth from inclination
  const incRad = inclination * (Math.PI / 180);
  const launchDir = east.clone().multiplyScalar(Math.cos(incRad))
    .add(north.clone().multiplyScalar(Math.sin(incRad))).normalize();

  // Arc: smooth rise from surface, curving along launch direction
  const arcSpan = Math.PI * Math.min(0.5, 0.15 + height * 0.2);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Smooth altitude rise (sine curve)
    const alt = earthRadius + height * Math.sin(t * Math.PI * 0.5);
    // Angular progress along orbit direction
    const angle = t * arcSpan;

    const orbitNormal = startDir.clone().cross(launchDir).normalize();
    const dir = startDir.clone().applyAxisAngle(orbitNormal, angle).normalize();
    points.push(dir.multiplyScalar(alt));
  }

  return points;
}

/**
 * Single solid colored line rendered as a thin tube.
 * No glow, fully opaque.
 */
function SolidArc({ points, color, radius }: {
  points: THREE.Vector3[];
  color: string;
  radius: number;
}) {
  const meshData = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const geometry = new THREE.TubeGeometry(curve, points.length * 2, radius, 5, false);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: false,
    });
    return { geometry, material };
  }, [points, color, radius]);

  useEffect(() => {
    return () => {
      meshData?.geometry.dispose();
      meshData?.material.dispose();
    };
  }, [meshData]);

  if (!meshData) return null;
  return <mesh geometry={meshData.geometry} material={meshData.material} />;
}

interface TrajectoryArcsProps {
  missions: Mission[];
  earthRadius: number;
}

export function TrajectoryArcs({ missions, earthRadius }: TrajectoryArcsProps) {
  const [trajectoryDb, setTrajectoryDb] = useState<TrajectoryDatabase | null>(null);

  useEffect(() => {
    loadTrajectories().then(setTrajectoryDb);
  }, []);

  const arcs = useMemo(() => {
    return missions.map((mission) => {
      const { latitude, longitude } = mission.launchSite;
      if (latitude === 0 && longitude === 0) return null;

      const color = getStatusColor(mission.status);
      const isDeep = mission.isDeepSpace === true;

      // For Earth-globe view: always show departure arc from launch site
      const { height, inclination } = getOrbitParams(mission.orbit);
      const points = generateArcPoints(latitude, longitude, earthRadius, height, inclination);
      const radius = isDeep ? 0.005 : 0.003;

      return { id: mission.id, points, color, radius };
    }).filter(Boolean) as { id: string; points: THREE.Vector3[]; color: string; radius: number }[];
  }, [missions, earthRadius, trajectoryDb]);

  return (
    <group>
      {arcs.map((arc) => (
        <SolidArc key={arc.id} points={arc.points} color={arc.color} radius={arc.radius} />
      ))}
    </group>
  );
}
