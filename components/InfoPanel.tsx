'use client';
import { useStore } from '@/lib/useStore';
import { formatDistance, formatRA, formatDec, distanceBetween } from '@/lib/coordinates';

export function InfoPanel() {
  const { selectedStar, measureTarget, scaleUnit, setSelected, mode, setMode, setMeasureTarget, showTravelCalc, setShowTravelCalc } = useStore();

  if (!selectedStar) return null;

  const dist = selectedStar.dist_pc;
  const distStr = formatDistance(dist, scaleUnit);

  return (
    <div className="panel info-panel">
      <button className="panel-close" onClick={() => { setSelected(null); setMeasureTarget(null); }}>
        ✕
      </button>

      <div className="info-name">{selectedStar.name}</div>
      <div className="info-type">{selectedStar.type}</div>

      <div className="info-divider" />

      <div className="info-grid">
        <span className="info-label">Distance</span>
        <span className="info-value">{dist === 0 ? 'Here (Sol)' : distStr}</span>

        <span className="info-label">Magnitude</span>
        <span className="info-value">{selectedStar.mag.toFixed(2)}</span>

        <span className="info-label">Spectral</span>
        <span className="info-value mono">{selectedStar.spectral}</span>

        <span className="info-label">RA</span>
        <span className="info-value mono">{formatRA(selectedStar.ra)}</span>

        <span className="info-label">Dec</span>
        <span className="info-value mono">{formatDec(selectedStar.dec)}</span>

        <span className="info-label">Catalog</span>
        <span className="info-value">{selectedStar.catalog}</span>
      </div>

      {measureTarget && (
        <>
          <div className="info-divider" />
          <div className="info-label" style={{ marginBottom: 4 }}>Distance to {measureTarget.name}</div>
          <div className="info-value mono">
            {formatDistance(distanceBetween(selectedStar, measureTarget), scaleUnit)}
          </div>
        </>
      )}

      <div className="info-divider" />
      <div className="info-actions">
        <button
          className={`info-btn ${mode === 'measure' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}
        >
          {mode === 'measure' ? '↩ Cancel measure' : '⟷ Measure to…'}
        </button>
        {dist > 0 && (
          <button className="info-btn" onClick={() => setShowTravelCalc(!showTravelCalc)}>
            ⏱ Travel time
          </button>
        )}
      </div>
    </div>
  );
}
