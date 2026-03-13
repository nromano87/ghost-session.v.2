import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';

const trackTypeColours: Record<string, string> = {
  audio: '#42A5F5',
  midi: '#8B5CF6',
  drum: '#FF6B6B',
  loop: '#4ECDC4',
};

const defaultTracks = [
  { id: '1', name: 'GUITAR', type: 'audio', muted: false, soloed: false },
  { id: '2', name: 'DRUMS', type: 'drum', muted: false, soloed: false },
  { id: '3', name: 'BASS', type: 'audio', muted: false, soloed: false },
  { id: '4', name: 'SYNTH', type: 'midi', muted: false, soloed: false },
];

// Generate pseudo-random waveform bars for visual display
function generateWaveform(seed: number, count: number): number[] {
  const bars: number[] = [];
  let val = seed;
  for (let i = 0; i < count; i++) {
    val = (val * 16807 + 11) % 2147483647;
    bars.push(0.15 + (val % 1000) / 1000 * 0.85);
  }
  return bars;
}

// Generate clip positions for a track (pseudo-random based on track index)
function generateClips(trackIndex: number) {
  const clips = [];
  const patterns = [
    [{ start: 0, width: 35 }, { start: 40, width: 25 }, { start: 70, width: 28 }],
    [{ start: 5, width: 20 }, { start: 30, width: 40 }, { start: 75, width: 22 }],
    [{ start: 0, width: 45 }, { start: 50, width: 48 }],
    [{ start: 10, width: 30 }, { start: 45, width: 20 }, { start: 68, width: 30 }],
  ];
  return patterns[trackIndex % patterns.length];
}

const timeMarkers = [1, 5, 9, 13, 17, 21, 25, 29];

export default function TrackTimeline() {
  const { currentProject } = useProjectStore();
  const tracks = currentProject?.tracks?.length
    ? currentProject.tracks
    : defaultTracks;
  const [volumes, setVolumes] = useState<Record<string, number>>(
    Object.fromEntries(tracks.map((t: any) => [t.id, 80]))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-lg border border-ghost-border bg-ghost-bg/50">
      {/* Timeline ruler */}
      <div className="flex shrink-0 border-b border-ghost-border">
        <div className="w-36 shrink-0" />
        <div className="flex-1 flex items-end px-2 h-6 relative">
          {timeMarkers.map((marker, i) => (
            <div
              key={marker}
              className="absolute text-[9px] text-ghost-text-muted font-mono"
              style={{ left: `${(i / (timeMarkers.length - 1)) * 100}%` }}
            >
              {marker}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track: any, trackIndex: number) => {
          const colour = trackTypeColours[track.type] || '#42A5F5';
          const clips = generateClips(trackIndex);

          return (
            <div
              key={track.id}
              className="flex items-stretch border-b border-ghost-border/50 group hover:bg-ghost-surface-light/30 transition-colors"
              style={{ height: '64px' }}
            >
              {/* Track label */}
              <div className="w-36 shrink-0 flex items-center gap-2 px-3 border-r border-ghost-border/50">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: colour }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-ghost-text-primary uppercase tracking-wide truncate">
                    {track.name}
                  </p>
                  <div className="flex gap-1 mt-0.5">
                    <button
                      className={`text-[8px] font-bold px-1 rounded ${
                        track.muted
                          ? 'bg-ghost-warning-amber/20 text-ghost-warning-amber'
                          : 'text-ghost-text-muted hover:text-ghost-text-primary'
                      }`}
                    >
                      M
                    </button>
                    <button
                      className={`text-[8px] font-bold px-1 rounded ${
                        track.soloed
                          ? 'bg-ghost-host-gold/20 text-ghost-host-gold'
                          : 'text-ghost-text-muted hover:text-ghost-text-primary'
                      }`}
                    >
                      S
                    </button>
                  </div>
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
                </div>
              </div>

              {/* Waveform area */}
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
                        backgroundColor: colour + '15',
                        border: `1px solid ${colour}30`,
                      }}
                    >
                      {/* Waveform bars */}
                      <div className="flex items-center h-full px-0.5 gap-px">
                        {waveform.map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm min-w-px"
                            style={{
                              height: `${height * 80}%`,
                              backgroundColor: colour + '80',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-ghost-green playhead-pulse"
                  style={{ left: '32%' }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-ghost-green rotate-45 rounded-sm" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
