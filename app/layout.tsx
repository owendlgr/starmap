import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'StarData.Space — Scientific Space Dashboard',
  description: 'Comprehensive visual dashboard for space data — missions, planets, stars, galaxies, and live streams. Built with real astronomical data from NASA, ESA, JPL, Hipparcos, and Gaia DR3.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
