'use client';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useEarthStore, filterMissions } from '@/lib/stores/earthStore';
import type { Mission } from '@/lib/types';

const BATCH_SIZE = 50;
const DISPLAY_LIMIT = 500;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function agencyAbbr(agency: string): string {
  const map: Record<string, string> = {
    'SpaceX': 'SPX', 'NASA': 'NASA', 'Roscosmos': 'RKA', 'RVSN USSR': 'USSR',
    'Soviet Space Program': 'USSR', 'Indian Space Research Organization': 'ISRO',
    'JAXA': 'JAXA', 'China Aerospace Science and Technology Corporation': 'CASC',
    'Arianespace': 'ASP', 'European Space Agency': 'ESA', 'Rocket Lab': 'RLAB',
    'United Launch Alliance': 'ULA', 'Blue Origin': 'BO',
    'Korea Aerospace Research Institute': 'KARI',
  };
  return map[agency] ?? agency.slice(0, 4).toUpperCase();
}

function countryFlag(code: string): string {
  if (!code || code.length < 2) return '';
  const map: Record<string, string> = {
    USA: 'US', RUS: 'RU', CHN: 'CN', IND: 'IN', JPN: 'JP',
    FRA: 'FR', NZL: 'NZ', KOR: 'KR', ISR: 'IL', GBR: 'GB', BRA: 'BR',
  };
  const iso = (map[code] ?? code.slice(0, 2)).toUpperCase();
  try {
    const first = 0x1f1e6 + iso.charCodeAt(0) - 65;
    const second = 0x1f1e6 + iso.charCodeAt(1) - 65;
    return String.fromCodePoint(first, second);
  } catch { return ''; }
}

function getStatusBadge(status: string): { label: string; bg: string; color: string } {
  const s = status.toLowerCase();
  if (s.includes('partial')) return { label: 'PART', bg: 'rgba(243, 156, 18, 0.15)', color: '#f39c12' };
  if (s.includes('success')) return { label: 'OK', bg: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' };
  if (s.includes('fail')) return { label: 'FAIL', bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' };
  if (s.includes('active') || s.includes('transit')) return { label: 'LIVE', bg: 'rgba(68, 255, 136, 0.15)', color: '#44ff88' };
  if (s.includes('go') || s.includes('tbd') || s.includes('tbc')) return { label: 'TBD', bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' };
  return { label: status.length > 6 ? status.slice(0, 6) : status, bg: 'rgba(160, 160, 190, 0.18)', color: '#b0b0c8' };
}

interface MissionListProps {
  missions: Mission[];
  selectedId: string | null;
  filter: string;
  onSelect: (mission: Mission) => void;
}

export function MissionList({ missions, selectedId, filter, onSelect }: MissionListProps) {
  const filters = useEarthStore((s) => s.filters);
  const setFilterSearch = useEarthStore((s) => s.setFilterSearch);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Apply full filter chain
  const filtered = useMemo(() => {
    // Legacy filter compat: if filter prop is set and not 'all', apply as agency filter
    const effectiveFilters = filter !== 'all'
      ? { ...filters, agency: filter }
      : filters;
    return filterMissions(missions, effectiveFilters);
  }, [missions, filters, filter]);

  useEffect(() => { setVisibleCount(BATCH_SIZE); }, [filters, filter]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, DISPLAY_LIMIT));
    }
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search input */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--bg-body)', border: '1px solid var(--border)',
          borderRadius: '3px', padding: '0 6px',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginRight: '4px' }}>⌕</span>
          <input
            type="text"
            placeholder="Search missions…"
            value={filters.search}
            onChange={(e) => setFilterSearch(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '11px', padding: '5px 0',
              fontFamily: 'var(--font)',
            }}
          />
          {filters.search && (
            <button
              onClick={() => setFilterSearch('')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-tertiary)',
                fontSize: '10px', padding: '2px', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Count bar */}
      <div style={{
        padding: '4px 8px', fontSize: '9px', fontWeight: 600,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span>{filtered.length} MISSIONS</span>
        {filtered.length !== missions.length && (
          <span style={{ color: 'var(--text-tertiary)' }}>OF {missions.length}</span>
        )}
      </div>

      {/* Mission cards */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-tertiary)', fontSize: '11px', textAlign: 'center' }}>
            No missions match your filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {visible.map((mission) => {
              const isActive = mission.id === selectedId;
              const badge = getStatusBadge(mission.status);
              return (
                <button
                  key={mission.id}
                  onClick={() => onSelect(mission)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: isActive ? 'var(--accent-bg)' : 'none',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    padding: '8px 10px', cursor: 'pointer',
                    transition: 'background 0.12s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-subtle-hover)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                >
                  {/* Top row: name + status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '3px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0,
                    }}>
                      {mission.isActive && (
                        <span style={{ color: 'var(--accent)', marginRight: '4px', fontSize: '8px' }}>●</span>
                      )}
                      {mission.name}
                    </span>
                    <span style={{
                      display: 'inline-block', padding: '1px 5px', borderRadius: '3px',
                      fontSize: '8px', fontWeight: 700, letterSpacing: '0.5px',
                      background: badge.bg, color: badge.color, flexShrink: 0,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                  {/* Bottom row: agency, date, rocket */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '9px', color: 'var(--text-secondary)', flexWrap: 'wrap',
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '2px',
                      padding: '0 4px', borderRadius: '2px', fontSize: '8px',
                      fontWeight: 600, background: 'rgba(100, 140, 255, 0.1)', color: 'var(--accent)',
                    }}>
                      {countryFlag(mission.agencyCountry ?? '')} {agencyAbbr(mission.agency)}
                    </span>
                    <span>{formatDate(mission.date)}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{mission.rocket}</span>
                    {mission.orbit && (
                      <span style={{ color: 'var(--text-tertiary)', opacity: 0.7, fontSize: '8px' }}>
                        {mission.orbit}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {visibleCount < Math.min(filtered.length, DISPLAY_LIMIT) && (
              <div ref={sentinelRef} style={{
                padding: '12px', textAlign: 'center', fontSize: '9px', color: 'var(--text-tertiary)',
              }}>
                Loading more ({visibleCount} of {Math.min(filtered.length, DISPLAY_LIMIT)})…
              </div>
            )}

            {filtered.length > DISPLAY_LIMIT && visibleCount >= DISPLAY_LIMIT && (
              <div style={{
                padding: '8px', textAlign: 'center', fontSize: '9px', color: 'var(--text-tertiary)',
                borderTop: '1px solid var(--border)',
              }}>
                Showing {DISPLAY_LIMIT} of {filtered.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
