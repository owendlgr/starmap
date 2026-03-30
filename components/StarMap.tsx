'use client';
import { useEffect, Suspense, useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { StarField } from './StarField';
import { GaiaField } from './GaiaField';
import { ConstellationLines } from './ConstellationLines';
import { CONSTELLATION_PAIRS } from '@/lib/constellations';
import { SelectionMarker, MeasureLine } from './SelectionMarker';
import { SceneGrid } from './SceneGrid';
import { FlatMap } from './FlatMap';
import { useStore } from '@/lib/useStore';
import { formatDistance } from '@/lib/coordinates';
import type { Star, StarChunk } from '@/lib/types';

const isNamed = (s: Star) => s.name && !s.name.startsWith('HIP ');

// Projected position entry shared between TwoDDotsCanvas (writer) and TwoDHoverOverlay (reader)
type ProjEntry = { sx: number; sy: number; star: Star };

// ── Data loaders ──────────────────────────────────────────
// Priority 1: Load main stars immediately (tiny ~18KB)
// Priority 2: Defer exoplanet hosts until after main stars render
function DataLoader({ onLoaded }: { onLoaded: () => void }) {
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
        onLoaded();
      })
      .catch(err => console.error('[StarMap] Failed to load star data:', err));
  }, [addStars, onLoaded]);
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

  // Mode-transition animation state
  const modeTransitionActive = useRef(false);
  const modeTransitionTarget = useRef<'2d' | '3d'>('3d');
  const flyGoalPos      = useRef(new THREE.Vector3());
  const flyGoalTarget   = useRef(new THREE.Vector3());
  const flyStartUp      = useRef(new THREE.Vector3(0, 1, 0));
  const flyGoalUp       = useRef(new THREE.Vector3(0, 1, 0));

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

  // Animated 2D/3D mode transition using the fly-to system
  const prevMapMode = useRef(mapMode);
  useEffect(() => {
    if (mapMode === prevMapMode.current) return;
    prevMapMode.current = mapMode;

    const controls = controlsRef.current;
    const target = controls?.target?.clone() ?? new THREE.Vector3();
    const dist = camera.position.distanceTo(target);

    // Capture current state as fly start
    flyStartPos.current.copy(camera.position);
    flyStartTarget.current.copy(target);
    flyStartUp.current.copy(camera.up);

    if (mapMode === '2d') {
      // Instant snap to top-down view — animation looks bad for this
      camera.position.set(target.x, Math.max(dist, 10), target.z);
      camera.up.set(0, 0, -1);
      camera.lookAt(target.x, 0, target.z);
      if (controls) {
        controls.target.set(target.x, 0, target.z);
        controls.update();
      }
      flyActive.current = false;
      modeTransitionActive.current = false;
      return; // skip the fly-to for 2D
    } else {
      // Target: 45-degree elevation from the orbit target
      const flatTarget = new THREE.Vector3(target.x, 0, target.z);
      // Compute a horizontal offset direction from target toward camera, projected on XZ
      const horiz = new THREE.Vector3(
        camera.position.x - target.x,
        0,
        camera.position.z - target.z,
      );
      if (horiz.lengthSq() < 0.001) horiz.set(0, 0, 1);
      horiz.normalize();
      // 45 degrees: equal horizontal and vertical offset
      const offsetDist = Math.max(dist, 10);
      const elevComponent = Math.sin(Math.PI / 4) * offsetDist; // vertical
      const horizComponent = Math.cos(Math.PI / 4) * offsetDist; // horizontal
      flyGoalPos.current.set(
        flatTarget.x + horiz.x * horizComponent,
        elevComponent,
        flatTarget.z + horiz.z * horizComponent,
      );
      flyGoalTarget.current.copy(flatTarget);
      flyGoalUp.current.set(0, 1, 0);
    }

    modeTransitionTarget.current = mapMode as '2d' | '3d';
    modeTransitionActive.current = true;
    flyProgress.current = 0;
    flyActive.current = true;
    zoomLerpActive.current = false;
  }, [mapMode, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    // --- 2D mode: enforce camera locked straight down above target ---
    // Only enforce AFTER any mode-transition animation has completed
    if (mapMode === '2d' && controls && !flyActive.current) {
      const target = controls.target;
      target.y = 0;
      // Force camera directly above target on the Y axis
      camera.position.set(target.x, Math.max(camera.position.y, 1), target.z);
      camera.up.set(0, 0, -1);
      camera.lookAt(target.x, 0, target.z);
      controls.update();
    }

    // --- Mode-transition fly animation (2D <-> 3D) ---
    if (flyActive.current && modeTransitionActive.current && controls) {
      // ~600ms transition: delta * 1.67 reaches 1.0 in ~0.6s
      flyProgress.current = Math.min(1, flyProgress.current + delta * 1.67);
      // Ease-in-out cubic for a smooth transition
      const p = flyProgress.current;
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      // Lerp camera position, orbit target, and up vector
      camera.position.lerpVectors(flyStartPos.current, flyGoalPos.current, t);
      controls.target.lerpVectors(flyStartTarget.current, flyGoalTarget.current, t);
      camera.up.copy(flyStartUp.current).lerp(flyGoalUp.current, t).normalize();
      controls.update();

      if (flyProgress.current >= 1) {
        flyActive.current = false;
        modeTransitionActive.current = false;
        // Snap final state precisely
        camera.position.copy(flyGoalPos.current);
        controls.target.copy(flyGoalTarget.current);
        camera.up.copy(flyGoalUp.current);
        controls.update();
        // Sync the zoom slider to the new distance
        const newDist = camera.position.distanceTo(controls.target);
        syncCameraZoom(newDist);
      }
      return; // skip other lerps while transitioning
    }

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
      rotateSpeed={mapMode === '2d' ? 0 : 1.2}
      enableRotate={mapMode !== '2d'}
      zoomSpeed={2.5} panSpeed={1.5}
      minDistance={0.2} maxDistance={60000}
      // In 2D: lock polar angle to 0 (straight down); in 3D: allow near-full rotation
      maxPolarAngle={mapMode === '2d' ? 0 : Math.PI * 0.95}
      minPolarAngle={mapMode === '2d' ? 0 : Math.PI * 0.05}
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

// Sol is in the star catalog (id 0) and rendered by StarField like all other stars.
// No special marker needed.

// ── Star labels ───────────────────────────────────────────
// Distance-based culling: only render labels for stars near the camera.
// Named stars always shown if within 500 pc of camera; HIP-only stars within 30 pc.
// Max 200 labels at a time to keep DOM light.
function StarLabels({ stars }: { stars: Star[] }) {
  const { showLabels, scaleUnit, theme, zoomTarget, flattenAmount } = useStore();
  const dark = theme === 'dark';
  const txt  = dark ? '#e8e0d0' : '#1a1208';
  const sub  = dark ? '#9a8e7e' : '#5a4e3e';
  const shad = dark ? '#0a0806' : '#f0ece0';

  // Show labels based on zoom level — named stars always, HIP stars when zoomed in
  const visible = useMemo(() => {
    const result: Star[] = [];
    // Always show named stars (non-HIP-prefix names)
    for (const s of stars) {
      if (s.name && !s.name.startsWith('HIP ')) {
        result.push(s);
      }
    }
    // When zoomed in close (< 30 pc), also show nearby HIP stars up to a limit
    if (zoomTarget < 30) {
      const hipStars = stars
        .filter(s => s.name?.startsWith('HIP ') && s.dist_pc < zoomTarget * 2)
        .slice(0, 100);
      result.push(...hipStars);
    }
    return result.slice(0, 300);
  }, [stars, zoomTarget]);

  if (!showLabels || visible.length === 0) return null;
  return (
    <>
      {visible.map(s => (
        <Html key={s.id} distanceFactor={10} position={[s.x+0.15, s.y * (1 - flattenAmount)+0.15, s.z]}
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

    // ── Draw 10 ly grid ──
    const CELL_PC = 10 * 0.30660; // 10 ly in parsecs (~3.066 pc)
    // Determine visible extent by un-projecting screen corners
    const topLeft = new THREE.Vector3(-1, 1, 0).unproject(camera);
    const botRight = new THREE.Vector3(1, -1, 0).unproject(camera);
    const minX = Math.floor(topLeft.x / CELL_PC) - 1;
    const maxX = Math.ceil(botRight.x / CELL_PC) + 1;
    const minZ = Math.floor(Math.min(topLeft.z, botRight.z) / CELL_PC) - 1;
    const maxZ = Math.ceil(Math.max(topLeft.z, botRight.z) / CELL_PC) + 1;

    // Clamp to a reasonable range to avoid drawing thousands of lines
    const lo = -200, hi = 200;
    const gMinX = Math.max(minX, lo), gMaxX = Math.min(maxX, hi);
    const gMinZ = Math.max(minZ, lo), gMaxZ = Math.min(maxZ, hi);

    ctx.strokeStyle = dark ? 'rgba(80, 70, 56, 0.35)' : 'rgba(160, 152, 136, 0.35)';
    ctx.lineWidth = 0.5;
    // Lines parallel to Z axis (varying X)
    for (let i = gMinX; i <= gMaxX; i++) {
      const wx = i * CELL_PC;
      const [sx1, sy1] = project2D(wx, gMinZ * CELL_PC);
      const [sx2, sy2] = project2D(wx, gMaxZ * CELL_PC);
      ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
    }
    // Lines parallel to X axis (varying Z)
    for (let i = gMinZ; i <= gMaxZ; i++) {
      const wz = i * CELL_PC;
      const [sx1, sy1] = project2D(gMinX * CELL_PC, wz);
      const [sx2, sy2] = project2D(gMaxX * CELL_PC, wz);
      ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
    }

    // ── Distance ring labels (circles at 10, 50, 100 ly from Sol) ──
    const ringDistances = [
      { ly: 10, label: '10 ly' },
      { ly: 50, label: '50 ly' },
      { ly: 100, label: '100 ly' },
    ];
    ctx.strokeStyle = dark ? 'rgba(160, 140, 100, 0.45)' : 'rgba(100, 88, 60, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    for (const ring of ringDistances) {
      const rPc = ring.ly * 0.30660;
      // Draw circle by projecting points around the ring
      const segments = 64;
      ctx.beginPath();
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const rx = Math.cos(angle) * rPc;
        const rz = Math.sin(angle) * rPc;
        const [sx, sy] = project2D(rx, rz);
        if (j === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      // Label at the right side of the ring
      const [lx, ly2] = project2D(rPc, 0);
      ctx.font = 'bold 10px Georgia, serif';
      ctx.fillStyle = dark ? 'rgba(180, 160, 120, 0.8)' : 'rgba(80, 68, 40, 0.8)';
      ctx.fillText(ring.label, lx + 4, ly2 - 4);
    }
    ctx.setLineDash([]);

    // Draw constellation lines first (behind stars)
    if (showConstellations) {
      ctx.strokeStyle = dark ? 'rgba(212, 188, 122, 0.6)' : 'rgba(74, 62, 46, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const [h1, h2] of CONSTELLATION_PAIRS) {
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

// ── 3D hover tooltip ─────────────────────────────────────
function HoverTooltip() {
  const { hoveredStar, selectedStar, flattenAmount } = useStore();
  if (!hoveredStar || selectedStar) return null;
  return (
    <Html position={[hoveredStar.x, hoveredStar.y * (1 - flattenAmount) + 0.3, hoveredStar.z]}
      distanceFactor={8} style={{ pointerEvents: 'none', zIndex: 20 }} zIndexRange={[20, 0]}>
      <div style={{ background: 'var(--chrome-bg)', border: '1px solid var(--chrome-border)',
        padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--chrome-text)',
        fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
        {hoveredStar.name}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--chrome-muted)', marginLeft: '0.4rem' }}>
          mag {hoveredStar.mag.toFixed(1)}
        </span>
      </div>
    </Html>
  );
}

// ── 3D scene ──────────────────────────────────────────────
function Scene() {
  const { stars, selectedStar, measureTarget, setSelected, theme, flattenAmount } = useStore();
  const dark = theme === 'dark';
  const bg = dark ? '#0a0806' : '#f0ece0';
  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 80000, 200000]} />
      <CameraManager />
      <RaycasterScaler />
      <SceneGrid />
      <StarField stars={stars} onSelect={setSelected} />
      <GaiaField />
      <ConstellationLines stars={stars} />
      <StarLabels stars={stars} />
      <HoverTooltip />
      {selectedStar && <SelectionMarker star={selectedStar} color="#c8a96a" flattenAmount={flattenAmount} />}
      {measureTarget && <SelectionMarker star={measureTarget} color="#6ab4c8" flattenAmount={flattenAmount} />}
      {selectedStar && measureTarget && <MeasureLine from={selectedStar} to={measureTarget} flattenAmount={flattenAmount} />}
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
  const { theme, mapMode, setSelected, mode, setMeasureTarget, setZoomTarget, triggerCameraReset, hoveredStar } = useStore();
  const bg = theme === 'dark' ? '#0a0806' : '#f0ece0';

  // Loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingFading, setLoadingFading] = useState(false);
  const handleDataLoaded = useCallback(() => {
    setDataLoaded(true);
    // Start fade-out after a brief delay so the transition is visible
    setTimeout(() => setLoadingFading(true), 200);
  }, []);

  // Keyboard navigation: +/- zoom, Escape deselect, Home reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          setZoomTarget(useStore.getState().zoomTarget * 0.8);
          break;
        case '-':
          e.preventDefault();
          setZoomTarget(useStore.getState().zoomTarget * 1.2);
          break;
        case 'Escape':
          setSelected(null);
          break;
        case 'Home':
          e.preventDefault();
          triggerCameraReset();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setZoomTarget, setSelected, triggerCameraReset]);

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
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, cursor: hoveredStar ? 'pointer' : 'default' }}
      onMouseMove={handleMouseMove2D}
      onClick={handleClick2D}
      onMouseLeave={() => { if (mapMode === '2d') setHovered2D(null); }}
    >
      <DataLoader onLoaded={handleDataLoaded} />

      {/* Loading overlay */}
      {!loadingFading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: theme === 'dark' ? '#0a0806' : '#f0ece0',
          opacity: dataLoaded ? 0 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: dataLoaded ? 'none' : 'auto',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: theme === 'dark' ? '#9a8e7e' : '#7a6e5e',
          }}>
            Loading stellar catalog...
          </div>
        </div>
      )}
      {mapMode === '2d' ? (
        <FlatMap />
      ) : (
        <Canvas
          camera={{ fov: 60, near: 0.001, far: 200000 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
          dpr={[1, 2]} style={{ background: bg }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      )}

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
