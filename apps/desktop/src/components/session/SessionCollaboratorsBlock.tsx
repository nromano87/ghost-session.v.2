import { useSessionStore } from '../../stores/sessionStore';
import Avatar from '../common/Avatar';

const COLLABORATOR_COLOURS = ['#8B5CF6', '#42A5F5', '#FF6B6B', '#FFD700', '#00FFC8'];

const PLACEHOLDER_USERS = [
  { userId: '1', displayName: 'Austin', colour: '#8B5CF6' },
  { userId: '2', displayName: 'Mike', colour: '#42A5F5' },
  { userId: '3', displayName: 'Sarah', colour: '#FF6B6B' },
  { userId: '4', displayName: 'JayC', colour: '#FFD700' },
];

export type SessionCollaboratorsBlockProps = {
  /** Sidebar: stacked list under “Collaborators”. Preview: compact horizontal strip. */
  variant: 'sidebar' | 'preview';
};

/**
 * Who’s in the session — shared between `SessionSidebar` and auth preview column.
 */
export default function SessionCollaboratorsBlock({ variant }: SessionCollaboratorsBlockProps) {
  const { onlineUsers } = useSessionStore();
  const users =
    onlineUsers.length > 0
      ? onlineUsers
      : PLACEHOLDER_USERS;

  const count = onlineUsers.length > 0 ? onlineUsers.length : PLACEHOLDER_USERS.length;

  if (variant === 'preview') {
    return (
      <div className="border-t border-ghost-border px-4 py-3 shrink-0">
        <p className="text-[10px] font-semibold text-ghost-text-muted uppercase tracking-widest mb-2">In the room</p>
        <div className="flex flex-wrap gap-2">
          {users.map((user: { userId: string; displayName: string; colour?: string }, i: number) => (
            <div
              key={user.userId}
              className="flex items-center gap-2 rounded-full bg-ghost-surface-light/80 border border-ghost-border/50 pl-1 pr-2.5 py-0.5"
            >
              <Avatar
                name={user.displayName}
                size="sm"
                colour={user.colour || COLLABORATOR_COLOURS[i % COLLABORATOR_COLOURS.length]}
              />
              <span className="text-[11px] text-ghost-text-secondary truncate max-w-[7rem]">{user.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-ghost-border px-3 py-3">
      <h3 className="text-[10px] font-semibold text-ghost-text-muted uppercase tracking-widest mb-2">
        Collaborators ({count})
      </h3>
      <div className="space-y-1.5">
        {users.map((user: { userId: string; displayName: string; colour?: string }, i: number) => (
          <div key={user.userId} className="flex items-center gap-2">
            <Avatar
              name={user.displayName}
              size="sm"
              colour={user.colour || COLLABORATOR_COLOURS[i % COLLABORATOR_COLOURS.length]}
            />
            <span className="text-xs text-ghost-text-secondary">{user.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
