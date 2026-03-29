'use client';
// Subtle galactic plane reference grid + scale ring
export function SceneGrid() {
  // Reference ring at 10 ly (3.066 pc) radius
  const RING_R = 3.066;
  const pts: number[] = [];
  const SEG = 64;
  for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    pts.push(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R);
  }
  const ringPts = new Float32Array(pts);

  return (
    <group>
      {/* Galactic plane reference (very subtle) */}
      <gridHelper args={[200, 40, '#0a0a1a', '#0a0a1a']} rotation={[0, 0, 0]} position={[0, 0, 0]} />
      {/* 10 ly reference ring */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ringPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1a1a3a" transparent opacity={0.5} />
      </line>
    </group>
  );
}
