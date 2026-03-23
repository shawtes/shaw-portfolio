'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

const IntroExperience = dynamic(() => import('../components/IntroExperience'), { ssr: false });
const Portfolio = dynamic(() => import('../components/Portfolio'), { ssr: false });

export default function Page() {
  const [phase, setPhase] = useState<'intro' | 'disposing' | 'portfolio'>('intro');

  const handleIntroComplete = useCallback(() => {
    setPhase('disposing');
  }, []);

  useEffect(() => {
    if (phase === 'disposing') {
      // Force kill any WebGL contexts left behind
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(c => {
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        }
      });

      // Wait for GC then show portfolio
      const timer = setTimeout(() => setPhase('portfolio'), 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div style={{ background: '#050507', minHeight: '100vh' }}>
      {phase === 'intro' && <IntroExperience onComplete={handleIntroComplete} />}

      {phase === 'disposing' && (
        <div style={{ position: 'fixed', inset: 0, background: '#050507', zIndex: 50 }} />
      )}

      {phase === 'portfolio' && <Portfolio />}
    </div>
  );
}
