'use client';
import type { Mission } from '@/lib/types';

interface MissionDetailPanelProps {
  mission: Mission | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '';
  }
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('success')) return '#2ecc71';
  if (s.includes('fail')) return '#e74c3c';
  if (s.includes('partial')) return '#f39c12';
  if (s.includes('go') || s.includes('tbd') || s.includes('tbc')) return '#3498db';
  return '#8888a0';
}

export function MissionDetailPanel({ mission, onClose }: MissionDetailPanelProps) {
  const isOpen = mission !== null;

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
      {mission && (
        <>
          <div className="detail-header">
            <button className="detail-close" onClick={onClose} title="Close">
              {'\u2715'}
            </button>
            <div className="detail-name">{mission.name}</div>
            <div className="detail-subtitle">
              {mission.agency}
              {mission.agencyCountry ? ` (${mission.agencyCountry})` : ''}
              {' \u00B7 '}
              {mission.rocket}
            </div>
          </div>

          <div className="detail-body">
            {/* Mission Image */}
            {mission.imageUrl && (
              <div className="data-section">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0.25rem 0 0.5rem',
                    overflow: 'hidden',
                    borderRadius: '6px',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mission.imageUrl}
                    alt={`${mission.name}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '180px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      opacity: 0.92,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mission Info */}
            <div className="data-section">
              <div className="data-section-title">Mission</div>
              <div className="data-grid">
                <span className="data-label">Status</span>
                <span className="data-value" style={{ color: statusColor(mission.status) }}>
                  {mission.status}
                </span>

                <span className="data-label">Date</span>
                <span className="data-value">{formatDate(mission.date)}</span>

                <span className="data-label">Time</span>
                <span className="data-value mono">{formatTime(mission.date)}</span>

                <span className="data-label">Agency</span>
                <span className="data-value">{mission.agency}</span>

                {mission.agencyCountry && (
                  <>
                    <span className="data-label">Country</span>
                    <span className="data-value">{mission.agencyCountry}</span>
                  </>
                )}

                <span className="data-label">Rocket</span>
                <span className="data-value">{mission.rocket}</span>

                {mission.orbit && (
                  <>
                    <span className="data-label">Orbit</span>
                    <span className="data-value">{mission.orbit}</span>
                  </>
                )}

                {mission.missionType && (
                  <>
                    <span className="data-label">Type</span>
                    <span className="data-value">{mission.missionType}</span>
                  </>
                )}
              </div>
            </div>

            {/* Launch Site */}
            <div className="data-section">
              <div className="data-section-title">Launch Site</div>
              <div className="data-grid">
                <span className="data-label">Name</span>
                <span className="data-value">{mission.launchSite.name}</span>

                <span className="data-label">Latitude</span>
                <span className="data-value mono">
                  {mission.launchSite.latitude.toFixed(4)}{'\u00B0'}
                </span>

                <span className="data-label">Longitude</span>
                <span className="data-value mono">
                  {mission.launchSite.longitude.toFixed(4)}{'\u00B0'}
                </span>
              </div>
            </div>

            {/* Details */}
            {mission.description && (
              <div className="data-section">
                <div className="data-section-title">Details</div>
                <p
                  style={{
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {mission.description}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
