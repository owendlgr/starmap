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
  const showDwarfPlanets = usePlanetStore((s) => s.showDwarfPlanets);
  const setShowDwarfPlanets = usePlanetStore((s) => s.setShowDwarfPlanets);
  const showAsteroidBelt = usePlanetStore((s) => s.showAsteroidBelt);
  const setShowAsteroidBelt = usePlanetStore((s) => s.setShowAsteroidBelt);
  const showKuiperBelt = usePlanetStore((s) => s.showKuiperBelt);
  const setShowKuiperBelt = usePlanetStore((s) => s.setShowKuiperBelt);
  const timeScale = usePlanetStore((s) => s.timeScale);
  const setTimeScale = usePlanetStore((s) => s.setTimeScale);
  const simulationDate = usePlanetStore((s) => s.simulationDate);
  const setSimulationDate = usePlanetStore((s) => s.setSimulationDate);

  return (
    <>
      <TopNav title="SOLAR SYSTEM" subtitle="8 PLANETS · 6 DWARF PLANETS · 2 BELTS" />

      <div className="scene-area">
        {/* Layer panel */}
        <div className="layer-panel">
          <div className="layer-panel-header"><span>LAYERS</span></div>
          <div className="layer-panel-body">
            {[
              { label: 'ORBITS', value: showOrbits, set: setShowOrbits },
              { label: 'LABELS', value: showLabels, set: setShowLabels },
              { label: 'MOONS', value: showMoons, set: setShowMoons },
              { label: 'DWARF PLANETS', value: showDwarfPlanets, set: setShowDwarfPlanets },
              { label: 'ASTEROID BELT', value: showAsteroidBelt, set: setShowAsteroidBelt },
              { label: 'KUIPER BELT', value: showKuiperBelt, set: setShowKuiperBelt },
            ].map(({ label, value, set }) => (
              <button key={label} className="layer-toggle" onClick={() => set(!value)}>
                <span className={`layer-checkbox ${value ? 'checked' : ''}`}>{value ? '✓' : ''}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="layer-panel-header"><span>TIME</span></div>
          <div className="layer-panel-body">
            <div className="layer-slider">
              <label>
                <span>SPEED</span>
                <span>{timeScale === 0 ? 'PAUSED' : `${timeScale.toFixed(1)}x`}</span>
              </label>
              <input
                type="range" min={0} max={20} step={0.1} value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              />
            </div>
            <div style={{ padding: '4px 6px' }}>
              <label style={{
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
                color: 'var(--text-secondary)', display: 'block', marginBottom: '4px',
              }}>
                DATE
              </label>
              <input
                type="date"
                value={simulationDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) {
                    setSimulationDate(d);
                    setTimeScale(0); // pause when setting specific date
                  }
                }}
                style={{
                  width: '100%', background: 'var(--bg-body)', border: '1px solid var(--border)',
                  borderRadius: '3px', color: 'var(--text-primary)', padding: '4px 6px',
                  fontSize: '11px', fontFamily: 'var(--font)',
                }}
              />
            </div>
            <button
              className="layer-toggle"
              onClick={() => {
                setSimulationDate(new Date());
                setTimeScale(0);
              }}
            >
              <span className="layer-checkbox" />
              <span>RESET TO NOW</span>
            </button>
          </div>
        </div>

        <SolarSystem />
        <PlanetDetailPanel />

        {/* Help hint */}
        <span className="help-hint">
          Click a planet to inspect · Scroll to zoom · Drag to orbit
        </span>
      </div>
    </>
  );
}
