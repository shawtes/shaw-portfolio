'use client';
import { Canvas } from '@react-three/fiber';
import { MiniShaw } from './IntroExperience';

export default function MiniShawCanvas() {
  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 20, width: 120, height: 180,
      zIndex: 50, pointerEvents: 'none',
    }}>
      <Canvas camera={{ fov: 40, position: [0, 1.2, 3] }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[1, 2, 2]} color="#22D3EE" intensity={1} />
        <MiniShaw />
      </Canvas>
    </div>
  );
}
