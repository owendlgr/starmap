'use client';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { Mission } from '@/lib/types';

interface MissionListProps {
  missions: Mission[];
  selectedId: string | null;
  filter: string;
  onSelect: (mission: Mission) => void;
}

const DISPLAY_LIMIT = 200;
const BATCH_SIZE = 50;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Short agency abbreviation for badges */
function agencyAbbr(agency: string): string {
  const map: Record<string, string> = {
    'SpaceX': 'SPX',
    'NASA': 'NASA',
    'Roscosmos': 'RKA',
    'RVSN USSR': 'USSR',
    'Soviet Space Program': 'USSR',
    'Indian Space Research Organization': 'ISRO',
    'JAXA': 'JAXA',
    'China Aerospace Science and Technology Corporation': 'CASC',
    'Arianespace': 'ASP',
    'European Space Agency': 'ESA',
    'Rocket Lab': 'RLAB',
    'United Launch Alliance': 'ULA',
    'Blue Origin': 'BO',
    'Korea Aerospace Research Institute': 'KARI',
  };
  return map[agency] ?? agency.slice(0, 4).toUpperCase();
}

/** Country code to flag emoji for badges */
function countryFlag(code: string): string {
  if (!code || code.length < 2) return '';
  const map: Record<string, string> = {
    USA: 'US',
    RUS: 'RU',
    CHN: 'CN',
    IND: 'IN',
    JPN: 'JP',
    FRA: 'FR',
    NZL: 'NZ',
    KOR: 'KR',
    ISR: 'IL',
    GBR: 'GB',
    BRA: 'BR',
  };
  const iso = (map[code] ?? code.slice(0, 2)).toUpperCase();
  try {
    const first = 0x1f1e6 + iso.charCodeAt(0) - 65;
    const second = 0x1f1e6 + iso.charCodeAt(1) - 65;
    return String.fromCodePoint(first, second);
  } catch {
    return '';
  }
}

function StatusBadge({ status }: { status: string }) {
  const style: React.CSSProperties = {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '0.58rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    flexShrink: 0,
  };

  const normalized = status.toLowerCase();
  if (normalized.includes('success')) {
    return (
      <span style={{ ...style, background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' }}>
        Success
      </span>
    );
  }
  if (normalized.includes('fail')) {
    return (
      <span style={{ ...style, background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' }}>
        Failed
      </span>
    );
  }
  if (normalized.includes('partial')) {
    return (
      <span style={{ ...style, background: 'rgba(243, 156, 18, 0.15)', color: '#f39c12' }}>
        Partial
      </span>
    );
  }
  if (normalized.includes('go') || normalized.includes('tbd') || normalized.includes('tbc')) {
    return (
      <span style={{ ...style, background: 'rgba(52, 152, 219, 0.15)', color: '#3498db' }}>
        Upcoming
      </span>
    );
  }
  return (
    <span style={{ ...style, background: 'rgba(136, 136, 160, 0.15)', color: '#8888a0' }}>
      {status.length > 10 ? status.slice(0, 10) : status}
    </span>
  );
}

function AgencyBadge({ agency, country }: { agency: string; country?: string }) {
  const flag = countryFlag(country ?? '');
  const abbr = agencyAbbr(agency);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '1px 5px',
        borderRadius: '3px',
        fontSize: '0.56rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: 'rgba(100, 140, 255, 0.1)',
        color: 'var(--accent)',
        flexShrink: 0,
      }}
    >
      {flag && <span style={{ fontSize: '0.7rem' }}>{flag}</span>}
      {abbr}
    </span>
  );
}

export function MissionList({ missions, selectedId, filter, onSelect }: MissionListProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return missions;
    return missions.filter(
      (m) => m.agency.toLowerCase() === filter.toLowerCase()
    );
  }, [missions, filter]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [filter]);

  // Intersection observer for progressive loading
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, DISPLAY_LIMIT));
      }
    },
    []
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const visible = filtered.slice(0, visibleCount);

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
        No missions found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
      }}
    >
      {visible.map((mission) => {
        const isActive = mission.id === selectedId;
        return (
          <button
            key={mission.id}
            onClick={() => onSelect(mission)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: isActive ? 'var(--accent-dim)' : 'none',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              padding: '0.6rem 0.75rem',
              cursor: 'pointer',
              transition: 'background 0.12s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--hover)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'none';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                marginBottom: '0.2rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {mission.name}
              </span>
              <StatusBadge status={mission.status} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                fontWeight: 500,
                flexWrap: 'wrap',
              }}
            >
              <AgencyBadge agency={mission.agency} country={mission.agencyCountry} />
              <span>{formatDate(mission.date)}</span>
              <span>{mission.rocket}</span>
              {mission.orbit && (
                <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                  {mission.orbit}
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* Sentinel for progressive loading */}
      {visibleCount < Math.min(filtered.length, DISPLAY_LIMIT) && (
        <div
          ref={sentinelRef}
          style={{
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          Loading more ({visibleCount} of {Math.min(filtered.length, DISPLAY_LIMIT)})...
        </div>
      )}

      {filtered.length > DISPLAY_LIMIT && visibleCount >= DISPLAY_LIMIT && (
        <div
          style={{
            padding: '0.75rem',
            textAlign: 'center',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)',
          }}
        >
          Showing {DISPLAY_LIMIT} of {filtered.length} missions
        </div>
      )}
    </div>
  );
}
