import { useEffect, useState, useMemo, useRef, useCallback, memo } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { rawDataCache, audioBufferCache, getAudioData } from '../../lib/audio';

export default memo(function Waveform({
  seed, height = 60, fileId, projectId, showPlayhead = false, trackId,
}: {
  seed: string; height?: number; fileId?: string | null; projectId?: string; showPlayhead?: boolean; trackId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rawData, setRawData] = useState<Float32Array | null>(
    fileId ? rawDataCache.get(fileId) || null : null
  );

  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!fileId || !projectId) return;
    if (rawDataCache.has(fileId)) { setRawData(rawDataCache.get(fileId)!); return; }

    let cancelled = false;

    getAudioData(projectId, fileId)
      .then(({ channelData }) => {
        if (!cancelled) setRawData(channelData);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => { cancelled = true; };
  }, [fileId, projectId]);

  const fakeData = useMemo(() => {
    if (rawData) return null;
    if (fileId && projectId && !loadFailed) return null;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    const len = 44100 * 4;
    const data = new Float32Array(len);
    let env = 0;
    for (let i = 0; i < len; i++) {
      h = ((h * 1103515245 + 12345) & 0x7fffffff);
      const noise = ((h & 0xffff) / 32768) - 1;
      if (i % 512 === 0) {
        h = ((h * 1103515245 + 12345) & 0x7fffffff);
        const target = (h % 100) / 100;
        env += (target - env) * 0.3;
      }
      data[i] = noise * env * 0.9;
    }
    return data;
  }, [seed, rawData, fileId, projectId, loadFailed]);

  const audioData = rawData || fakeData;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !audioData) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const mid = h / 2;
    const samplesPerPixel = audioData.length / w;

    const peaks = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      let max = 0;
      const start = Math.floor(x * samplesPerPixel);
      const end = Math.min(Math.floor((x + 1) * samplesPerPixel), audioData.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(audioData[j]);
        if (abs > max) max = abs;
      }
      peaks[x] = max;
    }

    for (let x = 0; x < w; x++) {
      const t = x / w;
      const r = Math.round(0x00 + (0x8B - 0x00) * t);
      const g = Math.round(0xFF + (0x5C - 0xFF) * t);
      const b = Math.round(0xC8 + (0xF6 - 0xC8) * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      const peakH = peaks[x] * mid * 0.84;
      if (peakH > 0.5) {
        ctx.fillRect(x, mid - peakH, 1, peakH * 2);
      }
    }
  }, [audioData]);

  useEffect(() => {
    draw();
    const obs = new ResizeObserver(draw);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const soloPlayingTrackId = useAudioStore((s) => s.soloPlayingTrackId);
  const soloCurrentTime = useAudioStore((s) => s.soloCurrentTime);
  const soloDuration = useAudioStore((s) => s.soloDuration);

  let playheadPct = 0;
  let showLine = false;
  if (showPlayhead) {
    if (trackId && soloPlayingTrackId === trackId && soloDuration > 0) {
      playheadPct = (soloCurrentTime / soloDuration) * 100;
      showLine = true;
    } else if (isPlaying && duration > 0) {
      playheadPct = (currentTime / duration) * 100;
      showLine = true;
    }
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden rounded relative" style={{ height }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {showLine && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none shadow-[0_0_6px_rgba(255,255,255,0.6)]"
          style={{ left: `${playheadPct}%` }}
        />
      )}
    </div>
  );
});
