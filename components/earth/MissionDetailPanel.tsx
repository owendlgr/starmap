'use client';
import type { Mission } from '@/lib/types';

interface MissionDetailPanelProps {
  mission: Mission | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
    });
  } catch { return ''; }
}

function formatCost(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  return `$${usd.toLocaleString()}`;
}

function formatMass(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toLocaleString()} kg`;
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('success')) return '#2ecc71';
  if (s.includes('fail')) return '#e74c3c';
  if (s.includes('partial')) return '#f39c12';
  if (s.includes('active') || s.includes('transit')) return '#44ff88';
  if (s.includes('go') || s.includes('tbd') || s.includes('tbc')) return '#3498db';
  return '#8888a0';
}

function stageStatusIcon(status?: string): string {
  switch (status) {
    case 'completed': return '✓';
    case 'active': return '●';
    case 'upcoming': return '○';
    case 'failed': return '✕';
    default: return '·';
  }
}

function stageStatusColor(status?: string): string {
  switch (status) {
    case 'completed': return 'var(--accent)';
    case 'active': return '#44ff88';
    case 'upcoming': return 'var(--text-tertiary)';
    case 'failed': return 'var(--accent-red)';
    default: return 'var(--text-secondary)';
  }
}

export function MissionDetailPanel({ mission, onClose }: MissionDetailPanelProps) {
  const isOpen = mission !== null;

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
      {mission && (
        <>
          <div className="detail-header">
            <button className="detail-close" onClick={onClose} title="Close">✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {mission.isActive && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                  color: '#44ff88', textTransform: 'uppercase',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#44ff88', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  ACTIVE
                </span>
              )}
            </div>
            <div className="detail-name">{mission.name}</div>
            <div className="detail-subtitle">
              {mission.agency}
              {mission.agencyCountry ? ` (${mission.agencyCountry})` : ''}
              {' · '}{mission.rocket}
            </div>
          </div>

          <div className="detail-body">
            {/* Mission Patch */}
            {mission.patchUrl && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mission.patchUrl} alt="Mission patch" style={{
                  maxWidth: '80px', maxHeight: '80px', objectFit: 'contain', opacity: 0.9,
                }} />
              </div>
            )}

            {/* Mission Image */}
            {mission.imageUrl && (
              <div style={{ padding: '4px 0 8px', overflow: 'hidden', borderRadius: '4px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mission.imageUrl} alt={mission.name} style={{
                  maxWidth: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '4px', opacity: 0.9,
                }} />
              </div>
            )}

            {/* ── Mission Info ────────────────────────────── */}
            <div className="data-section">
              <div className="data-section-title">Mission</div>
              <div className="data-grid">
                <span className="data-label">Status</span>
                <span className="data-value" style={{ color: statusColor(mission.status), fontWeight: 700 }}>
                  {mission.status}
                </span>

                <span className="data-label">Launch</span>
                <span className="data-value">{formatDate(mission.date)}</span>

                <span className="data-label">Time</span>
                <span className="data-value mono">{formatTime(mission.date)}</span>

                {mission.endDate && (<>
                  <span className="data-label">End Date</span>
                  <span className="data-value">{formatDate(mission.endDate)}</span>
                </>)}

                <span className="data-label">Agency</span>
                <span className="data-value">{mission.agency}</span>

                <span className="data-label">Rocket</span>
                <span className="data-value">{mission.rocket}</span>

                {mission.orbit && (<>
                  <span className="data-label">Orbit</span>
                  <span className="data-value">{mission.orbit}</span>
                </>)}

                {mission.missionType && (<>
                  <span className="data-label">Type</span>
                  <span className="data-value">{mission.missionType}</span>
                </>)}

                {mission.payload && (<>
                  <span className="data-label">Payload</span>
                  <span className="data-value">{mission.payload}</span>
                </>)}

                {mission.massKg && (<>
                  <span className="data-label">Mass</span>
                  <span className="data-value mono">{formatMass(mission.massKg)}</span>
                </>)}

                {mission.costUSD && (<>
                  <span className="data-label">Cost</span>
                  <span className="data-value mono">{formatCost(mission.costUSD)}</span>
                </>)}
              </div>
            </div>

            {/* ── Crew ────────────────────────────────────── */}
            {mission.crew && mission.crew.length > 0 && (
              <div className="data-section">
                <div className="data-section-title">Crew ({mission.crew.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {mission.crew.map((c, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      padding: '2px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {c.role}
                        {c.agency && ` · ${c.agency}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Mission Stages ──────────────────────────── */}
            {mission.stages && mission.stages.length > 0 && (
              <div className="data-section">
                <div className="data-section-title">Mission Stages</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {mission.stages.map((stage, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                      padding: '4px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{
                        fontSize: '12px', color: stageStatusColor(stage.status),
                        width: '14px', textAlign: 'center', flexShrink: 0, paddingTop: '1px',
                      }}>
                        {stageStatusIcon(stage.status)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {stage.name}
                        </div>
                        {stage.description && (
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {stage.description}
                          </div>
                        )}
                        {stage.date && (
                          <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                            {formatDate(stage.date)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Trajectory Waypoints ────────────────────── */}
            {mission.waypoints && mission.waypoints.length > 0 && (
              <div className="data-section">
                <div className="data-section-title">Trajectory</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {mission.waypoints.map((wp, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      padding: '3px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>
                          {wp.label}
                        </span>
                        {wp.body && (
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                            {wp.body}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {wp.date && (
                          <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                            {formatDate(wp.date)}
                          </div>
                        )}
                        {wp.distanceAU && (
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {wp.distanceAU.toFixed(2)} AU
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Launch Site ─────────────────────────────── */}
            <div className="data-section">
              <div className="data-section-title">Launch Site</div>
              <div className="data-grid">
                <span className="data-label">Name</span>
                <span className="data-value">{mission.launchSite.name}</span>
                <span className="data-label">Lat</span>
                <span className="data-value mono">{mission.launchSite.latitude.toFixed(4)}°</span>
                <span className="data-label">Lon</span>
                <span className="data-value mono">{mission.launchSite.longitude.toFixed(4)}°</span>
              </div>
            </div>

            {/* ── Description ─────────────────────────────── */}
            {mission.description && (
              <div className="data-section">
                <div className="data-section-title">Details</div>
                <p style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {mission.description}
                </p>
              </div>
            )}

            {/* ── Links ──────────────────────────────────── */}
            {(mission.nasaUrl || mission.wikiUrl) && (
              <div className="data-section">
                <div className="data-section-title">Links</div>
                <div className="action-group">
                  {mission.nasaUrl && (
                    <a href={mission.nasaUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ textDecoration: 'none' }}>
                      NASA
                    </a>
                  )}
                  {mission.wikiUrl && (
                    <a href={mission.wikiUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ textDecoration: 'none' }}>
                      WIKIPEDIA
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Telemetry ──────────────────────────────── */}
            {mission.telemetry && mission.telemetry.length > 0 && (
              <div className="data-section">
                <div className="data-section-title">Telemetry ({mission.telemetry.length} points)</div>
                <table className="planet-table">
                  <thead>
                    <tr>
                      <th>T+</th>
                      <th>ALT</th>
                      <th>VEL</th>
                      <th>RANGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mission.telemetry.slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <td>{t.time}s</td>
                        <td>{t.altitude.toFixed(0)} km</td>
                        <td>{t.velocity.toFixed(0)} m/s</td>
                        <td>{t.downrange.toFixed(0)} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
