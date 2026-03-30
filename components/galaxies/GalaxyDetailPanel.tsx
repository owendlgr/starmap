'use client';

import { useGalaxyStore } from '@/lib/stores/galaxyStore';
import { galaxyTypeColor } from '@/lib/data/galaxyCatalog';
import type { GalaxyData } from '@/lib/types';

/** Hubble constant for redshift estimate: H0 = 70 km/s/Mpc */
const H0 = 70;
const C_KM_S = 299792.458;
const MPC_TO_MLY = 3.2616;

function formatNum(n: number | undefined, decimals = 2): string {
  if (n == null) return '--';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function DataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <span className="data-label">{label}</span>
      <span className={`data-value${mono ? ' mono' : ''}`}>{value}</span>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="data-section">
      <div className="data-section-title">{title}</div>
      <div className="data-grid">{children}</div>
    </div>
  );
}

export function GalaxyDetailPanel() {
  const galaxy = useGalaxyStore((s) => s.selectedGalaxy);
  const setSelectedGalaxy = useGalaxyStore((s) => s.setSelectedGalaxy);
  const isOpen = galaxy != null;

  const close = () => setSelectedGalaxy(null);

  if (!galaxy) {
    return <div className={`detail-panel`} />;
  }

  const distMly = galaxy.distanceMpc != null ? galaxy.distanceMpc * MPC_TO_MLY : undefined;

  // Redshift: use radial velocity if available, otherwise estimate from Hubble law
  const redshift = galaxy.radialVelocity != null
    ? galaxy.radialVelocity / C_KM_S
    : galaxy.distanceMpc != null
      ? (H0 * galaxy.distanceMpc) / C_KM_S
      : undefined;

  const color = galaxyTypeColor(galaxy.galaxyType ?? galaxy.type);

  // NED lookup uses NGC number or Messier number
  const nedQuery = galaxy.altName
    ? encodeURIComponent(galaxy.altName.split('/')[0].trim())
    : encodeURIComponent(galaxy.name);
  const nedUrl = `https://ned.ipac.caltech.edu/byname?objname=${nedQuery}`;

  const wikiName = galaxy.name.replace(/\s+/g, '_');
  const wikiUrl = `https://en.wikipedia.org/wiki/${wikiName}`;

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
      <div className="detail-header">
        <button className="detail-close" onClick={close} title="Close">
          {'\u2715'}
        </button>
        <div className="detail-name">{galaxy.name}</div>
        {galaxy.altName && <div className="detail-subtitle">{galaxy.altName}</div>}
      </div>

      <div className="detail-body">
        {/* Overview */}
        <Section title="Overview">
          <DataRow label="Type" value={galaxy.type} />
          {galaxy.galaxyType && (
            <DataRow label="Category" value={galaxy.galaxyType} />
          )}
          <DataRow label="Hubble" value={galaxy.hubbleType ?? '--'} mono />
          <DataRow label="Constellation" value={galaxy.constellation ?? '--'} />
          <>
            <span className="data-label">Color</span>
            <span className="data-value">
              <span className="color-band">
                <span className="color-swatch" style={{ background: color }} />
                <span className="color-label">{galaxy.galaxyType ?? galaxy.type}</span>
              </span>
            </span>
          </>
        </Section>

        {/* Position */}
        <Section title="Position">
          <DataRow label="RA" value={`${formatNum(galaxy.ra, 4)}\u00B0`} mono />
          <DataRow label="Dec" value={`${formatNum(galaxy.dec, 4)}\u00B0`} mono />
        </Section>

        {/* Distance */}
        <Section title="Distance">
          <DataRow
            label="Mpc"
            value={galaxy.distanceMpc != null ? formatNum(galaxy.distanceMpc, 3) : '--'}
            mono
          />
          <DataRow
            label="Mly"
            value={distMly != null ? formatNum(distMly, 2) : '--'}
            mono
          />
          <DataRow
            label="Redshift z"
            value={redshift != null ? formatNum(redshift, 6) : '--'}
            mono
          />
        </Section>

        {/* Physical Properties */}
        <Section title="Physical Properties">
          <DataRow
            label="Abs Mag (B)"
            value={galaxy.absMagnitude != null ? formatNum(galaxy.absMagnitude, 1) : '--'}
            mono
          />
          <DataRow
            label="Stellar Mass"
            value={
              galaxy.stellarMass != null
                ? `10^${formatNum(galaxy.stellarMass, 1)} M\u2609`
                : '--'
            }
            mono
          />
          <DataRow
            label="Radial Vel."
            value={
              galaxy.radialVelocity != null
                ? `${formatNum(galaxy.radialVelocity, 0)} km/s`
                : '--'
            }
            mono
          />
        </Section>

        {/* Apparent Properties */}
        <Section title="Apparent Properties">
          <DataRow
            label="Magnitude"
            value={galaxy.magnitude != null ? formatNum(galaxy.magnitude, 2) : '--'}
            mono
          />
          <DataRow
            label="Angular Size"
            value={
              galaxy.majorAxis != null
                ? galaxy.minorAxis != null
                  ? `${formatNum(galaxy.majorAxis, 1)}\u2032 \u00D7 ${formatNum(galaxy.minorAxis, 1)}\u2032`
                  : `${formatNum(galaxy.majorAxis, 1)}\u2032`
                : '--'
            }
            mono
          />
        </Section>

        {/* Links */}
        <div className="data-section">
          <div className="data-section-title">External Links</div>
          <div className="action-group">
            <a
              href={nedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
            >
              NED Lookup
            </a>
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
            >
              Wikipedia
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
