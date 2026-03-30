'use client';
import { create } from 'zustand';
import type { PlanetData } from '../types';

interface PlanetState {
  selectedPlanet: PlanetData | null;
  setSelectedPlanet: (p: PlanetData | null) => void;

  showOrbits: boolean;
  setShowOrbits: (v: boolean) => void;

  showLabels: boolean;
  setShowLabels: (v: boolean) => void;

  showMoons: boolean;
  setShowMoons: (v: boolean) => void;

  timeScale: number;  // animation speed multiplier
  setTimeScale: (v: number) => void;

  cameraTarget: string | null;  // planet id to focus on
  setCameraTarget: (id: string | null) => void;
}

export const usePlanetStore = create<PlanetState>((set) => ({
  selectedPlanet: null,
  setSelectedPlanet: (p) => set({ selectedPlanet: p }),

  showOrbits: true,
  setShowOrbits: (v) => set({ showOrbits: v }),

  showLabels: true,
  setShowLabels: (v) => set({ showLabels: v }),

  showMoons: true,
  setShowMoons: (v) => set({ showMoons: v }),

  timeScale: 1,
  setTimeScale: (v) => set({ timeScale: v }),

  cameraTarget: null,
  setCameraTarget: (id) => set({ cameraTarget: id }),
}));
