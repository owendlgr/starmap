'use client';
import { useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from '@/components/layout/TopNav';
import { MissionList } from '@/components/earth/MissionList';
import { MissionDetailPanel } from '@/components/earth/MissionDetailPanel';
import { useEarthStore } from '@/lib/stores/earthStore';
import type { Mission, LaunchSite } from '@/lib/types';

const EarthScene = dynamic(() => import('@/components/earth/EarthScene'), {
  ssr: false,
  loading: () => (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">Loading Globe</div>
    </div>
  ),
});

export default function EarthPage() {
  const missions = useEarthStore((s) => s.missions);
  const setMissions = useEarthStore((s) => s.setMissions);
  const selectedMission = useEarthStore((s) => s.selectedMission);
  const setSelectedMission = useEarthStore((s) => s.setSelectedMission);
  const showLaunchSites = useEarthStore((s) => s.showLaunchSites);
  const setShowLaunchSites = useEarthStore((s) => s.setShowLaunchSites);
  const missionFilter = useEarthStore((s) => s.missionFilter);
  const setMissionFilter = useEarthStore((s) => s.setMissionFilter);
  const loading = useEarthStore((s) => s.loading);
  const setLoading = useEarthStore((s) => s.setLoading);

  // Derive unique agencies from mission data
  const agencies = useMemo(() => {
    const agencySet = new Set<string>();
    missions.forEach((m) => agencySet.add(m.agency));
    return Array.from(agencySet).sort();
  }, [missions]);

  // Derived launch sites from missions
  const launchSites = useMemo(() => {
    const siteMap = new Map<string, LaunchSite>();
    missions.forEach((m) => {
      const key = `${m.launchSite.latitude.toFixed(1)},${m.launchSite.longitude.toFixed(1)}`;
      if (!siteMap.has(key)) {
        siteMap.set(key, {
          id: key,
          name: m.launchSite.name,
          country: m.agencyCountry ?? '',
          latitude: m.launchSite.latitude,
          longitude: m.launchSite.longitude,
          launchCount: 1,
        });
      } else {
        const existing = siteMap.get(key)!;
        existing.launchCount = (existing.launchCount ?? 0) + 1;
      }
    });
    return Array.from(siteMap.values());
  }, [missions]);

  // Filtered mission count for display
  const filteredCount = useMemo(() => {
    if (missionFilter === 'all') return missions.length;
    return missions.filter(
      (m) => m.agency.toLowerCase() === missionFilter.toLowerCase()
    ).length;
  }, [missions, missionFilter]);

  // Fetch mission data
  useEffect(() => {
    if (missions.length > 0) return;

    let cancelled = false;
    setLoading(true);

    async function fetchData() {
      try {
        const res = await fetch('/api/missions');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        if (!cancelled && data.missions) {
          setMissions(data.missions);
        }
      } catch (err) {
        console.error('Failed to load missions:', err);
        // Try loading static file directly as fallback
        try {
          const staticRes = await fetch('/data/missions.json');
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            if (!cancelled && Array.isArray(staticData) && staticData.length > 0) {
              setMissions(staticData);
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback fetch also failed:', fallbackErr);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [missions.length, setMissions, setLoading]);

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
        title="EARTH & MISSIONS"
        subtitle={`${filteredCount} LAUNCHES${missionFilter !== 'all' ? ` (${missionFilter.toUpperCase()})` : ''}`}
      />

      <div className="scene-area">
        {/* Layer panel */}
        <div className="layer-panel">
          <div className="layer-panel-header">
            <span>LAYERS</span>
          </div>
          <div className="layer-panel-body">
            <button className="layer-toggle" onClick={() => setShowLaunchSites(!showLaunchSites)}>
              <span className={`layer-checkbox ${showLaunchSites ? 'checked' : ''}`}>
                {showLaunchSites ? '\u2713' : ''}
              </span>
              <span>LAUNCH SITES</span>
            </button>
          </div>

          <div className="layer-panel-header">
            <span>AGENCY</span>
          </div>
          <div className="layer-panel-body">
            <button
              className="layer-toggle"
              onClick={() => setMissionFilter('all')}
            >
              <span className={`layer-checkbox ${missionFilter === 'all' ? 'checked' : ''}`}>
                {missionFilter === 'all' ? '\u2713' : ''}
              </span>
              <span>ALL ({missions.length})</span>
            </button>
            {agencies.map((agency) => (
              <button
                key={agency}
                className="layer-toggle"
                onClick={() => setMissionFilter(agency)}
              >
                <span className={`layer-checkbox ${missionFilter === agency ? 'checked' : ''}`}>
                  {missionFilter === agency ? '\u2713' : ''}
                </span>
                <span>{agency.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mission list panel (left overlay) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            maxWidth: '40vw',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '0.25rem',
              }}
            >
              Global Missions
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
              }}
            >
              {loading
                ? 'Loading...'
                : `${filteredCount} launches loaded`}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div className="loading-spinner" />
                <div className="loading-text">Fetching missions</div>
              </div>
            ) : (
              <MissionList
                missions={missions}
                selectedId={selectedMission?.id ?? null}
                filter={missionFilter}
                onSelect={handleSelectMission}
              />
            )}
          </div>
        </div>

        {/* Three.js Globe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '280px',
            right: 0,
            bottom: 0,
          }}
        >
          <EarthScene
            launchSites={showLaunchSites ? launchSites : []}
            onSelectSite={handleSelectSite}
          />
        </div>

        {/* Detail panel */}
        <MissionDetailPanel
          mission={selectedMission}
          onClose={handleCloseDetail}
        />
      </div>
    </>
  );
}
