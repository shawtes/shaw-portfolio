'use client';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PROJECTS } from '../data/projects';
import * as THREE from 'three';

function ProjectCard({ project, position, index, onSelect }: {
  project: typeof PROJECTS[0];
  position: [number, number, number];
  index: number;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      // Subtle floating
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001 + index) * 0.05;
      // Gentle rotation toward mouse
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, pointer.x * 0.1, 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -pointer.y * 0.05, 0.05);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={() => onSelect(project.id)}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial
          color={project.color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glass border */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.25, 1.45]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <Html
        position={[0, 0, 0.02]}
        transform
        occlude={false}
        style={{
          width: '280px',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          background: 'rgba(6,7,16,0.85)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${project.color}30`,
          borderRadius: 14,
          padding: '18px 20px',
          color: '#E2E8F0',
          fontFamily: "'Sora', sans-serif",
          cursor: 'pointer',
          pointerEvents: 'auto',
        }} onClick={() => onSelect(project.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: project.color + '20',
              border: `1px solid ${project.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: project.color, fontWeight: 800,
            }}>{project.title[0]}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{project.title}</div>
              {project.award && <div style={{ fontSize: 10, color: '#FBBF24' }}>{project.award}</div>}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: 10 }}>{project.subtitle}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {project.tech.slice(0, 4).map(t => (
              <span key={t} style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 999,
                background: '#22D3EE10', color: '#22D3EE',
                fontFamily: 'monospace', fontWeight: 600,
              }}>{t}</span>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function ProjectsZone({ visible, onSelectProject }: { visible: boolean; onSelectProject: (id: string) => void }) {
  return (
    <group visible={visible}>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 5, 0]} color="#22D3EE" intensity={1} distance={20} />
      <pointLight position={[5, 0, 0]} color="#A78BFA" intensity={0.5} distance={15} />

      {PROJECTS.map((project, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = (col - 0.5) * 3.2;
        const y = -row * 2.0;
        const z = Math.sin(i * 0.8) * 0.5;
        return (
          <ProjectCard
            key={project.id}
            project={project}
            position={[x, y, z]}
            index={i}
            onSelect={onSelectProject}
          />
        );
      })}
    </group>
  );
}
