'use client';
import { create } from 'zustand';
import type { Mission, MissionFilters, MissionStatus, MissionCategory, MissionDestination } from '../types';

export type ViewMode = 'earth' | 'deep-space';

interface EarthState {
  /* ── Mission data ──────────────────────────────────────── */
  missions: Mission[];
  setMissions: (m: Mission[]) => void;

  /* ── Selection ─────────────────────────────────────────── */
  selectedMission: Mission | null;
  setSelectedMission: (m: Mission | null) => void;

  /* ── View mode (Earth globe vs deep-space) ─────────────── */
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  /* ── Filters ───────────────────────────────────────────── */
  filters: MissionFilters;
  setFilterSearch: (q: string) => void;
  setFilterAgency: (a: string) => void;
  setFilterCategory: (c: MissionCategory | 'all') => void;
  setFilterDestination: (d: MissionDestination | 'all') => void;
  setFilterStatus: (s: MissionStatus | 'all') => void;
  setFilterDateRange: (r: [number, number] | null) => void;
  resetFilters: () => void;

  /* ── Layer toggles ─────────────────────────────────────── */
  showLaunchSites: boolean;
  setShowLaunchSites: (v: boolean) => void;

  showTrajectories: boolean;
  setShowTrajectories: (v: boolean) => void;

  showGrid: boolean;
  setShowGrid: (v: boolean) => void;

  showAtmosphere: boolean;
  setShowAtmosphere: (v: boolean) => void;

  /* ── Timeline ──────────────────────────────────────────── */
  timelinePosition: number; // 0-1, where in the mission timeline we are
  setTimelinePosition: (v: number) => void;
  timelinePlaying: boolean;
  setTimelinePlaying: (v: boolean) => void;

  /* ── Compat aliases ────────────────────────────────────── */
  missionFilter: string;
  setMissionFilter: (f: string) => void;

  /* ── Loading ───────────────────────────────────────────── */
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const DEFAULT_FILTERS: MissionFilters = {
  search: '',
  agency: 'all',
  category: 'all',
  destination: 'all',
  status: 'all',
  dateRange: null,
};

export const useEarthStore = create<EarthState>((set) => ({
  missions: [],
  setMissions: (m) => set({ missions: m }),

  selectedMission: null,
  setSelectedMission: (m) => set((s) => ({
    selectedMission: m,
    // Auto-switch to deep-space view if mission is deep-space
    viewMode: m?.isDeepSpace ? 'deep-space' : 'earth',
  })),

  viewMode: 'earth',
  setViewMode: (v) => set({ viewMode: v }),

  filters: { ...DEFAULT_FILTERS },
  setFilterSearch: (q) => set((s) => ({ filters: { ...s.filters, search: q } })),
  setFilterAgency: (a) => set((s) => ({ filters: { ...s.filters, agency: a } })),
  setFilterCategory: (c) => set((s) => ({ filters: { ...s.filters, category: c } })),
  setFilterDestination: (d) => set((s) => ({ filters: { ...s.filters, destination: d } })),
  setFilterStatus: (st) => set((s) => ({ filters: { ...s.filters, status: st } })),
  setFilterDateRange: (r) => set((s) => ({ filters: { ...s.filters, dateRange: r } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  showLaunchSites: true,
  setShowLaunchSites: (v) => set({ showLaunchSites: v }),

  showTrajectories: true,
  setShowTrajectories: (v) => set({ showTrajectories: v }),

  showGrid: true,
  setShowGrid: (v) => set({ showGrid: v }),

  showAtmosphere: true,
  setShowAtmosphere: (v) => set({ showAtmosphere: v }),

  timelinePosition: 0,
  setTimelinePosition: (v) => set({ timelinePosition: v }),
  timelinePlaying: false,
  setTimelinePlaying: (v) => set({ timelinePlaying: v }),

  // Compat: maps to filters.agency
  missionFilter: 'all',
  setMissionFilter: (f) => set((s) => ({
    missionFilter: f,
    filters: { ...s.filters, agency: f },
  })),

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));

/* ── Selector: filtered missions ─────────────────────────── */

export function filterMissions(missions: Mission[], filters: MissionFilters): Mission[] {
  let result = missions;

  // Text search
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.agency.toLowerCase().includes(q) ||
      m.rocket.toLowerCase().includes(q) ||
      (m.description?.toLowerCase().includes(q)) ||
      (m.orbit?.toLowerCase().includes(q))
    );
  }

  // Agency
  if (filters.agency !== 'all') {
    result = result.filter((m) => m.agency.toLowerCase() === filters.agency.toLowerCase());
  }

  // Category
  if (filters.category !== 'all') {
    result = result.filter((m) => m.category === filters.category);
  }

  // Destination
  if (filters.destination !== 'all') {
    result = result.filter((m) => m.destination === filters.destination);
  }

  // Status
  if (filters.status !== 'all') {
    result = result.filter((m) => {
      if (!m.statusCategory) {
        // Infer from status string
        const s = m.status.toLowerCase();
        if (filters.status === 'success') return s.includes('success');
        if (filters.status === 'failed') return s.includes('fail');
        if (filters.status === 'partial') return s.includes('partial');
        if (filters.status === 'active') return m.isActive === true;
        if (filters.status === 'upcoming') return s.includes('go') || s.includes('tbd') || s.includes('tbc');
      }
      return m.statusCategory === filters.status;
    });
  }

  // Date range
  if (filters.dateRange) {
    const [startYear, endYear] = filters.dateRange;
    result = result.filter((m) => {
      const year = new Date(m.date).getFullYear();
      return year >= startYear && year <= endYear;
    });
  }

  return result;
}
