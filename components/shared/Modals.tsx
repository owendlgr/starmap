'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/appStore';

export function AboutModal() {
  const showAbout = useAppStore((s) => s.showAbout);
  const setShowAbout = useAppStore((s) => s.setShowAbout);

  if (!showAbout) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAbout(false); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={() => setShowAbout(false)}>{'\u2715'}</button>
        <div className="modal-title">StarData</div>
        <div className="modal-subtitle">Interactive Space Explorer</div>

        <div style={{ marginBottom: '1rem', lineHeight: 1.7, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          StarData is an interactive space exploration platform built from real astronomical
          measurements. Every star, planet, galaxy, and mission uses verified scientific data
          from NASA, ESA, and international astronomy databases.
        </div>

        <div className="source-entry">
          <div className="source-name">Created by</div>
          <div className="source-meta" style={{ marginTop: '0.25rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            Isaac Dellinger
          </div>
        </div>

        <div className="source-entry">
          <div className="source-name">Technology</div>
          <div className="source-meta" style={{ marginTop: '0.2rem' }}>
            Built with Next.js 14, Three.js, React Three Fiber, Mapbox GL, and Zustand.
            Custom GLSL shaders with logarithmic depth buffer supporting scales from
            sub-parsec to 60,000 pc.
          </div>
        </div>

        <div className="source-entry">
          <div className="source-name">Pages</div>
          <div className="source-meta" style={{ marginTop: '0.2rem' }}>
            Star Map &middot; Earth & Missions &middot; Solar System &middot; Galaxies
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourcesModal() {
  const showSources = useAppStore((s) => s.showSources);
  const setShowSources = useAppStore((s) => s.setShowSources);
  const [extraFiles, setExtraFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!showSources) return;
    fetch('/api/datasources')
      .then((r) => r.json())
      .then((d: { extra: string[] }) => setExtraFiles(d.extra || []))
      .catch(() => setExtraFiles([]));
  }, [showSources]);

  if (!showSources) return null;

  const sources = [
    {
      name: 'Hipparcos Catalogue (ESA, 1997)',
      detail: '118,000+ stars with satellite-measured parallax, proper motion, BV photometry, and spectral classification.',
      url: 'https://www.cosmos.esa.int/web/hipparcos',
    },
    {
      name: 'Gaia DR3 (ESA, 2022)',
      detail: '1.8 billion sources. We use ~1.1 million stars within 2 kpc with high-quality parallax measurements.',
      url: 'https://www.cosmos.esa.int/web/gaia',
    },
    {
      name: 'NASA Exoplanet Archive',
      detail: 'Comprehensive database of confirmed exoplanets with orbital parameters, host star data, and discovery methods.',
      url: 'https://exoplanetarchive.ipac.caltech.edu/',
    },
    {
      name: 'Stellarium Constellation Data',
      detail: 'Traditional IAU constellation stick figures using Hipparcos star ID pairs from the Stellarium open-source project.',
      url: 'https://stellarium.org/',
    },
    {
      name: 'OpenNGC Catalog',
      detail: '14,000+ deep sky objects (galaxies, nebulae, clusters) with positions, magnitudes, and morphological types.',
      url: 'https://github.com/mattiaverga/OpenNGC',
    },
    {
      name: 'NASA/JPL Solar System Data',
      detail: 'Planetary physical properties, orbital elements, and moon data from NASA Planetary Fact Sheets and JPL.',
      url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    },
    {
      name: 'Solar System Scope Textures',
      detail: 'Photorealistic planet surface textures. CC-BY 4.0 license.',
      url: 'https://www.solarsystemscope.com/textures/',
    },
    {
      name: 'Launch Library 2',
      detail: 'Comprehensive database of rocket launches worldwide from all agencies.',
      url: 'https://thespacedevs.com/',
    },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSources(false); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={() => setShowSources(false)}>{'\u2715'}</button>
        <div className="modal-title">Data Sources & Attribution</div>
        <div className="modal-subtitle">Scientific data provenance</div>
        {sources.map((s) => (
          <div className="source-entry" key={s.name}>
            <div className="source-name">{s.name}</div>
            <div className="source-meta">{s.detail}</div>
            {s.url && (
              <div className="source-meta" style={{ marginTop: '0.2rem' }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.url}</a>
              </div>
            )}
          </div>
        ))}
        {extraFiles.length > 0 && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <div className="source-name">Data Files</div>
            {extraFiles.map((f) => (
              <div className="source-entry" key={f} style={{ paddingLeft: '0.5rem' }}>
                <div className="source-meta">{f}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
