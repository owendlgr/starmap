'use client';

import dynamic from 'next/dynamic';
import { TopNav } from '@/components/layout/TopNav';
import { PlanetDetailPanel } from '@/components/planets/PlanetDetailPanel';
import { usePlanetStore } from '@/lib/stores/planetStore';

const SolarSystem = dynamic(() => import('@/components/planets/SolarSystem').then(m => m.SolarSystem), {
  ssr: false,
  loading: () => (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">Loading Solar System</div>
    </div>
  ),
});

export default function PlanetsPage() {
  const showOrbits = usePlanetStore((s) => s.showOrbits);
  const setShowOrbits = usePlanetStore((s) => s.setShowOrbits);
  const showLabels = usePlanetStore((s) => s.showLabels);
  const setShowLabels = usePlanetStore((s) => s.setShowLabels);
  const showMoons = usePlanetStore((s) => s.showMoons);
  const setShowMoons = usePlanetStore((s) => s.setShowMoons);
  const timeScale = usePlanetStore((s) => s.timeScale);
  const setTimeScale = usePlanetStore((s) => s.setTimeScale);

  return (
    <>
      <TopNav title="SOLAR SYSTEM" subtitle="8 PLANETS" />

      <div className="scene-area">
        {/* Layer panel */}
        <div className="layer-panel">
          <div className="layer-panel-header">
            <span>LAYERS</span>
          </div>
          <div className="layer-panel-body">
            <button className="layer-toggle" onClick={() => setShowOrbits(!showOrbits)}>
              <span className={`layer-checkbox ${showOrbits ? 'checked' : ''}`}>
                {showOrbits ? '\u2713' : ''}
              </span>
              <span>ORBITS</span>
            </button>
            <button className="layer-toggle" onClick={() => setShowLabels(!showLabels)}>
              <span className={`layer-checkbox ${showLabels ? 'checked' : ''}`}>
                {showLabels ? '\u2713' : ''}
              </span>
              <span>LABELS</span>
            </button>
            <button className="layer-toggle" onClick={() => setShowMoons(!showMoons)}>
              <span className={`layer-checkbox ${showMoons ? 'checked' : ''}`}>
                {showMoons ? '\u2713' : ''}
              </span>
              <span>MOONS</span>
            </button>
          </div>

          <div className="layer-panel-header">
            <span>TIME</span>
          </div>
          <div className="layer-panel-body">
            <div className="layer-slider">
              <label>
                <span>SPEED</span>
                <span>{timeScale.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        <SolarSystem />
        <PlanetDetailPanel />
      </div>
    </>
  );
}
