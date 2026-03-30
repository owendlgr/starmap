'use client';
import { create } from 'zustand';
import type { Mission } from '../types';

interface EarthState {
  missions: Mission[];
  setMissions: (m: Mission[]) => void;

  selectedMission: Mission | null;
  setSelectedMission: (m: Mission | null) => void;

  showLaunchSites: boolean;
  setShowLaunchSites: (v: boolean) => void;

  showTrajectories: boolean;
  setShowTrajectories: (v: boolean) => void;

  missionFilter: string;  // 'all' | agency name
  setMissionFilter: (f: string) => void;

  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useEarthStore = create<EarthState>((set) => ({
  missions: [],
  setMissions: (m) => set({ missions: m }),

  selectedMission: null,
  setSelectedMission: (m) => set({ selectedMission: m }),

  showLaunchSites: true,
  setShowLaunchSites: (v) => set({ showLaunchSites: v }),

  showTrajectories: true,
  setShowTrajectories: (v) => set({ showTrajectories: v }),

  missionFilter: 'all',
  setMissionFilter: (f) => set({ missionFilter: f }),

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
