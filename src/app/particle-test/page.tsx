'use client';

import { useEffect, useRef, useState } from 'react';
import Delaunator from 'delaunator';

/*
  PARTICLE PORTRAIT — White sketch style

  Multi-scale edge detection with aggressive local contrast enhancement.
  Uses CLAHE-inspired adaptive histogram equalization per tile,
  multi-scale Sobel (3 radii), and Laplacian of Gaussian combined.

  Rendering: ALL particles bright white, DARKEN only at detected edges
  Result: white face shape with dark pencil-stroke contours at features
*/

export default function ParticleTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Loading...');

  interface Particle {
    x: number; y: number;
    ox: number; oy: number;
    vx: number; vy: number;
    size: number;
    brightness: number;
    edge: number;
    fade: number;
  }

  const particlesRef = useRef<Particle[]>([]);
  const edgesListRef = useRef<[number, number][]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = 700, ch = 820;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`; canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = cw / ch;
      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (imgAspect > canvasAspect) {
        drawH = ch; drawW = ch * imgAspect; drawX = (cw - drawW) / 2; drawY = 0;
      } else {
        drawW = cw; drawH = cw / imgAspect; drawX = 0; drawY = (ch - drawH) / 2;
      }

      const sampleW = Math.min(img.naturalWidth, 500);
      const sampleH = Math.round(sampleW / imgAspect);
      const offscreen = document.createElement('canvas');
      offscreen.width = sampleW; offscreen.height = sampleH;
      const octx = offscreen.getContext('2d')!;
      octx.drawImage(img, 0, 0, sampleW, sampleH);
      const data = octx.getImageData(0, 0, sampleW, sampleH).data;

      // Grayscale
      const gray = new Float32Array(sampleW * sampleH);
      for (let i = 0; i < sampleW * sampleH; i++) {
        const idx = i * 4;
        gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
      }

      // Vignette
      const vigCx = sampleW * 0.43, vigCy = sampleH * 0.40;
      const vigRx = sampleW * 0.42, vigRy = sampleH * 0.50;
      const vignette = new Float32Array(sampleW * sampleH);
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const nx = (x - vigCx) / vigRx, ny = (y - vigCy) / vigRy;
          const d = Math.sqrt(nx * nx + ny * ny);
          vignette[y * sampleW + x] = Math.max(0, Math.min(1, 1 - Math.pow(Math.max(0, (d - 0.5) / 0.6), 1.6)));
        }
      }

      // ============================
      // ADAPTIVE LOCAL CONTRAST (CLAHE-inspired)
      // Divide into tiles, equalize each tile's histogram, interpolate
      // This reveals edges even in very flat, dark regions
      // ============================
      const tileSize = 32;
      const tilesX = Math.ceil(sampleW / tileSize);
      const tilesY = Math.ceil(sampleH / tileSize);
      const nBins = 256;
      const clipLimit = 4.0; // CLAHE clip limit

      // Build per-tile CDF
      const tileCDFs: Float32Array[] = [];
      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const hist = new Float32Array(nBins);
          let count = 0;
          const x0 = tx * tileSize, y0 = ty * tileSize;
          const x1 = Math.min(x0 + tileSize, sampleW);
          const y1 = Math.min(y0 + tileSize, sampleH);
          for (let yy = y0; yy < y1; yy++) {
            for (let xx = x0; xx < x1; xx++) {
              const bin = Math.min(nBins - 1, Math.floor(gray[yy * sampleW + xx] * (nBins - 1)));
              hist[bin]++;
              count++;
            }
          }
          // Clip histogram (CLAHE)
          const clipCount = clipLimit * count / nBins;
          let excess = 0;
          for (let i = 0; i < nBins; i++) {
            if (hist[i] > clipCount) { excess += hist[i] - clipCount; hist[i] = clipCount; }
          }
          const redistrib = excess / nBins;
          for (let i = 0; i < nBins; i++) hist[i] += redistrib;

          // Build CDF
          const cdf = new Float32Array(nBins);
          cdf[0] = hist[0];
          for (let i = 1; i < nBins; i++) cdf[i] = cdf[i - 1] + hist[i];
          const cdfMin = cdf[0];
          const cdfMax = cdf[nBins - 1];
          if (cdfMax > cdfMin) {
            for (let i = 0; i < nBins; i++) cdf[i] = (cdf[i] - cdfMin) / (cdfMax - cdfMin);
          }
          tileCDFs.push(cdf);
        }
      }

      // Apply CLAHE with bilinear interpolation between tiles
      const clahe = new Float32Array(sampleW * sampleH);
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const bin = Math.min(nBins - 1, Math.floor(gray[y * sampleW + x] * (nBins - 1)));
          // Find tile center coordinates
          const tcx = (x / tileSize) - 0.5;
          const tcy = (y / tileSize) - 0.5;
          const tx0 = Math.max(0, Math.floor(tcx));
          const ty0 = Math.max(0, Math.floor(tcy));
          const tx1 = Math.min(tilesX - 1, tx0 + 1);
          const ty1 = Math.min(tilesY - 1, ty0 + 1);
          const fx = Math.max(0, Math.min(1, tcx - tx0));
          const fy = Math.max(0, Math.min(1, tcy - ty0));

          const v00 = tileCDFs[ty0 * tilesX + tx0][bin];
          const v10 = tileCDFs[ty0 * tilesX + tx1][bin];
          const v01 = tileCDFs[ty1 * tilesX + tx0][bin];
          const v11 = tileCDFs[ty1 * tilesX + tx1][bin];

          clahe[y * sampleW + x] = (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10
            + (1 - fx) * fy * v01 + fx * fy * v11;
        }
      }

      // ============================
      // BOX BLUR helper (separable, variable radius)
      // ============================
      function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
        const temp = new Float32Array(w * h);
        const out = new Float32Array(w * h);
        // Horizontal
        for (let y = 0; y < h; y++) {
          let sum = 0, cnt = 0;
          for (let x = 0; x < Math.min(radius, w); x++) { sum += src[y * w + x]; cnt++; }
          for (let x = 0; x < w; x++) {
            if (x + radius < w) { sum += src[y * w + x + radius]; cnt++; }
            if (x - radius > 0) { sum -= src[y * w + x - radius - 1]; cnt--; }
            temp[y * w + x] = sum / cnt;
          }
        }
        // Vertical
        for (let x = 0; x < w; x++) {
          let sum = 0, cnt = 0;
          for (let y = 0; y < Math.min(radius, h); y++) { sum += temp[y * w + x]; cnt++; }
          for (let y = 0; y < h; y++) {
            if (y + radius < h) { sum += temp[(y + radius) * w + x]; cnt++; }
            if (y - radius > 0) { sum -= temp[(y - radius - 1) * w + x]; cnt--; }
            out[y * w + x] = sum / cnt;
          }
        }
        return out;
      }

      // ============================
      // MULTI-SCALE EDGE DETECTION
      // Combine Sobel at multiple scales on CLAHE-enhanced image,
      // plus Laplacian of Gaussian for fine edges
      // ============================

      // Also do strong unsharp mask on CLAHE result for extra pop
      const unsharpBlurred = boxBlur(clahe, sampleW, sampleH, 6);
      const enhanced = new Float32Array(sampleW * sampleH);
      for (let i = 0; i < clahe.length; i++) {
        enhanced[i] = Math.max(0, Math.min(1, clahe[i] + 10.0 * (clahe[i] - unsharpBlurred[i])));
      }

      // Sobel on a given source image
      function sobel(src: Float32Array, w: number, h: number): Float32Array {
        const out = new Float32Array(w * h);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const tl = src[(y-1)*w+(x-1)], t = src[(y-1)*w+x], tr = src[(y-1)*w+(x+1)];
            const l = src[y*w+(x-1)], r = src[y*w+(x+1)];
            const bl = src[(y+1)*w+(x-1)], b = src[(y+1)*w+x], br = src[(y+1)*w+(x+1)];
            const gx = -tl - 2*l - bl + tr + 2*r + br;
            const gy = -tl - 2*t - tr + bl + 2*b + br;
            out[y * w + x] = Math.sqrt(gx*gx + gy*gy);
          }
        }
        return out;
      }

      // Laplacian (second derivative — finds edges even in low-contrast regions)
      function laplacian(src: Float32Array, w: number, h: number): Float32Array {
        const out = new Float32Array(w * h);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const c = src[y * w + x];
            const t = src[(y-1)*w+x], b = src[(y+1)*w+x];
            const l = src[y*w+(x-1)], r = src[y*w+(x+1)];
            const tl = src[(y-1)*w+(x-1)], tr = src[(y-1)*w+(x+1)];
            const bl = src[(y+1)*w+(x-1)], br = src[(y+1)*w+(x+1)];
            // 8-connected Laplacian
            out[y * w + x] = Math.abs(-8 * c + t + b + l + r + tl + tr + bl + br);
          }
        }
        return out;
      }

      // Scale 1: Fine edges — Sobel on strongly enhanced CLAHE
      const edge1 = sobel(enhanced, sampleW, sampleH);

      // Scale 2: Medium edges — Sobel on slightly blurred CLAHE
      const blurred2 = boxBlur(clahe, sampleW, sampleH, 2);
      const blurredMed = boxBlur(blurred2, sampleW, sampleH, 4);
      const enhanced2 = new Float32Array(sampleW * sampleH);
      for (let i = 0; i < clahe.length; i++) {
        enhanced2[i] = Math.max(0, Math.min(1, blurred2[i] + 8.0 * (blurred2[i] - blurredMed[i])));
      }
      const edge2 = sobel(enhanced2, sampleW, sampleH);

      // Scale 3: Coarse edges — Sobel on more blurred version
      const blurred3 = boxBlur(clahe, sampleW, sampleH, 4);
      const blurredCoarse = boxBlur(blurred3, sampleW, sampleH, 8);
      const enhanced3 = new Float32Array(sampleW * sampleH);
      for (let i = 0; i < clahe.length; i++) {
        enhanced3[i] = Math.max(0, Math.min(1, blurred3[i] + 6.0 * (blurred3[i] - blurredCoarse[i])));
      }
      const edge3 = sobel(enhanced3, sampleW, sampleH);

      // Laplacian of Gaussian on CLAHE
      const logBlurred = boxBlur(clahe, sampleW, sampleH, 2);
      const edgeLoG = laplacian(logBlurred, sampleW, sampleH);

      // Combine all edge maps — take max across scales, plus LoG contribution
      const edgeMap = new Float32Array(sampleW * sampleH);
      for (let i = 0; i < edgeMap.length; i++) {
        const maxSobel = Math.max(edge1[i], edge2[i] * 1.2, edge3[i] * 1.4);
        edgeMap[i] = maxSobel + edgeLoG[i] * 0.5;
      }

      // Normalize
      let maxE = 0;
      for (let i = 0; i < edgeMap.length; i++) if (edgeMap[i] > maxE) maxE = edgeMap[i];
      if (maxE > 0) for (let i = 0; i < edgeMap.length; i++) edgeMap[i] /= maxE;

      // Boost edges in the eye region — eyes are small and subtle
      // Left eye (viewer's perspective): ~38-48% x, ~28-36% y
      // Right eye: ~52-62% x, ~26-34% y
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const nx = x / sampleW, ny = y / sampleH;
          const inLeftEye = nx > 0.35 && nx < 0.52 && ny > 0.26 && ny < 0.38;
          const inRightEye = nx > 0.50 && nx < 0.65 && ny > 0.24 && ny < 0.36;
          if (inLeftEye || inRightEye) {
            edgeMap[y * sampleW + x] *= 2.5; // amplify eye edges
          }
        }
      }

      // Re-normalize after eye boost
      maxE = 0;
      for (let i = 0; i < edgeMap.length; i++) if (edgeMap[i] > maxE) maxE = edgeMap[i];
      if (maxE > 0) for (let i = 0; i < edgeMap.length; i++) edgeMap[i] /= maxE;

      // Gamma curve to push more values into visible range
      for (let i = 0; i < edgeMap.length; i++) {
        edgeMap[i] = Math.pow(edgeMap[i], 0.45); // stronger gamma boost
      }

      // Threshold: below minimum, zero out for clean non-edge areas
      for (let i = 0; i < edgeMap.length; i++) {
        if (edgeMap[i] < 0.12) edgeMap[i] = 0;
        else edgeMap[i] = (edgeMap[i] - 0.15) / 0.85; // remap to 0..1
      }

      // Density map — same as before for good face shape
      const bgThreshold = 0.09;
      const density = new Float32Array(sampleW * sampleH);
      let maxDensity = 0;
      for (let i = 0; i < gray.length; i++) {
        const b = gray[i], v = vignette[i];
        if (b < bgThreshold || v < 0.01) { density[i] = 0; }
        else { density[i] = Math.pow(1 - b, 1.5) * v; }
        if (density[i] > maxDensity) maxDensity = density[i];
      }
      if (maxDensity > 0) for (let i = 0; i < density.length; i++) density[i] /= maxDensity;

      // Rejection sampling
      const particleCount = 4000;
      const points: number[] = [];
      let attempts = 0;
      while (points.length / 2 < particleCount && attempts < particleCount * 50) {
        attempts++;
        const sx = Math.random() * (sampleW - 2) + 1;
        const sy = Math.random() * (sampleH - 2) + 1;
        const d = density[Math.floor(sy) * sampleW + Math.floor(sx)];
        if (d > 0 && Math.random() < d) { points.push(sx, sy); }
      }

      // Lloyd relaxation
      const n = points.length / 2;
      setStatus(`${n} particles, computing Lloyd...`);
      for (let iter = 0; iter < 40; iter++) {
        if (n < 3) break;
        const weights = new Float64Array(n);
        const cx = new Float64Array(n);
        const cy = new Float64Array(n);
        for (let py = 0; py < sampleH; py += 2) {
          for (let px = 0; px < sampleW; px += 2) {
            const w = density[py * sampleW + px];
            if (w <= 0) continue;
            let minDist = Infinity, owner = 0;
            for (let i = 0; i < n; i++) {
              const dx = points[i*2] - px, dy = points[i*2+1] - py;
              const dd = dx*dx + dy*dy;
              if (dd < minDist) { minDist = dd; owner = i; }
            }
            weights[owner] += w; cx[owner] += w * px; cy[owner] += w * py;
          }
        }
        for (let i = 0; i < n; i++) {
          if (weights[i] > 0) {
            points[i*2] += ((cx[i]/weights[i]) - points[i*2]) * 1.8;
            points[i*2+1] += ((cy[i]/weights[i]) - points[i*2+1]) * 1.8;
            points[i*2] = Math.max(1, Math.min(sampleW-2, points[i*2]));
            points[i*2+1] = Math.max(1, Math.min(sampleH-2, points[i*2+1]));
          }
        }
      }

      // Build particles with edge value — sample edge in a small neighborhood for robustness
      const particles: Particle[] = [];
      for (let i = 0; i < n; i++) {
        const sx = points[i*2], sy = points[i*2+1];
        const px = drawX + (sx / sampleW) * drawW;
        const py = drawY + (sy / sampleH) * drawH;
        const ix = Math.floor(sx), iy = Math.floor(sy);

        // Sample max edge in 3x3 neighborhood for better edge pickup
        let maxEdge = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = Math.max(0, Math.min(sampleW - 1, ix + dx));
            const ny = Math.max(0, Math.min(sampleH - 1, iy + dy));
            const e = edgeMap[ny * sampleW + nx];
            if (e > maxEdge) maxEdge = e;
          }
        }

        particles.push({
          x: px, y: py, ox: px, oy: py, vx: 0, vy: 0,
          size: 1.0 + (1 - gray[iy * sampleW + ix]) * 1.2,
          brightness: gray[iy * sampleW + ix] || 0.5,
          edge: maxEdge,
          fade: vignette[iy * sampleW + ix] || 0,
        });
      }

      // INJECT EYEBALL PARTICLES — eyes are too dark for density sampling
      // Manually place dark particles in circular eye shapes
      const eyeSpots = [
        { cx: 0.41, cy: 0.31, rx: 0.025, ry: 0.015, count: 35 },  // left eye (viewer's right) — already visible
        { cx: 0.58, cy: 0.30, rx: 0.028, ry: 0.016, count: 45 },  // right eye (viewer's left) — the missing one, larger/more particles
      ];
      for (const eye of eyeSpots) {
        const ecx = eye.cx * sampleW, ecy = eye.cy * sampleH;
        const erx = eye.rx * sampleW, ery = eye.ry * sampleH;
        for (let j = 0; j < eye.count; j++) {
          // Random points inside ellipse
          const angle = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()); // uniform distribution inside circle
          const sx = ecx + Math.cos(angle) * r * erx;
          const sy = ecy + Math.sin(angle) * r * ery;
          if (sx < 1 || sx >= sampleW - 1 || sy < 1 || sy >= sampleH - 1) continue;
          const px = drawX + (sx / sampleW) * drawW;
          const py = drawY + (sy / sampleH) * drawH;
          // Iris edge: particles at the rim are max edge, center is softer
          const edgeVal = 0.6 + r * 0.4; // 0.6 at center, 1.0 at rim
          particles.push({
            x: px, y: py, ox: px, oy: py, vx: 0, vy: 0,
            size: 1.1 + r * 0.5,
            brightness: 0.05,
            edge: edgeVal,
            fade: 1.0,
          });
        }
      }

      // Delaunay
      const delaunayEdges: [number, number][] = [];
      if (n >= 3) {
        const coords = new Float64Array(n * 2);
        for (let i = 0; i < n; i++) { coords[i*2] = particles[i].ox; coords[i*2+1] = particles[i].oy; }
        const delaunay = new Delaunator(coords);
        const tris = delaunay.triangles;
        const maxSq = 18 * 18;
        const edgeSet = new Set<string>();
        for (let i = 0; i < tris.length; i += 3) {
          for (const [a, b] of [[tris[i],tris[i+1]],[tris[i+1],tris[i+2]],[tris[i+2],tris[i]]] as [number,number][]) {
            const key = a < b ? `${a}-${b}` : `${b}-${a}`;
            if (edgeSet.has(key)) continue;
            edgeSet.add(key);
            const dx = particles[a].ox-particles[b].ox, dy = particles[a].oy-particles[b].oy;
            if (dx*dx+dy*dy <= maxSq) delaunayEdges.push([a, b]);
          }
        }
      }

      setStatus(`${n} particles, ${delaunayEdges.length} edges`);
      particlesRef.current = particles;
      edgesListRef.current = delaunayEdges;

      // === ANIMATION ===
      let time = 0;
      const animate = () => {
        time += 0.016;
        const ps = particlesRef.current;
        const es = edgesListRef.current;
        const mouse = mouseRef.current;
        ctx.clearRect(0, 0, cw, ch);

        // Physics
        for (const p of ps) {
          const fx = Math.sin(time * 0.3 + p.ox * 0.008) * 0.3;
          const fy = Math.cos(time * 0.25 + p.oy * 0.01) * 0.25;
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90 && dist > 0) {
            const force = (1 - dist / 90) * 14;
            p.vx += (dx/dist) * force; p.vy += (dy/dist) * force;
          }
          p.vx += (p.ox + fx - p.x) * 0.045;
          p.vy += (p.oy + fy - p.y) * 0.045;
          p.vx *= 0.87; p.vy *= 0.87;
          p.x += p.vx; p.y += p.vy;
        }

        // === DRAW EDGES — white base, darken at feature edges ===
        for (const [a, b] of es) {
          const pa = ps[a], pb = ps[b];
          const edx = pa.x - pb.x, edy = pa.y - pb.y;
          const d = Math.sqrt(edx * edx + edy * edy);
          const distFade = Math.max(0, 1 - d / 20);
          const vFade = Math.min(pa.fade, pb.fade);
          const avgEdge = (pa.edge + pb.edge) / 2;

          // White lines, darken where edges detected
          const bright = Math.round(240 - avgEdge * 190);
          const alpha = (0.08 + avgEdge * 0.18) * distFade * vFade;

          const mx = (pa.x+pb.x)/2 - mouse.x, my = (pa.y+pb.y)/2 - mouse.y;
          const md = Math.sqrt(mx*mx + my*my);
          if (md < 110) {
            const glow = 1 - md / 110;
            ctx.strokeStyle = `rgba(193,255,0,${alpha + glow * 0.15})`;
            ctx.lineWidth = 0.7;
          } else {
            ctx.strokeStyle = `rgba(${bright},${bright},${bright},${alpha})`;
            ctx.lineWidth = 0.5;
          }
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }

        // === DRAW POINTS — WHITE everywhere, DARK at edges ===
        for (const p of ps) {
          const e = p.edge;

          // White base (240-255), darken to 30-50 at strong edges
          const bright = Math.round(245 - e * 210);
          // Alpha: visible everywhere, more opaque at edges
          const alpha = (0.4 + e * 0.45) * p.fade;
          // Size: slightly larger at edges for bolder contour
          const size = p.size * (1 + e * 0.5);

          // Mouse glow
          const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 90) {
            const glow = 1 - md / 90;
            ctx.fillStyle = `rgba(193,255,0,${glow * 0.45 * p.fade})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2); ctx.fill();
          }

          ctx.fillStyle = `rgba(${bright},${bright},${bright},${alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
        }

        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };
    img.onerror = () => setStatus('Failed to load /portrait.png');
    img.src = '/portrait.png';

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', () => { mouseRef.current = { x: -9999, y: -9999 }; });

    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div style={{ background: '#050507', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, fontFamily: 'monospace', color: '#888' }}>
      <h1 style={{ color: '#f0f1fa', fontSize: 24, marginBottom: 8 }}>Particle Portrait — White Sketch</h1>
      <p style={{ fontSize: 12, marginBottom: 20 }}>{status}</p>
      <canvas ref={canvasRef} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'crosshair' }} />
    </div>
  );
}
