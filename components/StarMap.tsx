'use client';
import { useEffect, Suspense, useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { StarField } from './StarField';
import { ExoplanetHostField } from './ExoplanetHostField';
import { GaiaField } from './GaiaField';
import { ConstellationLines } from './ConstellationLines';
import { SelectionMarker, MeasureLine } from './SelectionMarker';
import { SceneGrid } from './SceneGrid';
import { useStore } from '@/lib/useStore';
import { formatDistance } from '@/lib/coordinates';
import type { Star, StarChunk } from '@/lib/types';

const isNamed = (s: Star) => s.name && !s.name.startsWith('HIP ');

// Projected position entry shared between TwoDDotsCanvas (writer) and TwoDHoverOverlay (reader)
type ProjEntry = { sx: number; sy: number; star: Star };

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

function ExoplanetLoader({ onLoad }: { onLoad: (stars: Star[]) => void }) {
  const { setExoHostCount } = useStore();
  useEffect(() => {
    fetch('/api/exoplanet-stars')
      .then(r => r.json())
      .then((d: { stars: Star[] }) => {
        if (d.stars?.length) { onLoad(d.stars); setExoHostCount(d.stars.length); }
      })
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

  useEffect(() => {
    if (_zoomLerpTick === prevLerpTick.current) return;
    prevLerpTick.current = _zoomLerpTick;
    lerpActive.current = true;
  }, [_zoomLerpTick]);

  // 2D: snap to bird's-eye
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

  // In 2D mode: remap left-click from rotate → pan so the user can drag around
  const mouseButtons2d = useMemo(() => ({
    LEFT:   THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN,
  }), []);
  const mouseButtons3d = useMemo(() => ({
    LEFT:   THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN,
  }), []);
  const touches2d = useMemo(() => ({
    ONE: THREE.TOUCH.PAN,
    TWO: THREE.TOUCH.DOLLY_PAN,
  }), []);
  const touches3d = useMemo(() => ({
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  }), []);

  return (
    <OrbitControls
      // @ts-expect-error ref typing
      ref={controlsRef}
      enableDamping dampingFactor={0.10}
      rotateSpeed={0.45}
      zoomSpeed={1.0} panSpeed={0.6}
      minDistance={0.2} maxDistance={60000}
      makeDefault
      mouseButtons={mapMode === '2d' ? mouseButtons2d : mouseButtons3d}
      touches={mapMode === '2d' ? touches2d : touches3d}
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
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={col} transparent opacity={0.35} />
    </lineSegments>
  );
}

// ── 2D canvas dot renderer ────────────────────────────────
// Draws all stars as 2D dots and populates projRef each frame so the
// DOM overlay can do accurate hit detection without any math approximation.
function TwoDDotsCanvas({
  allStars, exoHosts,
  projRef,
}: {
  allStars: Star[];
  exoHosts: Star[];
  projRef: React.MutableRefObject<ProjEntry[]>;
}) {
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

    const entries: ProjEntry[] = [];

    const draw = (stars: Star[], ring: boolean) => {
      for (const s of stars) {
        proj.set(s.x, s.y, s.z).project(camera);
        const sx = (proj.x * 0.5 + 0.5) * size.width;
        const sy = (1 - (proj.y * 0.5 + 0.5)) * size.height;
        if (sx < -20 || sx > size.width + 20 || sy < -20 || sy > size.height + 20) continue;
        entries.push({ sx, sy, star: s });
        const r = Math.max(1.5, Math.min(5, 4.0 - s.mag * 0.25));
        ctx.beginPath();
        ctx.arc(sx, sy, r + (ring ? 1.5 : 0), 0, Math.PI * 2);
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
    proj.set(0, 0, 0).project(camera);
    const sx = (proj.x * 0.5 + 0.5) * size.width;
    const sy = (1 - (proj.y * 0.5 + 0.5)) * size.height;
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#c8b898' : '#3d2e1e'; ctx.fill();

    // Update shared ref — DOM overlay reads this on next mousemove
    projRef.current = entries;
  });

  return (
    <Html fullscreen style={{ zIndex: 7, pointerEvents: 'none' }} zIndexRange={[9, 0]}>
      <canvas ref={canvasRef} width={size.width} height={size.height}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </Html>
  );
}

// ── Raycaster threshold scaler ────────────────────────────
// Prevents accidentally clicking stars far away when zoomed in.
// Scales the Points pick radius proportionally to camera distance.
function RaycasterScaler() {
  const { raycaster, camera } = useThree();
  useFrame(() => {
    const dist = camera.position.length();
    (raycaster.params as { Points?: { threshold: number } }).Points = {
      threshold: Math.max(0.08, dist * 0.004),
    };
  });
  return null;
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
      <RaycasterScaler />
      <SceneGrid />
      <SolarMarker />
      <StarField stars={stars} onSelect={setSelected} />
      {exoHosts.length > 0 && <ExoplanetHostField stars={exoHosts} />}
      <GaiaField />
      <ConstellationLines stars={stars} />
      <StarLabels stars={stars} />
      <DepthLines stars={stars} />
      {selectedStar && <SelectionMarker star={selectedStar} color="#5a3e1e" />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#2e5a6e" />}
      {selectedStar && measureTarget && <MeasureLine from={selectedStar} to={measureTarget} />}
    </>
  );
}

// ── 2D scene ──────────────────────────────────────────────
function Scene2D({
  exoHosts,
  projRef,
}: {
  exoHosts: Star[];
  projRef: React.MutableRefObject<ProjEntry[]>;
}) {
  const { stars, theme } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';
  return (
    <>
      <color attach="background" args={[bg]} />
      <CameraManager />
      <RaycasterScaler />
      <GaiaField />
      <TwoDDotsCanvas allStars={stars} exoHosts={exoHosts} projRef={projRef} />
    </>
  );
}

// ── 2D hover + click overlay (DOM, reads projRef) ─────────
function TwoDHoverOverlay({
  projRef,
}: {
  projRef: React.MutableRefObject<ProjEntry[]>;
}) {
  const { theme, setSelected, mode, setMeasureTarget } = useStore();
  const [hovered, setHovered] = useState<{ x: number; y: number; stars: Star[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const CLUSTER_PX = 12;

  const nearby = useCallback((mx: number, my: number) =>
    projRef.current
      .filter(p => Math.hypot(p.sx - mx, p.sy - my) < CLUSTER_PX)
      .map(p => p.star),
  [projRef]);

  const handleSelect = useCallback((star: Star) => {
    if (mode === 'measure') setMeasureTarget(star); else setSelected(star);
    setHovered(null);
  }, [mode, setSelected, setMeasureTarget]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hits = nearby(mx, my);
    setHovered(hits.length > 0 ? { x: mx, y: my, stars: hits.slice(0, 20) } : null);
  }, [nearby]);

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  // Click: single star → select immediately; multiple → show tooltip
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const hits = nearby(e.clientX - rect.left, e.clientY - rect.top);
    if (hits.length === 1) handleSelect(hits[0]);
    // If multiple, the hover tooltip is already showing — user picks from list
  }, [nearby, handleSelect]);

  const dark = theme === 'dark';
  const panelBg  = dark ? 'rgba(10,8,5,0.97)'    : 'rgba(240,236,224,0.97)';
  const border   = dark ? 'rgba(200,180,140,0.3)' : 'rgba(26,18,8,0.2)';
  const hdrColor = dark ? '#9a8e7e'               : '#7a6e5e';
  const namColor = dark ? '#e8e0d0'               : '#1a1208';
  const metColor = dark ? '#9a8e7e'               : '#7a6e5e';
  const rowBdr   = dark ? 'rgba(200,180,140,0.08)': 'rgba(26,18,8,0.07)';
  const rowHov   = dark ? 'rgba(200,180,140,0.08)': 'rgba(26,18,8,0.06)';

  return (
    <div ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', zIndex: 8, cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {hovered && hovered.stars.length > 0 && (
        <div style={{
          position: 'absolute',
          left: Math.min(hovered.x + 14, (containerRef.current?.clientWidth ?? 800) - 300),
          top: Math.max(hovered.y - 8, 4),
          background: panelBg, border: `1px solid ${border}`,
          borderRadius: 3, padding: '0.4rem 0', zIndex: 35,
          minWidth: 180, maxWidth: 280, maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', pointerEvents: 'auto',
        }}>
          {hovered.stars.length > 1 && (
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
              letterSpacing: '0.1em', textTransform: 'uppercase', color: hdrColor,
              padding: '0 0.7rem 0.3rem',
              borderBottom: `1px solid ${rowBdr}`, marginBottom: '0.2rem' }}>
              {hovered.stars.length} objects at this location
            </div>
          )}
          {hovered.stars.map(s => (
            <button key={s.id} onClick={ev => { ev.stopPropagation(); handleSelect(s); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none',
                border: 'none', padding: '0.4rem 0.7rem', cursor: 'pointer',
                borderBottom: `1px solid ${rowBdr}` }}
              onMouseEnter={e => (e.currentTarget.style.background = rowHov)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: namColor }}>{s.name}</div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                color: metColor, marginTop: '0.1rem' }}>
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
  const { theme, mapMode } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';

  // Shared ref: TwoDDotsCanvas writes projected positions, TwoDHoverOverlay reads them.
  // This gives the DOM overlay pixel-accurate hit detection that tracks pan and zoom.
  const projRef = useRef<ProjEntry[]>([]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <DataLoader />
      <ExoplanetLoader onLoad={setExoHosts} />
      <Canvas
        camera={{ fov: 60, near: 0.001, far: 200000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
        dpr={[1, 2]} style={{ background: bg }}
      >
        <Suspense fallback={null}>
          {mapMode === '3d'
            ? <Scene exoHosts={exoHosts} />
            : <Scene2D exoHosts={exoHosts} projRef={projRef} />
          }
        </Suspense>
      </Canvas>
      {mapMode === '2d' && <TwoDHoverOverlay projRef={projRef} />}
    </div>
  );
}
