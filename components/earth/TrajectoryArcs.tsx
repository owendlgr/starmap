'use client';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { Mission } from '@/lib/types';

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const theta = (lng * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.sin(theta)
  );
}

/** Determine arc height multiplier based on orbit type */
function getArcHeight(orbit: string | undefined): number {
  if (!orbit) return 0.3;
  const lower = orbit.toLowerCase();
  if (lower.includes('low earth') || lower.includes('leo') || lower.includes('suborbital')) return 0.15;
  if (lower.includes('geostationary') || lower.includes('geo') || lower.includes('gto') || lower.includes('transfer')) return 0.6;
  if (lower.includes('lunar') || lower.includes('heliocentric') || lower.includes('mars') || lower.includes('l1') || lower.includes('l2')) return 0.8;
  if (lower.includes('sun-synchronous') || lower.includes('medium earth') || lower.includes('meo')) return 0.35;
  return 0.3;
}

/** Get arc color based on mission status */
function getStatusColor(status: string): THREE.Color {
  const lower = status.toLowerCase();
  if (lower.includes('partial')) return new THREE.Color(0xf39c12);
  if (lower.includes('success')) return new THREE.Color(0x2ecc71);
  if (lower.includes('fail')) return new THREE.Color(0xe74c3c);
  return new THREE.Color(0x8888a0);
}

interface ArcData {
  id: string;
  curve: THREE.QuadraticBezierCurve3;
  color: THREE.Color;
}

interface TrajectoryArcsProps {
  missions: Mission[];
  earthRadius: number;
}

function ArcLine({ curve, color }: { curve: THREE.QuadraticBezierCurve3; color: THREE.Color }) {
  const ref = useRef<THREE.Group>(null);

  const lineObj = useMemo(() => {
    const points = curve.getPoints(32);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
    });
    return new THREE.Line(geometry, material);
  }, [curve, color]);

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.LineBasicMaterial).dispose();
    };
  }, [lineObj]);

  return (
    <group ref={ref}>
      <primitive object={lineObj} />
    </group>
  );
}

export function TrajectoryArcs({ missions, earthRadius }: TrajectoryArcsProps) {
  const arcs = useMemo<ArcData[]>(() => {
    const results: ArcData[] = [];

    for (const mission of missions) {
      const { latitude, longitude } = mission.launchSite;
      // Skip missions without valid coordinates
      if (latitude === 0 && longitude === 0) continue;

      const startPos = latLngToVector3(latitude, longitude, earthRadius * 1.005);
      const arcHeight = getArcHeight(mission.orbit);

      // Control point: midpoint pushed outward from Earth center
      const direction = startPos.clone().normalize();
      // Offset the end point along a tangent direction to give the arc a flight path feel
      const tangent = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      const controlPoint = direction
        .clone()
        .multiplyScalar(earthRadius + arcHeight)
        .add(tangent.clone().multiplyScalar(arcHeight * 0.3));

      // End point: further along orbit direction, at surface level
      const endPos = startPos
        .clone()
        .normalize()
        .add(tangent.clone().multiplyScalar(0.3))
        .normalize()
        .multiplyScalar(earthRadius * (1.0 + arcHeight * 0.5));

      const curve = new THREE.QuadraticBezierCurve3(startPos, controlPoint, endPos);
      const color = getStatusColor(mission.status);

      results.push({ id: mission.id, curve, color });
    }

    return results;
  }, [missions, earthRadius]);

  return (
    <group>
      {arcs.map((arc) => (
        <ArcLine key={arc.id} curve={arc.curve} color={arc.color} />
      ))}
    </group>
  );
}
