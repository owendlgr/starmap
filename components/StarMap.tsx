'use client';
import { useEffect, Suspense, useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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
// Priority 1: Load main stars immediately (tiny ~18KB)
// Priority 2: Defer exoplanet hosts until after main stars render
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
  const { setExoHostCount, stars } = useStore();
  const loadedRef = useRef(false);
  // Defer exoplanet loading until main stars have loaded to avoid bandwidth contention
  useEffect(() => {
    if (loadedRef.current || stars.length === 0) return;
    loadedRef.current = true;
    const load = () => {
      fetch('/api/exoplanet-stars')
        .then(r => r.json())
        .then((d: { stars: Star[] }) => {
          if (d.stars?.length) { onLoad(d.stars); setExoHostCount(d.stars.length); }
        })
        .catch(() => {});
    };
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(load, { timeout: 2000 });
    } else {
      setTimeout(load, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars.length]);
  return null;
}

// ── Camera ────────────────────────────────────────────────
function CameraManager() {
  const { camera } = useThree();
  const controlsRef = useRef<{
    target: THREE.Vector3;
    object: THREE.Camera;
    update: () => void;
  } | null>(null);
  const {
    cameraResetTick, zoomTarget, _zoomLerpTick, setZoomTarget, syncCameraZoom, mapMode,
    cameraFlyTarget, _cameraFlyTick,
  } = useStore();
  const lastResetTick  = useRef(0);
  const zoomLerpActive = useRef(false);
  const prevLerpTick   = useRef(0);
  const lastSyncMs     = useRef(0);

  // Fly-to animation state
  const flyActive       = useRef(false);
  const prevFlyTick     = useRef(0);
  const flyTargetVec    = useRef(new THREE.Vector3());
  const flyStartPos     = useRef(new THREE.Vector3());
  const flyStartTarget  = useRef(new THREE.Vector3());
  const flyProgress     = useRef(0);

  useEffect(() => { camera.position.set(0, 8, 28); camera.lookAt(0, 0, 0); }, [camera]);

  // Reset camera
  useEffect(() => {
    if (cameraResetTick === lastResetTick.current) return;
    lastResetTick.current = cameraResetTick;
    camera.position.set(0, 8, 28);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    setZoomTarget(28);
    flyActive.current = false;
  }, [cameraResetTick, camera, setZoomTarget]);

  // Zoom-slider lerp trigger
  useEffect(() => {
    if (_zoomLerpTick === prevLerpTick.current) return;
    prevLerpTick.current = _zoomLerpTick;
    zoomLerpActive.current = true;
  }, [_zoomLerpTick]);

  // Fly-to trigger: when a star is selected, start smooth transition
  useEffect(() => {
    if (_cameraFlyTick === prevFlyTick.current) return;
    prevFlyTick.current = _cameraFlyTick;
    if (!cameraFlyTarget) return;
    flyTargetVec.current.set(cameraFlyTarget.x, cameraFlyTarget.y, cameraFlyTarget.z);
    flyStartPos.current.copy(camera.position);
    flyStartTarget.current.copy(controlsRef.current?.target ?? new THREE.Vector3());
    flyProgress.current = 0;
    flyActive.current = true;
    // Pause zoom lerp while flying
    zoomLerpActive.current = false;
  }, [_cameraFlyTick, cameraFlyTarget, camera]);

  // 2D: snap to bird's-eye
  useEffect(() => {
    if (mapMode === '2d') {
      const dist = camera.position.length();
      camera.position.set(0.001, dist, 0.001);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [mapMode, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    // --- Fly-to animation (smooth camera transition to selected star) ---
    if (flyActive.current && controls) {
      flyProgress.current = Math.min(1, flyProgress.current + delta * 1.8);
      // Ease-out cubic: fast start, gentle arrival
      const t = 1 - Math.pow(1 - flyProgress.current, 3);

      // Lerp orbit target toward the star
      controls.target.lerpVectors(flyStartTarget.current, flyTargetVec.current, t);

      // Compute desired camera offset: maintain a viewing distance relative to
      // how far the star is from origin, with a minimum orbit radius.
      const starDist = flyTargetVec.current.length();
      const viewDist = Math.max(2, Math.min(starDist * 0.5, 20));
      // Goal position: offset from star along the original camera direction
      const dir = new THREE.Vector3().subVectors(flyStartPos.current, flyStartTarget.current);
      if (dir.lengthSq() < 0.001) dir.set(0, 1, 1);
      dir.normalize().multiplyScalar(viewDist);
      const goalPos = new THREE.Vector3().copy(flyTargetVec.current).add(dir);

      camera.position.lerpVectors(flyStartPos.current, goalPos, t);
      controls.update();

      if (flyProgress.current >= 1) {
        flyActive.current = false;
        // Sync the zoom slider to the new distance
        const newDist = camera.position.distanceTo(controls.target);
        syncCameraZoom(newDist);
      }
      return; // skip other lerps while flying
    }

    // --- Zoom slider lerp ---
    if (zoomLerpActive.current) {
      const pos = camera.position;
      const target = controls?.target ?? new THREE.Vector3();
      const currentDist = pos.distanceTo(target);
      if (Math.abs(currentDist - zoomTarget) < 0.01) {
        zoomLerpActive.current = false;
      } else {
        const dir = new THREE.Vector3().subVectors(pos, target).normalize();
        const newDist = currentDist + (zoomTarget - currentDist) * 0.08;
        pos.copy(target).addScaledVector(dir, newDist);
        controls?.update();
      }
    }
  });

  // In 2D mode: remap left-click from rotate to pan so the user can drag around
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
      enableDamping dampingFactor={0.12}
      rotateSpeed={0.45}
      zoomSpeed={0.8} panSpeed={0.6}
      minDistance={0.2} maxDistance={60000}
      // Prevent camera from flipping upside down
      maxPolarAngle={Math.PI * 0.95}
      minPolarAngle={Math.PI * 0.05}
      makeDefault
      mouseButtons={mapMode === '2d' ? mouseButtons2d : mouseButtons3d}
      touches={mapMode === '2d' ? touches2d : touches3d}
      onChange={() => {
        if (flyActive.current || zoomLerpActive.current) return;
        const now = Date.now();
        if (now - lastSyncMs.current < 50) return;
        lastSyncMs.current = now;
        const target = controlsRef.current?.target ?? new THREE.Vector3();
        syncCameraZoom(camera.position.distanceTo(target));
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
  const col = theme === 'dark' ? '#8a7e6e' : '#b0a898';
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
      threshold: Math.max(0.3, dist * 0.012),
    };
  });
  return null;
}

// ── Deferred bloom — waits for scene to settle before enabling post-processing ──
function DeferredBloom() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Delay bloom activation so initial render + data loading is not impacted
    const id = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(id);
  }, []);
  if (!ready) return null;
  return (
    <EffectComposer>
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}

// ── 3D scene ──────────────────────────────────────────────
function Scene({ exoHosts }: { exoHosts: Star[] }) {
  const { stars, selectedStar, measureTarget, setSelected, theme } = useStore();
  const dark = theme === 'dark';
  const bg = dark ? '#0a0806' : '#f0ece0';
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
      {selectedStar && <SelectionMarker star={selectedStar} color="#c8a96a" />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#6ab4c8" />}
      {selectedStar && measureTarget && <MeasureLine from={selectedStar} to={measureTarget} />}
      {/* Subtle bloom for bright star glow — deferred to avoid blocking initial render */}
      {dark && <DeferredBloom />}
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

// ── Root export ───────────────────────────────────────────
export function StarMap() {
  const [exoHosts, setExoHosts] = useState<Star[]>([]);
  const { theme, mapMode, setSelected, mode, setMeasureTarget } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';

  // Shared ref: TwoDDotsCanvas (inside Canvas) writes projected positions each frame.
  const projRef = useRef<ProjEntry[]>([]);

  // 2D hover state — lives here so the tooltip renders outside the blocking overlay.
  type Hovered2D = { x: number; y: number; stars: Star[] };
  const [hovered2D, setHovered2D] = useState<Hovered2D | null>(null);
  // While the cursor is over the tooltip panel we pin it open (don't clear on mousemove).
  const tooltipPinned = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const CLUSTER_PX = 12;

  const nearby2D = useCallback((mx: number, my: number) =>
    projRef.current
      .filter(p => Math.hypot(p.sx - mx, p.sy - my) < CLUSTER_PX)
      .map(p => p.star),
  []);

  const handleSelect2D = useCallback((star: Star) => {
    if (mode === 'measure') setMeasureTarget(star); else setSelected(star);
    setHovered2D(null);
    tooltipPinned.current = false;
  }, [mode, setSelected, setMeasureTarget]);

  // mousemove on the root container — bubbles from the THREE canvas so OrbitControls
  // still receives all pointer events (no blocking overlay).
  const handleMouseMove2D = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mapMode !== '2d' || tooltipPinned.current) return;
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hits = nearby2D(mx, my);
    setHovered2D(hits.length > 0 ? { x: mx, y: my, stars: hits.slice(0, 20) } : null);
  }, [mapMode, nearby2D]);

  const handleClick2D = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mapMode !== '2d' || tooltipPinned.current) return;
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const hits = nearby2D(e.clientX - rect.left, e.clientY - rect.top);
    if (hits.length === 1) handleSelect2D(hits[0]);
    // Multiple → tooltip is showing; user selects from the panel.
  }, [mapMode, nearby2D, handleSelect2D]);

  const dark = theme === 'dark';
  const panelBg  = dark ? 'rgba(10,8,5,0.97)'    : 'rgba(240,236,224,0.97)';
  const border   = dark ? 'rgba(200,180,140,0.3)' : 'rgba(26,18,8,0.2)';
  const hdrColor = dark ? '#9a8e7e'               : '#7a6e5e';
  const namColor = dark ? '#e8e0d0'               : '#1a1208';
  const metColor = dark ? '#9a8e7e'               : '#7a6e5e';
  const rowBdr   = dark ? 'rgba(200,180,140,0.08)': 'rgba(26,18,8,0.07)';
  const rowHov   = dark ? 'rgba(200,180,140,0.08)': 'rgba(26,18,8,0.06)';

  return (
    <div ref={rootRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      onMouseMove={handleMouseMove2D}
      onClick={handleClick2D}
      onMouseLeave={() => { if (mapMode === '2d') setHovered2D(null); }}
    >
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

      {/* 2D tooltip — outer wrapper is pointer-events:none so it never blocks
          OrbitControls or hover detection; only the panel itself is interactive. */}
      {mapMode === '2d' && hovered2D && hovered2D.stars.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
          <div
            style={{
              position: 'absolute',
              left: Math.min(hovered2D.x + 14, (rootRef.current?.clientWidth ?? 800) - 300),
              top: Math.max(hovered2D.y - 8, 4),
              background: panelBg, border: `1px solid ${border}`,
              borderRadius: 3, padding: '0.4rem 0',
              minWidth: 180, maxWidth: 280, maxHeight: 260, overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              pointerEvents: 'auto', // only the panel captures clicks
            }}
            onMouseEnter={() => { tooltipPinned.current = true; }}
            onMouseLeave={() => { tooltipPinned.current = false; setHovered2D(null); }}
          >
            {hovered2D.stars.length > 1 && (
              <div style={{
                fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                letterSpacing: '0.1em', textTransform: 'uppercase', color: hdrColor,
                padding: '0 0.7rem 0.3rem',
                borderBottom: `1px solid ${rowBdr}`, marginBottom: '0.2rem',
              }}>
                {hovered2D.stars.length} objects at this location
              </div>
            )}
            {hovered2D.stars.map(s => (
              <button key={s.id}
                onClick={ev => { ev.stopPropagation(); handleSelect2D(s); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', padding: '0.4rem 0.7rem', cursor: 'pointer',
                  borderBottom: `1px solid ${rowBdr}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = rowHov)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: namColor }}>{s.name}</div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                  color: metColor, marginTop: '0.1rem' }}>
                  {s.type} · {s.dist_pc > 0 ? `${s.dist_pc.toFixed(1)} pc` : 'here'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
