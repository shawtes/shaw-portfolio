'use client';
import MonitorScreen from './MonitorScreen';

export default function DeskSetup({ position = [0, 0, 0] as [number, number, number] }) {
  const deskColor = '#2a1f14';
  const legColor = '#1f1710';
  const keyboardColor = '#111111';

  return (
    <group position={position}>
      {/* Desk Surface */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.6, 0.05, 0.75]} />
        <meshStandardMaterial color={deskColor} flatShading />
      </mesh>
      {/* Desk Legs */}
      {[[-0.7, 0.35, -0.3], [0.7, 0.35, -0.3], [-0.7, 0.35, 0.3], [0.7, 0.35, 0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color={legColor} flatShading />
        </mesh>
      ))}
      {/* Keyboard */}
      <mesh position={[0, 0.74, 0.15]}>
        <boxGeometry args={[0.35, 0.015, 0.12]} />
        <meshStandardMaterial color={keyboardColor} flatShading />
      </mesh>
      {/* Coffee Mug */}
      <mesh position={[0.55, 0.78, 0.1]}>
        <cylinderGeometry args={[0.035, 0.03, 0.07, 8]} />
        <meshStandardMaterial color="#f5f5f5" flatShading />
      </mesh>
      {/* Monitor */}
      <MonitorScreen position={[0, 1.15, -0.2]} />
      {/* Chair */}
      <group position={[0, 0, 0.55]}>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.45, 0.04, 0.4]} />
          <meshStandardMaterial color="#1a1a2e" flatShading />
        </mesh>
        {/* Back */}
        <mesh position={[0, 0.72, 0.18]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.43, 0.5, 0.04]} />
          <meshStandardMaterial color="#1a1a2e" flatShading />
        </mesh>
        {/* Chair Legs */}
        {[[-0.18, 0.22, -0.15], [0.18, 0.22, -0.15], [-0.18, 0.22, 0.15], [0.18, 0.22, 0.15]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.015, 0.015, 0.44, 4]} />
            <meshStandardMaterial color="#333" flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}
