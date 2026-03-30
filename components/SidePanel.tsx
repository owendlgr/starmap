'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/useStore';
import {
  formatDistance, formatRA, formatDec, distanceBetween,
  calcTravelTime, formatTravelTime,
  estimateTemperature, formatTemperature, estimateMass, estimateAge,
  absoluteMagnitude, parallaxFromDist, getConstellation, bvToColor,
} from '@/lib/coordinates';
import type { Planet } from '@/app/api/exoplanets/route';

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <span className="side-label">{label}</span>
      <span className={`side-value ${mono ? 'mono' : ''}`}>{value}</span>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="side-section">
      <div className="side-section-title">{title}</div>
      {children}
    </div>
  );
}

function PlanetsSection({ starName }: { starName: string }) {
  const [planets, setPlanets] = useState<Planet[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPlanets(null);
    fetch(`/api/exoplanets?host=${encodeURIComponent(starName)}`)
      .then(r => r.json())
      .then((d: { planets: Planet[] }) => { setPlanets(d.planets); setLoading(false); })
      .catch(() => { setPlanets([]); setLoading(false); });
  }, [starName]);

  return (
    <Section title={`Known Exoplanets — ${loading ? '…' : (planets?.length ?? 0)} found`}>
      {loading && <div className="planet-none">Querying NASA archive…</div>}
      {!loading && (!planets || planets.length === 0) && (
        <div className="planet-none">No confirmed exoplanets on record for this host star.</div>
      )}
      {!loading && planets && planets.length > 0 && (
        <table className="planet-table">
          <thead>
            <tr>
              <th>Planet</th>
              <th>Period</th>
              <th>Radius</th>
              <th>Mass</th>
              <th>Method</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            {planets.map(p => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.orbitalPeriod != null ? `${p.orbitalPeriod.toFixed(1)} d` : '—'}</td>
                <td>{p.radiusEarth != null ? `${p.radiusEarth.toFixed(2)} R⊕` : '—'}</td>
                <td>{p.massEarth != null ? `${p.massEarth.toFixed(2)} M⊕` : '—'}</td>
                <td style={{ fontSize: '0.68rem' }}>{p.discMethod || '—'}</td>
                <td>{p.discYear || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && planets && planets.length > 0 && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.65rem', color: 'var(--chrome-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.5 }}>
          Source: NASA Exoplanet Archive · R⊕ = Earth radii · M⊕ = Earth masses
        </div>
      )}
    </Section>
  );
}

export function SidePanel() {
  const {
    selectedStar, measureTarget,
    scaleUnit,
    setSelected, setMeasureTarget,
    mode, setMode,
    showTravelCalc, setShowTravelCalc,
  } = useStore();

  const isOpen = !!selectedStar;

  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
      {selectedStar && (
        <>
          <div className="side-panel-header">
            <button
              className="side-panel-close"
              onClick={() => { setSelected(null); setMeasureTarget(null); }}
            >✕</button>

            <div className="side-name">{selectedStar.name}</div>
            <div className="side-type">{selectedStar.type}</div>

            <div className="side-color-band">
              <div className="side-color-swatch" style={{ background: bvToColor(selectedStar.bv) }} />
              <span className="side-color-label">
                Class {selectedStar.spectral || '—'}&nbsp;·&nbsp;B−V {isFinite(selectedStar.bv) ? selectedStar.bv.toFixed(2) : '—'}
              </span>
            </div>

            {/* DSS Sky Survey Image */}
            {selectedStar.ra !== 0 && selectedStar.dec !== 0 && selectedStar.dist_pc > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                <img
                  src={`https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=${selectedStar.ra},${selectedStar.dec}&Survey=DSS2+Red&Pixels=280&Size=0.15&Return=GIF`}
                  alt={`Sky near ${selectedStar.name}`}
                  style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--chrome-border)', opacity: 0.9 }}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--chrome-muted)', marginTop: '0.2rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  DSS2 Red &middot; 9&#x2032; field
                </div>
              </div>
            )}
          </div>

          <div className="side-panel-body">

            {/* Distance & Position */}
            <Section title="Distance & Position">
              <div className="side-grid">
                <Row label="Distance"
                  value={selectedStar.dist_pc === 0 ? 'Here — Sol' : formatDistance(selectedStar.dist_pc, scaleUnit)} />
                <Row label="Light Years"
                  value={selectedStar.dist_pc === 0 ? '0 ly' : (selectedStar.dist_pc * 3.26156).toFixed(2) + ' ly'} />
                <Row label="Parsecs"
                  value={selectedStar.dist_pc === 0 ? '0 pc' : selectedStar.dist_pc.toFixed(4) + ' pc'} />
                <Row label="Parallax"   value={parallaxFromDist(selectedStar.dist_pc)} mono />
                <Row label="Constellation" value={getConstellation(selectedStar.ra, selectedStar.dec)} />
              </div>
            </Section>

            {/* Physical Properties */}
            <Section title="Physical Properties">
              <div className="side-grid">
                <Row label="Spectral Class" value={selectedStar.spectral || '—'} mono />
                <Row label="Temperature (estimated)"
                  value={isFinite(selectedStar.bv)
                    ? formatTemperature(estimateTemperature(selectedStar.bv))
                    : '—'} />
                <Row label="Mass (estimated)"  value={estimateMass(selectedStar.spectral)} />
                <Row label="Age (estimated)"   value={estimateAge(selectedStar.spectral)} />
                <Row label="B-V Color Index"
                  value={isFinite(selectedStar.bv) ? selectedStar.bv.toFixed(3) : '—'} mono />
                <Row label="Object Type"  value={selectedStar.type} />
              </div>
            </Section>

            {/* Photometry */}
            <Section title="Photometry">
              <div className="side-grid">
                <Row label="Apparent Magnitude" value={selectedStar.mag.toFixed(2)} mono />
                <Row label="Absolute Magnitude"
                  value={selectedStar.dist_pc > 0
                    ? absoluteMagnitude(selectedStar.mag, selectedStar.dist_pc)
                    : selectedStar.mag.toFixed(2)}
                  mono />
              </div>
            </Section>

            {/* Coordinates */}
            <Section title="Equatorial Coordinates">
              <div className="side-grid">
                <Row label="Right Ascension"     value={formatRA(selectedStar.ra)}   mono />
                <Row label="Declination"    value={formatDec(selectedStar.dec)} mono />
                <Row label="Right Ascension (degrees)" value={selectedStar.ra.toFixed(4) + '°'} mono />
                <Row label="Declination (degrees)" value={selectedStar.dec.toFixed(4) + '°'} mono />
              </div>
            </Section>

            {/* Catalog */}
            <Section title="Catalog & Discovery">
              <div className="side-grid">
                <Row label="Catalog"     value={selectedStar.catalog || '—'} />
                <Row label="Hipparcos Number"       value={selectedStar.hip > 0 ? selectedStar.hip.toString() : '—'} mono />
                <Row label="Object Identifier"   value={selectedStar.id.toString()} mono />
                <Row label="Data Source"
                  value={selectedStar.hip > 0 ? 'Hipparcos (real coordinates)' : 'Generated catalog'} />
              </div>
            </Section>


            {/* Measure separation */}
            {measureTarget && (
              <Section title={`Separation — ${measureTarget.name}`}>
                <div className="side-grid">
                  <Row label="Distance"
                    value={formatDistance(distanceBetween(selectedStar, measureTarget), scaleUnit)} />
                  <Row label="In ly"
                    value={(distanceBetween(selectedStar, measureTarget) * 3.26156).toFixed(2) + ' ly'} />
                </div>
              </Section>
            )}

            {/* Travel calculator */}
            {showTravelCalc && selectedStar.dist_pc > 0 && (() => {
              const dist = measureTarget
                ? distanceBetween(selectedStar, measureTarget)
                : selectedStar.dist_pc;
              const t = calcTravelTime(dist);
              const dest = measureTarget ? measureTarget.name : selectedStar.name;
              return (
                <Section title={`Travel Time → ${dest}`}>
                  {[
                    ['Speed of light (c)', t.lightspeed_years],
                    ['10% light speed', t.pct10c_years],
                    ['1% light speed', t.pct01c_years],
                    ['Voyager 1 (17 km/s)', t.voyager_years],
                  ].map(([lbl, val]) => (
                    <div className="travel-row-side" key={String(lbl)}>
                      <span className="travel-label-side">{String(lbl)}</span>
                      <span className="travel-value-side">{formatTravelTime(Number(val))}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.55rem', fontSize: '0.65rem', color: 'var(--chrome-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontStyle: 'italic' }}>
                    Relativistic effects not accounted for.
                  </div>
                </Section>
              );
            })()}

            {/* Actions */}
            <div className="side-actions">
              <button
                className={`side-action-btn ${mode === 'measure' ? 'active' : ''}`}
                onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}
              >
                {mode === 'measure' ? '↩ Cancel Measure' : '⟷ Measure To…'}
              </button>
              {selectedStar.dist_pc > 0 && (
                <button
                  className={`side-action-btn ${showTravelCalc ? 'active' : ''}`}
                  onClick={() => setShowTravelCalc(!showTravelCalc)}
                >
                  ⏱ Travel Time
                </button>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
