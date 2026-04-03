'use client';
import { useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from '@/components/layout/TopNav';
import { MissionList } from '@/components/earth/MissionList';
import { MissionDetailPanel } from '@/components/earth/MissionDetailPanel';
import { MissionTimeline } from '@/components/earth/MissionTimeline';
import { useEarthStore, filterMissions } from '@/lib/stores/earthStore';
import { useAppStore } from '@/lib/stores/appStore';
import type { Mission, LaunchSite, MissionStatus } from '@/lib/types';
import { hasRealTrajectory } from '@/lib/trajectoryLoader';

const EarthScene = dynamic(
  () => import('@/components/earth/EarthScene').then((m) => ({ default: m.EarthScene })),
  {
    ssr: false,
    loading: () => (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Loading Mission Control</div>
      </div>
    ),
  }
);

const DeepSpaceView = dynamic(
  () => import('@/components/earth/DeepSpaceView').then((m) => ({ default: m.DeepSpaceView })),
  {
    ssr: false,
    loading: () => (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Loading Deep Space View</div>
      </div>
    ),
  }
);

const STATUS_FILTERS: { value: MissionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'active', label: 'ACTIVE' },
  { value: 'success', label: 'SUCCESS' },
  { value: 'failed', label: 'FAILED' },
  { value: 'upcoming', label: 'UPCOMING' },
];

export default function MissionsPage() {
  const missions = useEarthStore((s) => s.missions);
  const setMissions = useEarthStore((s) => s.setMissions);
  const selectedMission = useEarthStore((s) => s.selectedMission);
  const setSelectedMission = useEarthStore((s) => s.setSelectedMission);
  const showLaunchSites = useEarthStore((s) => s.showLaunchSites);
  const setShowLaunchSites = useEarthStore((s) => s.setShowLaunchSites);
  const showTrajectories = useEarthStore((s) => s.showTrajectories);
  const setShowTrajectories = useEarthStore((s) => s.setShowTrajectories);
  const showGrid = useEarthStore((s) => s.showGrid);
  const setShowGrid = useEarthStore((s) => s.setShowGrid);
  const showAtmosphere = useEarthStore((s) => s.showAtmosphere);
  const setShowAtmosphere = useEarthStore((s) => s.setShowAtmosphere);
  const viewMode = useEarthStore((s) => s.viewMode);
  const setViewMode = useEarthStore((s) => s.setViewMode);
  const filters = useEarthStore((s) => s.filters);
  const setFilterAgency = useEarthStore((s) => s.setFilterAgency);
  const setFilterStatus = useEarthStore((s) => s.setFilterStatus);
  const loading = useEarthStore((s) => s.loading);
  const setLoading = useEarthStore((s) => s.setLoading);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);
  const setLastUpdated = useAppStore((s) => s.setLastUpdated);

  // Derive agencies
  const agencies = useMemo(() => {
    const set = new Set<string>();
    missions.forEach((m) => set.add(m.agency));
    return Array.from(set).sort();
  }, [missions]);

  // Derive launch sites
  const launchSites = useMemo(() => {
    const siteMap = new Map<string, LaunchSite>();
    missions.forEach((m) => {
      const key = `${m.launchSite.latitude.toFixed(1)},${m.launchSite.longitude.toFixed(1)}`;
      if (!siteMap.has(key)) {
        siteMap.set(key, {
          id: key, name: m.launchSite.name, country: m.agencyCountry ?? '',
          latitude: m.launchSite.latitude, longitude: m.launchSite.longitude, launchCount: 1,
        });
      } else {
        siteMap.get(key)!.launchCount = (siteMap.get(key)!.launchCount ?? 0) + 1;
      }
    });
    return Array.from(siteMap.values());
  }, [missions]);

  // Filtered count
  const filtered = useMemo(() => filterMissions(missions, filters), [missions, filters]);

  // Fetch missions
  useEffect(() => {
    if (missions.length > 0) return;
    let cancelled = false;
    setLoading(true);
    setStatusMessage('Loading missions…');

    async function fetchData() {
      try {
        const res = await fetch('/api/missions');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (!cancelled && data.missions) {
          setMissions(data.missions);
          setStatusMessage(`${data.missions.length} missions loaded`);
          setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch {
        try {
          const staticRes = await fetch('/data/missions.json');
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            if (!cancelled && Array.isArray(staticData) && staticData.length > 0) {
              setMissions(staticData);
              setStatusMessage(`${staticData.length} missions (cached)`);
            }
          }
        } catch { /* fallback also failed */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [missions.length, setMissions, setLoading, setStatusMessage, setLastUpdated]);

  const handleSelectSite = useCallback(
    (site: LaunchSite) => {
      const siteMission = missions.find(
        (m) =>
          Math.abs(m.launchSite.latitude - site.latitude) < 0.1 &&
          Math.abs(m.launchSite.longitude - site.longitude) < 0.1
      );
      if (siteMission) setSelectedMission(siteMission);
    },
    [missions, setSelectedMission]
  );

  const handleSelectMission = useCallback(
    (mission: Mission) => setSelectedMission(mission),
    [setSelectedMission]
  );

  const handleCloseDetail = useCallback(
    () => setSelectedMission(null),
    [setSelectedMission]
  );

  return (
    <>
      <TopNav
        title="MISSION CONTROL"
        subtitle={`${filtered.length} MISSIONS${filters.agency !== 'all' ? ` · ${filters.agency.toUpperCase()}` : ''}${filters.status !== 'all' ? ` · ${filters.status.toUpperCase()}` : ''}`}
      >
        {/* Status filter quick-buttons in the top nav */}
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            className={`btn ${filters.status === sf.value ? 'active' : ''}`}
            onClick={() => setFilterStatus(sf.value)}
            style={{ fontSize: '9px', padding: '2px 6px' }}
          >
            {sf.label}
          </button>
        ))}
      </TopNav>

      <div className="scene-area" style={{ display: 'flex', flexDirection: 'row' }}>
        {/* Left panel: Mission list */}
        <div style={{
          width: '280px', maxWidth: '40vw', flexShrink: 0,
          background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '2px',
            }}>
              Global Missions
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              {loading ? 'Loading…' : `${filtered.length} of ${missions.length} launches`}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: '8px' }}>
                <div className="loading-spinner" />
                <div className="loading-text">Fetching missions</div>
              </div>
            ) : (
              <MissionList
                missions={missions}
                selectedId={selectedMission?.id ?? null}
                filter={filters.agency}
                onSelect={handleSelectMission}
              />
            )}
          </div>
        </div>

        {/* Center: Globe viewport */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {/* Layer panel — top right */}
          <div className="layer-panel" style={{ position: 'absolute', top: '8px', right: '8px', left: 'auto', zIndex: 10 }}>
            <div className="layer-panel-header"><span>LAYERS</span></div>
            <div className="layer-panel-body">
              <button className="layer-toggle" onClick={() => setShowLaunchSites(!showLaunchSites)}>
                <span className={`layer-checkbox ${showLaunchSites ? 'checked' : ''}`}>{showLaunchSites ? '✓' : ''}</span>
                <span>LAUNCH SITES</span>
              </button>
              <button className="layer-toggle" onClick={() => setShowTrajectories(!showTrajectories)}>
                <span className={`layer-checkbox ${showTrajectories ? 'checked' : ''}`}>{showTrajectories ? '✓' : ''}</span>
                <span>TRAJECTORIES</span>
              </button>
              <button className="layer-toggle" onClick={() => setShowGrid(!showGrid)}>
                <span className={`layer-checkbox ${showGrid ? 'checked' : ''}`}>{showGrid ? '✓' : ''}</span>
                <span>GRID</span>
              </button>
              <button className="layer-toggle" onClick={() => setShowAtmosphere(!showAtmosphere)}>
                <span className={`layer-checkbox ${showAtmosphere ? 'checked' : ''}`}>{showAtmosphere ? '✓' : ''}</span>
                <span>ATMOSPHERE</span>
              </button>
            </div>

            <div className="layer-panel-header"><span>AGENCY</span></div>
            <div className="layer-panel-body">
              <button className="layer-toggle" onClick={() => setFilterAgency('all')}>
                <span className={`layer-checkbox ${filters.agency === 'all' ? 'checked' : ''}`}>{filters.agency === 'all' ? '✓' : ''}</span>
                <span>ALL ({missions.length})</span>
              </button>
              {agencies.map((agency) => (
                <button key={agency} className="layer-toggle" onClick={() => setFilterAgency(agency)}>
                  <span className={`layer-checkbox ${filters.agency === agency ? 'checked' : ''}`}>{filters.agency === agency ? '✓' : ''}</span>
                  <span>{agency.length > 20 ? agency.slice(0, 18) + '…' : agency.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Viewport — Globe or Deep Space */}
          {viewMode === 'deep-space' && selectedMission?.isDeepSpace ? (
            <>
              <DeepSpaceView mission={selectedMission} />
              {/* Back to globe button */}
              <button
                onClick={() => setViewMode('earth')}
                style={{
                  position: 'absolute', top: '8px', left: '8px', zIndex: 20,
                  background: 'rgba(10,10,10,0.8)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '4px 10px', fontSize: '10px',
                  fontFamily: 'var(--font)', borderRadius: '3px', cursor: 'pointer',
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  backdropFilter: 'blur(4px)',
                }}
              >
                ← EARTH VIEW
              </button>
              {/* SPICE data badge */}
              <div style={{
                position: 'absolute', bottom: '8px', left: '8px', zIndex: 20,
                background: 'rgba(10,10,10,0.8)', border: '1px solid var(--accent-border)',
                padding: '4px 8px', fontSize: '9px', fontFamily: 'var(--font)',
                color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase',
                borderRadius: '3px', backdropFilter: 'blur(4px)',
              }}>
                ◉ SPICE TRAJECTORY DATA — NASA JPL HORIZONS
              </div>
            </>
          ) : (
            <>
              <EarthScene
                launchSites={showLaunchSites ? launchSites : []}
                onSelectSite={handleSelectSite}
              />
              {/* Deep space button when applicable */}
              {selectedMission?.isDeepSpace && (
                <button
                  onClick={() => setViewMode('deep-space')}
                  style={{
                    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 20, background: 'rgba(10,10,10,0.8)',
                    border: '1px solid var(--accent-border)',
                    color: 'var(--accent)', padding: '6px 16px', fontSize: '10px',
                    fontFamily: 'var(--font)', borderRadius: '3px', cursor: 'pointer',
                    letterSpacing: '1px', textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  VIEW FULL TRAJECTORY →
                </button>
              )}
            </>
          )}

          {/* Mission timeline slider */}
          <MissionTimeline mission={selectedMission} />
        </div>

        {/* Right: Detail panel */}
        <MissionDetailPanel mission={selectedMission} onClose={handleCloseDetail} />
      </div>
    </>
  );
}
