'use client';
import { useStore } from '@/lib/useStore';
import {
  formatDistance, formatRA, formatDec, distanceBetween,
  calcTravelTime, formatTravelTime,
  estimateTemperature, formatTemperature, estimateMass, estimateAge,
  absoluteMagnitude, parallaxFromDist, getConstellation, bvToColor,
} from '@/lib/coordinates';

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
      <div className="side-grid">{children}</div>
    </div>
  );
}

export function SidePanel() {
  const {
    selectedStar,
    measureTarget,
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
            >
              ✕
            </button>

            <div className="side-name">{selectedStar.name}</div>
            <div className="side-type">{selectedStar.type}</div>

            {/* Spectral color swatch — this is where color lives */}
            <div className="side-color-band">
              <div
                className="side-color-swatch"
                style={{ background: bvToColor(selectedStar.bv) }}
              />
              <span className="side-color-label">
                Spectral class {selectedStar.spectral || '—'} &nbsp;·&nbsp; B−V {isFinite(selectedStar.bv) ? selectedStar.bv.toFixed(2) : '—'}
              </span>
            </div>
          </div>

          <div className="side-panel-body">

            {/* ── Distance & Position ── */}
            <Section title="Distance & Position">
              <Row label="Distance"
                value={selectedStar.dist_pc === 0 ? 'Here (Sol)' : formatDistance(selectedStar.dist_pc, scaleUnit)} />
              <Row label="Distance (ly)"
                value={selectedStar.dist_pc === 0 ? '0' : (selectedStar.dist_pc * 3.26156).toFixed(2) + ' ly'} />
              <Row label="Distance (pc)"
                value={selectedStar.dist_pc === 0 ? '0' : selectedStar.dist_pc.toFixed(4) + ' pc'} />
              <Row label="Parallax"
                value={parallaxFromDist(selectedStar.dist_pc)} mono />
              <Row label="Constellation"
                value={getConstellation(selectedStar.ra, selectedStar.dec)} />
            </Section>

            {/* ── Coordinates ── */}
            <Section title="Equatorial Coordinates">
              <Row label="RA"  value={formatRA(selectedStar.ra)}   mono />
              <Row label="Dec" value={formatDec(selectedStar.dec)} mono />
              <Row label="RA (°)"  value={selectedStar.ra.toFixed(4) + '°'}  mono />
              <Row label="Dec (°)" value={selectedStar.dec.toFixed(4) + '°'} mono />
            </Section>

            {/* ── Photometry ── */}
            <Section title="Photometry">
              <Row label="App. Magnitude"  value={selectedStar.mag.toFixed(2)} mono />
              <Row label="Abs. Magnitude"
                value={selectedStar.dist_pc > 0
                  ? absoluteMagnitude(selectedStar.mag, selectedStar.dist_pc)
                  : selectedStar.mag.toFixed(2)}
                mono />
              <Row label="B−V Color Index"
                value={isFinite(selectedStar.bv) ? selectedStar.bv.toFixed(3) : '—'} mono />
            </Section>

            {/* ── Physical Properties ── */}
            <Section title="Physical Properties">
              <Row label="Spectral Class" value={selectedStar.spectral || '—'} mono />
              <Row label="Temperature"
                value={isFinite(selectedStar.bv)
                  ? formatTemperature(estimateTemperature(selectedStar.bv))
                  : '—'} />
              <Row label="Mass (est.)" value={estimateMass(selectedStar.spectral)} />
              <Row label="Age (est.)"  value={estimateAge(selectedStar.spectral)} />
              <Row label="Planet Count" value="Unknown — no exoplanet data loaded" />
              <Row label="Type" value={selectedStar.type} />
            </Section>

            {/* ── Catalog ── */}
            <Section title="Catalog & Discovery">
              <Row label="Catalog"    value={selectedStar.catalog || '—'} />
              <Row label="HIP #"      value={selectedStar.hip > 0 ? selectedStar.hip.toString() : '—'} mono />
              <Row label="Object ID"  value={selectedStar.id.toString()} mono />
              <Row label="Data Source" value={selectedStar.hip > 0 ? 'Hipparcos (real coords)' : 'Generated catalog'} />
            </Section>

            {/* ── Measure ── */}
            {measureTarget && (
              <Section title={`Distance to ${measureTarget.name}`}>
                <Row label="Separation"
                  value={formatDistance(distanceBetween(selectedStar, measureTarget), scaleUnit)} />
                <Row label="Separation (ly)"
                  value={(distanceBetween(selectedStar, measureTarget) * 3.26156).toFixed(2) + ' ly'} />
              </Section>
            )}

            {/* ── Travel times ── */}
            {showTravelCalc && selectedStar.dist_pc > 0 && (() => {
              const dist = measureTarget
                ? distanceBetween(selectedStar, measureTarget)
                : selectedStar.dist_pc;
              const t = calcTravelTime(dist);
              return (
                <div className="side-section">
                  <div className="side-section-title">
                    Travel Time — from Sol to {measureTarget ? measureTarget.name : selectedStar.name}
                  </div>
                  {[
                    ['Speed of light (c)', t.lightspeed_years],
                    ['10% light speed', t.pct10c_years],
                    ['1% light speed', t.pct01c_years],
                    ['Voyager 1 speed (17 km/s)', t.voyager_years],
                  ].map(([label, val]) => (
                    <div className="travel-row-side" key={String(label)}>
                      <span className="travel-label-side">{String(label)}</span>
                      <span className="travel-value-side">{formatTravelTime(Number(val))}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.6rem', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
                    Relativistic effects not accounted for.
                  </div>
                </div>
              );
            })()}

            {/* ── Actions ── */}
            <div className="side-actions">
              <button
                className={`side-action-btn ${mode === 'measure' ? 'active' : ''}`}
                onClick={() => setMode(mode === 'measure' ? 'explore' : 'measure')}
              >
                {mode === 'measure' ? '↩ Cancel Measure' : '⟷ Measure to…'}
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
