'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Delaunator from 'delaunator';

/*
  PARTICLE PORTRAIT TEST PAGE — v2

  Fixed algorithm: rejection sampling by darkness (not edge detection).
  Dark pixels = more particles → face is recognizable by tonal regions.

  References:
  - Mike Bostock's Voronoi Stippling (Observable)
  - NHasan143/delaunay-stippler
  - tholman/image-nodes
*/

export default function ParticleTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Loading...');
  const [params, setParams] = useState({
    particleCount: 4000,
    bgThreshold: 0.09,    // skip pixels darker than this (black background)
    maxEdgeLen: 18,        // max Delaunay edge length to draw
    pointSizeMin: 0.6,
    pointSizeMax: 2.8,
    mouseRadius: 90,
    mouseForce: 14,
    springForce: 0.045,
    damping: 0.87,
    lloydIterations: 40,   // weighted Lloyd relaxation passes
  });

  interface Particle {
    x: number; y: number;
    ox: number; oy: number;
    vx: number; vy: number;
    size: number;
    brightness: number;
    fade: number;
  }

  const particlesRef = useRef<Particle[]>([]);
  const edgesRef = useRef<[number, number][]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);

  const buildParticles = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    // Fit image to canvas maintaining aspect ratio
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = cw / ch;
    let drawW: number, drawH: number, drawX: number, drawY: number;
    if (imgAspect > canvasAspect) {
      drawH = ch;
      drawW = ch * imgAspect;
      drawX = (cw - drawW) / 2;
      drawY = 0;
    } else {
      drawW = cw;
      drawH = cw / imgAspect;
      drawX = 0;
      drawY = (ch - drawH) / 2;
    }

    // Draw to offscreen canvas for sampling
    const sampleW = Math.min(img.naturalWidth, 500);
    const sampleH = Math.round(sampleW / imgAspect);
    const offscreen = document.createElement('canvas');
    offscreen.width = sampleW;
    offscreen.height = sampleH;
    const octx = offscreen.getContext('2d')!;
    octx.drawImage(img, 0, 0, sampleW, sampleH);
    const imageData = octx.getImageData(0, 0, sampleW, sampleH);
    const data = imageData.data;

    const { particleCount, bgThreshold, maxEdgeLen, pointSizeMin, pointSizeMax, lloydIterations } = params;

    // Build grayscale brightness map
    const gray = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < sampleW * sampleH; i++) {
      const idx = i * 4;
      gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
    }

    // Elliptical vignette — focus on face/upper body, fade out background
    const vigCx = sampleW * 0.40;
    const vigCy = sampleH * 0.36;
    const vigRx = sampleW * 0.34;
    const vigRy = sampleH * 0.44;

    const vignette = new Float32Array(sampleW * sampleH);
    for (let y = 0; y < sampleH; y++) {
      for (let x = 0; x < sampleW; x++) {
        const nx = (x - vigCx) / vigRx;
        const ny = (y - vigCy) / vigRy;
        const d = Math.sqrt(nx * nx + ny * ny);
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

    // === STEP 1: Rejection sampling by darkness ===
    // Place more points where the image is darker
    const points: number[] = []; // flat [x, y, x, y, ...]
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

    setStatus(`${points.length / 2} initial particles, running ${lloydIterations} Lloyd iterations...`);

    // === STEP 2: Weighted Lloyd relaxation ===
    // Iteratively move points toward brightness-weighted centroids of their Voronoi cells
    const n = points.length / 2;
    for (let iter = 0; iter < lloydIterations; iter++) {
      if (n < 3) break;
      const delaunay = new Delaunator(new Float64Array(points));

      // Accumulate weighted centroids per cell
      const weights = new Float64Array(n);
      const cx = new Float64Array(n);
      const cy = new Float64Array(n);

      // Sample a subset of pixels for speed (every 2nd pixel)
      const step = 2;
      for (let py = 0; py < sampleH; py += step) {
        for (let px = 0; px < sampleW; px += step) {
          const w = density[py * sampleW + px];
          if (w <= 0) continue;

          // Find which point owns this pixel (nearest neighbor via Delaunay)
          let minDist = Infinity;
          let owner = 0;
          // Use a simple brute-force for small point counts, or spatial lookup
          // For performance, sample fewer pixels per iteration
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

      // Move points toward weighted centroids with over-relaxation
      const relaxation = 1.8;
      for (let i = 0; i < n; i++) {
        if (weights[i] > 0) {
          const centX = cx[i] / weights[i];
          const centY = cy[i] / weights[i];
          points[i * 2] += (centX - points[i * 2]) * relaxation;
          points[i * 2 + 1] += (centY - points[i * 2 + 1]) * relaxation;
          // Clamp to bounds
          points[i * 2] = Math.max(1, Math.min(sampleW - 2, points[i * 2]));
          points[i * 2 + 1] = Math.max(1, Math.min(sampleH - 2, points[i * 2 + 1]));
        }
      }
    }

    // === STEP 3: Convert to canvas coordinates and create particles ===
    const particles: Particle[] = [];
    for (let i = 0; i < n; i++) {
      const sx = points[i * 2];
      const sy = points[i * 2 + 1];
      const px = drawX + (sx / sampleW) * drawW;
      const py = drawY + (sy / sampleH) * drawH;
      const idx = Math.floor(sy) * sampleW + Math.floor(sx);
      const b = gray[idx] || 0.5;
      const darkness = 1 - b;

      const v = vignette[idx] || 0;
      particles.push({
        x: px, y: py,
        ox: px, oy: py,
        vx: 0, vy: 0,
        size: pointSizeMin + darkness * (pointSizeMax - pointSizeMin),
        brightness: b,
        fade: v,
      });
    }

    // === STEP 4: Delaunay triangulation for connecting lines ===
    const delaunayEdges: [number, number][] = [];
    if (particles.length >= 3) {
      const coords = new Float64Array(particles.length * 2);
      for (let i = 0; i < particles.length; i++) {
        coords[i * 2] = particles[i].ox;
        coords[i * 2 + 1] = particles[i].oy;
      }
      const delaunay = new Delaunator(coords);
      const tris = delaunay.triangles;

      const maxSq = maxEdgeLen * maxEdgeLen;
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

    setStatus(`${particles.length} particles, ${delaunayEdges.length} edges (${lloydIterations} Lloyd iterations)`);
    particlesRef.current = particles;
    edgesRef.current = delaunayEdges;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = 700;
    const ch = 820;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      buildParticles(img, canvas);
      startAnimation(ctx, cw, ch);
    };
    img.onerror = () => setStatus('Failed to load /portrait.png');
    img.src = '/portrait.png';

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    function startAnimation(ctx: CanvasRenderingContext2D, w: number, h: number) {
      let time = 0;
      const animate = () => {
        time += 0.016;
        const particles = particlesRef.current;
        const edges = edgesRef.current;
        const mouse = mouseRef.current;
        const { mouseRadius, mouseForce, springForce, damping } = params;

        ctx.clearRect(0, 0, w, h);

        // Physics
        for (const p of particles) {
          const fx = Math.sin(time * 0.3 + p.ox * 0.008) * 0.4;
          const fy = Math.cos(time * 0.25 + p.oy * 0.01) * 0.3;

          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius && dist > 0.1) {
            const force = (1 - dist / mouseRadius) * mouseForce;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          p.vx += (p.ox + fx - p.x) * springForce;
          p.vy += (p.oy + fy - p.y) * springForce;
          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;
        }

        // Draw edges — stronger lines with vignette fade
        ctx.lineWidth = 0.5;
        for (const [a, b] of edges) {
          const pa = particles[a];
          const pb = particles[b];
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const distFade = 1 - d / (params.maxEdgeLen * 1.2);
          const edgeFade = Math.min(pa.fade, pb.fade);
          const alpha = Math.max(0, 0.25 * distFade * edgeFade);

          const mx = (pa.x + pb.x) / 2 - mouse.x;
          const my = (pa.y + pb.y) / 2 - mouse.y;
          const md = Math.sqrt(mx * mx + my * my);
          if (md < mouseRadius * 1.3) {
            const glow = 1 - md / (mouseRadius * 1.3);
            ctx.strokeStyle = `rgba(193,255,0,${alpha + glow * 0.3})`;
            ctx.lineWidth = 0.7;
          } else {
            ctx.strokeStyle = `rgba(180,180,195,${alpha})`;
            ctx.lineWidth = 0.5;
          }

          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }

        // Draw points with vignette fade
        for (const p of particles) {
          const darkness = 1 - p.brightness;
          const alpha = (0.25 + darkness * 0.65) * p.fade;

          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < mouseRadius) {
            const glow = 1 - md / mouseRadius;
            ctx.fillStyle = `rgba(193,255,0,${glow * 0.5 * p.fade})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `rgba(220,220,230,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [buildParticles, params]);

  return (
    <div style={{
      background: '#050507',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 40,
      fontFamily: 'monospace',
      color: '#888',
    }}>
      <h1 style={{ color: '#f0f1fa', fontSize: 24, marginBottom: 8 }}>Particle Portrait v2</h1>
      <p style={{ fontSize: 12, marginBottom: 20 }}>{status}</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, maxWidth: 800 }}>
        {([
          ['particleCount', 500, 8000, 100, 'Particles'],
          ['bgThreshold', 0, 0.3, 0.01, 'BG Threshold'],
          ['maxEdgeLen', 5, 40, 1, 'Max Edge Len'],
          ['pointSizeMin', 0.2, 2, 0.1, 'Point Min'],
          ['pointSizeMax', 1, 5, 0.1, 'Point Max'],
          ['mouseRadius', 30, 200, 5, 'Mouse Radius'],
          ['lloydIterations', 0, 100, 5, 'Lloyd Iters'],
        ] as [string, number, number, number, string][]).map(([key, min, max, step, label]) => (
          <label key={key} style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {label}: {(params as Record<string, number>)[key]}
            <input
              type="range"
              min={min} max={max} step={step}
              value={(params as Record<string, number>)[key]}
              onChange={e => setParams(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
              style={{ width: 100 }}
            />
          </label>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'crosshair' }}
      />
    </div>
  );
}
