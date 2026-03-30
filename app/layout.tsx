import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'StarData — Interactive Space Explorer',
  description: 'Explore stars, planets, galaxies, and space missions with real astronomical data from NASA, ESA, and international observatories.',
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
