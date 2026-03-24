'use client';
import { useEffect, useRef, useState } from 'react';

/*
  StipplePortrait — Pre-computed stipple with mouse interaction.

  Loads particle positions from /stipple-data.json (exported from the stipple tool).
  Same mouse-repel physics as ParticlePortrait for interactivity.
*/

interface Particle {
  x: number; y: number;
  ox: number; oy: number;
  vx: number; vy: number;
  r: number; c: number; a: number;
}

export default function StipplePortrait({
  width = 600, height = 700,
  accentColor = [193, 255, 0],
  className = '', style = {},
}: {
  width?: number; height?: number;
  accentColor?: [number, number, number];
  className?: string; style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const readyRef = useRef(false);
  const [, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Load particle data + drawing overlay in parallel
    const loadData = fetch('/stipple-data.json').then(r => r.json());
    loadData.then((data: number[][]) => {
      const particles: Particle[] = [];
      for (const [nx, ny, r, c, a] of data) {
        const px = nx * width;
        const py = ny * height;
        particles.push({
          x: px, y: py, ox: px, oy: py,
          vx: 0, vy: 0, r, c, a,
        });
      }
      particlesRef.current = particles;
      readyRef.current = true;
      setLoaded(true);
    });

    // Mouse tracking — global so it works through overlapping content
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onMouseMove);

    const mouseRadius = 90;
    const mouseForce = 14;
    const returnForce = 0.045;
    const damping = 0.87;
    let time = 0;

    const animate = () => {
      if (!readyRef.current) { rafRef.current = requestAnimationFrame(animate); return; }

      time += 0.016;
      const ps = particlesRef.current;
      const mouse = mouseRef.current;
      ctx.clearRect(0, 0, width, height);

      // Physics
      for (const p of ps) {
        const floatX = Math.sin(time * 0.3 + p.ox * 0.008) * 0.4;
        const floatY = Math.cos(time * 0.25 + p.oy * 0.01) * 0.3;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 0) {
          const force = (1 - dist / mouseRadius) * mouseForce;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        p.vx += (p.ox + floatX - p.x) * returnForce;
        p.vy += (p.oy + floatY - p.y) * returnForce;
        p.vx *= damping; p.vy *= damping;
        p.x += p.vx; p.y += p.vy;
      }

      // Draw dots
      for (const p of ps) {
        // Mouse glow
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < mouseRadius) {
          const glow = 1 - md / mouseRadius;
          ctx.fillStyle = `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},${glow * 0.4})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = `rgba(${p.c},${p.c},${p.c},${p.a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [width, height, accentColor]);

  return (
    <canvas ref={canvasRef} className={className}
      style={{ ...style, width, height }} />
  );
}
