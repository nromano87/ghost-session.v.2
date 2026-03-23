import { create } from 'zustand';
import { api } from '../lib/api';
// @ts-ignore - soundtouchjs types
import { SoundTouch, SimpleFilter } from 'soundtouchjs';

interface LoadedTrack {
  id: string;
  buffer: AudioBuffer;         // original buffer
  stretchedBuffer: AudioBuffer | null; // pre-stretched buffer (pitch-preserved)
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  volume: number;
  muted: boolean;
  soloed: boolean;
  bpm: number;
  stretchedForRate: number;    // the rate this was stretched for (to cache)
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  projectBpm: number;
  loadedTracks: Map<string, LoadedTrack>;
  soloActive: boolean;
  soloPlayingTrackId: string | null;
  soloCurrentTime: number;
  soloDuration: number;
  loadError: string | null;

  loadTrack: (trackId: string, fileId: string, projectId: string, trackBpm?: number) => Promise<void>;
  unloadTrack: (trackId: string) => void;
  setProjectBpm: (bpm: number) => void;
  setTrackBpm: (trackId: string, bpm: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  playSoloTrack: (trackId: string) => void;
  stopSoloTrack: () => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackMuted: (trackId: string, muted: boolean) => void;
  setTrackSoloed: (trackId: string, soloed: boolean) => void;
  cleanup: () => void;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let startedAt = 0;
let pausedAt = 0;
let rafId: number | null = null;
const bufferCache = new Map<string, AudioBuffer>();
let soloSource: AudioBufferSourceNode | null = null;
let soloGain: GainNode | null = null;
let soloStartedAt = 0;
let soloRafId: number | null = null;

// Cache for pre-stretched buffers: key = `${fileId}_${rate}`
const stretchCache = new Map<string, AudioBuffer>();

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function getMaster() {
  getCtx();
  return masterGain!;
}

/**
 * Offline time-stretch a buffer using SoundTouch (WSOLA).
 * Returns a new AudioBuffer at the original pitch but new tempo.
 */
function stretchBuffer(buffer: AudioBuffer, tempoRatio: number): AudioBuffer {
  const ctx = getCtx();
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const originalLength = buffer.length;

  // Estimate output length
  const estimatedLength = Math.ceil(originalLength / tempoRatio) + 8192;

  // Set up SoundTouch
  const st = new SoundTouch();
  st.tempo = tempoRatio;
  st.pitch = 1.0;

  // Create interleaved input (SoundTouch works with interleaved stereo)
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;
  const inputSamples = new Float32Array(originalLength * 2);
  for (let i = 0; i < originalLength; i++) {
    inputSamples[i * 2] = left[i];
    inputSamples[i * 2 + 1] = right[i];
  }

  // Source that feeds samples to SoundTouch
  let readPos = 0;
  const source = {
    extract(target: Float32Array, numFrames: number, position: number): number {
      const start = position * 2;
      let extracted = 0;
      for (let i = 0; i < numFrames; i++) {
        const idx = start + i * 2;
        if (idx + 1 >= inputSamples.length) break;
        target[i * 2] = inputSamples[idx];
        target[i * 2 + 1] = inputSamples[idx + 1];
        extracted++;
      }
      return extracted;
    }
  };

  const filter = new SimpleFilter(source, st);

  // Extract all output
  const outputChunks: Float32Array[] = [];
  let totalFrames = 0;
  const chunkSize = 4096;

  while (true) {
    const chunk = new Float32Array(chunkSize * 2);
    const extracted = filter.extract(chunk, chunkSize);
    if (extracted === 0) break;
    outputChunks.push(chunk.slice(0, extracted * 2));
    totalFrames += extracted;
    // Safety: don't exceed 3x the expected length
    if (totalFrames > estimatedLength * 3) break;
  }

  // Create output AudioBuffer
  const outputLength = totalFrames;
  const outputBuffer = ctx.createBuffer(channels >= 2 ? 2 : 1, outputLength, sampleRate);
  const outLeft = outputBuffer.getChannelData(0);
  const outRight = channels >= 2 ? outputBuffer.getChannelData(1) : null;

  let writePos = 0;
  for (const chunk of outputChunks) {
    const frames = chunk.length / 2;
    for (let i = 0; i < frames && writePos < outputLength; i++) {
      outLeft[writePos] = chunk[i * 2];
      if (outRight) outRight[writePos] = chunk[i * 2 + 1];
      writePos++;
    }
  }

  return outputBuffer;
}

export const useAudioStore = create<AudioState>((set, get) => {
  function updatePosition() {
    const ctx = audioCtx;
    if (!ctx || !get().isPlaying) return;
    const elapsed = ctx.currentTime - startedAt;
    const dur = get().duration;
    const wrapped = dur > 0 ? elapsed % dur : elapsed;
    set({ currentTime: wrapped });
    rafId = requestAnimationFrame(updatePosition);
  }

  function getTempoRatio(track: LoadedTrack): number {
    const { projectBpm } = get();
    if (projectBpm > 0 && track.bpm > 0) {
      return projectBpm / track.bpm;
    }
    return 1;
  }

  /**
   * Get the buffer to play for a track — stretched if needed.
   */
  function getPlayBuffer(track: LoadedTrack): AudioBuffer {
    const rate = getTempoRatio(track);
    if (rate === 1 || rate <= 0) return track.buffer;

    // Check if we already have a stretched version for this rate
    if (track.stretchedBuffer && Math.abs(track.stretchedForRate - rate) < 0.001) {
      return track.stretchedBuffer;
    }

    // Check global cache
    const cacheKey = `${track.id}_${rate.toFixed(4)}`;
    if (stretchCache.has(cacheKey)) {
      const cached = stretchCache.get(cacheKey)!;
      track.stretchedBuffer = cached;
      track.stretchedForRate = rate;
      return cached;
    }

    // Stretch offline
    const stretched = stretchBuffer(track.buffer, rate);
    stretchCache.set(cacheKey, stretched);
    track.stretchedBuffer = stretched;
    track.stretchedForRate = rate;
    return stretched;
  }

  function startAllSources(offset: number) {
    const ctx = getCtx();
    const { loadedTracks } = get();

    loadedTracks.forEach((track) => {
      if (track.source) {
        try { track.source.stop(); } catch {}
      }

      const playBuffer = getPlayBuffer(track);
      const source = ctx.createBufferSource();
      source.buffer = playBuffer;
      source.loop = true;
      source.loopEnd = playBuffer.duration;

      const gain = ctx.createGain();
      gain.gain.value = track.muted ? 0 : track.volume;
      source.connect(gain);
      gain.connect(getMaster());

      const trackOffset = offset % playBuffer.duration;
      source.start(0, trackOffset);

      track.source = source;
      track.gainNode = gain;
    });

    startedAt = ctx.currentTime - offset;
    updateSoloState();
  }

  function stopAllSources() {
    const { loadedTracks } = get();
    loadedTracks.forEach((track) => {
      if (track.source) {
        try { track.source.stop(); } catch {}
        track.source = null;
        track.gainNode = null;
      }
    });
  }

  function updateSoloState() {
    const { loadedTracks } = get();
    const anySoloed = Array.from(loadedTracks.values()).some((t) => t.soloed);
    set({ soloActive: anySoloed });

    loadedTracks.forEach((track) => {
      if (track.gainNode) {
        if (track.muted) {
          track.gainNode.gain.value = 0;
        } else if (anySoloed) {
          track.gainNode.gain.value = track.soloed ? track.volume : 0;
        } else {
          track.gainNode.gain.value = track.volume;
        }
      }
    });
  }

  function recalcDuration() {
    const { loadedTracks } = get();
    let maxDur = 0;
    loadedTracks.forEach((t) => {
      const buf = getPlayBuffer(t);
      if (buf.duration > maxDur) maxDur = buf.duration;
    });
    set({ duration: maxDur });
  }

  function restartIfPlaying() {
    const wasPlaying = get().isPlaying;
    if (wasPlaying) {
      const ctx = getCtx();
      const currentOffset = ctx.currentTime - startedAt;
      stopAllSources();
      if (rafId) cancelAnimationFrame(rafId);
      startAllSources(currentOffset);
      set({ isPlaying: true });
      rafId = requestAnimationFrame(updatePosition);
    }
    recalcDuration();
  }

  return {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    projectBpm: 0,
    loadedTracks: new Map(),
    soloActive: false,
    soloPlayingTrackId: null,
    soloCurrentTime: 0,
    soloDuration: 0,
    loadError: null,

    loadTrack: async (trackId, fileId, projectId, trackBpm = 0) => {
      if (bufferCache.has(fileId)) {
        const cachedBuf = bufferCache.get(fileId)!;
        set((s) => {
          const m = new Map(s.loadedTracks);
          const existing = m.get(trackId);
          m.set(trackId, {
            id: trackId, buffer: cachedBuf, stretchedBuffer: null, source: null, gainNode: null,
            volume: existing?.volume ?? 1, muted: existing?.muted ?? false, soloed: existing?.soloed ?? false,
            bpm: trackBpm || existing?.bpm || 0, stretchedForRate: 0,
          });
          return { loadedTracks: m };
        });
        recalcDuration();
        return;
      }

      try {
        const arrayBuffer = await api.downloadFile(projectId, fileId);
        const tempCtx = new AudioContext();
        const buffer = await tempCtx.decodeAudioData(arrayBuffer);
        await tempCtx.close();
        bufferCache.set(fileId, buffer);

        set((s) => {
          const m = new Map(s.loadedTracks);
          m.set(trackId, {
            id: trackId, buffer, stretchedBuffer: null, source: null, gainNode: null,
            volume: 1, muted: false, soloed: false, bpm: trackBpm, stretchedForRate: 0,
          });
          return { loadedTracks: m };
        });
        recalcDuration();
      } catch (err: any) {
        console.error('[AudioStore] Failed to load track:', trackId, 'fileId:', fileId, err);
        set({ loadError: `Track ${trackId}: ${err?.message || err}` });
      }
    },

    setProjectBpm: (bpm) => {
      set({ projectBpm: bpm });
      restartIfPlaying();
    },

    setTrackBpm: (trackId, bpm) => {
      const { loadedTracks } = get();
      const track = loadedTracks.get(trackId);
      if (track) {
        track.bpm = bpm;
        track.stretchedBuffer = null; // invalidate cache
        track.stretchedForRate = 0;
        set({ loadedTracks: new Map(loadedTracks) });
        restartIfPlaying();
      }
    },

    unloadTrack: (trackId) => {
      const { loadedTracks } = get();
      const track = loadedTracks.get(trackId);
      if (track?.source) {
        try { track.source.stop(); } catch {}
      }
      loadedTracks.delete(trackId);
      set({ loadedTracks: new Map(loadedTracks) });
      recalcDuration();
    },

    play: () => {
      if (get().isPlaying) return;
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      pausedAt = 0;
      startAllSources(0);
      set({ isPlaying: true, currentTime: 0 });
      rafId = requestAnimationFrame(updatePosition);
    },

    pause: () => {
      if (!get().isPlaying) return;
      const ctx = getCtx();
      pausedAt = ctx.currentTime - startedAt;
      stopAllSources();
      if (rafId) cancelAnimationFrame(rafId);
      set({ isPlaying: false, currentTime: pausedAt });
    },

    stop: () => {
      stopAllSources();
      if (rafId) cancelAnimationFrame(rafId);
      pausedAt = 0;
      startedAt = 0;
      set({ isPlaying: false, currentTime: 0 });
    },

    seekTo: (time) => {
      const wasPlaying = get().isPlaying;
      stopAllSources();
      if (rafId) cancelAnimationFrame(rafId);
      pausedAt = time;
      set({ currentTime: time });
      if (wasPlaying) {
        startAllSources(time);
        set({ isPlaying: true });
        rafId = requestAnimationFrame(updatePosition);
      }
    },

    setTrackVolume: (trackId, volume) => {
      const { loadedTracks } = get();
      const track = loadedTracks.get(trackId);
      if (track) {
        track.volume = volume;
        if (track.gainNode && !track.muted) {
          track.gainNode.gain.value = volume;
        }
        set({ loadedTracks: new Map(loadedTracks) });
      }
    },

    setTrackMuted: (trackId, muted) => {
      const { loadedTracks } = get();
      const track = loadedTracks.get(trackId);
      if (track) {
        track.muted = muted;
        set({ loadedTracks: new Map(loadedTracks) });
        updateSoloState();
      }
    },

    setTrackSoloed: (trackId, soloed) => {
      const { loadedTracks } = get();
      const track = loadedTracks.get(trackId);
      if (track) {
        track.soloed = soloed;
        set({ loadedTracks: new Map(loadedTracks) });
        updateSoloState();
      }
    },

    playSoloTrack: (trackId) => {
      if (soloSource) { try { soloSource.stop(); } catch {} soloSource = null; }
      if (soloGain) { soloGain.disconnect(); soloGain = null; }
      if (soloRafId) { cancelAnimationFrame(soloRafId); soloRafId = null; }
      if (get().isPlaying) { get().pause(); }

      const track = get().loadedTracks.get(trackId);
      if (!track) return;

      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();

      soloSource = ctx.createBufferSource();
      soloSource.buffer = track.buffer;
      soloSource.loop = false;

      soloGain = ctx.createGain();
      soloGain.gain.value = track.volume;
      soloSource.connect(soloGain);
      soloGain.connect(getMaster());

      soloSource.onended = () => {
        if (soloRafId) { cancelAnimationFrame(soloRafId); soloRafId = null; }
        set({ soloPlayingTrackId: null, soloCurrentTime: 0, soloDuration: 0 });
        soloSource = null;
        soloGain?.disconnect();
        soloGain = null;
      };

      soloStartedAt = ctx.currentTime;
      const dur = track.buffer.duration;
      soloSource.start(0);
      set({ soloPlayingTrackId: trackId, soloCurrentTime: 0, soloDuration: dur });

      function updateSoloPos() {
        if (!get().soloPlayingTrackId) return;
        const elapsed = (audioCtx?.currentTime || 0) - soloStartedAt;
        set({ soloCurrentTime: Math.min(elapsed, dur) });
        soloRafId = requestAnimationFrame(updateSoloPos);
      }
      soloRafId = requestAnimationFrame(updateSoloPos);
    },

    stopSoloTrack: () => {
      if (soloSource) { try { soloSource.stop(); } catch {} soloSource = null; }
      if (soloGain) { soloGain.disconnect(); soloGain = null; }
      if (soloRafId) { cancelAnimationFrame(soloRafId); soloRafId = null; }
      set({ soloPlayingTrackId: null, soloCurrentTime: 0, soloDuration: 0 });
    },

    cleanup: () => {
      stopAllSources();
      if (soloSource) { try { soloSource.stop(); } catch {} soloSource = null; }
      if (soloGain) { soloGain.disconnect(); soloGain = null; }
      if (rafId) cancelAnimationFrame(rafId);
      pausedAt = 0;
      startedAt = 0;
      if (soloRafId) { cancelAnimationFrame(soloRafId); soloRafId = null; }
      stretchCache.clear();
      set({ isPlaying: false, currentTime: 0, loadedTracks: new Map(), duration: 0, projectBpm: 0, soloPlayingTrackId: null, soloCurrentTime: 0, soloDuration: 0 });
    },
  };
});
