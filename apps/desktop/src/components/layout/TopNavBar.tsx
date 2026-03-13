import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Avatar from '../common/Avatar';

const tabs = [
  { key: 'projects', label: 'PROJECTS', path: '/projects' },
  { key: 'sessions', label: 'SESSIONS', path: '/sessions' },
  { key: 'library', label: 'LIBRARY', path: '/library' },
  { key: 'ai-assist', label: 'AI ASSIST', path: '/ai-assist' },
];

export default function TopNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.key || 'sessions';

  return (
    <header className="h-11 bg-ghost-surface border-b border-ghost-border flex items-center px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6">
        <div className="w-6 h-6 rounded-full bg-ghost-purple/30 border border-ghost-purple/50 flex items-center justify-center">
          <span className="text-[10px]">👻</span>
        </div>
        <span className="text-sm font-bold tracking-tight">
          <span className="text-ghost-text-primary">GHOST</span>{' '}
          <span className="text-ghost-purple">SESSION</span>
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`px-3 py-1.5 text-[11px] font-semibold tracking-wider rounded transition-colors ${
              activeTab === tab.key
                ? 'bg-ghost-purple/20 text-ghost-purple'
                : 'text-ghost-text-muted hover:text-ghost-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right icons */}
      <div className="flex items-center gap-3">
        <button className="text-ghost-text-muted hover:text-ghost-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <button className="text-ghost-text-muted hover:text-ghost-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button className="text-ghost-text-muted hover:text-ghost-text-primary transition-colors relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-ghost-purple rounded-full" />
        </button>
        {user && (
          <Avatar name={user.displayName} size="sm" colour="#8B5CF6" />
        )}
      </div>
    </header>
  );
}
