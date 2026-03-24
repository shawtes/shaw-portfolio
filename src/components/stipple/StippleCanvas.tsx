'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StippleParticle } from './useStippleEngine';

interface StippleCanvasProps {
  particles: StippleParticle[];
  edges: [number, number][];
  renderMode: 'dots' | 'mesh' | 'both';
  colorScheme: 'dark' | 'light';
  mouseInteraction: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export default function StippleCanvas({
  particles, edges, renderMode, colorScheme, mouseInteraction, canvasRef: externalRef,
}: StippleCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalRef || internalRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef(particles);
  const edgesRef = useRef(edges);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 600, h: 600 });
  const renderModeRef = useRef(renderMode);
  const colorSchemeRef = useRef(colorScheme);
  const mouseInteractionRef = useRef(mouseInteraction);

  // Keep refs in sync
  useEffect(() => { renderModeRef.current = renderMode; }, [renderMode]);
  useEffect(() => { colorSchemeRef.current = colorScheme; }, [colorScheme]);
  useEffect(() => { mouseInteractionRef.current = mouseInteraction; }, [mouseInteraction]);

  // Deep copy particles for physics mutation
  useEffect(() => {
    particlesRef.current = particles.map(p => ({ ...p }));
    edgesRef.current = edges;
  }, [particles, edges]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    sizeRef.current = { w, h };
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [canvasRef]);

  useEffect(() => {
    setupCanvas();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(container);
    return () => ro.disconnect();
  }, [setupCanvas]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let time = 0;

    const animate = () => {
      time += 0.016;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { w, h } = sizeRef.current;
      const ps = particlesRef.current;
      const es = edgesRef.current;
      const mouse = mouseRef.current;
      const mode = renderModeRef.current;
      const scheme = colorSchemeRef.current;
      const interactive = mouseInteractionRef.current;
      const isDark = scheme === 'dark';

      // Clear
      ctx.clearRect(0, 0, w, h);
      if (!isDark) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      if (ps.length === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Physics
      for (const p of ps) {
        const px = p.ox * w, py = p.oy * h;
        const cx = p.x * w, cy = p.y * h;
        const fx = Math.sin(time * 0.3 + px * 0.008) * 0.3 / w;
        const fy = Math.cos(time * 0.25 + py * 0.01) * 0.25 / h;

        if (interactive) {
          const dx = cx - mouse.x, dy = cy - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90 && dist > 0) {
            const f = (1 - dist / 90) * 14;
            p.vx += (dx / dist) * f / w;
            p.vy += (dy / dist) * f / h;
          }
        }

        p.vx += (p.ox + fx - p.x) * 0.045;
        p.vy += (p.oy + fy - p.y) * 0.045;
        p.vx *= 0.87;
        p.vy *= 0.87;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Draw mesh lines
      if (mode === 'mesh' || mode === 'both') {
        for (const [a, b] of es) {
          const pa = ps[a], pb = ps[b];
          if (!pa || !pb) continue;
          const ax = pa.x * w, ay = pa.y * h;
          const bx = pb.x * w, by = pb.y * h;
          const edx = ax - bx, edy = ay - by;
          const d = Math.sqrt(edx * edx + edy * edy);
          const dFade = Math.max(0, 1 - d / 20);
          const avgDark = ((1 - pa.brightness) + (1 - pb.brightness)) / 2;
          const alpha = (0.04 + avgDark * 0.22) * dFade;

          if (isDark) {
            const c = Math.round(210 - avgDark * 140);
            ctx.strokeStyle = `rgba(${c},${c},${c},${alpha})`;
          } else {
            const c = Math.round(40 + avgDark * 100);
            ctx.strokeStyle = `rgba(${c},${c},${c},${alpha})`;
          }
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      // Draw dots
      if (mode === 'dots' || mode === 'both') {
        for (const p of ps) {
          const px = p.x * w, py = p.y * h;
          const dark = 1 - p.brightness;
          const alpha = 0.25 + dark * 0.7;

          if (isDark) {
            const c = Math.round(240 - dark * 160);
            ctx.fillStyle = `rgba(${c},${c},${c},${alpha})`;
          } else {
            const c = Math.round(10 + (1 - dark) * 80);
            ctx.fillStyle = `rgba(${c},${c},${c},${alpha})`;
          }
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef]);

  // Mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [canvasRef]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <canvas ref={canvasRef} style={{ cursor: 'crosshair', display: 'block' }} />
    </div>
  );
}
