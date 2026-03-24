/*
  Lloyd relaxation Web Worker — offloads the expensive O(n*m) computation.
  Returns positioned points. Delaunay triangulation done on main thread.
*/

self.onmessage = function(e) {
  const { imageData, sampleW, sampleH, particleCount, bgThreshold, lloydIterations, width, height } = e.data;
  const data = new Uint8ClampedArray(imageData);

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

  // Sobel edges
  const edges = new Float32Array(sampleW * sampleH);
  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const tl = gray[(y-1)*sampleW+(x-1)], t = gray[(y-1)*sampleW+x], tr = gray[(y-1)*sampleW+(x+1)];
      const l = gray[y*sampleW+(x-1)], r = gray[y*sampleW+(x+1)];
      const bl = gray[(y+1)*sampleW+(x-1)], b2 = gray[(y+1)*sampleW+x], br = gray[(y+1)*sampleW+(x+1)];
      const gx = -tl - 2*l - bl + tr + 2*r + br;
      const gy = -tl - 2*t - tr + bl + 2*b2 + br;
      edges[y * sampleW + x] = Math.sqrt(gx*gx + gy*gy);
    }
  }
  let maxEdge = 0;
  for (let i = 0; i < edges.length; i++) if (edges[i] > maxEdge) maxEdge = edges[i];
  if (maxEdge > 0) for (let i = 0; i < edges.length; i++) edges[i] /= maxEdge;

  // Density
  const density = new Float32Array(sampleW * sampleH);
  let maxDensity = 0;
  for (let i = 0; i < gray.length; i++) {
    const b = gray[i], v = vignette[i], ed = edges[i];
    if (b < bgThreshold || v < 0.01) { density[i] = 0; }
    else {
      const tonal = Math.pow(1 - b, 1.5);
      const edgeBoost = Math.pow(ed, 0.8) * 0.6;
      density[i] = Math.max(tonal, tonal + edgeBoost) * v;
    }
    if (density[i] > maxDensity) maxDensity = density[i];
  }
  if (maxDensity > 0) for (let i = 0; i < density.length; i++) density[i] /= maxDensity;

  // Rejection sampling
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

  // Lloyd relaxation with spatial grid
  const n = count;
  const cellSize = Math.max(8, Math.sqrt((sampleW * sampleH) / n) * 1.5);
  const gridW = Math.ceil(sampleW / cellSize);
  const gridH = Math.ceil(sampleH / cellSize);

  for (let iter = 0; iter < lloydIterations; iter++) {
    if (n < 3) break;

    // Build spatial grid
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
    // Prefix sum for offsets
    const gridOffsets = new Int32Array(gridW * gridH);
    for (let i = 1; i < gridOffsets.length; i++) gridOffsets[i] = gridOffsets[i-1] + gridCounts[i-1];
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
        const centX = cx[i] / weights[i];
        const centY = cy[i] / weights[i];
        points[i * 2] += (centX - points[i * 2]) * 1.8;
        points[i * 2 + 1] += (centY - points[i * 2 + 1]) * 1.8;
        points[i * 2] = Math.max(1, Math.min(sampleW - 2, points[i * 2]));
        points[i * 2 + 1] = Math.max(1, Math.min(sampleH - 2, points[i * 2 + 1]));
      }
    }
  }

  // Build result — particles as flat arrays for fast transfer
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const brightnesses = new Float32Array(n);
  const fades = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const sx = points[i * 2], sy = points[i * 2 + 1];
    xs[i] = (sx / sampleW) * width;
    ys[i] = (sy / sampleH) * height;
    const idx = Math.floor(sy) * sampleW + Math.floor(sx);
    brightnesses[i] = gray[idx] || 0.5;
    fades[i] = vignette[idx] || 0;
  }

  self.postMessage({ xs, ys, brightnesses, fades, count: n },
    [xs.buffer, ys.buffer, brightnesses.buffer, fades.buffer]);
};
