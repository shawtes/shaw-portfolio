'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

function OrbitingIcon({ label, href, color, angle, radius = 2.5 }: {
  label: string; href: string; color: string; angle: number; radius?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * 0.3 + angle;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[0.15, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} flatShading />
      </mesh>
      <Html transform position={[0, 0.35, 0]} style={{ pointerEvents: 'auto' }}>
        <a href={href} target="_blank" rel="noopener noreferrer" style={{
          fontSize: 10, color, fontFamily: 'monospace', fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap',
          background: 'rgba(6,7,16,0.8)', padding: '4px 10px', borderRadius: 8,
          border: `1px solid ${color}30`,
        }}>{label}</a>
      </Html>
    </group>
  );
}

export default function ContactZone({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 3, 3]} color="#22D3EE" intensity={2} distance={15} />
      <pointLight position={[0, -2, 0]} color="#A78BFA" intensity={0.8} distance={10} />

      {/* Main terminal monitor */}
      <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.15}>
        <group>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[4, 3, 0.08]} />
            <meshStandardMaterial color="#0a0a15" flatShading />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[3.8, 2.8]} />
            <meshBasicMaterial color="#060710" />
          </mesh>
          <Html transform position={[0, 0, 0.01]} style={{ width: '380px', pointerEvents: 'auto' }}>
            <div style={{
              background: 'rgba(6,7,16,0.95)',
              border: '1px solid rgba(34,211,238,0.15)',
              borderRadius: 16,
              padding: '28px 32px',
              color: '#E2E8F0',
              fontFamily: "'Sora', sans-serif",
            }}>
              <div style={{ fontSize: 10, color: '#22D3EE', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '.1em', marginBottom: 6, textTransform: 'uppercase' }}>// Contact</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: '-.03em' }}>
                <span style={{ background: 'linear-gradient(135deg,#22D3EE,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Get In Touch</span>
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                Open to internships, collaborations, and interesting projects.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input placeholder="Name" style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)', color: '#E2E8F0', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                }} />
                <input placeholder="Email" type="email" style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)', color: '#E2E8F0', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                }} />
                <textarea placeholder="Message" rows={3} style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)', color: '#E2E8F0', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none', resize: 'none',
                }} />
                <button style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#22D3EE,#A78BFA)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>Send Message</button>
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                stesfaye4@student.gsu.edu
              </div>
            </div>
          </Html>
        </group>
      </Float>

      {/* Orbiting contact links */}
      <OrbitingIcon label="GitHub" href="https://github.com/shawtes" color="#22D3EE" angle={0} />
      <OrbitingIcon label="LinkedIn" href="https://linkedin.com/in/shaw-tesfaye" color="#A78BFA" angle={Math.PI * 0.5} />
      <OrbitingIcon label="Email" href="mailto:stesfaye4@student.gsu.edu" color="#34D399" angle={Math.PI} />
    </group>
  );
}
