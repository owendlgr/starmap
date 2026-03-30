'use client';

import React from 'react';
import { usePlanetStore } from '@/lib/stores/planetStore';

/** Format large numbers with commas */
function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e6) {
    return n.toExponential(decimals);
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

/** Convert AU to km */
function auToKm(au: number): number {
  return au * 149_597_870.7;
}

/** Convert AU to light-years */
function auToLy(au: number): number {
  return au / 63_241;
}

/** Convert Kelvin to Celsius */
function kToC(k: number): number {
  return k - 273.15;
}

export function PlanetDetailPanel() {
  const planet = usePlanetStore((s) => s.selectedPlanet);
  const setSelectedPlanet = usePlanetStore((s) => s.setSelectedPlanet);
  const setCameraTarget = usePlanetStore((s) => s.setCameraTarget);

  const handleClose = () => {
    setSelectedPlanet(null);
    setCameraTarget(null);
  };

  return (
    <div className={`detail-panel ${planet ? 'open' : ''}`}>
      {planet && (
        <>
          <div className="detail-header">
            <button className="detail-close" onClick={handleClose} title="Close">
              &#x2715;
            </button>
            <div className="detail-name">{planet.name}</div>
            <div className="detail-subtitle">{planet.type}</div>
            <div className="color-band" style={{ marginTop: '0.5rem' }}>
              <div className="color-swatch" style={{ background: planet.color }} />
              <span className="color-label">{planet.color}</span>
            </div>
          </div>

          <div className="detail-body">
            {/* Overview */}
            <div className="data-section">
              <div className="data-section-title">Overview</div>
              <div className="data-grid">
                <span className="data-label">Type</span>
                <span className="data-value">{planet.type === 'planet' ? 'Planet' : 'Dwarf Planet'}</span>

                <span className="data-label">Distance (AU)</span>
                <span className="data-value mono">{fmt(planet.distanceAU, 3)}</span>

                <span className="data-label">Distance (km)</span>
                <span className="data-value mono">{fmt(auToKm(planet.distanceAU), 0)}</span>

                <span className="data-label">Distance (ly)</span>
                <span className="data-value mono">{auToLy(planet.distanceAU).toExponential(3)}</span>

                <span className="data-label">Orbital Period</span>
                <span className="data-value mono">
                  {fmt(planet.orbitalPeriod, 1)} days
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {' '}({fmt(planet.orbitalPeriod / 365.25, 2)} yr)
                  </span>
                </span>

                <span className="data-label">Eccentricity</span>
                <span className="data-value mono">{planet.eccentricity.toFixed(4)}</span>

                <span className="data-label">Inclination</span>
                <span className="data-value mono">{planet.inclination.toFixed(2)}&deg;</span>
              </div>
            </div>

            {/* Physical Properties */}
            <div className="data-section">
              <div className="data-section-title">Physical Properties</div>
              <div className="data-grid">
                <span className="data-label">Mass</span>
                <span className="data-value mono">{fmt(planet.mass)} &times; 10<sup>24</sup> kg</span>

                <span className="data-label">Radius</span>
                <span className="data-value mono">{fmt(planet.radius, 1)} km</span>

                <span className="data-label">Density</span>
                <span className="data-value mono">{fmt(planet.density, 2)} g/cm&sup3;</span>

                <span className="data-label">Gravity</span>
                <span className="data-value mono">{fmt(planet.gravity, 2)} m/s&sup2;</span>

                <span className="data-label">Escape Vel.</span>
                <span className="data-value mono">{fmt(planet.escapeVelocity, 2)} km/s</span>

                <span className="data-label">Mean Temp.</span>
                <span className="data-value mono">
                  {planet.meanTemp} K
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {' '}({kToC(planet.meanTemp).toFixed(0)} &deg;C)
                  </span>
                </span>

                <span className="data-label">Axial Tilt</span>
                <span className="data-value mono">{planet.axialTilt.toFixed(2)}&deg;</span>

                <span className="data-label">Rotation</span>
                <span className="data-value mono">
                  {fmt(Math.abs(planet.rotationPeriod), 2)} hrs
                  {planet.rotationPeriod < 0 && (
                    <span style={{ color: 'var(--accent-warm)', fontSize: '0.68rem' }}> (retrograde)</span>
                  )}
                </span>

                <span className="data-label">Rings</span>
                <span className="data-value">{planet.hasRings ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Orbital Elements */}
            {planet.orbitalElements && (
              <div className="data-section">
                <div className="data-section-title">Orbital Elements (J2000)</div>
                <div className="data-grid">
                  <span className="data-label">Semi-major Axis</span>
                  <span className="data-value mono">{planet.orbitalElements.semiMajorAxis.toFixed(3)} AU</span>

                  <span className="data-label">Eccentricity</span>
                  <span className="data-value mono">{planet.orbitalElements.eccentricity.toFixed(4)}</span>

                  <span className="data-label">Inclination</span>
                  <span className="data-value mono">{planet.orbitalElements.inclination.toFixed(2)}&deg;</span>

                  <span className="data-label">Asc. Node (&Omega;)</span>
                  <span className="data-value mono">{planet.orbitalElements.longAscNode.toFixed(2)}&deg;</span>

                  <span className="data-label">Arg. Perihelion (&omega;)</span>
                  <span className="data-value mono">{planet.orbitalElements.argPerihelion.toFixed(2)}&deg;</span>

                  <span className="data-label">Mean Anomaly (M)</span>
                  <span className="data-value mono">{planet.orbitalElements.meanAnomaly.toFixed(2)}&deg;</span>

                  <span className="data-label">Period</span>
                  <span className="data-value mono">
                    {fmt(planet.orbitalElements.period, 2)} days
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {' '}({fmt(planet.orbitalElements.period / 365.25, 2)} yr)
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Atmosphere */}
            <div className="data-section">
              <div className="data-section-title">Atmosphere</div>
              {planet.atmosphere.length > 0 ? (
                <div className="data-grid">
                  {planet.atmosphere.map((comp) => {
                    const parts = comp.split(' ');
                    const formula = parts[0];
                    const pct = parts.slice(1).join(' ');
                    return (
                      <React.Fragment key={comp}>
                        <span className="data-label">{formula}</span>
                        <span className="data-value mono">{pct}</span>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <p className="planet-none">No significant atmosphere</p>
              )}
            </div>

            {/* Moons */}
            <div className="data-section">
              <div className="data-section-title">
                Moons ({planet.moons.length})
              </div>
              {planet.moons.length > 0 ? (
                <table className="planet-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Radius (km)</th>
                      <th>Distance (km)</th>
                      <th>Period (d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planet.moons.map((moon) => (
                      <tr key={moon.id}>
                        <td>{moon.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(moon.radius, 1)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(moon.distanceKm, 0)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(Math.abs(moon.orbitalPeriod), 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="planet-none">No known moons</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
