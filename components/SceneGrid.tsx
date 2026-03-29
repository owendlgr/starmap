'use client';
// Reference grid for the galactic plane — light background version
export function SceneGrid() {
  const RING_R = 3.066; // ~10 ly reference ring
  const pts: number[] = [];
  const SEG = 64;
  for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    pts.push(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R);
  }
  const ringPts = new Float32Array(pts);

  return (
    <group>
      {/* Galactic plane reference grid — very subtle warm gray lines */}
      <gridHelper args={[400, 60, '#c8c0b4', '#d8d0c4']} position={[0, 0, 0]} />
      {/* 10 ly reference ring */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ringPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#b0a898" transparent opacity={0.6} />
      </line>
    </group>
  );
}
