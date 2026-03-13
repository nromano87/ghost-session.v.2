import { useState } from 'react';
import Avatar from '../common/Avatar';

function GhostKeys() {
  const [position, setPosition] = useState({ x: 40, y: 60 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const updatePos = (ev: MouseEvent) => {
      const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
      setPosition({ x, y });
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', updatePos);
      window.removeEventListener('mouseup', handleUp);
    };
    updatePos(e.nativeEvent);
    window.addEventListener('mousemove', updatePos);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-[9px] font-semibold text-ghost-text-muted uppercase tracking-widest">
        Ghost Keys
      </h4>
      <div
        className="w-32 h-24 rounded-lg bg-ghost-bg border border-ghost-border relative cursor-crosshair overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-ghost-purple" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-ghost-purple" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-ghost-purple" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-ghost-purple" />
        </div>
        {/* Glow */}
        <div
          className="absolute w-12 h-12 rounded-full blur-xl"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent)',
          }}
        />
        {/* Cursor dot */}
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-ghost-purple bg-ghost-purple/30"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      <div className="flex justify-between px-0.5">
        <span className="text-[8px] text-ghost-text-muted">MOOD</span>
        <span className="text-[8px] text-ghost-text-muted">TEXTURE</span>
        <span className="text-[8px] text-ghost-text-muted">MOVEMENT</span>
      </div>
    </div>
  );
}

function EffectKnob({ label, sublabel }: { label: string; sublabel: string }) {
  const [value, setValue] = useState(50);

  return (
    <div className="flex flex-col items-center gap-1">
      <h4 className="text-[9px] font-semibold text-ghost-text-muted uppercase tracking-widest">
        {label}
      </h4>
      {/* Knob */}
      <div
        className="w-16 h-16 rounded-full border-2 border-ghost-border bg-ghost-bg relative cursor-pointer group"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startVal = value;
          const handleMove = (ev: MouseEvent) => {
            const delta = (startY - ev.clientY) * 0.5;
            setValue(Math.max(0, Math.min(100, startVal + delta)));
          };
          const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
          };
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
        }}
      >
        {/* Track arc */}
        <svg className="absolute inset-0" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r="26"
            fill="none"
            stroke="#2A2A4A"
            strokeWidth="3"
            strokeDasharray="130 33"
            strokeDashoffset="-16"
            strokeLinecap="round"
          />
          <circle
            cx="32" cy="32" r="26"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3"
            strokeDasharray={`${(value / 100) * 130} ${163 - (value / 100) * 130}`}
            strokeDashoffset="-16"
            strokeLinecap="round"
          />
        </svg>
        {/* Value indicator line */}
        <div
          className="absolute w-0.5 h-3 bg-ghost-purple rounded-full"
          style={{
            left: '50%',
            top: '6px',
            transformOrigin: '50% 170%',
            transform: `translateX(-50%) rotate(${-135 + (value / 100) * 270}deg)`,
          }}
        />
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono text-ghost-text-secondary">
            {Math.round(value)}
          </span>
        </div>
      </div>
      <div className="flex gap-4 text-[8px] text-ghost-text-muted">
        <span>DRY</span>
        <span>WET</span>
      </div>
    </div>
  );
}

function MasterMeter() {
  return (
    <div className="flex flex-col items-center gap-1">
      <h4 className="text-[9px] font-semibold text-ghost-text-muted uppercase tracking-widest">
        Master
      </h4>
      <div className="flex gap-1 h-20">
        {/* Left channel */}
        <div className="w-3 bg-ghost-bg rounded-full border border-ghost-border overflow-hidden flex flex-col-reverse">
          <div className="w-full rounded-full bg-gradient-to-t from-ghost-green via-ghost-green to-ghost-warning-amber" style={{ height: '65%' }} />
        </div>
        {/* Right channel */}
        <div className="w-3 bg-ghost-bg rounded-full border border-ghost-border overflow-hidden flex flex-col-reverse">
          <div className="w-full rounded-full bg-gradient-to-t from-ghost-green via-ghost-green to-ghost-warning-amber" style={{ height: '58%' }} />
        </div>
      </div>
      <span className="text-[8px] text-ghost-text-muted font-mono">-3.2 dB</span>
    </div>
  );
}

function VersionHistory() {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[9px] font-semibold text-ghost-text-muted uppercase tracking-widest">
        Version History
      </h4>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-ghost-purple">V5</span>
        <div className="flex -space-x-1.5">
          <Avatar name="Austin" size="sm" colour="#8B5CF6" />
          <Avatar name="Mike" size="sm" colour="#42A5F5" />
        </div>
      </div>
      <button className="px-2 py-1 text-[10px] font-semibold bg-ghost-surface-light border border-ghost-border rounded text-ghost-text-secondary hover:text-ghost-text-primary transition-colors">
        Revert
      </button>
    </div>
  );
}

function VersionPreview() {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[9px] font-semibold text-ghost-text-muted uppercase tracking-widest">
        Version Preview
      </h4>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold text-ghost-text-secondary">V4</span>
        {/* Mini waveform */}
        <div className="flex-1 h-8 rounded bg-ghost-bg border border-ghost-border overflow-hidden flex items-center px-1 gap-px">
          {Array.from({ length: 40 }, (_, i) => {
            const h = 20 + Math.sin(i * 0.5) * 30 + Math.cos(i * 0.3) * 20;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm min-w-px bg-ghost-purple/50"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex gap-1.5">
        <button className="px-2 py-1 text-[10px] font-semibold bg-ghost-cyan/10 text-ghost-cyan border border-ghost-cyan/30 rounded hover:bg-ghost-cyan/20 transition-colors">
          COMPARE
        </button>
        <button className="px-2 py-1 text-[10px] font-semibold bg-ghost-purple/10 text-ghost-purple border border-ghost-purple/30 rounded hover:bg-ghost-purple/20 transition-colors">
          MERGE
        </button>
      </div>
    </div>
  );
}

export default function BottomPanel() {
  return (
    <div className="h-36 bg-ghost-surface border-t border-ghost-border flex items-stretch shrink-0">
      {/* FX button */}
      <div className="w-10 flex items-center justify-center border-r border-ghost-border">
        <button className="text-ghost-text-muted hover:text-ghost-purple transition-colors">
          <span className="text-[10px] font-bold writing-vertical">FX</span>
        </button>
      </div>

      {/* Version History */}
      <div className="px-4 py-3 border-r border-ghost-border flex items-center">
        <VersionHistory />
      </div>

      {/* Master */}
      <div className="px-4 py-2 border-r border-ghost-border flex items-center">
        <MasterMeter />
      </div>

      {/* Version Preview */}
      <div className="px-4 py-3 flex items-center flex-1">
        <VersionPreview />
      </div>
    </div>
  );
}
