'use client';
import { create } from 'zustand';
import type { ThemeMode, AppPage } from '../types';

interface AppState {
  /* ── Theme ─────────────────────────────────────────────── */
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;

  /* ── Sidebar ───────────────────────────────────────────── */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;

  /* ── Active page (for sidebar highlight & conditional UI) */
  activePage: AppPage;
  setActivePage: (p: AppPage) => void;

  /* ── Global search ─────────────────────────────────────── */
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /* ── Modals ────────────────────────────────────────────── */
  showAbout: boolean;
  setShowAbout: (v: boolean) => void;
  showSources: boolean;
  setShowSources: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;

  /* ── Bookmarks ─────────────────────────────────────────── */
  bookmarks: string[];
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;

  /* ── Camera transition preference ──────────────────────── */
  smoothTransitions: boolean;
  toggleSmoothTransitions: () => void;

  /* ── Footer status ─────────────────────────────────────── */
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  lastUpdated: string | null;
  setLastUpdated: (ts: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activePage: 'missions',
  setActivePage: (p) => set({ activePage: p }),

  showSearch: false,
  setShowSearch: (v) => set({ showSearch: v }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  showAbout: false,
  setShowAbout: (v) => set({ showAbout: v }),
  showSources: false,
  setShowSources: (v) => set({ showSources: v }),
  showSettings: false,
  setShowSettings: (v) => set({ showSettings: v }),

  bookmarks: [],
  addBookmark: (id) => set((s) => ({
    bookmarks: s.bookmarks.includes(id) ? s.bookmarks : [...s.bookmarks, id],
  })),
  removeBookmark: (id) => set((s) => ({
    bookmarks: s.bookmarks.filter((b) => b !== id),
  })),

  smoothTransitions: true,
  toggleSmoothTransitions: () => set((s) => ({ smoothTransitions: !s.smoothTransitions })),

  statusMessage: 'Ready',
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  lastUpdated: null,
  setLastUpdated: (ts) => set({ lastUpdated: ts }),
}));
