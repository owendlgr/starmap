'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/useStore';
import { buildConstellationPairs } from '@/lib/constellations';
import { formatDistance } from '@/lib/coordinates';
import type { Star } from '@/lib/types';

/**
 * Pure 2D star map — no Three.js.
 * Plots star X,Z coordinates on a flat canvas with pan/zoom.
 * Y coordinate (height above galactic plane) is ignored.
 */
export function FlatMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { stars, theme, scaleUnit, showConstellations, showLabels, magLimit,
    selectedStar, setSelected, mode, setMeasureTarget, measureTarget,
    showHipparcos, cameraResetTick } = useStore();

  // Pan/zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(80); // start zoomed in (80 px/pc ≈ nearby stars visible)
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffsetStart = useRef({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const dark = theme === 'dark';

  // Build ID lookup for constellations
  const starIdMap = useRef(new Map<number, Star>());
  useEffect(() => {
    const m = new Map<number, Star>();
    for (const s of stars) m.set(s.id, s);
    starIdMap.current = m;
  }, [stars]);

  // World coords (parsecs) → screen coords
  const toScreen = useCallback((wx: number, wz: number, canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      sx: cx + wx * scale + offset.x,
      sy: cy + wz * scale + offset.y,
    };
  }, [scale, offset]);

  // Screen coords → world coords
  const toWorld = useCallback((sx: number, sy: number, canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      wx: (sx - cx - offset.x) / scale,
      wz: (sy - cy - offset.y) / scale,
    };
  }, [scale, offset]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill container
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    const w = rect?.width || canvas.width;
    const h = rect?.height || canvas.height;

    // Clear
    ctx.fillStyle = dark ? '#0a0806' : '#f0ece0';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // ── Grid ──
    const gridColor = dark ? 'rgba(80, 70, 56, 0.3)' : 'rgba(160, 148, 130, 0.3)';
    const CELL_PC = 10 * 0.30660; // 10 ly
    const cellPx = CELL_PC * scale;

    if (cellPx > 3) { // only draw grid when cells are visible
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;

      // Sol is at screen position (cx + offset.x, cy + offset.y)
      // Grid lines pass through Sol and repeat every cellPx
      const solSx = cx + offset.x;
      const solSy = cy + offset.y;

      // Vertical lines anchored to Sol
      const firstVx = ((solSx % cellPx) + cellPx) % cellPx; // always positive
      for (let x = firstVx; x < w; x += cellPx) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      // Horizontal lines anchored to Sol
      const firstHy = ((solSy % cellPx) + cellPx) % cellPx;
      for (let y = firstHy; y < h; y += cellPx) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }

    // ── Distance rings from Sol ──
    const rings = [
      { ly: 10, label: '10 ly' },
      { ly: 50, label: '50 ly' },
      { ly: 100, label: '100 ly' },
      { ly: 500, label: '500 ly' },
    ];
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = dark ? 'rgba(160, 140, 100, 0.4)' : 'rgba(100, 88, 60, 0.35)';
    ctx.lineWidth = 1;
    for (const ring of rings) {
      const rPx = ring.ly * 0.30660 * scale;
      if (rPx < 20 || rPx > w * 3) continue; // skip if too small or too large
      ctx.beginPath();
      ctx.arc(cx + offset.x, cy + offset.y, rPx, 0, Math.PI * 2);
      ctx.stroke();
      // Label
      ctx.font = `bold 9px 'Courier New', monospace`;
      ctx.fillStyle = dark ? 'rgba(160, 140, 100, 0.7)' : 'rgba(80, 68, 40, 0.7)';
      ctx.fillText(ring.label, cx + offset.x + rPx + 4, cy + offset.y - 3);
    }
    ctx.setLineDash([]);

    // ── Constellation lines ──
    if (showConstellations) {
      ctx.strokeStyle = dark ? 'rgba(212, 188, 122, 0.5)' : 'rgba(74, 62, 46, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const allPairs = buildConstellationPairs(stars);
      for (const [id1, id2] of allPairs) {
        const a = starIdMap.current.get(id1);
        const b = starIdMap.current.get(id2);
        if (!a || !b) continue;
        const { sx: ax, sy: ay } = toScreen(a.x, a.z, canvas);
        const { sx: bx, sy: by } = toScreen(b.x, b.z, canvas);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }

    // ── Stars ──
    const starColor = dark ? 'rgba(220, 210, 185, 0.9)' : 'rgba(26, 18, 8, 0.85)';
    const selectedColor = '#c8a96a';
    const visibleStars: { sx: number; sy: number; star: Star }[] = [];

    // Filter stars by layers and magnitude
    const filteredStars = showHipparcos ? stars : [];
    for (const s of filteredStars) {
      if (s.mag > magLimit) continue;
      const { sx, sy } = toScreen(s.x, s.z, canvas);
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

      const r = Math.max(1.5, Math.min(6, 5.0 - s.mag * 0.3));
      visibleStars.push({ sx, sy, star: s });

      const isSelected = selectedStar?.id === s.id;
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? r + 2 : r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? selectedColor : starColor;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // ── Measure line ──
    if (selectedStar && measureTarget) {
      const { sx: sx1, sy: sy1 } = toScreen(selectedStar.x, selectedStar.z, canvas);
      const { sx: sx2, sy: sy2 } = toScreen(measureTarget.x, measureTarget.z, canvas);
      ctx.strokeStyle = '#c8a96a';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Measure target ring
      ctx.strokeStyle = '#6ab4c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx2, sy2, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── Sol marker ──
    const { sx: solX, sy: solY } = toScreen(0, 0, canvas);
    ctx.beginPath();
    ctx.arc(solX, solY, 5, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#e8d8a8' : '#2a1e0e';
    ctx.fill();
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillStyle = dark ? '#e8e0d0' : '#1a1208';
    ctx.fillText('Sol', solX + 8, solY + 4);

    // ── Labels ──
    if (showLabels) {
      ctx.font = 'bold 11px Georgia, serif';
      ctx.fillStyle = dark ? 'rgba(232, 224, 208, 0.85)' : 'rgba(26, 18, 8, 0.8)';
      for (const { sx, sy, star } of visibleStars) {
        if (!star.name) continue;
        ctx.fillText(star.name, sx + 7, sy - 5);
      }
    }

    // ── Store visible stars for click detection ──
    (canvasRef as unknown as { _visibleStars: typeof visibleStars })._visibleStars = visibleStars;

  }, [stars, dark, scale, offset, showConstellations, showLabels, magLimit, selectedStar, measureTarget, showHipparcos, toScreen]);

  // ── Mouse handlers ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.85 : 1.18; // slightly more aggressive zoom
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const curOffset = offsetRef.current;
    const curScale = scaleRef.current;
    const newScale = Math.max(0.5, Math.min(1000, curScale * factor));
    const ratio = newScale / curScale;

    // Point under cursor in world coords stays fixed
    const newOffset = {
      x: mx - cx - (mx - cx - curOffset.x) * ratio,
      y: my - cy - (my - cy - curOffset.y) * ratio,
    };

    setScale(newScale);
    setOffset(newOffset);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffsetStart.current = { ...offsetRef.current };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Hover detection
    if (!dragging.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const visible = (canvasRef as unknown as { _visibleStars: { sx: number; sy: number; star: Star }[] })._visibleStars || [];
      let found: Star | null = null;
      for (const { sx, sy, star } of visible) {
        if (Math.hypot(sx - mx, sy - my) < 12) { found = star; break; }
      }
      setHoveredStar(found);
      setHoverPos({ x: e.clientX, y: e.clientY });
    }

    if (!dragging.current) return;
    setOffset({
      x: dragOffsetStart.current.x + (e.clientX - dragStart.current.x),
      y: dragOffsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const visible = (canvasRef as unknown as { _visibleStars: { sx: number; sy: number; star: Star }[] })._visibleStars || [];
    // Find nearest star within 15px
    let nearest: Star | null = null;
    let minDist = 15;
    for (const { sx, sy, star } of visible) {
      const d = Math.hypot(sx - mx, sy - my);
      if (d < minDist) { minDist = d; nearest = star; }
    }
    if (nearest) {
      if (mode === 'measure') setMeasureTarget(nearest);
      else setSelected(nearest);
    }
  }, [mode, setSelected, setMeasureTarget]);

  // Reset view when center button is pressed
  const prevResetTick = useRef(cameraResetTick);
  useEffect(() => {
    if (cameraResetTick === prevResetTick.current) return;
    prevResetTick.current = cameraResetTick;
    setOffset({ x: 0, y: 0 });
    setScale(80);
  }, [cameraResetTick]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: hoveredStar ? 'pointer' : dragging.current ? 'grabbing' : 'grab' }}>
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* Hover tooltip */}
      {hoveredStar && !selectedStar && (
        <div style={{
          position: 'fixed', left: hoverPos.x + 16, top: hoverPos.y - 10, zIndex: 30,
          background: dark ? 'rgba(240,236,224,0.95)' : 'rgba(20,16,10,0.95)',
          color: dark ? '#1a1208' : '#f0e8d8',
          padding: '0.4rem 0.7rem',
          border: `1px solid ${dark ? 'rgba(26,18,8,0.15)' : 'rgba(200,180,140,0.25)'}`,
          pointerEvents: 'none',
          fontFamily: 'Georgia, serif',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{hoveredStar.name}</div>
          <div style={{ fontSize: '0.65rem', fontFamily: "'Courier New', monospace", color: dark ? '#6a5e4e' : '#b0a48e', marginTop: '0.15rem' }}>
            {hoveredStar.spectral} · mag {hoveredStar.mag.toFixed(1)} · {formatDistance(hoveredStar.dist_pc, scaleUnit)}
          </div>
        </div>
      )}

      {/* Scale indicator */}
      <div style={{
        position: 'absolute', bottom: '1rem', left: '1rem',
        fontFamily: "'Courier New', monospace", fontSize: '0.6rem',
        letterSpacing: '0.08em', color: dark ? '#9a8e7e' : '#6a5e4e',
      }}>
        {(1 / scale).toFixed(2)} pc/px · {(10 * 0.30660 * scale).toFixed(0)}px per 10 ly
      </div>
    </div>
  );
}
