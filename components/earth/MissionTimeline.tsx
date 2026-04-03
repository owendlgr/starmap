'use client';
import { useEarthStore } from '@/lib/stores/earthStore';
import type { Mission } from '@/lib/types';

interface MissionTimelineProps {
  mission: Mission | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

export function MissionTimeline({ mission }: MissionTimelineProps) {
  const position = useEarthStore((s) => s.timelinePosition);
  const setPosition = useEarthStore((s) => s.setTimelinePosition);
  const playing = useEarthStore((s) => s.timelinePlaying);
  const setPlaying = useEarthStore((s) => s.setTimelinePlaying);

  if (!mission) return null;

  const hasStages = mission.stages && mission.stages.length > 0;
  const hasWaypoints = mission.waypoints && mission.waypoints.length > 0;
  if (!hasStages && !hasWaypoints) return null;

  const points = hasWaypoints ? mission.waypoints! : mission.stages!;
  const currentIndex = Math.floor(position * (points.length - 1));

  return (
    <div style={{
      position: 'absolute', bottom: '0', left: '0', right: '0',
      background: 'rgba(10, 10, 10, 0.9)',
      borderTop: '1px solid var(--border)',
      padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: '8px',
      zIndex: 30, backdropFilter: 'blur(4px)',
    }}>
      {/* Play/Pause */}
      <button
        onClick={() => setPlaying(!playing)}
        style={{
          background: 'none', border: '1px solid var(--border)',
          color: playing ? 'var(--accent)' : 'var(--text-secondary)',
          width: '24px', height: '24px', borderRadius: '3px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Timeline label */}
      <span style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
        textTransform: 'uppercase', color: 'var(--accent)',
        flexShrink: 0, width: '60px',
      }}>
        TIMELINE
      </span>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={position}
        onChange={(e) => setPosition(parseFloat(e.target.value))}
        style={{
          flex: 1, accentColor: 'var(--accent-muted)',
          height: '4px',
        }}
      />

      {/* Current waypoint/stage label */}
      <span style={{
        fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600,
        minWidth: '120px', textAlign: 'right',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {hasWaypoints
          ? mission.waypoints![currentIndex]?.label
          : mission.stages![currentIndex]?.name
        }
      </span>

      {/* Date */}
      <span style={{
        fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 600,
        flexShrink: 0, width: '90px', textAlign: 'right',
      }}>
        {hasWaypoints
          ? mission.waypoints![currentIndex]?.date ? formatDate(mission.waypoints![currentIndex].date!) : ''
          : mission.stages![currentIndex]?.date ? formatDate(mission.stages![currentIndex].date!) : ''
        }
      </span>
    </div>
  );
}
