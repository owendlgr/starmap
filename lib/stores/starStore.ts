'use client';
import { create } from 'zustand';
import type { Star, ScaleUnit, InteractionMode, ThemeMode } from '../types';

interface StarState {
  stars: Star[];
  loadedChunks: Set<string>;
  addStars: (chunk: string, stars: Star[]) => void;

  selectedStar: Star | null;
  measureTarget: Star | null;
  setSelected: (star: Star | null) => void;
  setMeasureTarget: (star: Star | null) => void;

  mode: InteractionMode;
  setMode: (m: InteractionMode) => void;

  showHipparcos: boolean;
  showExoplanets: boolean;
  showGaia: boolean;
  showConstellations: boolean;
  setShowHipparcos: (v: boolean) => void;
  setShowExoplanets: (v: boolean) => void;
  setShowGaia: (v: boolean) => void;
  setShowConstellations: (v: boolean) => void;

  scaleUnit: ScaleUnit;
  setScaleUnit: (u: ScaleUnit) => void;

  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  showDepthLines: boolean;
  setShowDepthLines: (v: boolean) => void;
  showTravelCalc: boolean;
  setShowTravelCalc: (v: boolean) => void;

  exoHostCount: number;
  setExoHostCount: (n: number) => void;

  cameraResetTick: number;
  triggerCameraReset: () => void;
  zoomTarget: number;
  _zoomLerpTick: number;
  setZoomTarget: (v: number) => void;
  syncCameraZoom: (v: number) => void;

  cameraFlyTarget: { x: number; y: number; z: number } | null;
  _cameraFlyTick: number;
  setCameraFlyTarget: (pos: { x: number; y: number; z: number } | null) => void;

  mapMode: '3d' | '2d';
  setMapMode: (m: '3d' | '2d') => void;

  magLimit: number;
  setMagLimit: (v: number) => void;

  hoveredStar: Star | null;
  setHoveredStar: (star: Star | null) => void;

  flattenAmount: number;
  setFlattenAmount: (v: number) => void;

  // Backward compat: theme & search were on the original monolithic store.
  // Copied components (StarScene, StarField, etc.) destructure these from useStore.
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  showSources: boolean;
  setShowSources: (v: boolean) => void;
  showAbout: boolean;
  setShowAbout: (v: boolean) => void;
}

export const useStarStore = create<StarState>((set) => ({
  stars: [],
  loadedChunks: new Set(),
  addStars: (chunk, newStars) => set((state) => {
    if (state.loadedChunks.has(chunk)) return state;
    const next = new Set(state.loadedChunks);
    next.add(chunk);
    return { stars: [...state.stars, ...newStars], loadedChunks: next };
  }),

  selectedStar: null,
  measureTarget: null,
  setSelected: (star) => set((s) => ({
    selectedStar: star,
    ...(star ? { cameraFlyTarget: { x: star.x, y: star.y, z: star.z }, _cameraFlyTick: s._cameraFlyTick + 1 } : {}),
  })),
  setMeasureTarget: (star) => set({ measureTarget: star }),

  mode: 'explore',
  setMode: (m) => set({ mode: m }),

  showHipparcos: true,
  showExoplanets: true,
  showGaia: true,
  showConstellations: true,
  setShowHipparcos: (v) => set({ showHipparcos: v }),
  setShowExoplanets: (v) => set({ showExoplanets: v }),
  setShowGaia: (v) => set({ showGaia: v }),
  setShowConstellations: (v) => set({ showConstellations: v }),

  scaleUnit: 'ly',
  setScaleUnit: (u) => set({ scaleUnit: u }),

  showLabels: true,
  setShowLabels: (v) => set({ showLabels: v }),
  showDepthLines: true,
  setShowDepthLines: (v) => set({ showDepthLines: v }),
  showTravelCalc: false,
  setShowTravelCalc: (v) => set({ showTravelCalc: v }),

  exoHostCount: 0,
  setExoHostCount: (n) => set({ exoHostCount: n }),

  cameraResetTick: 0,
  triggerCameraReset: () => set((s) => ({ cameraResetTick: s.cameraResetTick + 1 })),
  zoomTarget: 30,
  _zoomLerpTick: 0,
  setZoomTarget: (v) => set((s) => ({ zoomTarget: v, _zoomLerpTick: s._zoomLerpTick + 1 })),
  syncCameraZoom: (v) => set((state) => {
    if (Math.abs(state.zoomTarget - v) / (state.zoomTarget || 1) < 0.01) return state;
    return { zoomTarget: v };
  }),

  cameraFlyTarget: null,
  _cameraFlyTick: 0,
  setCameraFlyTarget: (pos) => set((s) => ({
    cameraFlyTarget: pos,
    _cameraFlyTick: s._cameraFlyTick + 1,
  })),

  mapMode: '3d',
  setMapMode: (m) => set({ mapMode: m }),

  magLimit: 12,
  setMagLimit: (v) => set({ magLimit: v }),

  hoveredStar: null,
  setHoveredStar: (star) => set({ hoveredStar: star }),

  flattenAmount: 0.0,
  setFlattenAmount: (v) => set({ flattenAmount: v }),

  // Backward compat fields
  theme: 'dark',
  setTheme: (t) => set({ theme: t }),
  showSearch: false,
  setShowSearch: (v) => set({ showSearch: v }),
  showSources: false,
  setShowSources: (v) => set({ showSources: v }),
  showAbout: false,
  setShowAbout: (v) => set({ showAbout: v }),
}));
