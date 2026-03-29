'use client';
import dynamic from 'next/dynamic';
import { InfoPanel } from '@/components/InfoPanel';
import { TravelCalc } from '@/components/TravelCalc';
import { Controls } from '@/components/Controls';
import { SearchBar } from '@/components/SearchBar';
import { ScaleIndicatorOverlay } from '@/components/ScaleIndicator';
import { useStore } from '@/lib/useStore';

// Canvas must be client-side only
const StarMap = dynamic(() => import('@/components/StarMap').then(m => ({ default: m.StarMap })), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#00000f' }} />,
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
      <StarMap />

      <div className="app-title">
        <h1>StarMap</h1>
        <p>Interactive 3D Star Atlas</p>
      </div>

      <SearchBar />
      <InfoPanel />
      <TravelCalc />
      <Controls />
      <ScaleIndicatorOverlay />
      <LoadingDot />

      <div className="help-hint">
        Drag to rotate · Scroll to zoom · Click any star
      </div>
    </main>
  );
}
