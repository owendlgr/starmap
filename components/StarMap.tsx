'use client';
import { useEffect, Suspense, useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { StarField } from './StarField';
import { ExoplanetHostField } from './ExoplanetHostField';
import { SelectionMarker, MeasureLine } from './SelectionMarker';
import { SceneGrid } from './SceneGrid';
import { useStore } from '@/lib/useStore';
import { formatDistance } from '@/lib/coordinates';
import type { Star, StarChunk } from '@/lib/types';

const isNamed = (s: Star) => s.name && !s.name.startsWith('HIP ');

// ── Data loaders ──────────────────────────────────────────
function DataLoader() {
  const { addStars } = useStore();
  useEffect(() => {
    fetch('/data/stars_verified.json')
      .then(r => r.json())
      .then((d: StarChunk) => addStars('verified', d.stars))
      .catch(() => {});
  }, [addStars]);
  return null;
}

function parseGaiaChunk(buf: ArrayBuffer, idBase: number): Star[] {
  if (buf.byteLength < 8) return [];
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'GAIA') return [];
  const count = dv.getUint32(4, true);
  if (buf.byteLength < 8 + count * 32) return [];
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const b = 8 + i * 32;
    const x = dv.getFloat32(b, true), y = dv.getFloat32(b+4, true), z = dv.getFloat32(b+8, true);
    const mag = dv.getFloat32(b+12, true), bvrp = dv.getFloat32(b+16, true);
    const dist_pc = dv.getFloat32(b+20, true), ra = dv.getFloat32(b+24, true), dec = dv.getFloat32(b+28, true);
    stars.push({ id: idBase+i, name: `Gaia DR3 ${idBase+i}`, x, y, z, mag, bv: bvrp*0.85,
      spectral: '', type: 'Star', ra, dec, dist_pc, size: Math.max(0.3, 4.0-mag*0.3),
      color: [0.10,0.07,0.03], catalog: 'Gaia DR3', hip: 0 });
  }
  return stars;
}

function GaiaLoader() {
  const { addStars } = useStore();
  useEffect(() => {
    fetch('/data/gaia/manifest.json')
      .then(r => { if (!r.ok) throw new Error('no manifest'); return r.json(); })
      .then(async (m: { chunks: string[]; id_base: number }) => {
        const base = m.id_base ?? 4_000_000;
        let offset = 0;
        for (const chunk of m.chunks) {
          const res = await fetch(`/data/gaia/${chunk}`);
          if (!res.ok) continue;
          const stars = parseGaiaChunk(await res.arrayBuffer(), base + offset);
          if (stars.length) { addStars(`gaia-${chunk}`, stars); offset += stars.length; }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ExoplanetLoader({ onLoad }: { onLoad: (stars: Star[]) => void }) {
  const { setExoHostCount } = useStore();
  useEffect(() => {
    fetch('/api/exoplanet-stars')
      .then(r => r.json())
      .then((d: { stars: Star[] }) => { if (d.stars?.length) { onLoad(d.stars); setExoHostCount(d.stars.length); } })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ── Camera ────────────────────────────────────────────────
function CameraManager() {
  const { camera } = useThree();
  const controlsRef = useRef<{ target: THREE.Vector3; object: THREE.Camera; update: () => void } | null>(null);
  const { cameraResetTick, zoomTarget, _zoomLerpTick, setZoomTarget, syncCameraZoom, mapMode } = useStore();
  const lastResetTick = useRef(0);
  const lerpActive   = useRef(false);
  const prevLerpTick = useRef(0);
  const lastSyncMs   = useRef(0);

  useEffect(() => { camera.position.set(0, 8, 28); camera.lookAt(0, 0, 0); }, [camera]);

  useEffect(() => {
    if (cameraResetTick === lastResetTick.current) return;
    lastResetTick.current = cameraResetTick;
    camera.position.set(0, 8, 28);
    if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
    setZoomTarget(28);
  }, [cameraResetTick, camera, setZoomTarget]);

  // Slider or reset → start lerp
  useEffect(() => {
    if (_zoomLerpTick === prevLerpTick.current) return;
    prevLerpTick.current = _zoomLerpTick;
    lerpActive.current = true;
  }, [_zoomLerpTick]);

  // 2D: snap to bird's-eye, disable rotation
  useEffect(() => {
    if (mapMode === '2d') {
      const dist = camera.position.length();
      camera.position.set(0.001, dist, 0.001);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
    }
  }, [mapMode, camera]);

  useFrame(() => {
    if (!lerpActive.current) return;
    const pos = camera.position;
    const currentDist = pos.length();
    if (Math.abs(currentDist - zoomTarget) < 0.01) { lerpActive.current = false; return; }
    pos.normalize().multiplyScalar(currentDist + (zoomTarget - currentDist) * 0.08);
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      // @ts-expect-error ref typing
      ref={controlsRef}
      enableDamping dampingFactor={0.10}
      rotateSpeed={mapMode === '2d' ? 0 : 0.45}
      zoomSpeed={1.0} panSpeed={0.6}
      minDistance={0.2} maxDistance={60000}
      makeDefault
      onChange={() => {
        if (lerpActive.current) return;
        const now = Date.now();
        if (now - lastSyncMs.current < 50) return;
        lastSyncMs.current = now;
        syncCameraZoom(camera.position.length());
      }}
    />
  );
}

// ── Sol marker ────────────────────────────────────────────
function SolarMarker() {
  const { theme } = useStore();
  const dark = theme === 'dark';
  const dot  = dark ? '#c8b898' : '#3d2e1e';
  const txt  = dark ? '#e8e0d0' : '#1a1208';
  const shad = dark ? '#0a0806' : '#f0ece0';
  return (
    <group position={[0,0,0]}>
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={dot} />
      </mesh>
      <Html distanceFactor={10} position={[0.2,0.2,0]}
        style={{ zIndex:5, pointerEvents:'none' }} zIndexRange={[10,0]}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'11px', fontWeight:'bold',
          color:txt, whiteSpace:'nowrap', fontStyle:'italic', lineHeight:1.3,
          textShadow:`0 0 6px ${shad}, 0 0 6px ${shad}` }}>
          Sol · 0 ly
        </div>
      </Html>
    </group>
  );
}

// ── Star labels ───────────────────────────────────────────
function StarLabels({ stars }: { stars: Star[] }) {
  const { showLabels, scaleUnit, theme } = useStore();
  const named = useMemo(() => stars.filter(isNamed), [stars]);
  const dark = theme === 'dark';
  const txt  = dark ? '#e8e0d0' : '#1a1208';
  const sub  = dark ? '#9a8e7e' : '#5a4e3e';
  const shad = dark ? '#0a0806' : '#f0ece0';
  if (!showLabels || named.length === 0) return null;
  return (
    <>
      {named.map(s => (
        <Html key={s.id} distanceFactor={10} position={[s.x+0.2, s.y+0.2, s.z]}
          style={{ zIndex:5, pointerEvents:'none' }} zIndexRange={[10,0]}>
          <div style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:txt,
            whiteSpace:'nowrap', lineHeight:1.35, pointerEvents:'none',
            textShadow:`0 0 6px ${shad}, 0 0 6px ${shad}, 0 0 8px ${shad}` }}>
            <span style={{ display:'block', fontSize:'10px' }}>{s.name}</span>
            <span style={{ display:'block', fontSize:'9px', color:sub }}>
              {s.dist_pc>0 ? formatDistance(s.dist_pc, scaleUnit) : 'here'}
            </span>
          </div>
        </Html>
      ))}
    </>
  );
}

// ── Depth lines ───────────────────────────────────────────
function DepthLines({ stars }: { stars: Star[] }) {
  const { showDepthLines, theme } = useStore();
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const s of stars.filter(s => isNamed(s) || s.mag < 3.5)) {
      if (Math.abs(s.y) < 0.05) continue;
      pts.push(s.x, s.y, s.z, s.x, 0, s.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, [stars]);
  if (!showDepthLines) return null;
  const col = theme === 'dark' ? '#504840' : '#b0a898';
  return <lineSegments geometry={geometry}><lineBasicMaterial color={col} transparent opacity={0.35} /></lineSegments>;
}

// ── 2D: canvas dot overlay inside Three.js ────────────────
function TwoDDotsCanvas({ allStars, exoHosts }: { allStars: Star[]; exoHosts: Star[] }) {
  const { camera, size } = useThree();
  const { theme } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proj = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dark = theme === 'dark';
    ctx.clearRect(0, 0, c.width, c.height);

    const draw = (stars: Star[], ring: boolean) => {
      for (const s of stars) {
        proj.set(s.x, s.y, s.z).project(camera);
        const sx = (proj.x * 0.5 + 0.5) * size.width;
        const sy = (1 - (proj.y * 0.5 + 0.5)) * size.height;
        if (sx < -20 || sx > size.width+20 || sy < -20 || sy > size.height+20) continue;
        const r = Math.max(1.5, Math.min(5, 4.0 - s.mag * 0.25));
        ctx.beginPath();
        ctx.arc(sx, sy, r + (ring ? 1.5 : 0), 0, Math.PI*2);
        if (ring) {
          ctx.strokeStyle = dark ? 'rgba(232,220,200,0.7)' : 'rgba(26,18,8,0.65)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          ctx.fillStyle = dark ? 'rgba(220,210,185,0.85)' : 'rgba(26,18,8,0.8)';
          ctx.fill();
        }
      }
    };
    draw(allStars, false);
    draw(exoHosts, true);
    // Sol
    proj.set(0,0,0).project(camera);
    const sx = (proj.x*0.5+0.5)*size.width, sy = (1-(proj.y*0.5+0.5))*size.height;
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2);
    ctx.fillStyle = dark ? '#c8b898' : '#3d2e1e'; ctx.fill();
  });

  return (
    <Html fullscreen style={{ zIndex:7, pointerEvents:'none' }} zIndexRange={[9,0]}>
      <canvas ref={canvasRef} width={size.width} height={size.height}
        style={{ position:'absolute', inset:0, pointerEvents:'none' }} />
    </Html>
  );
}

// ── 3D scene ──────────────────────────────────────────────
function Scene({ exoHosts }: { exoHosts: Star[] }) {
  const { stars, selectedStar, measureTarget, setSelected, theme } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';
  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 80000, 200000]} />
      <CameraManager />
      <SceneGrid />
      <SolarMarker />
      <StarField stars={stars} onSelect={setSelected} />
      {exoHosts.length > 0 && <ExoplanetHostField stars={exoHosts} />}
      <StarLabels stars={stars} />
      <DepthLines stars={stars} />
      {selectedStar && <SelectionMarker star={selectedStar} color="#5a3e1e" />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#2e5a6e" />}
      {selectedStar && measureTarget && <MeasureLine from={selectedStar} to={measureTarget} />}
    </>
  );
}

// ── 2D scene (top-down) ───────────────────────────────────
function Scene2D({ exoHosts }: { exoHosts: Star[] }) {
  const { stars, theme } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';
  return (
    <>
      <color attach="background" args={[bg]} />
      <CameraManager />
      <TwoDDotsCanvas allStars={stars} exoHosts={exoHosts} />
    </>
  );
}

// ── 2D hover tooltip (DOM layer, outside Canvas) ──────────
// Uses accurate perspective projection for the top-down camera.
function TwoDHoverOverlay({ allStars, exoHosts }: { allStars: Star[]; exoHosts: Star[] }) {
  const { theme, zoomTarget, setSelected, mode, setMeasureTarget } = useStore();
  const [hovered, setHovered] = useState<{ x: number; y: number; stars: Star[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const CLUSTER_PX = 12;
  const FOV_RAD = 60 * (Math.PI / 180);

  // Project world-space star (x, z) to screen coords for top-down camera
  const project = useCallback((s: Star, W: number, H: number) => {
    // Camera at (0, zoomTarget, 0), looking straight down
    // Visible half-height = zoomTarget * tan(fov/2), half-width = halfH * aspect
    const halfH = zoomTarget * Math.tan(FOV_RAD / 2);
    const halfW = halfH * (W / H);
    const sx = W / 2 + (s.x / halfW) * (W / 2);
    const sy = H / 2 + (s.z / halfH) * (H / 2);
    return { sx, sy };
  }, [zoomTarget]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = rect.width, H = rect.height;
    const all = [...allStars, ...exoHosts];
    const nearby = all.filter(s => {
      const { sx, sy } = project(s, W, H);
      return Math.hypot(sx - mx, sy - my) < CLUSTER_PX;
    });
    setHovered(nearby.length > 0 ? { x: mx, y: my, stars: nearby.slice(0, 20) } : null);
  }, [allStars, exoHosts, project]);

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  const handleSelect = useCallback((star: Star) => {
    if (mode === 'measure') setMeasureTarget(star); else setSelected(star);
    setHovered(null);
  }, [mode, setSelected, setMeasureTarget]);

  const dark = theme === 'dark';
  const panelBg = dark ? 'rgba(10,8,5,0.97)' : 'rgba(240,236,224,0.97)';
  const border = dark ? 'rgba(200,180,140,0.3)' : 'rgba(26,18,8,0.2)';
  const headerColor = dark ? '#9a8e7e' : '#7a6e5e';
  const nameColor = dark ? '#e8e0d0' : '#1a1208';
  const metaColor = dark ? '#9a8e7e' : '#7a6e5e';
  const rowBorder = dark ? 'rgba(200,180,140,0.08)' : 'rgba(26,18,8,0.07)';
  const rowHover = dark ? 'rgba(200,180,140,0.08)' : 'rgba(26,18,8,0.06)';

  return (
    <div ref={containerRef} style={{ position:'absolute', inset:0, pointerEvents:'auto', zIndex:8 }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {hovered && hovered.stars.length > 0 && (
        <div style={{
          position:'absolute',
          left: Math.min(hovered.x + 14, (containerRef.current?.clientWidth ?? 800) - 300),
          top: Math.max(hovered.y - 8, 4),
          background: panelBg, border:`1px solid ${border}`,
          borderRadius:3, padding:'0.4rem 0', zIndex:35,
          minWidth:180, maxWidth:280, maxHeight:260, overflowY:'auto',
          boxShadow:'0 4px 16px rgba(0,0,0,0.25)', pointerEvents:'auto',
        }}>
          {hovered.stars.length > 1 && (
            <div style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', fontWeight:'bold',
              letterSpacing:'0.1em', textTransform:'uppercase', color:headerColor,
              padding:'0 0.7rem 0.3rem', borderBottom:`1px solid ${rowBorder}`, marginBottom:'0.2rem' }}>
              {hovered.stars.length} objects at this location
            </div>
          )}
          {hovered.stars.map(s => (
            <button key={s.id} onClick={() => handleSelect(s)}
              style={{ display:'block', width:'100%', textAlign:'left', background:'none',
                border:'none', padding:'0.4rem 0.7rem', cursor:'pointer',
                borderBottom:`1px solid ${rowBorder}` }}
              onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <div style={{ fontSize:'0.82rem', fontWeight:'bold', color:nameColor }}>{s.name}</div>
              <div style={{ fontSize:'0.65rem', fontFamily:'var(--font-mono)', fontWeight:'bold',
                color:metaColor, marginTop:'0.1rem' }}>
                {s.type} · {s.dist_pc > 0 ? `${s.dist_pc.toFixed(1)} pc` : 'here'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────
export function StarMap() {
  const [exoHosts, setExoHosts] = useState<Star[]>([]);
  const { stars, theme, mapMode } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';

  return (
    <div style={{ width:'100%', height:'100%', position:'absolute', inset:0 }}>
      <DataLoader />
      <GaiaLoader />
      <ExoplanetLoader onLoad={setExoHosts} />
      <Canvas
        camera={{ fov:60, near:0.001, far:200000 }}
        gl={{ antialias:true, alpha:false, powerPreference:'high-performance', logarithmicDepthBuffer:true }}
        dpr={[1,2]} style={{ background:bg }}
      >
        <Suspense fallback={null}>
          {mapMode === '3d'
            ? <Scene exoHosts={exoHosts} />
            : <Scene2D exoHosts={exoHosts} />
          }
        </Suspense>
      </Canvas>
      {mapMode === '2d' && (
        <TwoDHoverOverlay allStars={stars} exoHosts={exoHosts} />
      )}
    </div>
  );
}
