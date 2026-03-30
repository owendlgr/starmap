'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/stores/appStore';

const NAV_ITEMS = [
  { href: '/stars', icon: '\u2605', label: 'Star Map' },
  { href: '/earth', icon: '\uD83C\uDF0D', label: 'Earth & Missions' },
  { href: '/planets', icon: '\u2643', label: 'Solar System' },
  { href: '/galaxies', icon: '\uD83C\uDF0C', label: 'Galaxies' },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);
  const setShowAbout = useAppStore((s) => s.setShowAbout);
  const setShowSources = useAppStore((s) => s.setShowSources);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <span style={{ fontSize: '1.2rem' }}>{'\u2726'}</span>
        <div>
          <h1>StarData</h1>
          <span className="brand-sub">Space Explorer</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Explore</div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/stars');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-controls" id="sidebar-controls">
        {/* Page-specific controls injected via portal */}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            className="sidebar-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {collapsed ? (theme === 'dark' ? '\u25D1' : '\u25D0') : (theme === 'dark' ? '\u25D1 Light Mode' : '\u25D0 Dark Mode')}
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="sidebar-toggle"
              onClick={() => setShowAbout(true)}
              style={{ flex: 1 }}
            >
              {collapsed ? '?' : 'About'}
            </button>
            <button
              className="sidebar-toggle"
              onClick={() => setShowSources(true)}
              style={{ flex: 1 }}
            >
              {collapsed ? '\u2139' : 'Sources'}
            </button>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {collapsed ? '\u25B6' : '\u25C0 Collapse'}
          </button>
        </div>
      </div>
    </aside>
  );
}
