'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/useStore';
import type { ScaleUnit } from '@/lib/types';

// ── Sources modal ─────────────────────────────────────────
const KNOWN_SOURCES = [
  {
    name: 'Hipparcos Catalogue (ESA, 1997)',
    detail: '~100 named stars with measured parallax, proper motion, and photometry.',
    url: 'https://www.cosmos.esa.int/web/hipparcos',
  },
  {
    name: 'Yale Bright Star Catalogue',
    detail: 'Standard reference for stars visible to the naked eye (mag < 6.5).',
    url: 'http://tdc-www.harvard.edu/catalogs/bsc5.html',
  },
  {
    name: 'NGC/IC Catalogue',
    detail: 'New General Catalogue — deep sky objects: galaxies, nebulae, clusters.',
    url: 'https://www.ngcicproject.org',
  },
  {
    name: 'Generated background catalog',
    detail: 'Statistically realistic background stars following galactic disk density distribution. Not from a real survey — used for visual completeness.',
    url: null,
  },
];

function SourcesModal({ onClose, extraFiles }: { onClose: () => void; extraFiles: string[] }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Data Sources</div>
        <div className="modal-subtitle">Attribution & Catalog Information</div>

        {KNOWN_SOURCES.map(s => (
          <div className="source-entry" key={s.name}>
            <div className="source-name">{s.name}</div>
            <div className="source-meta">{s.detail}</div>
            {s.url && (
              <div className="source-meta" style={{ marginTop: '0.3rem' }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>{s.url}</a>
              </div>
            )}
          </div>
        ))}

        {extraFiles.length > 0 && (
          <>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--divider)' }}>
              <div className="source-name">Additional Data Files Detected</div>
              {extraFiles.map(f => (
                <div className="source-entry" key={f} style={{ paddingLeft: '0.75rem' }}>
                  <div className="source-meta">{f} — loaded and cross-referenced</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
          Constellation assignments are approximated from RA/Dec center-point lookup. Mass, temperature, and age figures are statistical estimates derived from spectral classification — not individual measurements.
        </div>
      </div>
    </div>
  );
}

// ── Search ────────────────────────────────────────────────
function NavSearch() {
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
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, setShowSearch]);

  useEffect(() => {
    if (showSearch && inputRef.current) inputRef.current.focus();
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

  if (!showSearch) {
    return (
      <button className="nav-btn" onClick={() => setShowSearch(true)} title="Search (/)">
        ⌕ Search <kbd style={{ marginLeft: '0.35rem' }}>/</kbd>
      </button>
    );
  }

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
    showSearch,
    showSources, setShowSources,
    stars,
  } = useStore();

  const [extraFiles, setExtraFiles] = useState<string[]>([]);

  // Load extra data sources list when sources modal opens
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
        {/* Brand */}
        <div className="navbar-brand">
          <h1>StarMap</h1>
          <p>Interactive 3D Star Atlas</p>
        </div>

        <div className="navbar-sep" />

        {/* Search */}
        {!showSearch && <NavSearch />}

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

        {/* Overlays */}
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

        {/* Measure tool */}
        <button
          className={`nav-btn ${mode === 'measure' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}
        >
          {mode === 'measure' ? '↩ Cancel Measure' : '⟷ Measure'}
        </button>

        <div className="navbar-spacer" />

        {/* Stats + Sources */}
        <span className="nav-stat">{stars.length.toLocaleString()} objects</span>
        <div className="navbar-sep" />
        <button className="nav-btn" onClick={() => setShowSources(true)}>Sources</button>
      </nav>

      {/* Floating search overlay */}
      {showSearch && (
        <div style={{ position: 'absolute', top: 'calc(var(--navbar-h) + 0.5rem)', left: 0, right: 0, zIndex: 40, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <NavSearch />
          </div>
        </div>
      )}

      {/* Sources modal */}
      {showSources && (
        <SourcesModal onClose={() => setShowSources(false)} extraFiles={extraFiles} />
      )}
    </>
  );
}
