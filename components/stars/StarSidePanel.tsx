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
      <span className="data-label">{label}</span>
      <span className={`data-value ${mono ? 'mono' : ''}`}>{value}</span>
    </>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="data-section">
      <button className="data-section-title" onClick={() => setOpen(!open)}>
        {title}
        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{open ? '\u25BE' : '\u25B8'}</span>
      </button>
      {open && children}
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
    <Section title={`Known Exoplanets \u2014 ${loading ? '\u2026' : (planets?.length ?? 0)} found`}>
      {loading && <div className="planet-none">Querying NASA archive...</div>}
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
                <td>{p.orbitalPeriod != null ? `${p.orbitalPeriod.toFixed(1)} d` : '\u2014'}</td>
                <td>{p.radiusEarth != null ? `${p.radiusEarth.toFixed(2)} R\u2295` : '\u2014'}</td>
                <td>{p.massEarth != null ? `${p.massEarth.toFixed(2)} M\u2295` : '\u2014'}</td>
                <td style={{ fontSize: '0.68rem' }}>{p.discMethod || '\u2014'}</td>
                <td>{p.discYear || '\u2014'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && planets && planets.length > 0 && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.5 }}>
          Source: NASA Exoplanet Archive · R{'\u2295'} = Earth radii · M{'\u2295'} = Earth masses
        </div>
      )}
    </Section>
  );
}

export function StarSidePanel() {
  const {
    selectedStar, measureTarget,
    scaleUnit,
    setSelected, setMeasureTarget,
    mode, setMode,
    showTravelCalc, setShowTravelCalc,
  } = useStore();

  const isOpen = !!selectedStar;

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
      {selectedStar && (
        <>
          <div className="detail-header">
            <button
              className="detail-close"
              onClick={() => { setSelected(null); setMeasureTarget(null); }}
            >{'\u2715'}</button>

            <div className="detail-name">{selectedStar.name}</div>
            <div className="detail-subtitle">{selectedStar.type}</div>

            <div className="color-band">
              <div className="color-swatch" style={{ background: bvToColor(selectedStar.bv) }} />
              <span className="color-label">
                Class {selectedStar.spectral || '\u2014'}&nbsp;·&nbsp;B{'\u2212'}V {isFinite(selectedStar.bv) ? selectedStar.bv.toFixed(2) : '\u2014'}
              </span>
            </div>

            {/* DSS Sky Survey Image */}
            {selectedStar.ra !== 0 && selectedStar.dec !== 0 && selectedStar.dist_pc > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                <img
                  src={`https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=${selectedStar.ra},${selectedStar.dec}&Survey=DSS2+Red&Pixels=280&Size=0.15&Return=GIF`}
                  alt={`Sky near ${selectedStar.name}`}
                  style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--border)', opacity: 0.9 }}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  DSS2 Red &middot; 9&#x2032; field
                </div>
              </div>
            )}
          </div>

          <div className="detail-body">

            {/* Distance & Position */}
            <Section title="Distance & Position">
              <div className="data-grid">
                <Row label="Distance"
                  value={selectedStar.dist_pc === 0 ? 'Here \u2014 Sol' : formatDistance(selectedStar.dist_pc, scaleUnit)} />
                <Row label="Light Years"
                  value={selectedStar.dist_pc === 0 ? '0 ly' : (selectedStar.dist_pc * 3.26156).toFixed(2) + ' ly'} />
                <Row label="Parsecs"
                  value={selectedStar.dist_pc === 0 ? '0 pc' : selectedStar.dist_pc.toFixed(4) + ' pc'} />
                <Row label="Parallax"   value={parallaxFromDist(selectedStar.dist_pc)} mono />
                <Row label="Constellation" value={getConstellation(selectedStar.ra, selectedStar.dec)} />
              </div>
            </Section>

            {/* Physical Properties */}
            <Section title="Physical Properties" defaultOpen={false}>
              <div className="data-grid">
                <Row label="Spectral Class" value={selectedStar.spectral || '\u2014'} mono />
                <Row label="Temperature (estimated)"
                  value={isFinite(selectedStar.bv)
                    ? formatTemperature(estimateTemperature(selectedStar.bv))
                    : '\u2014'} />
                <Row label="Mass (estimated)"  value={estimateMass(selectedStar.spectral)} />
                <Row label="Age (estimated)"   value={estimateAge(selectedStar.spectral)} />
                <Row label="B-V Color Index"
                  value={isFinite(selectedStar.bv) ? selectedStar.bv.toFixed(3) : '\u2014'} mono />
                <Row label="Object Type"  value={selectedStar.type} />
              </div>
            </Section>

            {/* Photometry */}
            <Section title="Photometry" defaultOpen={false}>
              <div className="data-grid">
                <Row label="Apparent Magnitude" value={selectedStar.mag.toFixed(2)} mono />
                <Row label="Absolute Magnitude"
                  value={selectedStar.dist_pc > 0
                    ? absoluteMagnitude(selectedStar.mag, selectedStar.dist_pc)
                    : selectedStar.mag.toFixed(2)}
                  mono />
              </div>
            </Section>

            {/* Coordinates */}
            <Section title="Equatorial Coordinates" defaultOpen={false}>
              <div className="data-grid">
                <Row label="Right Ascension"     value={formatRA(selectedStar.ra)}   mono />
                <Row label="Declination"    value={formatDec(selectedStar.dec)} mono />
                <Row label="Right Ascension (degrees)" value={selectedStar.ra.toFixed(4) + '\u00B0'} mono />
                <Row label="Declination (degrees)" value={selectedStar.dec.toFixed(4) + '\u00B0'} mono />
              </div>
            </Section>

            {/* Catalog */}
            <Section title="Catalog & Discovery" defaultOpen={false}>
              <div className="data-grid">
                <Row label="Catalog"     value={selectedStar.catalog || '\u2014'} />
                <Row label="Hipparcos Number"       value={selectedStar.hip > 0 ? selectedStar.hip.toString() : '\u2014'} mono />
                <Row label="Object Identifier"   value={selectedStar.id.toString()} mono />
                <Row label="Data Source"
                  value={selectedStar.hip > 0 ? 'Hipparcos (real coordinates)' : 'Generated catalog'} />
              </div>
              {selectedStar.hip > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <a href={`https://simbad.cds.unistra.fr/simbad/sim-id?Ident=HIP+${selectedStar.hip}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', textDecoration: 'none' }}>
                    SIMBAD &#8599;
                  </a>
                  <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedStar.name.replace(/ /g, '_'))}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', textDecoration: 'none' }}>
                    Wikipedia &#8599;
                  </a>
                </div>
              )}
            </Section>

            {/* Exoplanets */}
            <PlanetsSection starName={selectedStar.name} />

            {/* Measure separation */}
            {measureTarget && (
              <Section title={`Separation \u2014 ${measureTarget.name}`}>
                <div className="data-grid">
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
                <Section title={`Travel Time \u2192 ${dest}`}>
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
                  <div style={{ marginTop: '0.55rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontStyle: 'italic' }}>
                    Relativistic effects not accounted for.
                  </div>
                </Section>
              );
            })()}

            {/* Actions */}
            <div className="action-group">
              <button
                className={`action-btn ${mode === 'measure' ? 'active' : ''}`}
                onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}
              >
                {mode === 'measure' ? '\u21A9 Cancel Measure' : '\u27F7 Measure To\u2026'}
              </button>
              {selectedStar.dist_pc > 0 && (
                <button
                  className={`action-btn ${showTravelCalc ? 'active' : ''}`}
                  onClick={() => setShowTravelCalc(!showTravelCalc)}
                >
                  {'\u23F1'} Travel Time
                </button>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
