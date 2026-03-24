'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Delaunator from 'delaunator';

/*
  STIPPLE PORTRAIT — Pure brightness mapping

  Black & white photo → dots.
  Dark pixel = big opaque dot. Bright pixel = small faint dot.
  That's it. Features appear naturally from tonal contrast.
*/

export default function ParticleTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Loading...');
  const [imgSrc, setImgSrc] = useState('/portrait-bw.png');

  interface Particle {
    x: number; y: number; ox: number; oy: number;
    vx: number; vy: number;
    size: number;   // radius — bigger where darker
    dark: number;   // 0=white, 1=black (from normalized grayscale)
    fade: number;   // vignette
  }

  const particlesRef = useRef<Particle[]>([]);
  const edgesRef = useRef<[number, number][]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgSrc(URL.createObjectURL(file));
  };

  const generate = useCallback((imageSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelAnimationFrame(rafRef.current);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = 700, ch = 820;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`; canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setStatus('Processing...');

      // Fit image to canvas
      const ar = img.naturalWidth / img.naturalHeight;
      const car = cw / ch;
      let dW: number, dH: number, dX: number, dY: number;
      if (ar > car) { dH = ch; dW = ch * ar; dX = (cw - dW) / 2; dY = 0; }
      else { dW = cw; dH = cw / ar; dX = 0; dY = (ch - dH) / 2; }

      // Sample at reduced resolution
      const sW = Math.min(img.naturalWidth, 500);
      const sH = Math.round(sW / ar);
      const off = document.createElement('canvas');
      off.width = sW; off.height = sH;
      const octx = off.getContext('2d')!;
      octx.drawImage(img, 0, 0, sW, sH);
      const data = octx.getImageData(0, 0, sW, sH).data;

      // Grayscale
      const gray = new Float32Array(sW * sH);
      for (let i = 0; i < sW * sH; i++) {
        const j = i * 4;
        gray[i] = (data[j] * 0.299 + data[j+1] * 0.587 + data[j+2] * 0.114) / 255;
      }

      // Auto-range: stretch to full 0-1 (skip pure black bg)
      let lo = 1, hi = 0;
      for (let i = 0; i < gray.length; i++) {
        if (gray[i] > 0.03 && gray[i] < lo) lo = gray[i];
        if (gray[i] > hi) hi = gray[i];
      }
      const rng = hi - lo || 1;
      const norm = new Float32Array(sW * sH);
      for (let i = 0; i < gray.length; i++) {
        norm[i] = Math.max(0, Math.min(1, (gray[i] - lo) / rng));
      }

      // Gamma — boost dark photos
      const avg = norm.reduce((a, b) => a + b) / norm.length;
      const gamma = avg < 0.3 ? 0.45 : avg < 0.5 ? 0.65 : 1.0;
      for (let i = 0; i < norm.length; i++) norm[i] = Math.pow(norm[i], gamma);

      // Vignette
      const vCx = sW * 0.45, vCy = sH * 0.42;
      const vRx = sW * 0.44, vRy = sH * 0.52;

      // Density = darkness * vignette
      const density = new Float32Array(sW * sH);
      let maxD = 0;
      for (let y = 0; y < sH; y++) for (let x = 0; x < sW; x++) {
        const i = y * sW + x;
        const nx = (x - vCx) / vRx, ny = (y - vCy) / vRy;
        const d = Math.sqrt(nx*nx + ny*ny);
        const vig = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (d - 0.5) / 0.6), 1.6)));
        if (gray[i] < 0.03 || vig < 0.01) { density[i] = 0; continue; }
        density[i] = (1 - norm[i]) * vig;
        if (density[i] > maxD) maxD = density[i];
      }
      if (maxD > 0) for (let i = 0; i < density.length; i++) density[i] /= maxD;

      // Rejection sampling
      const N = 4500;
      const pts = new Float64Array(N * 2);
      let cnt = 0;
      for (let i = 0; i < N; i++) {
        for (let a = 0; a < 30; a++) {
          const x = Math.random() * (sW - 2) + 1;
          const y = Math.random() * (sH - 2) + 1;
          if (Math.random() < density[Math.floor(y) * sW + Math.floor(x)]) {
            pts[cnt * 2] = x; pts[cnt * 2 + 1] = y; cnt++; break;
          }
        }
      }

      // Lloyd relaxation (40 iterations)
      setStatus(`${cnt} points, Lloyd relaxation...`);
      for (let iter = 0; iter < 40; iter++) {
        const w = new Float64Array(cnt), cx = new Float64Array(cnt), cy = new Float64Array(cnt);
        for (let py = 0; py < sH; py += 2) for (let px = 0; px < sW; px += 2) {
          const wt = density[py * sW + px];
          if (wt <= 0) continue;
          let best = Infinity, owner = 0;
          for (let i = 0; i < cnt; i++) {
            const dx = pts[i*2] - px, dy = pts[i*2+1] - py;
            const dd = dx*dx + dy*dy;
            if (dd < best) { best = dd; owner = i; }
          }
          w[owner] += wt; cx[owner] += wt * px; cy[owner] += wt * py;
        }
        for (let i = 0; i < cnt; i++) if (w[i] > 0) {
          pts[i*2] += ((cx[i]/w[i]) - pts[i*2]) * 1.8;
          pts[i*2+1] += ((cy[i]/w[i]) - pts[i*2+1]) * 1.8;
          pts[i*2] = Math.max(1, Math.min(sW-2, pts[i*2]));
          pts[i*2+1] = Math.max(1, Math.min(sH-2, pts[i*2+1]));
        }
      }

      // Build particles — pure brightness mapping
      const particles: Particle[] = [];
      for (let i = 0; i < cnt; i++) {
        const sx = pts[i*2], sy = pts[i*2+1];
        const px = dX + (sx / sW) * dW;
        const py = dY + (sy / sH) * dH;
        const idx = Math.floor(sy) * sW + Math.floor(sx);
        const dark = 1 - norm[idx]; // 0=bright area, 1=dark area
        const nx = (sx - vCx) / vRx, ny = (sy - vCy) / vRy;
        const d = Math.sqrt(nx*nx + ny*ny);
        const vig = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (d - 0.5) / 0.6), 1.6)));

        particles.push({
          x: px, y: py, ox: px, oy: py, vx: 0, vy: 0,
          size: 0.6 + dark * 2.8,   // 0.6px bright areas → 3.4px dark areas
          dark,
          fade: vig,
        });
      }

      // Delaunay
      const edges: [number, number][] = [];
      if (cnt >= 3) {
        const coords = new Float64Array(cnt * 2);
        for (let i = 0; i < cnt; i++) { coords[i*2] = particles[i].ox; coords[i*2+1] = particles[i].oy; }
        const tris = new Delaunator(coords).triangles;
        const maxSq = 18 * 18, seen = new Set<string>();
        for (let i = 0; i < tris.length; i += 3) {
          for (const [a, b] of [[tris[i],tris[i+1]],[tris[i+1],tris[i+2]],[tris[i+2],tris[i]]] as [number,number][]) {
            const k = a < b ? `${a}-${b}` : `${b}-${a}`;
            if (seen.has(k)) continue; seen.add(k);
            const dx = particles[a].ox-particles[b].ox, dy = particles[a].oy-particles[b].oy;
            if (dx*dx+dy*dy <= maxSq) edges.push([a, b]);
          }
        }
      }

      setStatus(`${cnt} particles, ${edges.length} mesh edges`);
      particlesRef.current = particles;
      edgesRef.current = edges;

      // === RENDER LOOP ===
      let time = 0;
      const animate = () => {
        time += 0.016;
        const ps = particlesRef.current;
        const es = edgesRef.current;
        const m = mouseRef.current;
        ctx.clearRect(0, 0, cw, ch);

        // Physics
        for (const p of ps) {
          const fx = Math.sin(time * 0.3 + p.ox * 0.008) * 0.3;
          const fy = Math.cos(time * 0.25 + p.oy * 0.01) * 0.25;
          const dx = p.x - m.x, dy = p.y - m.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 90 && dist > 0) {
            const f = (1 - dist / 90) * 14;
            p.vx += (dx/dist)*f; p.vy += (dy/dist)*f;
          }
          p.vx += (p.ox + fx - p.x) * 0.045;
          p.vy += (p.oy + fy - p.y) * 0.045;
          p.vx *= 0.87; p.vy *= 0.87;
          p.x += p.vx; p.y += p.vy;
        }

        // Mesh lines — darker where particles are darker
        for (const [a, b] of es) {
          const pa = ps[a], pb = ps[b];
          const ex = pa.x-pb.x, ey = pa.y-pb.y;
          const d = Math.sqrt(ex*ex + ey*ey);
          const dFade = Math.max(0, 1 - d / 20);
          const avgD = (pa.dark + pb.dark) / 2;
          const vF = Math.min(pa.fade, pb.fade);
          const alpha = (0.04 + avgD * 0.22) * dFade * vF;
          const c = Math.round(210 - avgD * 140);

          const mx = (pa.x+pb.x)/2 - m.x, my = (pa.y+pb.y)/2 - m.y;
          const md = Math.sqrt(mx*mx + my*my);
          if (md < 100) {
            const glow = 1 - md / 100;
            ctx.strokeStyle = `rgba(193,255,0,${alpha + glow * 0.1})`;
            ctx.lineWidth = 0.6;
          } else {
            ctx.strokeStyle = `rgba(${c},${c},${c},${alpha})`;
            ctx.lineWidth = 0.4;
          }
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }

        // Dots — PURE BRIGHTNESS MAPPING
        // dark=1 (black pixel) → big, opaque, dark dot
        // dark=0 (white pixel) → tiny, faint, bright dot
        for (const p of ps) {
          const alpha = (0.25 + p.dark * 0.7) * p.fade;
          const c = Math.round(240 - p.dark * 160); // 240 bright → 80 dark

          // Mouse glow
          const mx = p.x - m.x, my = p.y - m.y;
          const md = Math.sqrt(mx*mx + my*my);
          if (md < 90) {
            const glow = 1 - md / 90;
            ctx.fillStyle = `rgba(193,255,0,${glow * 0.4 * p.fade})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2); ctx.fill();
          }

          ctx.fillStyle = `rgba(${c},${c},${c},${alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }

        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };
    img.onerror = () => setStatus('Failed to load image');
    img.src = imageSrc;

    const onMM = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };
    canvas.addEventListener('mousemove', onMM);
    canvas.addEventListener('mouseleave', () => { mouseRef.current = { x: -9999, y: -9999 }; });
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => { generate(imgSrc); }, [imgSrc, generate]);

  return (
    <div style={{ background: '#050507', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, fontFamily: 'monospace', color: '#888' }}>
      <h1 style={{ color: '#f0f1fa', fontSize: 24, marginBottom: 8 }}>Stipple Portrait</h1>
      <p style={{ fontSize: 12, marginBottom: 16 }}>{status}</p>
      <label style={{ fontSize: 12, color: '#c1ff00', cursor: 'pointer', padding: '8px 20px', border: '1px solid rgba(193,255,0,0.3)', borderRadius: 100, marginBottom: 20 }}>
        Upload Portrait
        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
      </label>
      <canvas ref={canvasRef} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'crosshair' }} />
    </div>
  );
}
