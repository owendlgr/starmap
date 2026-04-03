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

  showDwarfPlanets: boolean;
  setShowDwarfPlanets: (v: boolean) => void;

  showAsteroidBelt: boolean;
  setShowAsteroidBelt: (v: boolean) => void;

  showKuiperBelt: boolean;
  setShowKuiperBelt: (v: boolean) => void;

  timeScale: number;  // animation speed multiplier (0 = paused)
  setTimeScale: (v: number) => void;

  /** Julian Date for planet positions. null = current date (live). */
  simulationDate: Date;
  setSimulationDate: (d: Date) => void;

  /** Days offset from J2000 epoch for orbital calculations */
  daysSinceJ2000: number;

  cameraTarget: string | null;  // planet id to focus on
  setCameraTarget: (id: string | null) => void;
}

/** J2000.0 epoch: January 1, 2000, 12:00 TT */
const J2000 = new Date('2000-01-01T12:00:00Z');

function dateToDaysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000.getTime()) / (86400 * 1000);
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

  showDwarfPlanets: true,
  setShowDwarfPlanets: (v) => set({ showDwarfPlanets: v }),

  showAsteroidBelt: true,
  setShowAsteroidBelt: (v) => set({ showAsteroidBelt: v }),

  showKuiperBelt: false,
  setShowKuiperBelt: (v) => set({ showKuiperBelt: v }),

  timeScale: 0, // start paused — show current positions
  setTimeScale: (v) => set({ timeScale: v }),

  simulationDate: new Date(),
  setSimulationDate: (d) => set({
    simulationDate: d,
    daysSinceJ2000: dateToDaysSinceJ2000(d),
  }),
  daysSinceJ2000: dateToDaysSinceJ2000(new Date()),

  cameraTarget: null,
  setCameraTarget: (id) => set({ cameraTarget: id }),
}));
