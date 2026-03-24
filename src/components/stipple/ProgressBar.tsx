'use client';

interface ProgressBarProps {
  progress: number;     // 0-1
  iteration: number;
  total: number;
  visible: boolean;
}

export default function ProgressBar({ progress, iteration, total, visible }: ProgressBarProps) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${progress * 100}%`,
          background: '#c1ff00', borderRadius: 2,
          transition: 'width 0.15s ease-out',
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
        Lloyd {iteration}/{total}
      </span>
    </div>
  );
}
