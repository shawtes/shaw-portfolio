'use client';
import { useEffect, useRef, useCallback } from 'react';
import Delaunator from 'delaunator';

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

  const sampleImage = useCallback((img: HTMLImageElement) => {
    const offscreen = document.createElement('canvas');
    const sampleW = Math.min(img.naturalWidth, 500);
    const sampleH = Math.round(sampleW * (img.naturalHeight / img.naturalWidth));
    offscreen.width = sampleW;
    offscreen.height = sampleH;
    const octx = offscreen.getContext('2d')!;
    octx.drawImage(img, 0, 0, sampleW, sampleH);
    const imageData = octx.getImageData(0, 0, sampleW, sampleH);
    const data = imageData.data;

    // Build grayscale brightness map
    const gray = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < sampleW * sampleH; i++) {
      const idx = i * 4;
      gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
    }

    // Elliptical vignette — focus on face/upper body, fade out background
    // Center slightly above midpoint (face is upper-center in most portraits)
    const vigCx = sampleW * 0.40;  // shifted left — face is left-of-center
    const vigCy = sampleH * 0.36;
    const vigRx = sampleW * 0.34;  // tighter horizontal to cut right-side background
    const vigRy = sampleH * 0.44;  // tighter vertical

    const vignette = new Float32Array(sampleW * sampleH);
    for (let y = 0; y < sampleH; y++) {
      for (let x = 0; x < sampleW; x++) {
        const nx = (x - vigCx) / vigRx;
        const ny = (y - vigCy) / vigRy;
        const d = Math.sqrt(nx * nx + ny * ny);
        // Soft falloff: fully visible inside d<0.6, fades to 0 at d=1.2
        vignette[y * sampleW + x] = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (d - 0.55) / 0.65), 1.8)));
      }
    }

    // Build density map: darkness * vignette
    const density = new Float32Array(sampleW * sampleH);
    let maxDensity = 0;
    for (let i = 0; i < gray.length; i++) {
      const b = gray[i];
      const v = vignette[i];
      if (b < bgThreshold || v < 0.01) {
        density[i] = 0;
      } else {
        density[i] = Math.pow(1 - b, 1.5) * v;
      }
      if (density[i] > maxDensity) maxDensity = density[i];
    }
    if (maxDensity > 0) {
      for (let i = 0; i < density.length; i++) density[i] /= maxDensity;
    }

    // STEP 1: Rejection sampling by darkness * vignette
    const points: number[] = [];
    let attempts = 0;
    const maxAttempts = particleCount * 50;
    while (points.length / 2 < particleCount && attempts < maxAttempts) {
      attempts++;
      const sx = Math.random() * (sampleW - 2) + 1;
      const sy = Math.random() * (sampleH - 2) + 1;
      const idx = Math.floor(sy) * sampleW + Math.floor(sx);
      const d = density[idx];
      if (d > 0 && Math.random() < d) {
        points.push(sx, sy);
      }
    }

    // STEP 2: Weighted Lloyd relaxation
    const n = points.length / 2;
    for (let iter = 0; iter < lloydIterations; iter++) {
      if (n < 3) break;

      const weights = new Float64Array(n);
      const cx = new Float64Array(n);
      const cy = new Float64Array(n);

      const step = 2;
      for (let py = 0; py < sampleH; py += step) {
        for (let px = 0; px < sampleW; px += step) {
          const w = density[py * sampleW + px];
          if (w <= 0) continue;

          let minDist = Infinity;
          let owner = 0;
          for (let i = 0; i < n; i++) {
            const dx = points[i * 2] - px;
            const dy = points[i * 2 + 1] - py;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
              minDist = dist;
              owner = i;
            }
          }

          weights[owner] += w;
          cx[owner] += w * px;
          cy[owner] += w * py;
        }
      }

      for (let i = 0; i < n; i++) {
        if (weights[i] > 0) {
          const centX = cx[i] / weights[i];
          const centY = cy[i] / weights[i];
          points[i * 2] += (centX - points[i * 2]) * 1.8;
          points[i * 2 + 1] += (centY - points[i * 2 + 1]) * 1.8;
          points[i * 2] = Math.max(1, Math.min(sampleW - 2, points[i * 2]));
          points[i * 2 + 1] = Math.max(1, Math.min(sampleH - 2, points[i * 2 + 1]));
        }
      }
    }

    // STEP 3: Convert to canvas coordinates with vignette fade
    const particles: Particle[] = [];
    for (let i = 0; i < n; i++) {
      const sx = points[i * 2];
      const sy = points[i * 2 + 1];
      const px = (sx / sampleW) * width;
      const py = (sy / sampleH) * height;
      const idx = Math.floor(sy) * sampleW + Math.floor(sx);
      const b = gray[idx] || 0.5;
      const v = vignette[idx] || 0;
      const darkness = 1 - b;

      particles.push({
        x: px, y: py,
        ox: px, oy: py,
        vx: 0, vy: 0,
        size: 0.5 + darkness * 2.2,
        brightness: b,
        fade: v,
      });
    }

    // STEP 4: Delaunay triangulation
    const delaunayEdges: [number, number][] = [];
    if (particles.length >= 3) {
      const coords = new Float64Array(particles.length * 2);
      for (let i = 0; i < particles.length; i++) {
        coords[i * 2] = particles[i].ox;
        coords[i * 2 + 1] = particles[i].oy;
      }
      const delaunay = new Delaunator(coords);
      const tris = delaunay.triangles;
      const maxSq = maxLineLength * maxLineLength;
      const edgeSet = new Set<string>();
      for (let i = 0; i < tris.length; i += 3) {
        const pairs: [number, number][] = [
          [tris[i], tris[i + 1]],
          [tris[i + 1], tris[i + 2]],
          [tris[i + 2], tris[i]],
        ];
        for (const [a, b] of pairs) {
          const key = a < b ? `${a}-${b}` : `${b}-${a}`;
          if (edgeSet.has(key)) continue;
          edgeSet.add(key);
          const dx = particles[a].ox - particles[b].ox;
          const dy = particles[a].oy - particles[b].oy;
          if (dx * dx + dy * dy <= maxSq) {
            delaunayEdges.push([a, b]);
          }
        }
      }
    }

    particlesRef.current = particles;
    edgesRef.current = delaunayEdges;
    readyRef.current = true;
  }, [width, height, particleCount, maxLineLength, bgThreshold, lloydIterations]);

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

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => sampleImage(img);
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
  }, [src, width, height, maxLineLength, pointColor, lineColor, accentColor, sampleImage]);

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
