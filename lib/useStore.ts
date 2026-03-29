'use client';
import { create } from 'zustand';
import type { Star, ScaleUnit, InteractionMode } from './types';

interface StoreState {
  stars: Star[];
  loadedChunks: Set<string>;
  addStars: (chunk: string, stars: Star[]) => void;

  selectedStar: Star | null;
  measureTarget: Star | null;
  setSelected: (star: Star | null) => void;
  setMeasureTarget: (star: Star | null) => void;

  mode: InteractionMode;
  setMode: (m: InteractionMode) => void;

  showStars: boolean;
  showGalaxies: boolean;
  showNebulae: boolean;
  showClusters: boolean;
  toggleLayer: (layer: 'stars' | 'galaxies' | 'nebulae' | 'clusters') => void;

  scaleUnit: ScaleUnit;
  setScaleUnit: (u: ScaleUnit) => void;

  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  showDepthLines: boolean;
  setShowDepthLines: (v: boolean) => void;
  showTravelCalc: boolean;
  setShowTravelCalc: (v: boolean) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  showSources: boolean;
  setShowSources: (v: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  stars: [],
  loadedChunks: new Set(),
  addStars: (chunk, newStars) => set(state => {
    if (state.loadedChunks.has(chunk)) return state;
    const next = new Set(state.loadedChunks);
    next.add(chunk);
    return { stars: [...state.stars, ...newStars], loadedChunks: next };
  }),

  selectedStar: null,
  measureTarget: null,
  setSelected: (star) => set({ selectedStar: star }),
  setMeasureTarget: (star) => set({ measureTarget: star }),

  mode: 'explore',
  setMode: (m) => set({ mode: m }),

  showStars: true,
  showGalaxies: true,
  showNebulae: true,
  showClusters: true,
  toggleLayer: (layer) => set(state => ({
    showStars:    layer === 'stars'    ? !state.showStars    : state.showStars,
    showGalaxies: layer === 'galaxies' ? !state.showGalaxies : state.showGalaxies,
    showNebulae:  layer === 'nebulae'  ? !state.showNebulae  : state.showNebulae,
    showClusters: layer === 'clusters' ? !state.showClusters : state.showClusters,
  })),

  scaleUnit: 'ly',
  setScaleUnit: (u) => set({ scaleUnit: u }),

  showLabels: true,
  setShowLabels: (v) => set({ showLabels: v }),
  showDepthLines: true,
  setShowDepthLines: (v) => set({ showDepthLines: v }),
  showTravelCalc: false,
  setShowTravelCalc: (v) => set({ showTravelCalc: v }),
  showSearch: false,
  setShowSearch: (v) => set({ showSearch: v }),
  showSources: false,
  setShowSources: (v) => set({ showSources: v }),
}));
