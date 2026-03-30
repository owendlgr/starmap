'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
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
        <GalaxyDetailPanel />
        <span className="help-hint">
          Click a galaxy to inspect -- Scroll to zoom -- Drag to orbit
        </span>
      </div>
    </>
  );
}
