import { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { api } from '../../lib/api';
import { audioBufferCache } from '../../lib/audio';
import StemRow from '../tracks/StemRow';

const VISIBLE_BARS = 16;

function useBarMetrics() {
  const duration = useAudioStore((s) => s.duration);
  const projectBpm = useAudioStore((s) => s.projectBpm);
  const bpm = projectBpm > 0 ? projectBpm : 120;
  const secondsPerBar = (60 / bpm) * 4;
  const totalBars = duration > 0 ? Math.max(VISIBLE_BARS, Math.ceil(duration / secondsPerBar)) : VISIBLE_BARS;
  return { duration, bpm, secondsPerBar, totalBars };
}

export function TrackWithWidth({ track, selectedProjectId, deleteTrack, updateTrack, trackZoom, fetchProject }: { track: any; selectedProjectId: string; deleteTrack: any; updateTrack: any; trackZoom: 'full' | 'half'; fetchProject: any }) {
  const trackBuffer = useAudioStore((s) => s.loadedTracks.get(track.id)?.buffer);
  const maxDur = useAudioStore((s) => s.duration);
  const bufferVersion = useAudioStore((s) => s.bufferVersion);
  const trackDur = trackBuffer?.duration || 0;
  const widthPct = maxDur > 0 && trackDur > 0 ? (trackDur / maxDur) * 100 : 100;

  return (
    <StemRow
      key={`${track.id}-${bufferVersion}`}
      trackId={track.id}
      name={track.name || track.fileName || 'Track'}
      type={track.type || 'audio'}
      fileId={track.fileId}
      projectId={selectedProjectId}
      createdAt={track.createdAt}
      onDelete={() => { useAudioStore.getState().removeTrack(track.id); deleteTrack(selectedProjectId, track.id); }}
      onRename={(newName) => updateTrack(selectedProjectId, track.id, { name: newName })}
      compact={trackZoom === 'half'}
      widthPercent={widthPct}
    />
  );
}

export function ArrangementDropZone({ projectId, onFilesAdded, children }: { projectId: string; onFilesAdded: () => void; children: React.ReactNode }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('audio/') || f.name.match(/\.(wav|mp3|flac|aiff|ogg|m4a|aac)$/i)
    );
    if (droppedFiles.length === 0) return;
    for (const file of droppedFiles) {
      const { fileId } = await api.uploadFile(projectId, file);
      const trackName = file.name.replace(/\.[^.]+$/, '');
      await api.addTrack(projectId, { name: trackName, type: 'fullmix', fileId, fileName: file.name } as any);
    }
    onFilesAdded();
  };

  return (
    <div
      className={`relative transition-all ${dragOver ? 'ring-2 ring-ghost-green/50 ring-inset' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {children}
      {dragOver && (
        <div className="absolute inset-0 bg-ghost-green/5 pointer-events-none z-30 rounded-xl" />
      )}
    </div>
  );
}

export function ArrangementScrollView({ children, showAll }: { children: React.ReactNode; showAll?: boolean }) {
  const { duration, secondsPerBar, totalBars } = useBarMetrics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const currentTime = useAudioStore((s) => s.currentTime);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Auto-scroll to follow playhead during playback (only in 16-bar mode)
  useEffect(() => {
    if (showAll || !isPlaying || !containerRef.current || duration <= 0) return;
    const pxPerBar = containerWidth / VISIBLE_BARS;
    const totalWidth = totalBars * pxPerBar;
    const playheadX = (currentTime / duration) * totalWidth;
    const scrollLeft = containerRef.current.scrollLeft;
    const viewEnd = scrollLeft + containerWidth;

    if (playheadX > viewEnd - 50 || playheadX < scrollLeft) {
      containerRef.current.scrollLeft = Math.max(0, playheadX - containerWidth * 0.25);
    }
  }, [currentTime, isPlaying, duration, totalBars, containerWidth, showAll]);

  const totalWidth = showAll ? '100%' : totalBars * (containerWidth / VISIBLE_BARS);

  return (
    <div ref={containerRef} className={showAll ? 'relative' : 'overflow-x-auto overflow-y-visible relative'} style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent' }}>
      <div style={{ width: totalWidth, minWidth: '100%', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

export function BarRuler() {
  const { duration, secondsPerBar, totalBars } = useBarMetrics();
  const seekTo = useAudioStore((s) => s.seekTo);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!rulerRef.current || duration <= 0) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left + (rulerRef.current.parentElement?.parentElement?.scrollLeft || 0)) / rulerRef.current.offsetWidth;
    seekTo(pct * duration);
  };

  return (
    <div
      ref={rulerRef}
      className="h-7 relative cursor-pointer select-none shrink-0 sticky top-0 z-30"
      style={{ background: 'rgba(10,4,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      onClick={handleClick}
    >
      {Array.from({ length: totalBars }).map((_, i) => {
        const leftPct = duration > 0 ? (i * secondsPerBar / duration) * 100 : (i / totalBars) * 100;
        return (
          <div key={i} className="absolute top-0 bottom-0" style={{ left: `${leftPct}%` }}>
            <div className="absolute top-0 w-px bottom-0 bg-white/[0.12]" />
            <span className="text-[9px] font-mono text-white/35 pl-1 leading-7 select-none whitespace-nowrap">{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BarGridOverlay() {
  const { duration, secondsPerBar, totalBars } = useBarMetrics();

  if (totalBars === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Array.from({ length: totalBars }).map((_, i) => {
        const leftPct = (i * secondsPerBar / duration) * 100;
        return (
          <div key={i} className="absolute top-0 bottom-0 w-px bg-white/[0.06]" style={{ left: `${leftPct}%` }} />
        );
      })}
    </div>
  );
}

export function DraggableTrackList({ tracks, selectedProjectId, deleteTrack, updateTrack, trackZoom, fetchProject }: {
  tracks: any[];
  selectedProjectId: string;
  deleteTrack: any;
  updateTrack: any;
  trackZoom: 'full' | 'half';
  fetchProject: any;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const reversed = [...tracks].reverse();

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }

    const reordered = [...reversed];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    // Reverse back to get original order (DB stores oldest-first)
    const newOrder = [...reordered].reverse();
    const trackIds = newOrder.map((t: any) => t.id);

    setDragIdx(null);
    setOverIdx(null);

    await api.reorderTracks(selectedProjectId, trackIds);
    fetchProject(selectedProjectId);
  }, [dragIdx, reversed, selectedProjectId, fetchProject]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  return (
    <div className="relative space-y-1">
      {reversed.map((track: any, idx: number) => (
        <div
          key={track.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={`relative transition-transform duration-150 ${
            dragIdx === idx ? 'opacity-40 scale-[0.98]' : ''
          } ${overIdx === idx && dragIdx !== idx ? 'ring-2 ring-purple-500/60 ring-inset rounded-xl' : ''}`}
        >
          <TrackWithWidth
            track={track}
            selectedProjectId={selectedProjectId}
            deleteTrack={deleteTrack}
            updateTrack={updateTrack}
            trackZoom={trackZoom}
            fetchProject={fetchProject}
          />
        </div>
      ))}
      <BarGridOverlay />
    </div>
  );
}

export function ArrangementPlayhead() {
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isPlaying && currentTime === 0) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-20"
      style={{
        left: `${Math.min(pct, 100)}%`,
        background: 'rgba(255,255,255,0.8)',
        boxShadow: '0 0 6px rgba(255,255,255,0.4), 0 0 12px rgba(255,255,255,0.1)',
      }}
    >
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" style={{ boxShadow: '0 0 4px rgba(255,255,255,0.6)' }} />
    </div>
  );
}
