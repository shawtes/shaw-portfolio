'use client';
import ShawCharacter from '../objects/ShawCharacter';
import DeskSetup from '../objects/DeskSetup';
import ParticleField from '../effects/ParticleField';

export default function IntroScene({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      {/* Dim room lighting */}
      <ambientLight intensity={0.15} />
      {/* Monitor glow - cyan light on Shaw's face */}
      <pointLight position={[0, 0.6, -0.6]} color="#22D3EE" intensity={2} distance={4} decay={2} />
      {/* Fill light from above-behind */}
      <spotLight position={[1, 3, 2]} color="#A78BFA" intensity={0.3} angle={0.5} penumbra={0.8} />

      <ShawCharacter position={[0, -0.7, 0.3]} />
      <DeskSetup position={[0, -0.7, -0.15]} />

      {/* Floor */}
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#080818" />
      </mesh>

      {/* Subtle dust particles — small count, wide spread */}
      <ParticleField count={40} zone="intro" radius={12} />
    </group>
  );
}
