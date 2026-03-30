import SessionHeaderBar from '../session/SessionHeaderBar';
import TrackTimeline from '../session/TrackTimeline';
import SessionCollaboratorsBlock from '../session/SessionCollaboratorsBlock';

const PREVIEW_SESSION_TITLE = 'Sacred Dreams';

/**
 * Auth left column — same session chrome as `SessionWorkspacePage` + `SessionShell`
 * (header + `TrackTimeline` + collaborators), simplified and non-interactive.
 */
export default function SessionPreviewPanel() {
  return (
    <div className="relative flex flex-col min-h-[260px] lg:min-h-screen lg:w-[52%] xl:w-[50%] overflow-hidden bg-ghost-surface border-b lg:border-b-0 lg:border-r border-ghost-border shrink-0">
      <SessionHeaderBar title={PREVIEW_SESSION_TITLE} mode="preview" />
      <div className="flex-1 min-h-0 flex flex-col p-3">
        <TrackTimeline interactive={false} className="flex-1" />
      </div>
      <SessionCollaboratorsBlock variant="preview" />
    </div>
  );
}
