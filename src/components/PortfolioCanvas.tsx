'use client';
import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import SceneController from '../scenes/SceneController';
import PostProcessingPipeline from '../effects/PostProcessingPipeline';
import HTMLOverlay from './HTMLOverlay';
import LoadingScreen from './LoadingScreen';
import { useMobileDetect, getPerformanceSettings } from '../hooks/useMobileDetect';
import { useVirtualScroll } from '../hooks/useVirtualScroll';

/**
 * PortfolioCanvas — Lusion-inspired architecture:
 * - Custom virtual scroll (body overflow:hidden, no native scroll)
 * - Canvas fills viewport, scroll drives camera via progress 0..1
 * - SecondOrderDynamics for spring-based camera motion
 * - ScreenPaint for mouse-driven distortion
 */
export default function PortfolioCanvas() {
  const tier = useMobileDetect();
  const settings = typeof window !== 'undefined' ? getPerformanceSettings(tier) : { dpr: 1, enableBloom: true };
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Lusion-style virtual scroll — no native scrollbar
  const scrollState = useVirtualScroll(8);

  const handleSelectProject = useCallback((id: string) => {
    setSelectedProject(id);
  }, []);

  return (
    <>
      {loading && <LoadingScreen />}
      <Canvas
        dpr={settings.dpr}
        camera={{ fov: 60, near: 0.1, far: 200, position: [0, 1.2, 4] }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        onCreated={() => setTimeout(() => setLoading(false), 500)}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#060710']} />
        <fog attach="fog" args={['#060710', 30, 80]} />

        <Suspense fallback={null}>
          <SceneController
            scrollProgress={scrollState.current.progress}
            scrollVelocity={scrollState.current.velocity}
            onSelectProject={handleSelectProject}
          />
          <PostProcessingPipeline enableBloom={settings.enableBloom} />
          <Preload all />
        </Suspense>
      </Canvas>

      <HTMLOverlay
        selectedProject={selectedProject}
        onCloseProject={() => setSelectedProject(null)}
        scrollProgress={scrollState.current.progress}
      />
    </>
  );
}
