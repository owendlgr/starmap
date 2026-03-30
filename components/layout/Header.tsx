'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/stores/appStore';

const NAV_ITEMS = [
  { href: '/stars', label: 'STARS' },
  { href: '/earth', label: 'EARTH' },
  { href: '/planets', label: 'PLANETS' },
  { href: '/galaxies', label: 'GALAXIES' },
];

export function Header() {
  const pathname = usePathname();
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);
  const setShowAbout = useAppStore((s) => s.setShowAbout);
  const setShowSources = useAppStore((s) => s.setShowSources);

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-brand">STARDATA</span>
        <span className="header-version">v2.0</span>
        <div className="header-sep" />
        <nav className="header-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/stars');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`header-nav-btn ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-sep" />
        <span className="header-live">LIVE</span>
      </div>
      <div className="header-right">
        <button className="header-btn" onClick={() => setShowSources(true)}>SOURCES</button>
        <button className="header-btn" onClick={() => setShowAbout(true)}>ABOUT</button>
        <div className="header-sep" />
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '\u2600' : '\u263E'}
        </button>
      </div>
    </header>
  );
}
