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
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  showSources: boolean;
  setShowSources: (v: boolean) => void;

  exoHostCount: number;
  setExoHostCount: (n: number) => void;

  // Camera controls
  cameraResetTick: number;
  triggerCameraReset: () => void;
  zoomTarget: number;          // desired camera distance in pc
  _zoomLerpTick: number;       // incremented by setZoomTarget to trigger lerp
  setZoomTarget: (v: number) => void;  // slider/reset → triggers lerp
  syncCameraZoom: (v: number) => void; // OrbitControls → syncs display only

  // Smooth fly-to target (set when a star is selected)
  cameraFlyTarget: { x: number; y: number; z: number } | null;
  _cameraFlyTick: number;
  setCameraFlyTarget: (pos: { x: number; y: number; z: number } | null) => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;

  // About modal
  showAbout: boolean;
  setShowAbout: (v: boolean) => void;

  // Map mode: 3D orbit or 2D bird's-eye top-down
  mapMode: '3d' | '2d';
  setMapMode: (m: '3d' | '2d') => void;
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
  setSelected: (star) => set(s => ({
    selectedStar: star,
    // Trigger smooth fly-to when selecting a star (not when clearing)
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
  showSearch: false,
  setShowSearch: (v) => set({ showSearch: v }),
  showSources: false,
  setShowSources: (v) => set({ showSources: v }),

  exoHostCount: 0,
  setExoHostCount: (n) => set({ exoHostCount: n }),

  cameraResetTick: 0,
  triggerCameraReset: () => set(s => ({ cameraResetTick: s.cameraResetTick + 1 })),
  zoomTarget: 30,
  _zoomLerpTick: 0,
  setZoomTarget: (v) => set(s => ({ zoomTarget: v, _zoomLerpTick: s._zoomLerpTick + 1 })),
  // Only update if value changed by >1% to avoid unnecessary re-renders during orbit drag
  syncCameraZoom: (v) => set(state => {
    if (Math.abs(state.zoomTarget - v) / (state.zoomTarget || 1) < 0.01) return state;
    return { zoomTarget: v };
  }),

  cameraFlyTarget: null,
  _cameraFlyTick: 0,
  setCameraFlyTarget: (pos) => set(s => ({
    cameraFlyTarget: pos,
    _cameraFlyTick: s._cameraFlyTick + 1,
  })),

  theme: 'light',
  setTheme: (t) => set({ theme: t }),

  showAbout: false,
  setShowAbout: (v) => set({ showAbout: v }),

  mapMode: '3d',
  setMapMode: (m) => set({ mapMode: m }),
}));
