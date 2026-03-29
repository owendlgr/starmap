'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/useStore';
import type { ScaleUnit } from '@/lib/types';

// ── Sources modal ─────────────────────────────────────────
const KNOWN_SOURCES = [
  {
    name: 'NASA Exoplanet Archive (2026)',
    detail: '~5,600 confirmed exoplanet systems, 39,000+ records. Includes orbital parameters, planetary radius, mass, discovery method, equilibrium temperature, and host star data.',
    url: 'https://exoplanetarchive.ipac.caltech.edu',
  },
  {
    name: 'Hipparcos Catalogue (ESA, 1997)',
    detail: '~100 named stars with measured parallax, proper motion, BV photometry, and spectral classification. All positions are real Hipparcos measurements.',
    url: 'https://www.cosmos.esa.int/web/hipparcos',
  },
  {
    name: 'Yale Bright Star Catalogue',
    detail: 'Standard reference for stars visible to the naked eye (apparent magnitude < 6.5).',
    url: 'http://tdc-www.harvard.edu/catalogs/bsc5.html',
  },
  {
    name: 'NGC/IC Catalogue',
    detail: 'New General Catalogue — deep sky objects: galaxies, nebulae, and star clusters.',
    url: 'https://www.ngcicproject.org',
  },
  {
    name: 'Generated Background Catalog',
    detail: 'Statistically realistic background stars (~15,000 objects) following galactic disk density distribution. Not from a real survey — generated for visual completeness. Should not be used for scientific analysis.',
    url: null,
  },
];

function SourcesModal({ onClose, extraFiles }: { onClose: () => void; extraFiles: string[] }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Data Sources & Attribution</div>
        <div className="modal-subtitle">Scientific data provenance</div>
        {KNOWN_SOURCES.map(s => (
          <div className="source-entry" key={s.name}>
            <div className="source-name">{s.name}</div>
            <div className="source-meta">{s.detail}</div>
            {s.url && (
              <div className="source-meta" style={{ marginTop: '0.3rem' }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--chrome-accent)', textDecoration: 'none' }}>{s.url}</a>
              </div>
            )}
          </div>
        ))}
        {extraFiles.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--chrome-border)' }}>
            <div className="source-name">Additional Data Files</div>
            {extraFiles.map(f => (
              <div className="source-entry" key={f} style={{ paddingLeft: '0.75rem' }}>
                <div className="source-meta">{f}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--chrome-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontWeight: 'bold', lineHeight: 1.6 }}>
          Constellation assignments approximate (nearest-center RA/Dec lookup). Mass, temperature, and age are statistical estimates from spectral classification — not individual measurements.
        </div>
      </div>
    </div>
  );
}

// ── Inline search (rendered inside map-area) ──────────────
export function NavSearch() {
  const { stars, setSelected, showSearch, setShowSearch } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: number; name: string; type: string; mag: number; dist_pc: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !showSearch && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') { setShowSearch(false); setQuery(''); setResults([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, setShowSearch]);

  useEffect(() => {
    if (showSearch) inputRef.current?.focus();
  }, [showSearch]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lq = q.toLowerCase();
    setResults(
      stars
        .filter(s => s.name.toLowerCase().includes(lq))
        .sort((a, b) => a.mag - b.mag)
        .slice(0, 8)
        .map(s => ({ id: s.id, name: s.name, type: s.type, mag: s.mag, dist_pc: s.dist_pc }))
    );
  }, [stars]);

  const select = useCallback((id: number) => {
    const star = stars.find(s => s.id === id);
    if (star) { setSelected(star); setShowSearch(false); setQuery(''); setResults([]); }
  }, [stars, setSelected, setShowSearch]);

  if (!showSearch) return null;

  return (
    <div className="search-overlay">
      <div className="search-box">
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search stars, galaxies, nebulae…"
          value={query}
          onChange={e => search(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="search-close" onClick={() => { setShowSearch(false); setQuery(''); setResults([]); }}>✕</button>
      </div>
      {results.length > 0 && (
        <div className="search-results">
          {results.map(r => (
            <button key={r.id} className="search-result" onClick={() => select(r.id)}>
              <span className="result-name">{r.name}</span>
              <span className="result-meta">{r.type} · {r.dist_pc === 0 ? 'here' : `${r.dist_pc.toFixed(0)} pc`} · mag {r.mag.toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}
      {query && results.length === 0 && (
        <div className="search-results">
          <div className="search-empty">No matches for "{query}"</div>
        </div>
      )}
    </div>
  );
}

// ── NavBar ────────────────────────────────────────────────
const SCALE_OPTIONS: { value: ScaleUnit; label: string }[] = [
  { value: 'ly', label: 'ly' },
  { value: 'pc', label: 'pc' },
  { value: 'au', label: 'au' },
];

export function NavBar() {
  const {
    showStars, showGalaxies, showNebulae, showClusters, toggleLayer,
    scaleUnit, setScaleUnit,
    mode, setMode,
    showLabels, setShowLabels,
    showDepthLines, setShowDepthLines,
    showSearch, setShowSearch,
    showSources, setShowSources,
    stars,
    triggerCameraReset,
    exoHostCount,
  } = useStore();

  const [extraFiles, setExtraFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!showSources) return;
    fetch('/api/datasources')
      .then(r => r.json())
      .then((d: { extra: string[] }) => setExtraFiles(d.extra || []))
      .catch(() => setExtraFiles([]));
  }, [showSources]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>StarData</h1>
          <p>3D Star Atlas</p>
        </div>

        <div className="navbar-sep" />

        {/* Search trigger */}
        <button className="nav-btn" onClick={() => setShowSearch(true)} title="Search (/)">
          ⌕ Search <kbd>/ </kbd>
        </button>

        <div className="navbar-sep" />

        {/* Layers */}
        <div className="navbar-section">
          <span className="navbar-label">Layers</span>
          {([
            ['stars',    showStars,    '★ Stars'],
            ['galaxies', showGalaxies, '⬡ Galaxies'],
            ['nebulae',  showNebulae,  '◎ Nebulae'],
            ['clusters', showClusters, '· Clusters'],
          ] as const).map(([id, active, label]) => (
            <button key={id} className={`nav-btn ${active ? 'on' : ''}`} onClick={() => toggleLayer(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="navbar-sep" />

        {/* View overlays */}
        <div className="navbar-section">
          <span className="navbar-label">View</span>
          <button className={`nav-btn ${showLabels ? 'on' : ''}`} onClick={() => setShowLabels(!showLabels)}>
            Labels
          </button>
          <button className={`nav-btn ${showDepthLines ? 'on' : ''}`} onClick={() => setShowDepthLines(!showDepthLines)}>
            Depth Lines
          </button>
        </div>

        <div className="navbar-sep" />

        {/* Distance unit */}
        <div className="navbar-section">
          <span className="navbar-label">Unit</span>
          {SCALE_OPTIONS.map(o => (
            <button key={o.value} className={`nav-btn ${scaleUnit === o.value ? 'active' : ''}`}
              onClick={() => setScaleUnit(o.value)}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="navbar-sep" />

        {/* Tools */}
        <div className="navbar-section">
          <button
            className={`nav-btn ${mode === 'measure' ? 'active' : ''}`}
            onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}
          >
            {mode === 'measure' ? '↩ Cancel' : '⟷ Measure'}
          </button>
          <button className="nav-btn" onClick={triggerCameraReset} title="Re-center on Sol">
            ⊕ Center
          </button>
        </div>

        <div className="navbar-spacer" />

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--chrome-muted)', fontWeight: 'bold' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1208', display: 'inline-block', flexShrink: 0 }} />
            Star
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--chrome-muted)', fontWeight: 'bold' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid #1a1208', display: 'inline-block', flexShrink: 0 }} />
            Exoplanet Host
          </span>
        </div>
        <div className="navbar-sep" />
        <span className="nav-stat">
          {stars.length.toLocaleString()} stars
          {exoHostCount > 0 && ` · ${exoHostCount.toLocaleString()} exo hosts`}
        </span>
        <div className="navbar-sep" />
        <button className="nav-btn" onClick={() => setShowSources(true)}>Sources</button>
      </nav>

      {showSources && (
        <SourcesModal onClose={() => setShowSources(false)} extraFiles={extraFiles} />
      )}
    </>
  );
}
