'use client';
import { ThemeProvider } from './ThemeProvider';
import { Header } from './Header';
import { AboutModal, SourcesModal } from '../shared/Modals';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <Header />
        <div className="main-content">
          {children}
        </div>
      </div>
      <AboutModal />
      <SourcesModal />
    </ThemeProvider>
  );
}
