'use client';
import dynamic from 'next/dynamic';
import { NavBar, NavSearch } from '@/components/NavBar';
import { SidePanel } from '@/components/SidePanel';
import { ZoomSlider } from '@/components/ZoomSlider';
import { useStore } from '@/lib/useStore';

const StarMap = dynamic(() => import('@/components/StarMap').then(m => ({ default: m.StarMap })), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#f0ece0' }} />,
});

function LoadingDot() {
  const { stars } = useStore();
  if (stars.length > 2000) return null;
  return (
    <div className="loading-indicator">
      {stars.length === 0 ? 'Loading catalog…' : `Loading… ${stars.length.toLocaleString()} objects`}
    </div>
  );
}

export default function Home() {
  return (
    <main className="app">
      <NavBar />
      <div className="map-area">
        <StarMap />
        {/* Search overlay — rendered inside map-area so z-index is correct */}
        <div style={{ position: 'absolute', top: '0.6rem', left: 0, right: 0, zIndex: 40, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <NavSearch />
          </div>
        </div>
        <ZoomSlider />
        <SidePanel />
        <LoadingDot />
        <div className="help-hint">
          Drag to rotate · Scroll to zoom · Click any object to inspect
        </div>
      </div>
    </main>
  );
}
