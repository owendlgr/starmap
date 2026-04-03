'use client';
import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { LaunchSite } from '@/lib/types';

/**
 * Convert geographic lat/lng to Three.js Vector3 on a sphere.
 * Matches THREE.SphereGeometry default UV mapping with standard
 * equirectangular Earth textures.
 */
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);     // colatitude (0=north pole, PI=south pole)
  const theta = (lng + 180) * (Math.PI / 180);   // longitude shifted to match texture seam at -180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Group nearby sites (within ~1 degree) to avoid overlapping markers.
 */
function groupSitesByProximity(sites: LaunchSite[], thresholdDeg = 1.0): LaunchSite[] {
  const grouped: LaunchSite[] = [];
  const used = new Set<number>();

  for (let i = 0; i < sites.length; i++) {
    if (used.has(i)) continue;
    const cluster = [sites[i]];
    used.add(i);

    for (let j = i + 1; j < sites.length; j++) {
      if (used.has(j)) continue;
      const dlat = Math.abs(sites[i].latitude - sites[j].latitude);
      const dlng = Math.abs(sites[i].longitude - sites[j].longitude);
      if (dlat < thresholdDeg && dlng < thresholdDeg) {
        cluster.push(sites[j]);
        used.add(j);
      }
    }

    let best = cluster[0];
    let totalCount = 0;
    for (const s of cluster) {
      const c = s.launchCount ?? 1;
      totalCount += c;
      if (c > (best.launchCount ?? 1)) best = s;
    }

    grouped.push({ ...best, launchCount: totalCount });
  }

  return grouped;
}

interface MarkerProps {
  site: LaunchSite;
  position: THREE.Vector3;
  brightness: number;
  scale: number;
  onSelect: (site: LaunchSite) => void;
}

function SiteMarker({ site, position, brightness, scale, onSelect }: MarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      meshRef.current.scale.setScalar(s * scale);
    }
    if (glowRef.current) {
      const glowScale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
      glowRef.current.scale.setScalar(glowScale * scale);
    }
  });

  const color = useMemo(() => {
    const r = 0.2 + brightness * 0.8;
    const g = 0.5 + brightness * 0.5;
    const b = 1.0;
    return new THREE.Color(r, g, b);
  }, [brightness]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(site);
    },
    [site, onSelect]
  );

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      {/* Core dot */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : color} />
      </mesh>

      {/* Tooltip on hover */}
      {hovered && (
        <Html distanceFactor={3} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <div style={{
            background: 'rgba(15, 15, 24, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px', padding: '4px 8px',
            fontSize: '11px', fontFamily: 'system-ui, sans-serif',
            color: '#e4e4ec', transform: 'translateY(-24px)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{site.name}</div>
            <div style={{ fontSize: '9px', color: '#b8b8cc', fontFamily: 'monospace' }}>
              {site.country && <span>{site.country} · </span>}
              {site.launchCount ?? 0} launches
              <br />
              {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface LaunchSiteMarkersProps {
  sites: LaunchSite[];
  earthRadius: number;
  onSelectSite: (site: LaunchSite) => void;
}

export function LaunchSiteMarkers({ sites, earthRadius, onSelectSite }: LaunchSiteMarkersProps) {
  const grouped = useMemo(() => groupSitesByProximity(sites, 1.5), [sites]);

  const maxLaunches = useMemo(
    () => Math.max(1, ...grouped.map((s) => s.launchCount ?? 1)),
    [grouped]
  );

  const markerData = useMemo(
    () =>
      grouped.map((site) => {
        const count = site.launchCount ?? 1;
        const brightness = Math.min(1, count / maxLaunches);
        const scale = 0.7 + (count / maxLaunches) * 1.1;
        return {
          site,
          position: latLngToVector3(site.latitude, site.longitude, earthRadius * 1.005),
          brightness,
          scale,
        };
      }),
    [grouped, earthRadius, maxLaunches]
  );

  return (
    <group>
      {markerData.map(({ site, position, brightness, scale }) => (
        <SiteMarker
          key={site.id}
          site={site}
          position={position}
          brightness={brightness}
          scale={scale}
          onSelect={onSelectSite}
        />
      ))}
    </group>
  );
}
