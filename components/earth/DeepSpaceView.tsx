'use client';
import { useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { loadTrajectories, getTrajectory, getPlanetOrbit, type TrajectoryDatabase, type TrajectoryData } from '@/lib/trajectoryLoader';
import type { Mission } from '@/lib/types';

/**
 * Convert SPICE ecliptic (x,y,z) in AU to Three.js scene.
 * SPICE: x=vernal equinox, y=90° ecliptic, z=north ecliptic pole
 * Three.js: y=up → map SPICE z → Three.js y
 */
function s2s(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, z, -y);
}

/** Sun — tiny bright dot */
function Sun() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshBasicMaterial color="#ffee88" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.3} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#ffdd44" distance={100} />
    </group>
  );
}

/** Render a planet orbit as a thin THREE.Line + small dot at current position */
function PlanetRing({ data, color, label }: { data: TrajectoryData; color: string; label: string }) {
  const points = useMemo(() => data.points.map(p => s2s(p.x, p.y, p.z)), [data]);

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 });
    return new THREE.Line(geo, mat);
  }, [points, color]);

  useEffect(() => () => {
    lineObj.geometry.dispose();
    (lineObj.material as THREE.LineBasicMaterial).dispose();
  }, [lineObj]);

  const pos = points[points.length - 1];

  return (
    <group>
      <primitive object={lineObj} />
      <mesh position={pos}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={[pos.x, pos.y + 0.025, pos.z]} style={{ pointerEvents: 'none' }} center>
        <div style={{
          fontSize: '7px', fontFamily: 'monospace', color, fontWeight: 600,
          letterSpacing: '1px', whiteSpace: 'nowrap',
          textShadow: '0 0 4px #000, 0 0 8px #000',
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

/** Spacecraft trajectory line + markers */
function Trajectory({ data, color, label, isActive, earthLaunchPos }: {
  data: TrajectoryData; color: string; label: string; isActive?: boolean;
  earthLaunchPos: THREE.Vector3;
}) {
  const points = useMemo(() => data.points.map(p => s2s(p.x, p.y, p.z)), [data]);

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geo, mat);
  }, [points, color]);

  useEffect(() => () => {
    lineObj.geometry.dispose();
    (lineObj.material as THREE.LineBasicMaterial).dispose();
  }, [lineObj]);

  const endPos = points[points.length - 1];

  return (
    <group>
      <primitive object={lineObj} />

      {/* Earth at launch — small white dot where trajectory starts */}
      <mesh position={earthLaunchPos}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshBasicMaterial color="#4488ff" />
      </mesh>
      <Html position={[earthLaunchPos.x, earthLaunchPos.y + 0.025, earthLaunchPos.z]}
        style={{ pointerEvents: 'none' }} center>
        <div style={{
          fontSize: '6px', fontFamily: 'monospace', color: '#4488ff', fontWeight: 600,
          letterSpacing: '0.5px', whiteSpace: 'nowrap',
          textShadow: '0 0 3px #000, 0 0 6px #000',
        }}>
          EARTH (LAUNCH)
        </div>
      </Html>

      {/* Current position — small solid opaque dot */}
      <mesh position={endPos}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Label at current position */}
      <Html position={[endPos.x, endPos.y + 0.03, endPos.z]}
        style={{ pointerEvents: 'none' }} center>
        <div style={{
          fontSize: '9px', fontFamily: 'monospace', color, fontWeight: 700,
          letterSpacing: '1px', whiteSpace: 'nowrap',
          textShadow: '0 0 6px #000, 0 0 12px #000',
        }}>
          {isActive && '● '}{label}
        </div>
        <div style={{
          fontSize: '7px', fontFamily: 'monospace', color: '#99a',
          textAlign: 'center', whiteSpace: 'nowrap',
          textShadow: '0 0 3px #000',
        }}>
          {data.points[data.points.length - 1].dist_au.toFixed(1)} AU
        </div>
      </Html>

      {/* Subtle waypoint dots at 25%, 50%, 75% */}
      {points.length > 20 && [0.25, 0.5, 0.75].map((frac) => {
        const idx = Math.floor(frac * (points.length - 1));
        return (
          <mesh key={frac} position={points[idx]}>
            <sphereGeometry args={[0.002, 4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

/** AU distance rings */
function ScaleRings({ maxDist }: { maxDist: number }) {
  const rings = useMemo(() => {
    const r: number[] = [];
    if (maxDist <= 5) r.push(1, 2, 3, 4, 5);
    else if (maxDist <= 15) r.push(1, 5, 10);
    else if (maxDist <= 50) r.push(1, 5, 10, 20, 30, 50);
    else r.push(1, 5, 10, 30, 50, 100, 150);
    return r.filter(v => v <= maxDist * 1.2);
  }, [maxDist]);

  const ringObjects = useMemo(() => {
    return rings.map((r) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: '#2a2a4a', transparent: true, opacity: 0.55 });
      return { r, line: new THREE.Line(geo, mat) };
    });
  }, [rings]);

  useEffect(() => () => {
    ringObjects.forEach(({ line }) => {
      line.geometry.dispose();
      (line.material as THREE.LineBasicMaterial).dispose();
    });
  }, [ringObjects]);

  return (
    <group>
      {ringObjects.map(({ r, line }) => (
        <group key={r}>
          <primitive object={line} />
          <Html position={[r + 0.05, 0, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontSize: '7px', fontFamily: 'monospace', color: '#778',
              whiteSpace: 'nowrap', textShadow: '0 0 3px #000',
            }}>
              {r} AU
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

interface DeepSpaceViewProps {
  mission: Mission;
}

export function DeepSpaceView({ mission }: DeepSpaceViewProps) {
  const [db, setDb] = useState<TrajectoryDatabase | null>(null);

  useEffect(() => {
    loadTrajectories().then(setDb);
  }, []);

  const trajectoryData = db ? getTrajectory(db, mission.id) : null;
  const earthOrbit = db ? getPlanetOrbit(db, 'earth') : null;
  const marsOrbit = db ? getPlanetOrbit(db, 'mars') : null;
  const jupiterOrbit = db ? getPlanetOrbit(db, 'jupiter') : null;
  const saturnOrbit = db ? getPlanetOrbit(db, 'saturn') : null;

  const maxDist = trajectoryData
    ? Math.max(...trajectoryData.points.map(p => p.dist_au))
    : 10;

  // The first point of the spacecraft trajectory IS Earth's position at launch
  const earthLaunchPos = useMemo(() => {
    if (!trajectoryData || trajectoryData.points.length === 0) return new THREE.Vector3(1, 0, 0);
    const p = trajectoryData.points[0];
    return s2s(p.x, p.y, p.z);
  }, [trajectoryData]);

  const cameraDist = Math.max(3, maxDist * 1.1);

  if (!trajectoryData) {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: '#020204',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px',
      }}>
        <div className="loading-spinner" />
        <div className="loading-text">
          {db ? 'No SPICE trajectory data for this mission' : 'Loading SPICE data…'}
        </div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{
        position: [cameraDist * 0.3, cameraDist * 0.6, cameraDist * 0.8],
        fov: 50, near: 0.001, far: cameraDist * 10,
      }}
      style={{ width: '100%', height: '100%', background: '#020204' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.05} />
      <Stars radius={500} depth={200} count={2000} factor={3} fade speed={0.1} />

      <Sun />
      <ScaleRings maxDist={maxDist} />

      {/* Planet orbits */}
      {earthOrbit && <PlanetRing data={earthOrbit} color="#4488ff" label="EARTH" />}
      {marsOrbit && maxDist > 1.2 && <PlanetRing data={marsOrbit} color="#ff6644" label="MARS" />}
      {jupiterOrbit && maxDist > 4 && <PlanetRing data={jupiterOrbit} color="#ffaa44" label="JUPITER" />}
      {saturnOrbit && maxDist > 8 && <PlanetRing data={saturnOrbit} color="#ddcc88" label="SATURN" />}

      {/* Spacecraft trajectory — starts from Earth's position at launch */}
      <Trajectory
        data={trajectoryData}
        color={mission.isActive ? '#44ff88' : '#00d4ff'}
        label={mission.name}
        isActive={mission.isActive}
        earthLaunchPos={earthLaunchPos}
      />

      <OrbitControls
        enableDamping dampingFactor={0.05} rotateSpeed={0.5}
        minDistance={0.1} maxDistance={cameraDist * 5}
      />
    </Canvas>
  );
}
