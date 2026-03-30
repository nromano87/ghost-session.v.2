import TransportControls from './TransportControls';
import Button from '../common/Button';

export type SessionHeaderBarMode = 'workspace' | 'preview';

export type SessionHeaderBarProps = {
  title: string;
  mode: SessionHeaderBarMode;
};

/**
 * Session chrome header — same row as the logged-in DAW workspace (`SessionWorkspacePage`).
 * Preview mode adds a Live pill and hides back / invite (auth left column).
 */
export default function SessionHeaderBar({ title, mode }: SessionHeaderBarProps) {
  const isPreview = mode === 'preview';

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-ghost-border shrink-0 gap-3">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {!isPreview && (
          <button
            type="button"
            className="text-ghost-text-muted hover:text-ghost-text-primary transition-colors shrink-0"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        {isPreview && (
          <div
            className="flex items-center gap-2 shrink-0 rounded-full border border-ghost-green/30 bg-ghost-green/10 px-2 py-0.5"
            aria-hidden
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ghost-green animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-ghost-green">Live</span>
          </div>
        )}
        <h2 className="text-sm font-bold text-ghost-text-primary truncate">{title}</h2>
        <div className={isPreview ? 'pointer-events-none opacity-[0.92] select-none' : undefined}>
          <TransportControls />
        </div>
      </div>
      {!isPreview && (
        <Button size="sm" variant="secondary" className="text-[11px] gap-1 shrink-0">
          <span className="text-ghost-purple">+</span> INVITE
        </Button>
      )}
    </header>
  );
}
