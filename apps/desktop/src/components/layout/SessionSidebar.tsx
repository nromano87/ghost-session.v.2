import { useProjectStore } from '../../stores/projectStore';
import { useSessionStore } from '../../stores/sessionStore';
import Avatar from '../common/Avatar';

const collaboratorColours = ['#8B5CF6', '#42A5F5', '#FF6B6B', '#FFD700', '#00FFC8'];

export default function SessionSidebar() {
  const { projects, currentProject } = useProjectStore();
  const { onlineUsers } = useSessionStore();

  return (
    <aside className="w-52 bg-ghost-surface border-r border-ghost-border flex flex-col shrink-0">
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-[10px] font-semibold text-ghost-text-muted uppercase tracking-widest">
            Sessions
          </h3>
        </div>

        <div className="px-3 pt-2 pb-1">
          <p className="text-[10px] text-ghost-text-muted">Favorites</p>
        </div>

        <div className="px-2 space-y-0.5">
          {(projects.length > 0 ? projects : [
            { id: '1', name: 'Sacred Dreams' },
            { id: '2', name: 'Midnight Tape' },
            { id: '3', name: 'Ascension' },
            { id: '4', name: 'Vibe Pack' },
          ]).map((project, i) => {
            const isActive = currentProject?.id === project.id || (currentProject === null && i === 0);
            return (
              <button
                key={project.id}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  isActive
                    ? 'bg-ghost-purple/15 text-ghost-text-primary'
                    : 'text-ghost-text-secondary hover:text-ghost-text-primary hover:bg-ghost-surface-light'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? '#8B5CF6' : '#555570' }}
                />
                <span className="text-xs truncate">{project.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collaborators */}
      <div className="border-t border-ghost-border px-3 py-3">
        <h3 className="text-[10px] font-semibold text-ghost-text-muted uppercase tracking-widest mb-2">
          Collaborators ({onlineUsers.length > 0 ? onlineUsers.length : 4})
        </h3>
        <div className="space-y-1.5">
          {(onlineUsers.length > 0 ? onlineUsers : [
            { userId: '1', displayName: 'Austin', colour: '#8B5CF6' },
            { userId: '2', displayName: 'Mike', colour: '#42A5F5' },
            { userId: '3', displayName: 'Sarah', colour: '#FF6B6B' },
            { userId: '4', displayName: 'JayC', colour: '#FFD700' },
          ]).map((user, i) => (
            <div key={user.userId} className="flex items-center gap-2">
              <Avatar
                name={user.displayName}
                size="sm"
                colour={user.colour || collaboratorColours[i % collaboratorColours.length]}
              />
              <span className="text-xs text-ghost-text-secondary">{user.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
