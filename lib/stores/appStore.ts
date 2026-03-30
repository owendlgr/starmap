'use client';
import { create } from 'zustand';
import type { ThemeMode } from '../types';

interface AppState {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;

  showSearch: boolean;
  setShowSearch: (v: boolean) => void;

  showAbout: boolean;
  setShowAbout: (v: boolean) => void;

  showSources: boolean;
  setShowSources: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  showSearch: false,
  setShowSearch: (v) => set({ showSearch: v }),

  showAbout: false,
  setShowAbout: (v) => set({ showAbout: v }),

  showSources: false,
  setShowSources: (v) => set({ showSources: v }),
}));
