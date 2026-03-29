'use client';
import { useStore } from '@/lib/useStore';
import { calcTravelTime, formatTravelTime, distanceBetween } from '@/lib/coordinates';

export function TravelCalc() {
  const { selectedStar, measureTarget, showTravelCalc, setShowTravelCalc } = useStore();
  if (!showTravelCalc || !selectedStar) return null;

  const dist_pc = measureTarget
    ? distanceBetween(selectedStar, measureTarget)
    : selectedStar.dist_pc;

  if (dist_pc === 0) return null;

  const t = calcTravelTime(dist_pc);
  const target = measureTarget ? measureTarget.name : selectedStar.name;

  return (
    <div className="panel travel-panel">
      <button className="panel-close" onClick={() => setShowTravelCalc(false)}>✕</button>
      <div className="travel-title">Travel to {target}</div>
      <div className="travel-subtitle">from Earth / Sol</div>

      <div className="travel-rows">
        <div className="travel-row">
          <span className="travel-label">Speed of light (c)</span>
          <span className="travel-value">{formatTravelTime(t.lightspeed_years)}</span>
        </div>
        <div className="travel-row">
          <span className="travel-label">10% light speed</span>
          <span className="travel-value">{formatTravelTime(t.pct10c_years)}</span>
        </div>
        <div className="travel-row">
          <span className="travel-label">1% light speed</span>
          <span className="travel-value">{formatTravelTime(t.pct01c_years)}</span>
        </div>
        <div className="travel-row">
          <span className="travel-label">Voyager 1 speed</span>
          <span className="travel-value">{formatTravelTime(t.voyager_years)}</span>
        </div>
      </div>

      <div className="travel-note">Relativistic effects not accounted for.</div>
    </div>
  );
}
