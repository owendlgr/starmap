'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import type { NavItem } from '@/lib/types';

const NAV_ITEMS: NavItem[] = [
  { id: 'missions', href: '/missions', label: 'MISSIONS', shortLabel: 'MSN', icon: '◉', description: 'Space mission tracking & telemetry' },
  { id: 'planets',  href: '/planets',  label: 'PLANETS',  shortLabel: 'PLN', icon: '⊕', description: 'Solar system exploration' },
  { id: 'stars',    href: '/stars',     label: 'STARS',    shortLabel: 'STR', icon: '✦', description: 'Nearby star systems' },
  { id: 'galaxies', href: '/galaxies',  label: 'GALAXIES', shortLabel: 'GLX', icon: '◎', description: 'Galaxy map & clusters' },
  { id: 'streams',  href: '/streams',   label: 'STREAMS',  shortLabel: 'LIV', icon: '▶', description: 'Live mission feeds' },
];

export function Header() {
  const pathname = usePathname();
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);
  const showSearch = useAppStore((s) => s.showSearch);
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const setShowAbout = useAppStore((s) => s.setShowAbout);
  const setShowSources = useAppStore((s) => s.setShowSources);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl+K → global search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(!showSearch);
      return;
    }
    // Esc → close search
    if (e.key === 'Escape' && showSearch) {
      setShowSearch(false);
      return;
    }
    // Number keys 1-5 for section switching (only when not typing)
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5 && NAV_ITEMS[num - 1]) {
      window.location.href = NAV_ITEMS[num - 1].href;
    }
  }, [showSearch, setShowSearch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-icon-btn sidebar-toggle-btn"
          onClick={toggleSidebar}
          title="Toggle sidebar (layers & controls)"
        >
          ☰
        </button>
        <Link href="/missions" className="header-brand-link">
          <span className="header-brand">STARDATA</span>
          <span className="header-version">.SPACE</span>
        </Link>
        <div className="header-sep" />
        <nav className="header-nav">
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname === item.href ||
              (pathname === '/' && item.id === 'missions') ||
              (pathname === '/earth' && item.id === 'missions');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`header-nav-btn ${isActive ? 'active' : ''}`}
                title={`${item.description} [${i + 1}]`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-key">{i + 1}</span>
              </Link>
            );
          })}
        </nav>
        <div className="header-sep" />
        <span className="header-live">LIVE</span>
      </div>
      <div className="header-right">
        <button
          className="header-btn header-search-btn"
          onClick={() => setShowSearch(true)}
          title="Global search (Ctrl+K)"
        >
          ⌕ <span className="search-hint">SEARCH</span> <kbd>⌘K</kbd>
        </button>
        <div className="header-sep" />
        <button className="header-btn" onClick={() => setShowSources(true)}>SOURCES</button>
        <button className="header-btn" onClick={() => setShowAbout(true)}>ABOUT</button>
        <div className="header-sep" />
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
