'use client';
import dynamic from 'next/dynamic';
import { NavBar, NavSearch } from '@/components/NavBar';
import { SidePanel } from '@/components/SidePanel';
import { ZoomSlider } from '@/components/ZoomSlider';

const StarMap = dynamic(() => import('@/components/StarMap').then(m => ({ default: m.StarMap })), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#f0ece0' }} />,
});

export default function Home() {
  return (
    <main className="app">
      <NavBar />
      <div className="map-area">
        <StarMap />
        <div style={{ position: 'absolute', top: '0.6rem', left: 0, right: 0, zIndex: 40, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <NavSearch />
          </div>
        </div>
        <ZoomSlider />
        <SidePanel />
        <div className="help-hint">
          Drag to rotate · Scroll to zoom · Click any object to inspect
        </div>
      </div>
    </main>
  );
}
