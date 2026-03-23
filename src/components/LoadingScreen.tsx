'use client';

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#060710',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Sora', sans-serif",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'linear-gradient(135deg,#22D3EE,#A78BFA)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, color: '#fff',
        marginBottom: 20,
        animation: 'pulse 1.5s infinite',
      }}>ST</div>
      <div style={{
        fontSize: 12, color: '#64748B', fontFamily: 'monospace',
        letterSpacing: '.1em',
      }}>initializing...</div>
      <div style={{
        width: 120, height: 2, background: 'rgba(255,255,255,0.05)',
        borderRadius: 1, marginTop: 16, overflow: 'hidden',
      }}>
        <div style={{
          width: '60%', height: '100%',
          background: 'linear-gradient(90deg,#22D3EE,#A78BFA)',
          borderRadius: 1,
          animation: 'loading 1.5s infinite ease-in-out',
        }} />
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
