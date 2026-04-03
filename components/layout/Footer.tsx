'use client';
import { useAppStore } from '@/lib/stores/appStore';

export function Footer() {
  const statusMessage = useAppStore((s) => s.statusMessage);
  const lastUpdated = useAppStore((s) => s.lastUpdated);

  return (
    <footer className="footer">
      <div className="footer-left">
        <span className="footer-brand">STARDATA.SPACE</span>
        <div className="footer-sep" />
        <span className="footer-status">{statusMessage}</span>
      </div>
      <div className="footer-center">
        <span className="footer-sources">
          NASA · ESA · JPL · HIPPARCOS · GAIA DR3 · LAUNCH LIBRARY 2
        </span>
      </div>
      <div className="footer-right">
        {lastUpdated && (
          <span className="footer-updated">
            UPDATED {lastUpdated}
          </span>
        )}
        <span className="footer-coord" id="footer-coord" />
      </div>
    </footer>
  );
}
