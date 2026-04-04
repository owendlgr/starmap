'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from '@/components/layout/TopNav';
import { StarSearch } from '@/components/stars/StarSearch';
import { StarSidePanel } from '@/components/stars/StarSidePanel';
// ZoomSlider replaced by inline MapControls
import { useStore } from '@/lib/useStore';
import { useAppStore } from '@/lib/stores/appStore';
import type { ScaleUnit } from '@/lib/types';

const StarScene = dynamic(() => import('@/components/stars/StarScene').then(m => ({ default: m.StarMap })), {
  ssr: false,
  loading: () => (
    <div className="loading-screen">
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
      }}>
        Loading stellar catalog...
      </div>
    </div>
  ),
});

const SCALE_OPTIONS: { value: ScaleUnit; label: string }[] = [
  { value: 'ly', label: 'LY' },
  { value: 'pc', label: 'PC' },
  { value: 'au', label: 'AU' },
];

function StarLayerPanel() {
  const {
    showHipparcos, showGaia, showConstellations,
    setShowHipparcos, setShowGaia, setShowConstellations,
    scaleUnit, setScaleUnit,
    mode, setMode,
    showLabels, setShowLabels,
    mapMode, setMapMode,
    magLimit, setMagLimit,
    setZoomTarget,
    flattenAmount, setFlattenAmount,
    triggerCameraReset,
  } = useStore();

  return (
    <div className="layer-panel" style={{ maxHeight: '300px', overflowY: 'auto' }}>
      <div className="layer-panel-header">
        <span>LAYERS</span>
      </div>
      <div className="layer-panel-body">
        <button className="layer-toggle" onClick={() => setShowHipparcos(!showHipparcos)}>
          <span className={`layer-checkbox ${showHipparcos ? 'checked' : ''}`}>
            {showHipparcos ? '\u2713' : ''}
          </span>
          <span>STARS</span>
        </button>
        <button className="layer-toggle" onClick={() => setShowGaia(!showGaia)}>
          <span className={`layer-checkbox ${showGaia ? 'checked' : ''}`}>
            {showGaia ? '\u2713' : ''}
          </span>
          <span>GAIA DR3</span>
        </button>
        <button className="layer-toggle" onClick={() => setShowConstellations(!showConstellations)}>
          <span className={`layer-checkbox ${showConstellations ? 'checked' : ''}`}>
            {showConstellations ? '\u2713' : ''}
          </span>
          <span>CONSTELLATIONS</span>
        </button>
      </div>

      <div className="layer-panel-header">
        <span>VIEW</span>
      </div>
      <div className="layer-panel-body">
        <button className="layer-toggle" onClick={() => setShowLabels(!showLabels)}>
          <span className={`layer-checkbox ${showLabels ? 'checked' : ''}`}>
            {showLabels ? '\u2713' : ''}
          </span>
          <span>LABELS</span>
        </button>
        <button className="layer-toggle" onClick={() => setMapMode(mapMode === '3d' ? '2d' : '3d')}>
          <span className={`layer-checkbox ${mapMode === '2d' ? 'checked' : ''}`}>
            {mapMode === '2d' ? '\u2713' : ''}
          </span>
          <span>2D VIEW</span>
        </button>
        {mapMode === '3d' && (
          <div className="layer-slider">
            <label>
              <span>FLATTEN</span>
              <span>{Math.round(flattenAmount * 100)}%</span>
            </label>
            <input type="range" min={0} max={1} step={0.05} value={flattenAmount}
              onChange={e => setFlattenAmount(parseFloat(e.target.value))} />
          </div>
        )}
      </div>

      <div className="layer-panel-header">
        <span>FILTERS</span>
      </div>
      <div className="layer-panel-body">
        <div className="layer-slider">
          <label>
            <span>MAGNITUDE</span>
            <span>{magLimit < 12 ? magLimit.toFixed(1) : 'ALL'}</span>
          </label>
          <input type="range" min={1} max={12} step={0.5} value={magLimit}
            onChange={e => setMagLimit(parseFloat(e.target.value))} />
        </div>
      </div>

      <div className="layer-panel-header">
        <span>UNITS</span>
      </div>
      <div className="layer-panel-body">
        {SCALE_OPTIONS.map(o => (
          <button key={o.value} className="layer-toggle" onClick={() => setScaleUnit(o.value)}>
            <span className={`layer-checkbox ${scaleUnit === o.value ? 'checked' : ''}`}>
              {scaleUnit === o.value ? '\u2713' : ''}
            </span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>

      <div className="layer-panel-header">
        <span>PRESETS</span>
      </div>
      <div className="layer-panel-body">
        <button className="layer-toggle" onClick={() => setZoomTarget(5)} title="Solar neighborhood (5 pc)">
          <span className="layer-checkbox" />
          <span>NEAR (5 PC)</span>
        </button>
        <button className="layer-toggle" onClick={() => setZoomTarget(100)} title="Local bubble (100 pc)">
          <span className="layer-checkbox" />
          <span>LOCAL (100 PC)</span>
        </button>
        <button className="layer-toggle" onClick={() => setZoomTarget(1000)} title="Milky Way arm (1000 pc)">
          <span className="layer-checkbox" />
          <span>GALAXY (1000 PC)</span>
        </button>
      </div>

      <div className="layer-panel-header">
        <span>TOOLS</span>
      </div>
      <div className="layer-panel-body">
        <button className="layer-toggle" onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}>
          <span className={`layer-checkbox ${mode === 'measure' ? 'checked' : ''}`}>
            {mode === 'measure' ? '\u2713' : ''}
          </span>
          <span>MEASURE</span>
        </button>
        <button className="layer-toggle" onClick={triggerCameraReset} title="Re-center on Sol">
          <span className="layer-checkbox" />
          <span>CENTER</span>
        </button>
        <button className="layer-toggle" onClick={() => setZoomTarget(useStore.getState().zoomTarget * 0.7)} title="Zoom in">
          <span className="layer-checkbox" />
          <span>ZOOM IN (+)</span>
        </button>
        <button className="layer-toggle" onClick={() => setZoomTarget(useStore.getState().zoomTarget * 1.4)} title="Zoom out">
          <span className="layer-checkbox" />
          <span>ZOOM OUT (-)</span>
        </button>
      </div>
    </div>
  );
}

// MapControls removed — zoom/center now in StarLayerPanel

export default function StarsPage() {
  const theme = useAppStore((s) => s.theme);
  const showSources = useAppStore((s) => s.showSources);
  const setShowSources = useAppStore((s) => s.setShowSources);
  const showAbout = useAppStore((s) => s.showAbout);
  const setShowAbout = useAppStore((s) => s.setShowAbout);
  const stars = useStore((s) => s.stars);

  const [extraFiles, setExtraFiles] = useState<string[]>([]);

  // Apply data-theme to document so CSS vars switch
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!showSources) return;
    fetch('/api/datasources')
      .then(r => r.json())
      .then((d: { extra: string[] }) => setExtraFiles(d.extra || []))
      .catch(() => setExtraFiles([]));
  }, [showSources]);

  return (
    <>
      <TopNav
        title="STAR MAP"
        subtitle={`${stars.length.toLocaleString()} STARS`}
      />

      <div className="scene-area">
        <StarScene />
        <StarLayerPanel />
        <StarSearch />
        <StarSidePanel />

        {/* Spectral type legend */}
        <div className="legend-bar">
          {[
            { label: 'O', color: '#6699ff' },
            { label: 'B', color: '#aabbff' },
            { label: 'A', color: '#ffffff' },
            { label: 'F', color: '#ffeecc' },
            { label: 'G', color: '#ffdd44' },
            { label: 'K', color: '#ff8833' },
            { label: 'M', color: '#ff4422' },
          ].map((s) => (
            <span key={s.label} className="legend-item">
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-label">{s.label}</span>
            </span>
          ))}
        </div>

        {/* Help hint */}
        <div style={{
          position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
          letterSpacing: '0.08em', color: 'var(--text-muted)', opacity: 0.6,
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Drag to rotate · Scroll to zoom · Click a star to inspect · Press <kbd>/</kbd> to search
        </div>
      </div>

      {/* Sources modal */}
      {showSources && (
        <SourcesModal onClose={() => setShowSources(false)} extraFiles={extraFiles} />
      )}

      {/* About modal */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </>
  );
}

// ── Sources modal ─────────────────────────────────────────
const KNOWN_SOURCES = [
  {
    name: 'Hipparcos Catalogue (ESA, 1997)',
    detail: '39,000+ stars with measured astrometry from ESA Hipparcos satellite: parallax, proper motion, BV photometry, and spectral classification. All positions are real measurements with sub-milliarcsecond precision.',
    url: 'https://www.cosmos.esa.int/web/hipparcos',
  },
];

function SourcesModal({ onClose, extraFiles }: { onClose: () => void; extraFiles: string[] }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>{'\u2715'}</button>
        <div className="modal-title">Data Sources & Attribution</div>
        <div className="modal-subtitle">Scientific data provenance</div>
        {KNOWN_SOURCES.map(s => (
          <div className="source-entry" key={s.name}>
            <div className="source-name">{s.name}</div>
            <div className="source-meta">{s.detail}</div>
            {s.url && (
              <div className="source-meta" style={{ marginTop: '0.3rem' }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.url}</a>
              </div>
            )}
          </div>
        ))}
        {extraFiles.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div className="source-name">Additional Data Files</div>
            {extraFiles.map(f => (
              <div className="source-entry" key={f} style={{ paddingLeft: '0.75rem' }}>
                <div className="source-meta">{f}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontWeight: 'bold', lineHeight: 1.6 }}>
          Constellation assignments approximate (nearest-center RA/Dec lookup). Mass, temperature, and age are statistical estimates from spectral classification &mdash; not individual measurements.
        </div>
      </div>
    </div>
  );
}

// ── About modal ───────────────────────────────────────────
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>{'\u2715'}</button>
        <div className="modal-title">StarData</div>
        <div className="modal-subtitle">Interactive 3D Star Atlas</div>

        <div style={{ marginBottom: '1.25rem', lineHeight: 1.7, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
          StarData is an interactive three-dimensional atlas of our stellar neighborhood,
          built from real astronomical measurements. Every star you see has a precisely
          measured position derived from satellite parallax observations.
        </div>

        <div className="source-entry">
          <div className="source-name">Created by</div>
          <div className="source-meta" style={{ marginTop: '0.3rem', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Isaac Dellinger
          </div>
        </div>

        <div className="source-entry">
          <div className="source-name">Technology</div>
          <div className="source-meta" style={{ marginTop: '0.25rem' }}>
            Built with Next.js 14, React Three Fiber, Three.js, and Zustand.<br />
            3D rendering uses custom GLSL shaders with a logarithmic depth buffer
            supporting scales from sub-parsec to 60,000 pc.
          </div>
        </div>

        <div className="source-entry">
          <div className="source-name">Data</div>
          <div className="source-meta" style={{ marginTop: '0.25rem' }}>
            Star positions from the ESA Hipparcos catalogue (1997).<br />
            Exoplanet host systems from the NASA Exoplanet Archive (2026).<br />
            Coordinate system: equatorial Cartesian, 1 unit = 1 parsec.
          </div>
        </div>

        <div className="source-entry">
          <div className="source-name">Navigation</div>
          <div className="source-meta" style={{ marginTop: '0.25rem' }}>
            Drag to rotate · Scroll or pinch to zoom · Click any object to inspect<br />
            Press <kbd>/</kbd> to search · Use the <strong style={{ color: 'var(--accent)' }}>2D</strong> button for a top-down galactic plane view
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontWeight: 'bold', lineHeight: 1.6 }}>
          All stellar distances are based on trigonometric parallax measurements.
          Physical properties (mass, temperature, age) are statistical estimates
          derived from spectral classification, not direct measurements.
        </div>
      </div>
    </div>
  );
}
