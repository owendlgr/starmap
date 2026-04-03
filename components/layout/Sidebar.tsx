'use client';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/stores/appStore';

/**
 * Sidebar — worldmonitor-style collapsible left panel.
 * Contains page-specific layer controls injected via a portal target.
 * When collapsed, shows only icons (40px wide). Expanded = 220px.
 */
export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const currentSection = getSection(pathname);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Section header */}
      <div className="sidebar-section-header">
        <span className="sidebar-section-icon">{currentSection.icon}</span>
        {!collapsed && <span className="sidebar-section-title">{currentSection.title}</span>}
      </div>

      {/* Page-specific controls get injected here via React portal */}
      <div className="sidebar-controls" id="sidebar-controls" />

      {/* Spacer */}
      <div className="sidebar-spacer" />

      {/* Bottom controls */}
      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="sidebar-btn-icon">{theme === 'dark' ? '☀' : '☾'}</span>
          {!collapsed && <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>}
        </button>
        <button
          className="sidebar-footer-btn"
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar-btn-icon">{collapsed ? '▸' : '◂'}</span>
          {!collapsed && <span>COLLAPSE</span>}
        </button>
      </div>
    </aside>
  );
}

function getSection(pathname: string): { icon: string; title: string } {
  if (pathname.startsWith('/missions') || pathname.startsWith('/earth')) return { icon: '◉', title: 'MISSION CONTROL' };
  if (pathname.startsWith('/planets')) return { icon: '⊕', title: 'SOLAR SYSTEM' };
  if (pathname.startsWith('/stars')) return { icon: '✦', title: 'STAR MAP' };
  if (pathname.startsWith('/galaxies')) return { icon: '◎', title: 'GALAXY MAP' };
  if (pathname.startsWith('/streams')) return { icon: '▶', title: 'LIVE STREAMS' };
  return { icon: '◉', title: 'MISSION CONTROL' };
}
