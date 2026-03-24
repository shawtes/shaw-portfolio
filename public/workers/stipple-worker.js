/*
  Stipple Worker — configurable Lloyd relaxation + edge detection.
  Forked from lloyd-worker.js, stripped of portrait-specific code.
  Accepts config object, reports progress per iteration.
*/

self.onmessage = function(e) {
  const { imageData, sampleW, sampleH, canvasW, canvasH, config } = e.data;
  const {
    particleCount = 4000,
    lloydIterations = 40,
    whiteCutoff = 0.03,
    densityPower = 1.5,
    useCLAHE = true,
    useEdgeDetection = true,
    minDotSize = 0.6,
    maxDotSize = 3.5,
  } = config || {};

  const data = new Uint8ClampedArray(imageData);

  // ── Grayscale ──
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0; i < sampleW * sampleH; i++) {
    const idx = i * 4;
    gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
  }

  // ── CLAHE (optional) ──
  let enhanced = gray;
  if (useCLAHE) {
    const tileSize = 32;
    const tilesX = Math.ceil(sampleW / tileSize), tilesY = Math.ceil(sampleH / tileSize);
    const nBins = 256, clipLim = 4.0;
    const tileCDFs = [];
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const hist = new Float32Array(nBins);
        let cnt = 0;
        const x0 = tx * tileSize, y0 = ty * tileSize;
        const x1 = Math.min(x0 + tileSize, sampleW), y1 = Math.min(y0 + tileSize, sampleH);
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
          hist[Math.min(nBins - 1, Math.floor(gray[yy * sampleW + xx] * (nBins - 1)))]++;
          cnt++;
        }
        const clipCnt = clipLim * cnt / nBins;
        let excess = 0;
        for (let i = 0; i < nBins; i++) {
          if (hist[i] > clipCnt) { excess += hist[i] - clipCnt; hist[i] = clipCnt; }
        }
        for (let i = 0; i < nBins; i++) hist[i] += excess / nBins;
        const cdf = new Float32Array(nBins);
        cdf[0] = hist[0];
        for (let i = 1; i < nBins; i++) cdf[i] = cdf[i - 1] + hist[i];
        const cMin = cdf[0], cMax = cdf[nBins - 1];
        if (cMax > cMin) for (let i = 0; i < nBins; i++) cdf[i] = (cdf[i] - cMin) / (cMax - cMin);
        tileCDFs.push(cdf);
      }
    }
    enhanced = new Float32Array(sampleW * sampleH);
    for (let y = 0; y < sampleH; y++) {
      for (let x = 0; x < sampleW; x++) {
        const bin = Math.min(nBins - 1, Math.floor(gray[y * sampleW + x] * (nBins - 1)));
        const tcx = (x / tileSize) - 0.5, tcy = (y / tileSize) - 0.5;
        const tx0 = Math.max(0, Math.floor(tcx)), ty0 = Math.max(0, Math.floor(tcy));
        const tx1 = Math.min(tilesX - 1, tx0 + 1), ty1 = Math.min(tilesY - 1, ty0 + 1);
        const fx = Math.max(0, Math.min(1, tcx - tx0)), fy = Math.max(0, Math.min(1, tcy - ty0));
        enhanced[y * sampleW + x] =
          (1 - fx) * (1 - fy) * tileCDFs[ty0 * tilesX + tx0][bin] +
          fx * (1 - fy) * tileCDFs[ty0 * tilesX + tx1][bin] +
          (1 - fx) * fy * tileCDFs[ty1 * tilesX + tx0][bin] +
          fx * fy * tileCDFs[ty1 * tilesX + tx1][bin];
      }
    }
  }

  // ── Density map ──
  const density = new Float32Array(sampleW * sampleH);
  let maxDensity = 0;
  for (let i = 0; i < gray.length; i++) {
    const b = gray[i];
    if (b < whiteCutoff) { density[i] = 0; continue; }
    density[i] = Math.pow(1 - b, densityPower);
    if (density[i] > maxDensity) maxDensity = density[i];
  }
  if (maxDensity > 0) for (let i = 0; i < density.length; i++) density[i] /= maxDensity;

  // ── Rejection sampling ──
  const points = new Float64Array(particleCount * 2);
  let count = 0, attempts = 0;
  while (count < particleCount && attempts < particleCount * 50) {
    attempts++;
    const sx = Math.random() * (sampleW - 2) + 1;
    const sy = Math.random() * (sampleH - 2) + 1;
    const d = density[Math.floor(sy) * sampleW + Math.floor(sx)];
    if (d > 0 && Math.random() < d) {
      points[count * 2] = sx;
      points[count * 2 + 1] = sy;
      count++;
    }
  }

  // ── Lloyd relaxation with spatial grid ──
  const n = count;
  const cellSize = Math.max(8, Math.sqrt((sampleW * sampleH) / n) * 1.5);
  const gridW = Math.ceil(sampleW / cellSize);
  const gridH = Math.ceil(sampleH / cellSize);

  for (let iter = 0; iter < lloydIterations; iter++) {
    if (n < 3) break;

    self.postMessage({ type: 'progress', iteration: iter, total: lloydIterations });

    const gridCounts = new Int32Array(gridW * gridH);
    const gridIndices = new Int32Array(n);
    const gridCells = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const gx = Math.min(gridW - 1, Math.floor(points[i * 2] / cellSize));
      const gy = Math.min(gridH - 1, Math.floor(points[i * 2 + 1] / cellSize));
      const cell = gy * gridW + gx;
      gridCells[i] = cell;
      gridCounts[cell]++;
    }
    const gridOffsets = new Int32Array(gridW * gridH);
    for (let i = 1; i < gridOffsets.length; i++) gridOffsets[i] = gridOffsets[i - 1] + gridCounts[i - 1];
    const tempCounts = new Int32Array(gridW * gridH);
    const gridSorted = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const cell = gridCells[i];
      gridSorted[gridOffsets[cell] + tempCounts[cell]] = i;
      tempCounts[cell]++;
    }

    const weights = new Float64Array(n);
    const cx = new Float64Array(n);
    const cy = new Float64Array(n);
    const step = 2;

    for (let py = 0; py < sampleH; py += step) {
      for (let px = 0; px < sampleW; px += step) {
        const w = density[py * sampleW + px];
        if (w <= 0) continue;
        const gx = Math.min(gridW - 1, Math.floor(px / cellSize));
        const gy = Math.min(gridH - 1, Math.floor(py / cellSize));
        let minDist = Infinity, owner = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ngx = gx + dx, ngy = gy + dy;
            if (ngx < 0 || ngx >= gridW || ngy < 0 || ngy >= gridH) continue;
            const cell = ngy * gridW + ngx;
            const start = gridOffsets[cell];
            const end = start + gridCounts[cell];
            for (let k = start; k < end; k++) {
              const i = gridSorted[k];
              const ddx = points[i * 2] - px;
              const ddy = points[i * 2 + 1] - py;
              const dd = ddx * ddx + ddy * ddy;
              if (dd < minDist) { minDist = dd; owner = i; }
            }
          }
        }

        weights[owner] += w;
        cx[owner] += w * px;
        cy[owner] += w * py;
      }
    }

    for (let i = 0; i < n; i++) {
      if (weights[i] > 0) {
        points[i * 2] += ((cx[i] / weights[i]) - points[i * 2]) * 1.8;
        points[i * 2 + 1] += ((cy[i] / weights[i]) - points[i * 2 + 1]) * 1.8;
        points[i * 2] = Math.max(1, Math.min(sampleW - 2, points[i * 2]));
        points[i * 2 + 1] = Math.max(1, Math.min(sampleH - 2, points[i * 2 + 1]));
      }
    }
  }

  // ── Edge detection (optional) ──
  let edgeMap = new Float32Array(sampleW * sampleH);

  if (useEdgeDetection) {
    function boxBlur(src, w, h, rad) {
      const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        let s = 0, c = 0;
        for (let x = 0; x < Math.min(rad, w); x++) { s += src[y * w + x]; c++; }
        for (let x = 0; x < w; x++) {
          if (x + rad < w) { s += src[y * w + x + rad]; c++; }
          if (x - rad > 0) { s -= src[y * w + x - rad - 1]; c--; }
          tmp[y * w + x] = s / c;
        }
      }
      for (let x = 0; x < w; x++) {
        let s = 0, c = 0;
        for (let y = 0; y < Math.min(rad, h); y++) { s += tmp[y * w + x]; c++; }
        for (let y = 0; y < h; y++) {
          if (y + rad < h) { s += tmp[(y + rad) * w + x]; c++; }
          if (y - rad > 0) { s -= tmp[(y - rad - 1) * w + x]; c--; }
          out[y * w + x] = s / c;
        }
      }
      return out;
    }

    function sobel(src, w, h) {
      const out = new Float32Array(w * h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const tl = src[(y-1)*w+(x-1)], t = src[(y-1)*w+x], tr = src[(y-1)*w+(x+1)];
        const l = src[y*w+(x-1)], r = src[y*w+(x+1)];
        const bl = src[(y+1)*w+(x-1)], b = src[(y+1)*w+x], br = src[(y+1)*w+(x+1)];
        const gx = -tl - 2*l - bl + tr + 2*r + br;
        const gy = -tl - 2*t - tr + bl + 2*b + br;
        out[y * w + x] = Math.sqrt(gx * gx + gy * gy);
      }
      return out;
    }

    function laplacian(src, w, h) {
      const out = new Float32Array(w * h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const c = src[y*w+x];
        out[y*w+x] = Math.abs(-8*c + src[(y-1)*w+x] + src[(y+1)*w+x] + src[y*w+(x-1)] + src[y*w+(x+1)]
          + src[(y-1)*w+(x-1)] + src[(y-1)*w+(x+1)] + src[(y+1)*w+(x-1)] + src[(y+1)*w+(x+1)]);
      }
      return out;
    }

    const src = enhanced;
    // Scale 1: unsharp mask + Sobel
    const ub = boxBlur(src, sampleW, sampleH, 6);
    const enh1 = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < src.length; i++) enh1[i] = Math.max(0, Math.min(1, src[i] + 10 * (src[i] - ub[i])));
    const e1 = sobel(enh1, sampleW, sampleH);

    // Scale 2: cascading blur + Sobel
    const b2 = boxBlur(src, sampleW, sampleH, 2);
    const bm = boxBlur(b2, sampleW, sampleH, 4);
    const enh2 = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < src.length; i++) enh2[i] = Math.max(0, Math.min(1, b2[i] + 8 * (b2[i] - bm[i])));
    const e2 = sobel(enh2, sampleW, sampleH);

    // Scale 3
    const b3 = boxBlur(src, sampleW, sampleH, 4);
    const bc = boxBlur(b3, sampleW, sampleH, 8);
    const enh3 = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < src.length; i++) enh3[i] = Math.max(0, Math.min(1, b3[i] + 6 * (b3[i] - bc[i])));
    const e3 = sobel(enh3, sampleW, sampleH);

    // LoG
    const logB = boxBlur(src, sampleW, sampleH, 2);
    const eLaG = laplacian(logB, sampleW, sampleH);

    for (let i = 0; i < edgeMap.length; i++) {
      edgeMap[i] = Math.max(e1[i], e2[i] * 1.2, e3[i] * 1.4) + eLaG[i] * 0.5;
    }

    let maxEM = 0;
    for (let i = 0; i < edgeMap.length; i++) if (edgeMap[i] > maxEM) maxEM = edgeMap[i];
    if (maxEM > 0) for (let i = 0; i < edgeMap.length; i++) edgeMap[i] /= maxEM;
    for (let i = 0; i < edgeMap.length; i++) edgeMap[i] = Math.pow(edgeMap[i], 0.45);
    for (let i = 0; i < edgeMap.length; i++) {
      if (edgeMap[i] < 0.12) edgeMap[i] = 0;
      else edgeMap[i] = (edgeMap[i] - 0.12) / 0.88;
    }
  }

  // ── Build result ──
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const brightnesses = new Float32Array(n);
  const sizes = new Float32Array(n);
  const edgeVals = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const sx = points[i * 2], sy = points[i * 2 + 1];
    // Normalized 0-1 coordinates
    xs[i] = sx / sampleW;
    ys[i] = sy / sampleH;
    const ix = Math.floor(sx), iy = Math.floor(sy);
    const idx = iy * sampleW + ix;
    const b = gray[idx] || 0.5;
    brightnesses[i] = b;
    // 3x3 max edge
    let me = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = Math.max(0, Math.min(sampleW - 1, ix + dx));
      const ny = Math.max(0, Math.min(sampleH - 1, iy + dy));
      const ev = edgeMap[ny * sampleW + nx];
      if (ev > me) me = ev;
    }
    edgeVals[i] = me;
    const dark = 1 - b;
    sizes[i] = minDotSize + dark * (maxDotSize - minDotSize);
  }

  self.postMessage({ type: 'progress', iteration: lloydIterations, total: lloydIterations });

  self.postMessage(
    { type: 'result', xs, ys, brightnesses, sizes, edgeVals, count: n },
    [xs.buffer, ys.buffer, brightnesses.buffer, sizes.buffer, edgeVals.buffer]
  );
};
