import { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import Avatar from '../common/Avatar';

const demoMessages = [
  { userId: '2', displayName: 'Mike', colour: '#42A5F5', text: 'Added new guitar loop', timestamp: Date.now() - 120000 },
  { userId: '2', displayName: 'Mike', colour: '#42A5F5', text: 'Drums are fire!', timestamp: Date.now() - 60000 },
  { userId: '3', displayName: 'Sarah', colour: '#FF6B6B', text: "Let's drop the synth here →", timestamp: Date.now() - 30000 },
];

export default function SessionChat() {
  const { chatMessages, sendMessage } = useSessionStore();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = chatMessages.length > 0 ? chatMessages : demoMessages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  };

  return (
    <aside className="w-64 bg-ghost-surface border-l border-ghost-border flex flex-col shrink-0">
      <div className="px-3 py-2.5 border-b border-ghost-border">
        <h3 className="text-[10px] font-semibold text-ghost-text-muted uppercase tracking-widest">
          Chat:
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <Avatar name={msg.displayName} size="sm" colour={msg.colour} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold" style={{ color: msg.colour }}>
                  {msg.displayName}
                </span>
                <span className="text-[9px] text-ghost-text-muted">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-xs text-ghost-text-primary leading-relaxed mt-0.5">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t border-ghost-border">
        <div className="flex gap-1.5">
          <input
            className="ghost-input flex-1 text-[11px] py-1.5 px-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button
            onClick={handleSend}
            className="px-2 py-1 bg-ghost-purple text-white text-[10px] font-semibold rounded hover:bg-ghost-purple/80 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
