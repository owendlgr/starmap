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
    showStars, showGalaxies, showNebulae, showClusters, toggleLayer,
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
        {([
          ['stars',    showStars,    '★ Stars'],
          ['galaxies', showGalaxies, '⬡ Galaxies'],
          ['nebulae',  showNebulae,  '◎ Nebulae'],
          ['clusters', showClusters, '· Clusters'],
        ] as const).map(([id, active, label]) => (
          <button
            key={id}
            className={`ctrl-layer-btn ${active ? 'on' : 'off'}`}
            onClick={() => toggleLayer(id)}
          >
            {label}
          </button>
        ))}
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
