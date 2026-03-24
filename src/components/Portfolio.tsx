'use client';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { PROJECTS } from '../data/projects';
import { EXPERIENCE } from '../data/experience';
import { SKILLS, AWARDS } from '../data/skills';
import VerticalThreadLine from './ui/VerticalThreadLine';
import StipplePortrait from './StipplePortrait';

/*
  PORTFOLIO — Lusion-style

  Extracted from lusion.co:
  - Aeonik-like clean sans-serif (we use Inter Tight)
  - Extremely large typography — titles fill viewport width
  - Minimal palette — dark bg, off-white text, single neon accent
  - Character-split text reveals on scroll
  - Lots of whitespace
  - Project list with huge names, category tags, hover reveals
  - Smooth scroll-triggered counters
  - Grid-based layout with 2vw gaps
  - 20px border radius on cards
  - Mouse-responsive subtle effects
*/

// ═══════════ SCROLL REVEAL ═══════════
function Rv({ children, delay = 0, direction = 'up' }: { children: ReactNode; delay?: number; direction?: 'up' | 'left' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const from = direction === 'up' ? 'translateY(40px)' : 'translateX(-30px)';
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translate(0)' : from,
      transition: `opacity .9s cubic-bezier(.16,1,.3,1) ${delay}s, transform .9s cubic-bezier(.16,1,.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ═══════════ TEXT REVEAL — word by word stagger ═══════════
function TextReveal({ text, style = {}, wordDelay = 0.04 }: { text: string; style?: React.CSSProperties; wordDelay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const words = text.split(' ');
  return (
    <div ref={ref} style={{ overflow: 'hidden', ...style }}>
      {words.map((word, i) => (
        <span key={i} style={{
          display: 'inline-block',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(100%)',
          transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${i * wordDelay}s, transform .6s cubic-bezier(.16,1,.3,1) ${i * wordDelay}s`,
          marginRight: '0.3em',
        }}>
          {word}
        </span>
      ))}
    </div>
  );
}

// ═══════════ CHAR SPLIT — character by character reveal for big headlines ═══════════
function CharSplit({ text, style = {}, charDelay = 0.025, visible = true }: {
  text: string; style?: React.CSSProperties; charDelay?: number; visible?: boolean;
}) {
  return (
    <span style={style}>
      {text.split('').map((char, i) => (
        <span key={i} style={{
          display: 'inline-block',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) rotateX(0)' : 'translateY(60%) rotateX(-40deg)',
          transition: `opacity .5s cubic-bezier(.16,1,.3,1) ${i * charDelay}s, transform .7s cubic-bezier(.16,1,.3,1) ${i * charDelay}s`,
          transformOrigin: 'bottom',
          whiteSpace: char === ' ' ? 'pre' : undefined,
        }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

// ═══════════ HERO TEXT — uses CharSplit with scroll trigger ═══════════
function HeroTitle({ line1, line2 }: { line1: string; line2: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <h1 ref={ref} style={{
      fontFamily: 'var(--font)',
      fontSize: 'clamp(48px, 10vw, 140px)',
      fontWeight: 900,
      lineHeight: 0.92,
      letterSpacing: '-0.04em',
      color: '#f0f1fa',
      marginBottom: 40,
    }}>
      <span style={{ display: 'block' }}>
        <CharSplit text={line1} visible={vis} charDelay={0.03} />
      </span>
      <span style={{ display: 'block', color: '#c1ff00' }}>
        <CharSplit text={line2} visible={vis} charDelay={0.03} style={{ transitionDelay: '0.3s' }} />
      </span>
    </h1>
  );
}

// ═══════════ ANIMATED COUNTER ═══════════
function Counter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const numVal = parseInt(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = () => {
          start += Math.ceil(numVal / 30);
          if (start >= numVal) { setCount(numVal); return; }
          setCount(start);
          requestAnimationFrame(step);
        };
        step();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [numVal]);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, color: '#f0f1fa', lineHeight: 1 }}>
        {isNaN(numVal) ? value : count}{!isNaN(numVal) && '+'}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 8 }}>{label}</div>
    </div>
  );
}

// ═══════════ PROJECT ROW — Lusion style huge text ═══════════
function ProjectRow({ project, index }: { project: typeof PROJECTS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const num = String(index + 1).padStart(2, '0');

  return (
    <Rv delay={index * 0.06}>
      <a
        href={project.github}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr auto',
          alignItems: 'center',
          gap: 'clamp(16px, 2vw, 32px)',
          padding: 'clamp(20px, 3vw, 40px) 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all .4s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Number */}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: hovered ? '#c1ff00' : '#444', transition: 'color .3s' }}>
          {num}
        </span>

        {/* Title + tags */}
        <div>
          <div style={{
            fontFamily: 'var(--font)',
            fontSize: 'clamp(24px, 4vw, 52px)',
            fontWeight: 800,
            color: hovered ? '#f0f1fa' : '#888',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            transition: 'color .3s',
          }}>
            {project.title}
          </div>
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 8,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity .3s',
          }}>
            {project.award && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#c1ff00', padding: '2px 8px', border: '1px solid rgba(193,255,0,0.3)', borderRadius: 100 }}>
                {project.award}
              </span>
            )}
            {project.tech.slice(0, 3).map(t => (
              <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#555', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100 }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 14,
          color: hovered ? '#c1ff00' : '#333',
          transform: hovered ? 'translateX(8px)' : 'translateX(0)',
          transition: 'all .3s',
        }}>
          →
        </span>
      </a>
    </Rv>
  );
}

// ═══════════ RESPONSIVE HOOK ═══════════
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// ═══════════ MAIN PORTFOLIO ═══════════
export default function Portfolio() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{
      '--font': "'Inter Tight', 'Helvetica Neue', sans-serif",
      '--mono': "'IBM Plex Mono', 'SF Mono', monospace",
      background: '#050507',
      color: '#f0f1fa',
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
    } as React.CSSProperties}>
      <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* ═══ FIXED PARTICLE PORTRAIT — stays centered, content scrolls over ═══ */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: isMobile ? '5vw' : '15vw',
        zIndex: 0,
        pointerEvents: 'none',
        transform: `translateY(${scrollY * -0.05}px)`,
        willChange: 'transform',
      }}>
        <StipplePortrait
          width={isMobile ? 247 : 390}
          height={isMobile ? 286 : 455}
          accentColor={[193, 255, 0]}
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* ═══ SCROLLABLE CONTENT — sits above the fixed portrait ═══ */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ═══ NEON THREAD LINE — draws across the full page as you scroll ═══ */}
      <VerticalThreadLine color="#c1ff00" opacity={0.45} strokeWidth={9} />

      {/* ═══ HERO — massive text, portrait visible behind ═══ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'max(5vw, 40px)',
        maxWidth: 1400,
        margin: '0 auto',
        position: 'relative',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Rv>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
              Software Engineer · ML Systems
            </div>
          </Rv>
          <HeroTitle line1="Shaw" line2="Tesfaye." />
          <TextReveal
            text="Building ML-driven systems, full-stack applications, and quantitative frameworks. Senior CS at Georgia State University, graduating December 2026."
            style={{
              fontFamily: 'var(--font)',
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              fontWeight: 300,
              color: '#666',
              maxWidth: 520,
              lineHeight: 1.7,
            }}
          />
          <Rv delay={0.3}>
            <div style={{ marginTop: 40, display: 'flex', gap: 16, alignItems: 'center' }}>
              <a href="#work" style={{
                fontFamily: 'var(--mono)', fontSize: 12, color: '#050507', background: '#c1ff00',
                padding: '14px 28px', borderRadius: 100, textDecoration: 'none', fontWeight: 500,
                transition: 'transform .2s', display: 'inline-block',
              }}>
                View work ↓
              </a>
              <a href="https://github.com/shawtes" target="_blank" rel="noopener noreferrer" style={{
                fontFamily: 'var(--mono)', fontSize: 12, color: '#888',
                padding: '14px 28px', borderRadius: 100, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                GitHub ↗
              </a>
            </div>
          </Rv>
        </div>
      </section>

      {/* ═══ FROSTED CONTENT — light tint, portrait visible through ═══ */}
      <div style={{
        background: 'rgba(5, 5, 7, 0.35)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      } as React.CSSProperties}>

      {/* ═══ STATS BAR — counters ═══ */}
      <section style={{
        padding: '60px max(5vw, 40px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '2vw' }}>
          <Counter value="4" label="Hackathon Wins" />
          <Counter value="8" label="Projects Shipped" />
          <Counter value="2" label="Research Papers" />
          <Counter value="500" label="Competitors Beat" />
        </div>
      </section>

{/* ═══ FEATURED WORK — huge project names ═══ */}
      <section id="work" style={{ padding: '100px max(5vw, 40px)', maxWidth: 1400, margin: '0 auto' }}>
        <Rv>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            Featured Work
          </div>
        </Rv>
        <TextReveal
          text="A selection of passionately crafted works"
          style={{
            fontFamily: 'var(--font)', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800,
            color: '#f0f1fa', letterSpacing: '-0.03em', marginBottom: 60, lineHeight: 1.15,
          }}
          wordDelay={0.05}
        />

        {/* Project list */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {PROJECTS.map((p, i) => (
            <ProjectRow key={p.id} project={p} index={i} />
          ))}
        </div>
      </section>

{/* ═══ ABOUT — two column, big statement ═══ */}
      <section style={{
        padding: '120px max(5vw, 40px)',
        maxWidth: 1400,
        margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 'clamp(40px, 6vw, 100px)', alignItems: 'start' }}>
          <div>
            <Rv>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
                About
              </div>
            </Rv>
            <TextReveal
              text="Connecting ideas to uniquely crafted experiences"
              style={{
                fontFamily: 'var(--font)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800,
                color: '#f0f1fa', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 32,
              }}
              wordDelay={0.05}
            />
            <Rv delay={0.15}>
              <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 300, color: '#666', lineHeight: 1.85, marginBottom: 20 }}>
                I&apos;m Shaw Tesfaye, a software engineer and ML researcher at Georgia State University.
                I build full-stack applications and ML pipelines that solve real problems — from AI-powered
                restaurant management to healthcare screening tools.
              </p>
            </Rv>
            <Rv delay={0.2}>
              <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 300, color: '#666', lineHeight: 1.85 }}>
                My work sits at the intersection of production engineering and applied machine learning.
                4 hackathon wins, 2 published research papers, and systems serving real users.
              </p>
            </Rv>
          </div>

          {/* Skills */}
          <div>
            {SKILLS.map((skill, si) => (
              <Rv key={skill.cat} delay={si * 0.08}>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#c1ff00', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {skill.cat}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {skill.items.map(item => (
                      <span key={item} style={{
                        fontFamily: 'var(--mono)', fontSize: 12, color: '#888',
                        padding: '6px 14px', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 100, transition: 'border-color .3s, color .3s',
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Rv>
            ))}
          </div>
        </div>
      </section>

{/* ═══ EXPERIENCE — timeline ═══ */}
      <section style={{
        padding: '100px max(5vw, 40px)',
        maxWidth: 1400,
        margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <Rv>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            Experience
          </div>
        </Rv>
        <Rv delay={0.05}>
          <h2 style={{
            fontFamily: 'var(--font)', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800,
            color: '#f0f1fa', letterSpacing: '-0.03em', marginBottom: 60, lineHeight: 1.05,
          }}>
            Background &<br />experience
          </h2>
        </Rv>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'clamp(40px, 4vw, 80px)' }}>
          {/* Timeline */}
          <div>
            {EXPERIENCE.map((exp, i) => (
              <Rv key={i} delay={i * 0.08} direction="left">
                <div style={{
                  paddingLeft: 28,
                  borderLeft: `1px solid ${exp.type === 'v' ? 'rgba(193,255,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  marginBottom: 48,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: -5, top: 4, width: 9, height: 9,
                    borderRadius: '50%', background: exp.type === 'v' ? '#c1ff00' : '#333',
                  }} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 6 }}>{exp.period}</div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700, color: '#f0f1fa', marginBottom: 4 }}>{exp.role}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#c1ff00', marginBottom: 10 }}>{exp.org}</div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 300, color: '#666', lineHeight: 1.75 }}>
                    {exp.bullets.join(' ')}
                  </div>
                </div>
              </Rv>
            ))}
          </div>

          {/* Awards */}
          <div>
            <Rv>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
                Awards & Recognition
              </div>
            </Rv>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {AWARDS.map((a, i) => (
                <Rv key={i} delay={i * 0.08}>
                  <div style={{
                    background: 'rgba(10, 10, 15, 0.55)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: 24,
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    transition: 'border-color .3s, transform .3s',
                  }}>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 32, fontWeight: 900, color: a.place === '1st' ? '#c1ff00' : '#555', lineHeight: 1, marginBottom: 8 }}>
                      {a.place}
                    </div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: '#f0f1fa', marginBottom: 4 }}>{a.what}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555' }}>{a.event}</div>
                  </div>
                </Rv>
              ))}
            </div>
          </div>
        </div>
      </section>

{/* ═══ CONTACT — big CTA ═══ */}
      <section id="contact" style={{
        padding: '120px max(5vw, 40px)',
        maxWidth: 1400,
        margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <Rv>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
            Get in touch
          </div>
        </Rv>
        <TextReveal
          text="Is your big idea ready to go wild?"
          style={{
            fontFamily: 'var(--font)',
            fontSize: 'clamp(40px, 8vw, 100px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: 48,
          }}
          wordDelay={0.06}
        />
        <Rv delay={0.15}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href="mailto:stesfaye4@student.gsu.edu" style={{
              fontFamily: 'var(--mono)', fontSize: 13, color: '#050507', background: '#c1ff00',
              padding: '16px 32px', borderRadius: 100, textDecoration: 'none', fontWeight: 500,
            }}>
              stesfaye4@student.gsu.edu →
            </a>
            <a href="https://github.com/shawtes" target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'var(--mono)', fontSize: 13, color: '#888',
              padding: '16px 32px', borderRadius: 100, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              GitHub ↗
            </a>
            <a href="https://linkedin.com/in/sineshawtesfaye" target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'var(--mono)', fontSize: 13, color: '#888',
              padding: '16px 32px', borderRadius: 100, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              LinkedIn ↗
            </a>
          </div>
        </Rv>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '32px max(5vw, 40px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#333' }}>© 2026 Shaw Tesfaye</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#333' }}>Atlanta, GA</span>
      </footer>

      </div>{/* end opaque content wrapper */}
      </div>{/* end scrollable content wrapper */}
    </div>
  );
}
