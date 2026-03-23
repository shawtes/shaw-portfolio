'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import { EXPERIENCE } from '../data/experience';
import * as THREE from 'three';

function TimelineNode({ exp, position, index }: {
  exp: typeof EXPERIENCE[0];
  position: [number, number, number];
  index: number;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const color = exp.type === 'v' ? '#22D3EE' : '#A78BFA';

  useFrame((state) => {
    if (sphereRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + index * 1.5) * 0.05;
      sphereRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.2}>
      <group position={position}>
        {/* Glowing sphere */}
        <mesh ref={sphereRef}>
          <icosahedronGeometry args={[0.25, 2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} flatShading />
        </mesh>
        {/* Outer glow */}
        <mesh>
          <icosahedronGeometry args={[0.35, 2]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} />
        </mesh>

        <Html transform position={[0.8, 0, 0]} style={{ width: '260px', pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(6,7,16,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${color}25`,
            borderRadius: 14,
            padding: '16px 18px',
            color: '#E2E8F0',
            fontFamily: "'Sora', sans-serif",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{exp.role}</div>
            <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 3 }}>{exp.org}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace', marginTop: 3 }}>{exp.period} · {exp.loc}</div>
            <ul style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, marginTop: 8, paddingLeft: 14, listStyle: 'disc' }}>
              {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        </Html>
      </group>
    </Float>
  );
}

export default function ExperienceZone({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 3, 2]} color="#22D3EE" intensity={1} distance={15} />

      {/* Timeline line */}
      <mesh position={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.008, 0.008, 10, 4]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.2} />
      </mesh>

      {EXPERIENCE.map((exp, i) => (
        <TimelineNode
          key={i}
          exp={exp}
          position={[(i % 2 === 0 ? -1 : 1) * 0.5, 3 - i * 2.2, 0]}
          index={i}
        />
      ))}
    </group>
  );
}
