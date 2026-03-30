'use client';
import { useEffect, Suspense, useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { StarField } from './StarField';
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
    fetch('/data/stars_catalog.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: StarChunk) => {
        console.log(`[StarMap] Loaded ${d.stars.length} stars from verified catalog`);
        addStars('verified', d.stars);
      })
      .catch(err => console.error('[StarMap] Failed to load star data:', err));
  }, [addStars]);
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
      enableDamping dampingFactor={0.1}
      rotateSpeed={1.2}
      zoomSpeed={2.5} panSpeed={1.5}
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
  const dark = theme === 'dark';
  const txt  = dark ? '#e8e0d0' : '#1a1208';
  const sub  = dark ? '#9a8e7e' : '#5a4e3e';
  const shad = dark ? '#0a0806' : '#f0ece0';
  if (!showLabels || stars.length === 0) return null;
  return (
    <>
      {stars.map(s => (
        <Html key={s.id} distanceFactor={10} position={[s.x+0.15, s.y+0.15, s.z]}
          style={{ zIndex:5, pointerEvents:'none' }} zIndexRange={[10,0]}>
          <div style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:txt,
            whiteSpace:'nowrap', lineHeight:1.3, pointerEvents:'none',
            textShadow:`0 0 6px ${shad}, 0 0 6px ${shad}, 0 0 8px ${shad}` }}>
            <span style={{ display:'block', fontSize:'9px' }}>{s.name}</span>
            <span style={{ display:'block', fontSize:'8px', color:sub }}>
              {s.dist_pc>0 ? formatDistance(s.dist_pc, scaleUnit) : 'here'}
            </span>
          </div>
        </Html>
      ))}
    </>
  );
}

// ── Depth lines ───────────────────────────────────────────
// Vertical lines from every star down to the Y=0 galactic plane
function DepthLines({ stars }: { stars: Star[] }) {
  const { showDepthLines, theme } = useStore();
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const s of stars) {
      if (Math.abs(s.y) < 0.02) continue; // skip stars already on the plane
      pts.push(s.x, s.y, s.z, s.x, 0, s.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, [stars]);
  if (!showDepthLines) return null;
  const col = theme === 'dark' ? '#b0a48e' : '#5a4e3e';
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={col} transparent opacity={0.7} />
    </lineSegments>
  );
}

// ── 2D canvas dot renderer ────────────────────────────────
// Draws all stars as 2D dots FLATTENED onto the galactic plane (Y→0).
// This creates a true 2D projection rather than a top-down 3D view.
function TwoDDotsCanvas({
  allStars,
  projRef,
}: {
  allStars: Star[];
  projRef: React.MutableRefObject<ProjEntry[]>;
}) {
  const { camera, size } = useThree();
  const { theme, showConstellations } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proj = useMemo(() => new THREE.Vector3(), []);

  // Build constellation lines for 2D rendering
  const hipMap = useMemo(() => {
    const m = new Map<number, Star>();
    for (const s of allStars) if (s.hip) m.set(s.hip, s);
    return m;
  }, [allStars]);

  useFrame(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dark = theme === 'dark';
    ctx.clearRect(0, 0, c.width, c.height);

    const entries: ProjEntry[] = [];

    // Helper: project star position flattened to Y=0 (galactic plane)
    const project2D = (x: number, z: number): [number, number] => {
      proj.set(x, 0, z).project(camera);
      return [
        (proj.x * 0.5 + 0.5) * size.width,
        (1 - (proj.y * 0.5 + 0.5)) * size.height,
      ];
    };

    // Draw constellation lines first (behind stars)
    if (showConstellations) {
      ctx.strokeStyle = dark ? 'rgba(212, 188, 122, 0.6)' : 'rgba(74, 62, 46, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Import constellation pairs inline to avoid circular dependency
      const PAIRS: [number, number][] = [
        [27989,25336],[27989,26311],[25336,26311],[26311,26727],[26727,24436],[25336,24436],[27366,26727],
        [54061,53910],[53910,58001],[58001,59774],[59774,62956],[62956,65378],[65378,67301],
        [746,4427],[4427,6686],[6686,8886],[4427,4436],
        [36850,37826],[36850,31592],[37826,31681],
        [21421,25428],
        [32349,30324],[32349,33579],[33579,34444],
        [80763,85927],[85927,86670],
        [68702,71683],[68702,68933],
        [677,5447],[5447,9640],
        [677,1067],[1067,113963],
        [61941,65474],
        [106278,109074],
        [102098,95947],[95947,102488],
        [97649,97278],
        [15863,14576],
        [90185,89931],[92855,90185],
        [69673,72105],[69673,69974],
        [60718,62434],
      ];
      for (const [h1, h2] of PAIRS) {
        const a = hipMap.get(h1);
        const b = hipMap.get(h2);
        if (!a || !b) continue;
        const [ax, ay] = project2D(a.x, a.z);
        const [bx, by] = project2D(b.x, b.z);
        if (ax < -50 || ax > size.width+50 || ay < -50 || ay > size.height+50) continue;
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }

    // Draw stars — flattened Y to 0
    const draw = (stars: Star[], ring: boolean) => {
      for (const s of stars) {
        const [sx, sy] = project2D(s.x, s.z);
        if (sx < -20 || sx > size.width + 20 || sy < -20 || sy > size.height + 20) continue;
        entries.push({ sx, sy, star: s });
        const r = Math.max(2, Math.min(6, 5.0 - s.mag * 0.3));
        ctx.beginPath();
        ctx.arc(sx, sy, r + (ring ? 2 : 0), 0, Math.PI * 2);
        if (ring) {
          ctx.strokeStyle = dark ? 'rgba(232,220,200,0.85)' : 'rgba(26,18,8,0.75)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = dark ? 'rgba(220,210,185,0.9)' : 'rgba(26,18,8,0.85)';
          ctx.fill();
        }
      }
    };
    draw(allStars, false);

    // Sol marker
    const [solX, solY] = project2D(0, 0);
    ctx.beginPath(); ctx.arc(solX, solY, 6, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#e8d8a8' : '#2a1e0e'; ctx.fill();
    // Sol label
    ctx.font = 'bold 10px Georgia, serif';
    ctx.fillStyle = dark ? '#e8e0d0' : '#1a1208';
    ctx.fillText('Sol', solX + 9, solY + 4);

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
function Scene() {
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
      <GaiaField />
      <ConstellationLines stars={stars} />
      <StarLabels stars={stars} />
      <DepthLines stars={stars} />
      {selectedStar && <SelectionMarker star={selectedStar} color="#c8a96a" />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#6ab4c8" />}
      {selectedStar && measureTarget && <MeasureLine from={selectedStar} to={measureTarget} />}
      {dark && <DeferredBloom />}
    </>
  );
}

// ── 2D scene ──────────────────────────────────────────────
function Scene2D({
  projRef,
}: {
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
      <TwoDDotsCanvas allStars={stars} projRef={projRef} />
    </>
  );
}

// ── Root export ───────────────────────────────────────────
export function StarMap() {
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
  // Inverted: dark tooltip on light bg, light tooltip on dark bg
  const panelBg  = dark ? 'rgba(240,236,224,0.95)' : 'rgba(20,16,10,0.95)';
  const border   = dark ? 'rgba(26,18,8,0.2)'      : 'rgba(200,180,140,0.3)';
  const hdrColor = dark ? '#5a4e3e'                : '#b0a48e';
  const namColor = dark ? '#1a1208'                : '#f0e8d8';
  const metColor = dark ? '#5a4e3e'                : '#b0a48e';
  const rowBdr   = dark ? 'rgba(26,18,8,0.1)'     : 'rgba(200,180,140,0.12)';
  const rowHov   = dark ? 'rgba(26,18,8,0.08)'    : 'rgba(200,180,140,0.1)';

  return (
    <div ref={rootRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      onMouseMove={handleMouseMove2D}
      onClick={handleClick2D}
      onMouseLeave={() => { if (mapMode === '2d') setHovered2D(null); }}
    >
      <DataLoader />
      <Canvas
        camera={{ fov: 60, near: 0.001, far: 200000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
        dpr={[1, 2]} style={{ background: bg }}
      >
        <Suspense fallback={null}>
          {mapMode === '3d'
            ? <Scene />
            : <Scene2D projRef={projRef} />
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
