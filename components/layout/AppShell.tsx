'use client';
import { ThemeProvider } from './ThemeProvider';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { GlobalSearch } from './GlobalSearch';
import { AboutModal, SourcesModal } from '../shared/Modals';

/**
 * AppShell — worldmonitor.app-style layout:
 * ┌──────────────────────────────────────┐
 * │ HEADER (40px) — tabs, search, theme  │
 * ├────────┬─────────────────────────────┤
 * │SIDEBAR │                             │
 * │(220px) │   MAIN VIEWPORT (flex: 1)   │
 * │collapse│   (3D scene / content)       │
 * │ ible   │                             │
 * ├────────┴─────────────────────────────┤
 * │ FOOTER (30px) — status, sources, ts  │
 * └──────────────────────────────────────┘
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <Header />
        <div className="app-body">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
        <Footer />
      </div>
      <GlobalSearch />
      <AboutModal />
      <SourcesModal />
    </ThemeProvider>
  );
}
