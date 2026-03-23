'use client';
import { Html, Float } from '@react-three/drei';
import { SKILLS, AWARDS } from '../data/skills';

function GlassPanel({ position, children, width = '300px' }: {
  position: [number, number, number];
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <group position={position}>
        <mesh>
          <planeGeometry args={[3, 2]} />
          <meshPhysicalMaterial
            color="#0a0a1a"
            transparent
            opacity={0.3}
            roughness={0.2}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
        <Html transform position={[0, 0, 0.02]} style={{ width, pointerEvents: 'none' }}>
          {children}
        </Html>
      </group>
    </Float>
  );
}

export default function AboutZone({ visible }: { visible: boolean }) {
  const panelStyle: React.CSSProperties = {
    background: 'rgba(6,7,16,0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '22px 24px',
    color: '#E2E8F0',
    fontFamily: "'Sora', sans-serif",
  };

  return (
    <group visible={visible}>
      <ambientLight intensity={0.12} />
      <pointLight position={[-3, 3, 2]} color="#22D3EE" intensity={1.5} distance={15} />
      <pointLight position={[3, -1, 2]} color="#A78BFA" intensity={1} distance={12} />

      {/* Bio Panel */}
      <GlassPanel position={[-2, 1, 0]} width="340px">
        <div style={panelStyle}>
          <div style={{ fontSize: 10, color: '#22D3EE', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '.1em', marginBottom: 12, textTransform: 'uppercase' }}>Bio</div>
          <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
            I&apos;m <strong>Shaw Tesfaye</strong>, a senior CS student at Georgia State University (Dec 2026). I build ML-driven systems and full-stack applications with a focus on quantitative methods and production-grade software.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#94a3b8' }}>
            My work spans healthcare ML, quantitative finance, and full-stack SaaS. I&apos;ve won 4 hackathons and authored peer-presented research.
          </p>
        </div>
      </GlassPanel>

      {/* Education Panel */}
      <GlassPanel position={[2.5, 1.5, -0.5]} width="260px">
        <div style={panelStyle}>
          <div style={{ fontSize: 10, color: '#A78BFA', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '.1em', marginBottom: 12, textTransform: 'uppercase' }}>Education</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Georgia State University</div>
          <div style={{ fontSize: 12, color: '#22D3EE', fontWeight: 600, marginTop: 4 }}>B.S. Computer Science (Senior)</div>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 6 }}>Expected: December 2026</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Atlanta, GA</div>
        </div>
      </GlassPanel>

      {/* Skills Panel */}
      <GlassPanel position={[-1.5, -1.5, 0.5]} width="320px">
        <div style={panelStyle}>
          <div style={{ fontSize: 10, color: '#22D3EE', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '.1em', marginBottom: 12, textTransform: 'uppercase' }}>Tech Stack</div>
          {SKILLS.map(g => (
            <div key={g.cat} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5, fontFamily: 'monospace' }}>{g.cat}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {g.items.map(s => (
                  <span key={s} style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(34,211,238,0.07)', color: '#22D3EE',
                    fontFamily: 'monospace', fontWeight: 600,
                  }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Awards Panel */}
      <GlassPanel position={[2, -1, 0]} width="300px">
        <div style={panelStyle}>
          <div style={{ fontSize: 10, color: '#FBBF24', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '.1em', marginBottom: 12, textTransform: 'uppercase' }}>Awards</div>
          {AWARDS.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: 7,
                background: a.place === '1st' ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, fontFamily: 'monospace',
                color: a.place === '1st' ? '#FBBF24' : '#64748B',
              }}>{a.place}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{a.event}</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>{a.what}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </group>
  );
}
