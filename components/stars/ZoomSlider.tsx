'use client';
import { useStore } from '@/lib/useStore';

// Log scale: slider 0→100 maps to distance 0.05→5000 pc
const MIN_D = 0.2;
const MAX_D = 5000;
const LOG_MIN = Math.log10(MIN_D);
const LOG_MAX = Math.log10(MAX_D);

function distToSlider(dist: number): number {
  const clamped = Math.max(MIN_D, Math.min(MAX_D, dist));
  return ((Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
}

function sliderToDist(val: number): number {
  return Math.pow(10, LOG_MIN + (val / 100) * (LOG_MAX - LOG_MIN));
}

export function ZoomSlider() {
  const { zoomTarget, setZoomTarget, triggerCameraReset } = useStore();

  return (
    <div className="zoom-slider-wrap">
      <span className="zoom-label">Zoom</span>
      <input
        className="zoom-slider"
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={distToSlider(zoomTarget)}
        onChange={e => setZoomTarget(sliderToDist(parseFloat(e.target.value)))}
        title={`Camera distance: ${zoomTarget < 1 ? zoomTarget.toFixed(3) : zoomTarget.toFixed(1)} pc`}
      />
      <button className="zoom-home-btn" onClick={triggerCameraReset} title="Re-center on Sol (⊕)">
        ⊕
      </button>
    </div>
  );
}
