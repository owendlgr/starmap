import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32,
        background: '#0c0a08',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
      }}
    >
      {/* Central star (Sol) */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#e8e0d0',
        position: 'absolute',
      }} />
      {/* Orbit ring */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: '1px solid rgba(200,180,140,0.5)',
        position: 'absolute',
      }} />
      {/* Small star top-right */}
      <div style={{
        width: 3, height: 3, borderRadius: '50%',
        background: '#c8b88a',
        position: 'absolute', top: 5, right: 6,
      }} />
      {/* Small star bottom-left */}
      <div style={{
        width: 2, height: 2, borderRadius: '50%',
        background: '#e8e0d0',
        position: 'absolute', bottom: 7, left: 5,
      }} />
    </div>,
    { ...size }
  );
}
