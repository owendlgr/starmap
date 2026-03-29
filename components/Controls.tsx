'use client';
import { useStore } from '@/lib/useStore';
import type { ScaleUnit } from '@/lib/types';

const SCALE_OPTIONS: { value: ScaleUnit; label: string }[] = [
  { value: 'ly',  label: 'Light years' },
  { value: 'pc',  label: 'Parsecs' },
  { value: 'au',  label: 'AU' },
];

export function Controls() {
  const {
    showHipparcos, showExoplanets, showGaia, showConstellations,
    setShowHipparcos, setShowExoplanets, setShowGaia, setShowConstellations,
    scaleUnit, setScaleUnit,
    stars,
  } = useStore();

  return (
    <div className="controls-panel">
      {/* Object count */}
      <div className="ctrl-stat">{stars.length.toLocaleString()} objects</div>

      <div className="ctrl-divider" />

      {/* Layer toggles */}
      <div className="ctrl-section-label">Layers</div>
      <div className="ctrl-layers">
        <button className={`ctrl-layer-btn ${showHipparcos ? 'on' : 'off'}`} onClick={() => setShowHipparcos(!showHipparcos)}>★ Hipparcos</button>
        <button className={`ctrl-layer-btn ${showExoplanets ? 'on' : 'off'}`} onClick={() => setShowExoplanets(!showExoplanets)}>◎ Exo Hosts</button>
        <button className={`ctrl-layer-btn ${showGaia ? 'on' : 'off'}`} onClick={() => setShowGaia(!showGaia)}>· Gaia DR3</button>
        <button className={`ctrl-layer-btn ${showConstellations ? 'on' : 'off'}`} onClick={() => setShowConstellations(!showConstellations)}>⌖ Lines</button>
      </div>

      <div className="ctrl-divider" />

      {/* Scale unit */}
      <div className="ctrl-section-label">Distance unit</div>
      <div className="ctrl-scale">
        {SCALE_OPTIONS.map(o => (
          <button
            key={o.value}
            className={`ctrl-scale-btn ${scaleUnit === o.value ? 'active' : ''}`}
            onClick={() => setScaleUnit(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
