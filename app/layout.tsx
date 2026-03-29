import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StarData — Interactive 3D Star Atlas',
  description: 'Explore the Milky Way and beyond. 15,000+ stars, galaxies, and deep sky objects in interactive 3D. Cross-referenced with NASA exoplanet data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
