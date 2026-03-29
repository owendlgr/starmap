'use client';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { useStore } from '@/lib/useStore';
import { formatDistance } from '@/lib/coordinates';

// Overlay scale bar in screen space (not 3D)
export function ScaleIndicatorOverlay() {
  const { scaleUnit } = useStore();

  // Show a few reference distances as labels
  const refs = [
    { dist_pc: 1.30,  label: 'Proxima Centauri' },
    { dist_pc: 2.64,  label: 'Sirius' },
    { dist_pc: 8.6,   label: 'Vega (25 ly)' },
    { dist_pc: 100,   label: '326 ly' },
  ];

  return (
    <div className="scale-indicator">
      <div className="scale-title">Reference distances</div>
      {refs.map(r => (
        <div key={r.label} className="scale-row">
          <span className="scale-dot" />
          <span className="scale-name">{r.label}</span>
          <span className="scale-dist">{formatDistance(r.dist_pc, scaleUnit)}</span>
        </div>
      ))}
    </div>
  );
}
