/** Shared defaults for session timeline UI (workspace + auth preview). */
export const TRACK_TYPE_COLOURS: Record<string, string> = {
  audio: '#42A5F5',
  midi: '#8B5CF6',
  drum: '#FF6B6B',
  loop: '#4ECDC4',
};

export const DEFAULT_SESSION_TRACKS = [
  { id: '1', name: 'GUITAR', type: 'audio', muted: false, soloed: false },
  { id: '2', name: 'DRUMS', type: 'drum', muted: false, soloed: false },
  { id: '3', name: 'BASS', type: 'audio', muted: false, soloed: false },
  { id: '4', name: 'SYNTH', type: 'midi', muted: false, soloed: false },
] as const;

export const TIME_MARKERS = [1, 5, 9, 13, 17, 21, 25, 29];

export function generateWaveform(seed: number, count: number): number[] {
  const bars: number[] = [];
  let val = seed;
  for (let i = 0; i < count; i++) {
    val = (val * 16807 + 11) % 2147483647;
    bars.push(0.15 + ((val % 1000) / 1000) * 0.85);
  }
  return bars;
}

export function generateClips(trackIndex: number) {
  const patterns = [
    [{ start: 0, width: 35 }, { start: 40, width: 25 }, { start: 70, width: 28 }],
    [{ start: 5, width: 20 }, { start: 30, width: 40 }, { start: 75, width: 22 }],
    [{ start: 0, width: 45 }, { start: 50, width: 48 }],
    [{ start: 10, width: 30 }, { start: 45, width: 20 }, { start: 68, width: 30 }],
  ];
  return patterns[trackIndex % patterns.length];
}
