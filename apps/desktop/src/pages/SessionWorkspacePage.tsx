import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useSessionStore } from '../stores/sessionStore';
import TransportControls from '../components/session/TransportControls';
import TrackTimeline from '../components/session/TrackTimeline';
import Button from '../components/common/Button';

export default function SessionWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, fetchProject, fetchVersions, fetchComments } = useProjectStore();
  const { join, leave } = useSessionStore();

  useEffect(() => {
    if (!id) return;
    fetchProject(id);
    fetchVersions(id);
    fetchComments(id);
    join(id);
    return () => { leave(); };
  }, [id]);

  const projectName = currentProject?.name || 'Sacred Dreams';

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Session header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ghost-border shrink-0">
        <div className="flex items-center gap-4">
          <button className="text-ghost-text-muted hover:text-ghost-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-sm font-bold text-ghost-text-primary">{projectName}</h2>
          <TransportControls />
        </div>
        <Button size="sm" variant="secondary" className="text-[11px] gap-1">
          <span className="text-ghost-purple">+</span> INVITE
        </Button>
      </div>

      {/* Track timeline */}
      <div className="flex-1 min-h-0 p-3">
        <TrackTimeline />
      </div>
    </div>
  );
}
