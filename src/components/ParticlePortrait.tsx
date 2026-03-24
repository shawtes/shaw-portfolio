'use client';
import { useEffect, useRef } from 'react';
import Delaunator from 'delaunator';

interface Particle {
  x: number; y: number; ox: number; oy: number;
  vx: number; vy: number; size: number; brightness: number; fade: number;
}

export default function ParticlePortrait({
  src = '/portrait.png', width = 600, height = 700,
  particleCount = 3500, maxLineLength = 18, bgThreshold = 0.09, lloydIterations = 40,
  pointColor = [220, 220, 230], lineColor = [180, 180, 195], accentColor = [193, 255, 0],
  className = '', style = {},
}: {
  src?: string; width?: number; height?: number; particleCount?: number;
  maxLineLength?: number; bgThreshold?: number; lloydIterations?: number;
  pointColor?: [number, number, number]; lineColor?: [number, number, number];
  accentColor?: [number, number, number]; className?: string; style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const edgesRef = useRef<[number, number][]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const readyRef = useRef(false);

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

    // Load image, send to worker for heavy Lloyd computation
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

      try {
        const worker = new Worker('/workers/lloyd-worker.js');
        const buffer = imageData.data.buffer.slice(0);

        worker.onmessage = (ev: MessageEvent) => {
          const { xs, ys, brightnesses, fades, count } = ev.data;
          // Build particles
          const particles: Particle[] = [];
          for (let i = 0; i < count; i++) {
            const darkness = 1 - brightnesses[i];
            particles.push({ x: xs[i], y: ys[i], ox: xs[i], oy: ys[i], vx: 0, vy: 0,
              size: 0.5 + darkness * 2.2, brightness: brightnesses[i], fade: fades[i] });
          }
          // Delaunay on main thread — fast (~5ms for 4000 points)
          const delaunayEdges: [number, number][] = [];
          if (count >= 3) {
            const coords = new Float64Array(count * 2);
            for (let i = 0; i < count; i++) { coords[i*2] = xs[i]; coords[i*2+1] = ys[i]; }
            const delaunay = new Delaunator(coords);
            const tris = delaunay.triangles;
            const maxSq = maxLineLength * maxLineLength;
            const edgeSet = new Set<string>();
            for (let i = 0; i < tris.length; i += 3) {
              const pairs: [number,number][] = [[tris[i],tris[i+1]],[tris[i+1],tris[i+2]],[tris[i+2],tris[i]]];
              for (const [a,b] of pairs) {
                const key = a < b ? `${a}-${b}` : `${b}-${a}`;
                if (edgeSet.has(key)) continue;
                edgeSet.add(key);
                const dx = particles[a].ox-particles[b].ox, dy = particles[a].oy-particles[b].oy;
                if (dx*dx+dy*dy <= maxSq) delaunayEdges.push([a,b]);
              }
            }
          }
          particlesRef.current = particles;
          edgesRef.current = delaunayEdges;
          readyRef.current = true;
          worker.terminate();
        };

        worker.onerror = () => { worker.terminate(); };

        worker.postMessage({
          imageData: buffer, sampleW, sampleH, particleCount, bgThreshold, lloydIterations, width, height,
        }, [buffer]);
      } catch {
        // Worker unavailable — skip portrait silently
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
      if (!readyRef.current) { rafRef.current = requestAnimationFrame(animate); return; }

      time += 0.016;
      const particles = particlesRef.current;
      const edges = edgesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
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

      // Draw edges — tonal shading
      ctx.lineWidth = 0.5;
      for (const [a, b] of edges) {
        const pa = particles[a], pb = particles[b];
        const edx = pa.x - pb.x, edy = pa.y - pb.y;
        const d = Math.sqrt(edx * edx + edy * edy);
        const distFade = 1 - d / (maxLineLength * 1.2);
        const edgeFade = Math.min(pa.fade, pb.fade);
        const avgRaw = (pa.brightness + pb.brightness) / 2;
        const avgB = Math.pow(Math.min(1, Math.max(0, (avgRaw - 0.09) / 0.55)), 0.7);
        const tonalAlpha = Math.max(0, (0.1 + avgB * 0.3) * distFade * edgeFade);

        const mx = (pa.x + pb.x) / 2 - mouse.x, my = (pa.y + pb.y) / 2 - mouse.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < mouseRadius * 1.3) {
          const glow = 1 - md / (mouseRadius * 1.3);
          ctx.strokeStyle = `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},${tonalAlpha + glow * 0.3})`;
          ctx.lineWidth = 0.7;
        } else {
          const r = Math.round(100 + avgB * 130);
          const g = Math.round(100 + avgB * 125);
          const bl = Math.round(115 + avgB * 100);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${tonalAlpha})`;
          ctx.lineWidth = 0.5;
        }
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }

      // Draw points — tonal shading with contrast stretch
      for (const p of particles) {
        const stretched = Math.min(1, Math.max(0, (p.brightness - 0.09) / 0.55));
        const b = Math.pow(stretched, 0.7);
        const darkness = 1 - b;
        const alpha = (0.4 + b * 0.55) * p.fade;
        const r = Math.round(110 + b * 148);
        const g = Math.round(110 + b * 146);
        const bl = Math.round(125 + b * 128);
        const sizeBoost = darkness > 0.55 ? 1.35 : 1.0;

        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < mouseRadius) {
          const glow = 1 - md / mouseRadius;
          ctx.fillStyle = `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},${glow * 0.5 * p.fade})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * sizeBoost * 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `rgba(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,bl)},${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * sizeBoost, 0, Math.PI * 2); ctx.fill();
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
    <canvas ref={canvasRef} className={className}
      style={{ ...style, width, height }} />
  );
}
