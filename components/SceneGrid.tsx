'use client';
import { useStore } from '@/lib/useStore';

export function SceneGrid() {
  const { theme } = useStore();
  const dark = theme === 'dark';
  const RING_R = 3.066;
  const pts: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pts.push(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R);
  }
  const ringPts = new Float32Array(pts);
  const gridA = dark ? '#1c1614' : '#c8c0b4';
  const gridB = dark ? '#222018' : '#d8d0c4';
  const ringCol = dark ? '#302820' : '#b0a898';

  return (
    <group>
      <gridHelper args={[400, 60, gridA, gridB]} position={[0,0,0]} />
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ringPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={ringCol} transparent opacity={dark ? 0.5 : 0.6} />
      </line>
    </group>
  );
}
