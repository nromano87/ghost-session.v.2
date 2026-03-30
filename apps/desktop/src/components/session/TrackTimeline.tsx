import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import {
  TRACK_TYPE_COLOURS,
  DEFAULT_SESSION_TRACKS,
  TIME_MARKERS,
  generateWaveform,
  generateClips,
} from './timelineModel';

export type TrackTimelineProps = {
  /**
   * When false, M/S and volume are non-interactive (auth preview).
   * @default true
   */
  interactive?: boolean;
  className?: string;
};

export default function TrackTimeline({ interactive = true, className = '' }: TrackTimelineProps) {
  const { currentProject } = useProjectStore();
  const tracks = currentProject?.tracks?.length ? currentProject.tracks : [...DEFAULT_SESSION_TRACKS];
  const [volumes, setVolumes] = useState<Record<string, number>>(
    Object.fromEntries(tracks.map((t: { id: string }) => [t.id, 80]))
  );

  const shellClass = interactive
    ? 'flex-1 flex flex-col min-h-0 overflow-hidden rounded-lg border border-ghost-border bg-ghost-bg/50'
    : 'flex flex-col min-h-0 overflow-hidden rounded-lg border border-ghost-border bg-ghost-bg/50 max-h-[min(320px,42vh)]';

  return (
    <div className={`${shellClass} ${className}`.trim()}>
      {/* Timeline ruler — matches session workspace */}
      <div className="flex shrink-0 border-b border-ghost-border">
        <div className="w-36 shrink-0" />
        <div className="flex-1 flex items-end px-2 h-6 relative">
          {TIME_MARKERS.map((marker, i) => (
            <div
              key={marker}
              className="absolute text-[9px] text-ghost-text-muted font-mono"
              style={{ left: `${(i / (TIME_MARKERS.length - 1)) * 100}%` }}
            >
              {marker}
            </div>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${!interactive ? 'pointer-events-none select-none' : ''}`}>
        {tracks.map((track: { id: string; name: string; type: string; muted?: boolean; soloed?: boolean }, trackIndex: number) => {
          const colour = TRACK_TYPE_COLOURS[track.type] || '#42A5F5';
          const clips = generateClips(trackIndex);

          return (
            <div
              key={track.id}
              className="flex items-stretch border-b border-ghost-border/50 group hover:bg-ghost-surface-light/30 transition-colors"
              style={{ height: '64px' }}
            >
              <div className="w-36 shrink-0 flex items-center gap-2 px-3 border-r border-ghost-border/50">
                <div
                  className="w-1.5 h-10 rounded-full timeline-track-strip"
                  style={{
                    backgroundColor: colour,
                    animationDelay: `${trackIndex * 0.35}s`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-ghost-text-primary uppercase tracking-wide truncate">
                    {track.name}
                  </p>
                  <div className="flex gap-1 mt-0.5">
                    {interactive ? (
                      <>
                        <button
                          type="button"
                          className={`text-[8px] font-bold px-1 rounded ${
                            track.muted
                              ? 'bg-ghost-warning-amber/20 text-ghost-warning-amber'
                              : 'text-ghost-text-muted hover:text-ghost-text-primary'
                          }`}
                        >
                          M
                        </button>
                        <button
                          type="button"
                          className={`text-[8px] font-bold px-1 rounded ${
                            track.soloed
                              ? 'bg-ghost-host-gold/20 text-ghost-host-gold'
                              : 'text-ghost-text-muted hover:text-ghost-text-primary'
                          }`}
                        >
                          S
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`text-[8px] font-bold px-1 rounded ${
                            track.muted
                              ? 'bg-ghost-warning-amber/20 text-ghost-warning-amber'
                              : 'text-ghost-text-muted'
                          }`}
                        >
                          M
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1 rounded ${
                            track.soloed
                              ? 'bg-ghost-host-gold/20 text-ghost-host-gold'
                              : 'text-ghost-text-muted'
                          }`}
                        >
                          S
                        </span>
                      </>
                    )}
                  </div>
                  {interactive ? (
                    <input
                      type="range"
                      className="track-volume w-full mt-0.5"
                      min={0}
                      max={100}
                      value={volumes[track.id] ?? 80}
                      onChange={(e) =>
                        setVolumes((v) => ({ ...v, [track.id]: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    <input
                      type="range"
                      className="track-volume w-full mt-0.5 opacity-60"
                      min={0}
                      max={100}
                      value={volumes[track.id] ?? 80}
                      readOnly
                      tabIndex={-1}
                      aria-hidden
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 relative px-1 py-1">
                {clips.map((clip, clipIndex) => {
                  const waveform = generateWaveform(trackIndex * 100 + clipIndex * 37, 60);
                  return (
                    <div
                      key={clipIndex}
                      className="absolute top-1 bottom-1 rounded overflow-hidden"
                      style={{
                        left: `${clip.start}%`,
                        width: `${clip.width}%`,
                        backgroundColor: `${colour}15`,
                        border: `1px solid ${colour}30`,
                      }}
                    >
                      <div className="flex items-end justify-stretch h-full px-0.5 gap-px">
                        {waveform.map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full flex items-end justify-center min-w-px"
                          >
                            <div
                              className="timeline-wave-bar w-full rounded-sm min-h-[2px]"
                              style={{
                                height: `${height * 80}%`,
                                backgroundColor: `${colour}90`,
                                animationDelay: `${i * 0.022}s`,
                                animationDuration: `${0.38 + (i % 9) * 0.04}s`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="absolute top-0 bottom-0 w-px bg-ghost-green timeline-playhead-animated pointer-events-none">
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-ghost-green rotate-45 rounded-sm shadow-[0_0_6px_rgba(0,255,200,0.7)]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
