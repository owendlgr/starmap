'use client';
import { create } from 'zustand';
import type { GalaxyData } from '../types';

interface GalaxyState {
  galaxies: GalaxyData[];
  setGalaxies: (g: GalaxyData[]) => void;

  selectedGalaxy: GalaxyData | null;
  setSelectedGalaxy: (g: GalaxyData | null) => void;

  showLabels: boolean;
  setShowLabels: (v: boolean) => void;

  showMilkyWay: boolean;
  setShowMilkyWay: (v: boolean) => void;

  filterType: string;  // 'all' | 'G' | 'GC' | etc.
  setFilterType: (t: string) => void;

  maxMagnitude: number;
  setMaxMagnitude: (v: number) => void;

  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  galaxies: [],
  setGalaxies: (g) => set({ galaxies: g }),

  selectedGalaxy: null,
  setSelectedGalaxy: (g) => set({ selectedGalaxy: g }),

  showLabels: true,
  setShowLabels: (v) => set({ showLabels: v }),

  showMilkyWay: true,
  setShowMilkyWay: (v) => set({ showMilkyWay: v }),

  filterType: 'all',
  setFilterType: (t) => set({ filterType: t }),

  maxMagnitude: 18,
  setMaxMagnitude: (v) => set({ maxMagnitude: v }),

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
