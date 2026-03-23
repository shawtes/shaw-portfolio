'use client';
import { PROJECTS } from '../data/projects';

/**
 * HTMLOverlay — Lusion-inspired minimal UI.
 * Fixed nav, scroll progress counter (like Lusion's 00-56 counter),
 * section labels that appear/fade, and project detail modal.
 */

const SECTIONS = ['Intro', 'Tunnel', 'Projects', 'About', 'Experience', 'Contact'];

function getSectionIndex(progress: number): number {
  if (progress < 0.12) return 0;
  if (progress < 0.32) return 1;
  if (progress < 0.55) return 2;
  if (progress < 0.72) return 3;
  if (progress < 0.87) return 4;
  return 5;
}

export default function HTMLOverlay({
  selectedProject,
  onCloseProject,
  scrollProgress = 0,
}: {
  selectedProject: string | null;
  onCloseProject: () => void;
  scrollProgress?: number;
}) {
  const project = selectedProject ? PROJECTS.find(p => p.id === selectedProject) : null;
  const sectionIdx = getSectionIndex(scrollProgress);
  const progressPercent = Math.round(scrollProgress * 100);

  return (
    <>
      {/* Minimal nav — Lusion style */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, pointerEvents: 'auto' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg,#22D3EE,#A78BFA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>ST</div>
          <span style={{
            fontWeight: 700, fontSize: 14, letterSpacing: '-.02em', color: '#E2E8F0',
            fontFamily: "'Sora', sans-serif",
          }}>shaw<span style={{ color: '#22D3EE' }}>tesfaye</span></span>
        </div>
        <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
          {['GitHub', 'LinkedIn', 'Email'].map((label) => {
            const hrefs: Record<string, string> = {
              GitHub: 'https://github.com/shawtes',
              LinkedIn: 'https://linkedin.com/in/shaw-tesfaye',
              Email: 'mailto:stesfaye4@student.gsu.edu',
            };
            return (
              <a key={label} href={hrefs[label]} target="_blank" rel="noopener noreferrer" style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8', fontSize: 11, fontWeight: 600,
                textDecoration: 'none', fontFamily: 'monospace',
                backdropFilter: 'blur(12px)',
              }}>{label}</a>
            );
          })}
        </div>
      </nav>

      {/* SEO content — invisible but crawlable */}
      <div style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}>
        <h1>Shaw Tesfaye — Software Engineer, ML Systems, Full-Stack Developer</h1>
        <p>Senior CS student at Georgia State University. Portfolio featuring ML-driven systems, full-stack applications, and award-winning hackathon projects.</p>
      </div>

      {/* Lusion-style progress counter — bottom left */}
      <div style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 50,
        pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
          color: '#22D3EE', letterSpacing: '.05em',
        }}>
          <span style={{ opacity: 0.4 }}>0</span>
          {progressPercent.toString().padStart(2, '0')}
        </div>
        {/* Progress bar */}
        <div style={{
          width: 60, height: 1.5, background: 'rgba(255,255,255,0.06)',
          borderRadius: 1, overflow: 'hidden',
        }}>
          <div style={{
            width: `${scrollProgress * 100}%`, height: '100%',
            background: 'linear-gradient(90deg,#22D3EE,#A78BFA)',
            transition: 'width 0.1s linear',
          }} />
        </div>
      </div>

      {/* Section label — bottom right (like Lusion's section indicator) */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 50,
        pointerEvents: 'none',
        fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
        color: '#64748B', letterSpacing: '.1em', textTransform: 'uppercase',
        transition: 'opacity 0.3s',
      }}>
        {SECTIONS[sectionIdx]}
      </div>

      {/* Scroll hint — only on intro */}
      {scrollProgress < 0.05 && (
        <div style={{
          position: 'fixed', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, pointerEvents: 'none',
          fontSize: 11, color: '#64748B', fontFamily: 'monospace',
          letterSpacing: '.15em', textTransform: 'uppercase',
          animation: 'pulse 2s infinite',
        }}>scroll to explore</div>
      )}

      {/* Project detail modal */}
      {project && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(6,7,16,0.92)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={onCloseProject}>
          <div style={{
            background: 'rgba(15,15,30,0.95)',
            border: `1px solid ${project.color}25`,
            borderRadius: 20, padding: 32, maxWidth: 600, width: '100%',
            maxHeight: '85vh', overflowY: 'auto',
            color: '#E2E8F0', fontFamily: "'Sora', sans-serif",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: project.color + '20', border: `1px solid ${project.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: project.color,
                  }}>{project.title[0]}</div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{project.title}</h2>
                    {project.award && <div style={{ fontSize: 12, color: '#FBBF24', fontWeight: 600, marginTop: 2 }}>{project.award}</div>}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{project.subtitle}</div>
              </div>
              <button onClick={onCloseProject} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 16,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>&times;</button>
            </div>

            {/* Metrics */}
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${Math.min(project.metrics.length, 4)}, 1fr)`,
              gap: 8, marginBottom: 20, padding: '12px 14px', borderRadius: 12,
              background: project.color + '08', border: `1px solid ${project.color}12`,
            }}>
              {project.metrics.map(m => (
                <div key={m.k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: project.color, fontFamily: 'monospace' }}>{m.v}</div>
                  <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>{m.k}</div>
                </div>
              ))}
            </div>

            {/* Long description */}
            {project.longDesc.map((p, i) => (
              <p key={i} style={{ fontSize: 13, lineHeight: 1.7, color: '#94a3b8', marginBottom: 12 }}>{p}</p>
            ))}

            {/* Tech stack */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 16, marginBottom: 16 }}>
              {project.tech.map(t => (
                <span key={t} style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(34,211,238,0.07)', color: '#22D3EE',
                  fontFamily: 'monospace', fontWeight: 600, border: '1px solid rgba(34,211,238,0.1)',
                }}>{t}</span>
              ))}
            </div>

            {/* Architecture */}
            <div style={{
              fontSize: 11, color: '#64748B', fontFamily: 'monospace', lineHeight: 1.6,
              padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)', marginBottom: 16,
            }}>
              <span style={{ color: '#22D3EE', fontWeight: 600 }}>arch: </span>{project.arch}
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={project.github} target="_blank" rel="noopener noreferrer" style={{
                padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)', color: '#E2E8F0', fontSize: 13,
                fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit',
              }}>GitHub</a>
              {project.live && (
                <a href={project.live} target="_blank" rel="noopener noreferrer" style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#22D3EE,#A78BFA)',
                  color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}>Live Demo</a>
              )}
            </div>

            <div style={{ fontSize: 11, color: '#64748B', marginTop: 16, fontFamily: 'monospace' }}>
              team: {project.team}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
