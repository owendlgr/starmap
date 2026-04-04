'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { GalaxyDetailPanel } from '@/components/galaxies/GalaxyDetailPanel';
import { useGalaxyStore } from '@/lib/stores/galaxyStore';
import { GALAXIES, computeScaledPositions } from '@/lib/data/galaxyCatalog';

const GalaxyScene = dynamic(
  () => import('@/components/galaxies/GalaxyScene').then((m) => m.GalaxyScene),
  {
    ssr: false,
    loading: () => (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Loading Galaxy Map</span>
      </div>
    ),
  },
);

const TYPE_OPTIONS = [
  { value: 'all', label: 'ALL TYPES' },
  { value: 'spiral', label: 'SPIRAL' },
  { value: 'elliptical', label: 'ELLIPTICAL' },
  { value: 'irregular', label: 'IRREGULAR' },
  { value: 'dwarf', label: 'DWARF' },
  { value: 'lenticular', label: 'LENTICULAR' },
] as const;

function GalaxySearch() {
  const galaxies = useGalaxyStore((s) => s.galaxies);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof galaxies>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !open && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lq = q.toLowerCase();
    setResults(
      galaxies
        .filter((g) => g.name.toLowerCase().includes(lq) || (g.altName ?? '').toLowerCase().includes(lq))
        .slice(0, 8),
    );
  }, [galaxies]);

  const select = useCallback((g: typeof galaxies[0]) => {
    setSelectedGalaxy(g);
    setOpen(false);
    setQuery('');
    setResults([]);
  }, [setSelectedGalaxy]);

  if (!open) return null;

  return (
    <div className="search-overlay" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}>
      <div className="search-box">
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search galaxies by name or catalog ID..."
          value={query}
          onChange={(e) => search(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="search-close" onClick={() => { setOpen(false); setQuery(''); setResults([]); }}>
          {'\u2715'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="search-results">
          {results.map((g) => (
            <button key={g.id} className="search-result" onClick={() => select(g)}>
              <span className="result-name">{g.name}</span>
              <span className="result-meta">
                {g.galaxyType ?? g.type} · {g.distanceMpc != null ? `${g.distanceMpc.toFixed(1)} Mpc` : '--'}
                {g.magnitude != null ? ` · mag ${g.magnitude.toFixed(1)}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
      {query && results.length === 0 && (
        <div className="search-results">
          <div className="search-empty">No matches for &quot;{query}&quot;</div>
        </div>
      )}
    </div>
  );
}

export default function GalaxiesPage() {
  const setGalaxies = useGalaxyStore((s) => s.setGalaxies);
  const setLoading = useGalaxyStore((s) => s.setLoading);
  const galaxies = useGalaxyStore((s) => s.galaxies);
  const showLabels = useGalaxyStore((s) => s.showLabels);
  const setShowLabels = useGalaxyStore((s) => s.setShowLabels);
  const showMilkyWay = useGalaxyStore((s) => s.showMilkyWay);
  const setShowMilkyWay = useGalaxyStore((s) => s.setShowMilkyWay);
  const maxMagnitude = useGalaxyStore((s) => s.maxMagnitude);
  const setMaxMagnitude = useGalaxyStore((s) => s.setMaxMagnitude);
  const filterType = useGalaxyStore((s) => s.filterType);
  const setFilterType = useGalaxyStore((s) => s.setFilterType);

  useEffect(() => {
    setLoading(true);
    const positioned = computeScaledPositions(GALAXIES);
    setGalaxies(positioned);
    setLoading(false);
  }, [setGalaxies, setLoading]);

  const galaxyCount = galaxies.length;

  return (
    <>
      <TopNav
        title="GALAXY MAP"
        subtitle={`${galaxyCount} GALAXIES`}
      />

      <div className="scene-area">
        {/* Layer panel */}
        <div className="layer-panel">
          <div className="layer-panel-header">
            <span>LAYERS</span>
          </div>
          <div className="layer-panel-body">
            <button className="layer-toggle" onClick={() => setShowLabels(!showLabels)}>
              <span className={`layer-checkbox ${showLabels ? 'checked' : ''}`}>
                {showLabels ? '\u2713' : ''}
              </span>
              <span>LABELS</span>
            </button>
            <button className="layer-toggle" onClick={() => setShowMilkyWay(!showMilkyWay)}>
              <span className={`layer-checkbox ${showMilkyWay ? 'checked' : ''}`}>
                {showMilkyWay ? '\u2713' : ''}
              </span>
              <span>MILKY WAY</span>
            </button>
          </div>

          <div className="layer-panel-header">
            <span>TYPE</span>
          </div>
          <div className="layer-panel-body">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="layer-toggle"
                onClick={() => setFilterType(opt.value)}
              >
                <span className={`layer-checkbox ${filterType === opt.value ? 'checked' : ''}`}>
                  {filterType === opt.value ? '\u2713' : ''}
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="layer-panel-header">
            <span>FILTERS</span>
          </div>
          <div className="layer-panel-body">
            <div className="layer-slider">
              <label>
                <span>MAGNITUDE</span>
                <span>{maxMagnitude.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={3}
                max={18}
                step={0.1}
                value={maxMagnitude}
                onChange={(e) => setMaxMagnitude(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        <GalaxyScene />
        <GalaxySearch />
        <GalaxyDetailPanel />
        <span className="help-hint">
          Click a galaxy to inspect · Scroll to zoom · Drag to orbit · Press / to search
        </span>
      </div>
    </>
  );
}
