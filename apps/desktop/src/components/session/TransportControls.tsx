import { useState } from 'react';

export default function TransportControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Time display */}
      <span className="text-[11px] font-mono text-ghost-text-secondary tabular-nums w-16 text-right">
        00:00:00
      </span>

      {/* Skip back */}
      <button className="w-7 h-7 flex items-center justify-center rounded text-ghost-text-muted hover:text-ghost-text-primary transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 20L9 12l10-8v16zM7 19V5H5v14h2z" />
        </svg>
      </button>

      {/* Play / Pause */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-ghost-green text-ghost-bg hover:bg-ghost-green/90 transition-colors"
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Skip forward */}
      <button className="w-7 h-7 flex items-center justify-center rounded text-ghost-text-muted hover:text-ghost-text-primary transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4l10 8-10 8V4zm12-1v14h2V5h-2z" />
        </svg>
      </button>

      {/* Loop */}
      <button
        onClick={() => setIsLooping(!isLooping)}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          isLooping ? 'text-ghost-purple' : 'text-ghost-text-muted hover:text-ghost-text-primary'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
      </button>
    </div>
  );
}
