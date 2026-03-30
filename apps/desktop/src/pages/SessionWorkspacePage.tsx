import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useSessionStore } from '../stores/sessionStore';
import SessionHeaderBar from '../components/session/SessionHeaderBar';
import TrackTimeline from '../components/session/TrackTimeline';

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
      <SessionHeaderBar title={projectName} mode="workspace" />
      <div className="flex-1 min-h-0 p-3">
        <TrackTimeline interactive />
      </div>
    </div>
  );
}
