'use client';
import { useEffect, useRef } from 'react';

/*
  PARTICLE PORTRAIT — v3

  Improvements over v2:
  - Elliptical vignette mask to fade out background clutter (fence, lights)
  - Stronger Delaunay mesh lines for the wireframe aesthetic
  - Edge dissolve: particles fade out at portrait boundaries
  - Depth variation: darker areas get brighter/larger particles for contrast
*/

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  size: number;
  brightness: number;
  fade: number; // 0-1 vignette fade (1 = fully visible, 0 = faded)
}

export default function ParticlePortrait({
  src = '/portrait.png',
  width = 600,
  height = 700,
  particleCount = 3500,
  maxLineLength = 18,
  bgThreshold = 0.09,
  lloydIterations = 40,
  pointColor = [220, 220, 230],
  lineColor = [180, 180, 195],
  accentColor = [193, 255, 0],
  className = '',
  style = {},
}: {
  src?: string;
  width?: number;
  height?: number;
  particleCount?: number;
  maxLineLength?: number;
  bgThreshold?: number;
  lloydIterations?: number;
  pointColor?: [number, number, number];
  lineColor?: [number, number, number];
  accentColor?: [number, number, number];
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const edgesRef = useRef<[number, number][]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const readyRef = useRef(false);

  // Fallback: simple rejection sampling without Lloyd (no worker needed)
  const fallbackSample = (data: Uint8ClampedArray, sw: number, sh: number) => {
    const gray = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      const idx = i * 4;
      gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
    }
    const particles: Particle[] = [];
    let attempts = 0;
    while (particles.length < particleCount && attempts < particleCount * 50) {
      attempts++;
      const sx = Math.random() * (sw - 2) + 1;
      const sy = Math.random() * (sh - 2) + 1;
      const idx = Math.floor(sy) * sw + Math.floor(sx);
      const b = gray[idx];
      if (b >= bgThreshold && Math.random() < Math.pow(1 - b, 1.5)) {
        const px = (sx / sw) * width;
        const py = (sy / sh) * height;
        particles.push({
          x: px, y: py, ox: px, oy: py, vx: 0, vy: 0,
          size: 0.5 + (1 - b) * 2.2, brightness: b, fade: 1,
        });
      }
    }
    particlesRef.current = particles;
    edgesRef.current = [];
    readyRef.current = true;
  };

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

    // Load image then offload to Web Worker
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      const sampleW = Math.min(img.naturalWidth, 500);
      const sampleH = Math.round(sampleW * (img.naturalHeight / img.naturalWidth));
      offscreen.width = sampleW;
      offscreen.height = sampleH;
      const octx = offscreen.getContext('2d')!;
      octx.drawImage(img, 0, 0, sampleW, sampleH);
      const imageData = octx.getImageData(0, 0, sampleW, sampleH);

      // Offload heavy computation to Web Worker
      try {
        const worker = new Worker('/workers/lloyd-worker.js');
        const buffer = imageData.data.buffer.slice(0);

        worker.onerror = () => {
          // Worker failed — fall back to simple sampling on main thread
          console.warn('Lloyd worker failed, using fallback');
          fallbackSample(imageData.data, sampleW, sampleH);
          worker.terminate();
        };

        worker.onmessage = (ev: MessageEvent) => {
          particlesRef.current = ev.data.particles;
          edgesRef.current = ev.data.edges;
          readyRef.current = true;
          worker.terminate();
        };

        worker.postMessage({
          imageData: buffer,
          sampleW, sampleH, particleCount, bgThreshold, lloydIterations, width, height,
        }, [buffer]);
      } catch {
        // Worker not supported — fall back
        fallbackSample(imageData.data, sampleW, sampleH);
      }
    };
    img.src = src;

    // Global mouse tracking — reacts through overlapping content
    const onGlobalMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onGlobalMouseMove);

    let time = 0;
    const mouseRadius = 90;
    const mouseForce = 14;
    const returnForce = 0.045;
    const damping = 0.87;

    const animate = () => {
      if (!readyRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.016;
      const particles = particlesRef.current;
      const edges = edgesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, width, height);

      // Physics
      for (const p of particles) {
        const floatX = Math.sin(time * 0.3 + p.ox * 0.008) * 0.4;
        const floatY = Math.cos(time * 0.25 + p.oy * 0.01) * 0.3;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 0) {
          const force = (1 - dist / mouseRadius) * mouseForce;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.vx += (p.ox + floatX - p.x) * returnForce;
        p.vy += (p.oy + floatY - p.y) * returnForce;
        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Draw edges — stronger lines for wireframe aesthetic
      ctx.lineWidth = 0.5;
      for (const [a, b] of edges) {
        const pa = particles[a];
        const pb = particles[b];
        const edx = pa.x - pb.x;
        const edy = pa.y - pb.y;
        const d = Math.sqrt(edx * edx + edy * edy);
        const distFade = 1 - d / (maxLineLength * 1.2);
        // Fade lines at vignette boundary
        const edgeFade = Math.min(pa.fade, pb.fade);
        const alpha = Math.max(0, 0.25 * distFade * edgeFade);

        const mx = (pa.x + pb.x) / 2 - mouse.x;
        const my = (pa.y + pb.y) / 2 - mouse.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < mouseRadius * 1.3) {
          const glow = 1 - md / (mouseRadius * 1.3);
          ctx.strokeStyle = `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},${alpha + glow * 0.3})`;
          ctx.lineWidth = 0.7;
        } else {
          ctx.strokeStyle = `rgba(${lineColor[0]},${lineColor[1]},${lineColor[2]},${alpha})`;
          ctx.lineWidth = 0.5;
        }

        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // Draw points
      for (const p of particles) {
        const darkness = 1 - p.brightness;
        // Core alpha: darker areas more visible, modulated by vignette fade
        const alpha = (0.25 + darkness * 0.65) * p.fade;

        // Mouse accent glow
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < mouseRadius) {
          const glow = 1 - md / mouseRadius;
          ctx.fillStyle = `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},${glow * 0.5 * p.fade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${pointColor[0]},${pointColor[1]},${pointColor[2]},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onGlobalMouseMove);
    };
  }, [src, width, height, maxLineLength, pointColor, lineColor, accentColor, particleCount, bgThreshold, lloydIterations]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        ...style,
        width,
        height,
      }}
    />
  );
}
