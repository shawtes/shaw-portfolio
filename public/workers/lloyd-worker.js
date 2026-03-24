/*
  Lloyd relaxation Web Worker — offloads heavy computation from main thread.
  Receives image data, returns positioned particles + Delaunay edges.
*/

// Inline minimal Delaunator (avoids importScripts issues with bundled modules)
// Source: https://github.com/mapbox/delaunator (ISC License)
// Minified core only — triangulation, no hull
function Delaunator(coords) {
  const n = coords.length >> 1;
  this.coords = coords;
  const maxTriangles = Math.max(2 * n - 5, 0);
  this._triangles = new Uint32Array(maxTriangles * 3);
  this._halfedges = new Int32Array(maxTriangles * 3);
  this._hashSize = Math.ceil(Math.sqrt(n));
  this._hullPrev = new Uint32Array(n);
  this._hullNext = new Uint32Array(n);
  this._hullTri = new Uint32Array(n);
  this._hullHash = new Int32Array(this._hashSize).fill(-1);
  this._ids = new Uint32Array(n);
  this._dists = new Float64Array(n);
  this.update();
}

Delaunator.from = function(points) {
  const n = points.length;
  const coords = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    coords[2 * i] = points[i][0];
    coords[2 * i + 1] = points[i][1];
  }
  return new Delaunator(coords);
};

Delaunator.prototype = {
  update() {
    const { coords, _hullPrev: hullPrev, _hullNext: hullNext, _hullTri: hullTri, _hullHash: hullHash } = this;
    const n = coords.length >> 1;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = coords[2 * i], y = coords[2 * i + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      this._ids[i] = i;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

    let i0, i1, i2;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const d = dist(cx, cy, coords[2 * i], coords[2 * i + 1]);
      if (d < minDist) { i0 = i; minDist = d; }
    }
    const i0x = coords[2 * i0], i0y = coords[2 * i0 + 1];

    minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (i === i0) continue;
      const d = dist(i0x, i0y, coords[2 * i], coords[2 * i + 1]);
      if (d < minDist && d > 0) { i1 = i; minDist = d; }
    }
    let i1x = coords[2 * i1], i1y = coords[2 * i1 + 1];

    let minRadius = Infinity;
    for (let i = 0; i < n; i++) {
      if (i === i0 || i === i1) continue;
      const r = circumradius(i0x, i0y, i1x, i1y, coords[2 * i], coords[2 * i + 1]);
      if (r < minRadius) { i2 = i; minRadius = r; }
    }
    let i2x = coords[2 * i2], i2y = coords[2 * i2 + 1];

    if (minRadius === Infinity) {
      for (let i = 0; i < n; i++) {
        this._dists[i] = coords[2 * i] - coords[0] || coords[2 * i + 1] - coords[1];
      }
      quicksort(this._ids, this._dists, 0, n - 1);
      const hull = new Uint32Array(n);
      let j = 0;
      for (let i = 0, d0 = -Infinity; i < n; i++) {
        const id = this._ids[i];
        if (this._dists[id] > d0) { hull[j++] = id; d0 = this._dists[id]; }
      }
      this.hull = hull.subarray(0, j);
      this.triangles = new Uint32Array(0);
      this.halfedges = new Uint32Array(0);
      return;
    }

    if (orient2d(i0x, i0y, i1x, i1y, i2x, i2y) < 0) {
      const i = i1; const x = i1x; const y = i1y;
      i1 = i2; i1x = i2x; i1y = i2y;
      i2 = i; i2x = x; i2y = y;
    }

    const center = circumcenter(i0x, i0y, i1x, i1y, i2x, i2y);
    this._cx = center.x;
    this._cy = center.y;

    for (let i = 0; i < n; i++) {
      this._dists[i] = dist(coords[2 * i], coords[2 * i + 1], center.x, center.y);
    }

    quicksort(this._ids, this._dists, 0, n - 1);

    let hullStart = i0;
    let hullSize = 3;

    hullNext[i0] = hullPrev[i2] = i1;
    hullNext[i1] = hullPrev[i0] = i2;
    hullNext[i2] = hullPrev[i1] = i0;

    hullTri[i0] = 0;
    hullTri[i1] = 1;
    hullTri[i2] = 2;

    hullHash.fill(-1);
    hullHash[this._hashKey(i0x, i0y)] = i0;
    hullHash[this._hashKey(i1x, i1y)] = i1;
    hullHash[this._hashKey(i2x, i2y)] = i2;

    this.trianglesLen = 0;
    this._addTriangle(i0, i1, i2, -1, -1, -1);

    for (let k = 0, xp, yp; k < this._ids.length; k++) {
      const i = this._ids[k];
      const x = coords[2 * i], y = coords[2 * i + 1];

      if (k > 0 && Math.abs(x - xp) <= 1e-10 && Math.abs(y - yp) <= 1e-10) continue;
      xp = x; yp = y;

      if (i === i0 || i === i1 || i === i2) continue;

      let start = 0;
      for (let j = 0, key = this._hashKey(x, y); j < this._hashSize; j++) {
        start = hullHash[(key + j) % this._hashSize];
        if (start !== -1 && start !== hullNext[start]) break;
      }

      start = hullPrev[start];
      let e = start, q;
      while (q = hullNext[e], orient2d(x, y, coords[2 * e], coords[2 * e + 1], coords[2 * q], coords[2 * q + 1]) >= 0) {
        e = q;
        if (e === start) { e = -1; break; }
      }
      if (e === -1) continue;

      let t = this._addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);
      hullTri[i] = this._legalize(t + 2);
      hullTri[e] = t;
      hullSize++;

      let n2 = hullNext[e];
      while (q = hullNext[n2], orient2d(x, y, coords[2 * n2], coords[2 * n2 + 1], coords[2 * q], coords[2 * q + 1]) < 0) {
        t = this._addTriangle(n2, i, q, hullTri[i], -1, hullTri[n2]);
        hullTri[i] = this._legalize(t + 2);
        hullNext[n2] = n2;
        hullSize--;
        n2 = q;
      }

      if (e === start) {
        while (q = hullPrev[e], orient2d(x, y, coords[2 * q], coords[2 * q + 1], coords[2 * e], coords[2 * e + 1]) < 0) {
          t = this._addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
          this._legalize(t + 2);
          hullTri[q] = t;
          hullNext[e] = e;
          hullSize--;
          e = q;
        }
      }

      hullStart = hullPrev[i] = e;
      hullNext[e] = hullPrev[n2] = i;
      hullNext[i] = n2;

      hullHash[this._hashKey(x, y)] = i;
      hullHash[this._hashKey(coords[2 * e], coords[2 * e + 1])] = e;
    }

    this.hull = new Uint32Array(hullSize);
    for (let i = 0, e = hullStart; i < hullSize; i++) {
      this.hull[i] = e;
      e = hullNext[e];
    }

    this.triangles = this._triangles.subarray(0, this.trianglesLen);
    this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
  },

  _hashKey(x, y) {
    return Math.floor(pseudoAngle(x - this._cx, y - this._cy) * this._hashSize) % this._hashSize;
  },

  _legalize(a) {
    const { _triangles: triangles, _halfedges: halfedges, coords } = this;
    let i = 0, ar = 0;
    while (true) {
      const b = halfedges[a];
      const a0 = a - a % 3;
      ar = a0 + (a + 2) % 3;

      if (b === -1) { if (i === 0) break; a = EDGE_STACK[--i]; continue; }

      const b0 = b - b % 3;
      const al = a0 + (a + 1) % 3;
      const bl = b0 + (b + 2) % 3;

      const p0 = triangles[ar];
      const pr = triangles[a];
      const pl = triangles[al];
      const p1 = triangles[bl];

      const illegal = inCircle(
        coords[2 * p0], coords[2 * p0 + 1],
        coords[2 * pr], coords[2 * pr + 1],
        coords[2 * pl], coords[2 * pl + 1],
        coords[2 * p1], coords[2 * p1 + 1]);

      if (illegal) {
        triangles[a] = p1;
        triangles[b] = p0;
        const hbl = halfedges[bl];
        if (hbl === -1) { if (i === 0) break; a = EDGE_STACK[--i]; continue; }
        halfedges[a] = hbl;
        halfedges[b] = halfedges[ar];
        halfedges[ar] = b;
        if (hbl !== -1) halfedges[hbl] = a;
        if (halfedges[ar] !== -1) halfedges[halfedges[ar]] = ar;
        EDGE_STACK[i++] = br = b0 + (b + 1) % 3;
        a = bl;
      } else {
        if (i === 0) break;
        a = EDGE_STACK[--i];
      }
    }
    return ar;
  },

  _addTriangle(i0, i1, i2, a, b, c) {
    const t = this.trianglesLen;
    this._triangles[t] = i0;
    this._triangles[t + 1] = i1;
    this._triangles[t + 2] = i2;
    this._link(t, a);
    this._link(t + 1, b);
    this._link(t + 2, c);
    this.trianglesLen += 3;
    return t;
  },

  _link(a, b) {
    this._halfedges[a] = b;
    if (b !== -1) this._halfedges[b] = a;
  }
};

const EDGE_STACK = new Uint32Array(512);

function pseudoAngle(dx, dy) {
  const p = dx / (Math.abs(dx) + Math.abs(dy));
  return (dy > 0 ? 3 - p : 1 + p) / 4;
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function inCircle(ax, ay, bx, by, cx, cy, px, py) {
  const dx = ax - px, dy = ay - py;
  const ex = bx - px, ey = by - py;
  const fx = cx - px, fy = cy - py;
  const ap = dx * dx + dy * dy;
  const bp = ex * ex + ey * ey;
  const cp = fx * fx + fy * fy;
  return dx * (ey * cp - bp * fy) - dy * (ex * cp - bp * fx) + ap * (ex * fy - ey * fx) < 0;
}

function circumradius(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax, dy = by - ay;
  const ex = cx - ax, ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  const x = (ey * bl - dy * cl) * d;
  const y = (dx * cl - ex * bl) * d;
  return x * x + y * y;
}

function circumcenter(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax, dy = by - ay;
  const ex = cx - ax, ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  return { x: ax + (ey * bl - dy * cl) * d, y: ay + (dx * cl - ex * bl) * d };
}

function orient2d(ax, ay, bx, by, cx, cy) {
  return (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
}

function quicksort(ids, dists, left, right) {
  if (right - left <= 20) {
    for (let i = left + 1; i <= right; i++) {
      const temp = ids[i]; const tempDist = dists[temp];
      let j = i - 1;
      while (j >= left && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
      ids[j + 1] = temp;
    }
  } else {
    const median = (left + right) >> 1;
    let i = left + 1, j = right;
    swap(ids, median, i);
    if (dists[ids[left]] > dists[ids[right]]) swap(ids, left, right);
    if (dists[ids[i]] > dists[ids[right]]) swap(ids, i, right);
    if (dists[ids[left]] > dists[ids[i]]) swap(ids, left, i);
    const temp = ids[i]; const tempDist = dists[temp];
    while (true) {
      do i++; while (dists[ids[i]] < tempDist);
      do j--; while (dists[ids[j]] > tempDist);
      if (j < i) break;
      swap(ids, i, j);
    }
    ids[left + 1] = ids[j];
    ids[j] = temp;
    if (right - i + 1 >= j - left) {
      quicksort(ids, dists, i, right);
      quicksort(ids, dists, left, j - 1);
    } else {
      quicksort(ids, dists, left, j - 1);
      quicksort(ids, dists, i, right);
    }
  }
}

function swap(arr, i, j) { const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }


// ═══════════ MAIN WORKER LOGIC ═══════════

self.onmessage = function(e) {
  const { imageData, sampleW, sampleH, particleCount, bgThreshold, lloydIterations, width, height } = e.data;
  const data = new Uint8ClampedArray(imageData);

  // Grayscale brightness map
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0; i < sampleW * sampleH; i++) {
    const idx = i * 4;
    gray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
  }

  // Elliptical vignette
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

  // Density map
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

  // Rejection sampling
  const points = [];
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

  // Lloyd relaxation with spatial grid acceleration
  const n = points.length / 2;
  const cellSize = Math.max(8, Math.sqrt((sampleW * sampleH) / n) * 1.5);
  const gridW = Math.ceil(sampleW / cellSize);
  const gridH = Math.ceil(sampleH / cellSize);

  for (let iter = 0; iter < lloydIterations; iter++) {
    if (n < 3) break;

    // Build spatial grid
    const grid = new Array(gridW * gridH);
    for (let i = 0; i < grid.length; i++) grid[i] = [];
    for (let i = 0; i < n; i++) {
      const gx = Math.min(gridW - 1, Math.floor(points[i * 2] / cellSize));
      const gy = Math.min(gridH - 1, Math.floor(points[i * 2 + 1] / cellSize));
      grid[gy * gridW + gx].push(i);
    }

    const weights = new Float64Array(n);
    const cx = new Float64Array(n);
    const cy = new Float64Array(n);

    const step = 2;
    for (let py = 0; py < sampleH; py += step) {
      for (let px = 0; px < sampleW; px += step) {
        const w = density[py * sampleW + px];
        if (w <= 0) continue;

        // Find nearest point using grid
        const gx = Math.min(gridW - 1, Math.floor(px / cellSize));
        const gy = Math.min(gridH - 1, Math.floor(py / cellSize));

        let minDist = Infinity;
        let owner = 0;

        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ngx = gx + dx, ngy = gy + dy;
            if (ngx < 0 || ngx >= gridW || ngy < 0 || ngy >= gridH) continue;
            const cell = grid[ngy * gridW + ngx];
            for (let k = 0; k < cell.length; k++) {
              const i = cell[k];
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

  // Convert to canvas coordinates
  const particles = [];
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
      x: px, y: py, ox: px, oy: py, vx: 0, vy: 0,
      size: 0.5 + darkness * 2.2,
      brightness: b,
      fade: v,
    });
  }

  // Delaunay triangulation for edges
  const edges = [];
  if (particles.length >= 3) {
    const coords = new Float64Array(particles.length * 2);
    for (let i = 0; i < particles.length; i++) {
      coords[i * 2] = particles[i].ox;
      coords[i * 2 + 1] = particles[i].oy;
    }
    const delaunay = new Delaunator(coords);
    const tris = delaunay.triangles;
    const maxLineLength = 18;
    const maxSq = maxLineLength * maxLineLength;
    const edgeSet = new Set();
    for (let i = 0; i < tris.length; i += 3) {
      const pairs = [[tris[i], tris[i+1]], [tris[i+1], tris[i+2]], [tris[i+2], tris[i]]];
      for (const [a, b] of pairs) {
        const key = a < b ? a + '-' + b : b + '-' + a;
        if (edgeSet.has(key)) continue;
        edgeSet.add(key);
        const dx = particles[a].ox - particles[b].ox;
        const dy = particles[a].oy - particles[b].oy;
        if (dx * dx + dy * dy <= maxSq) {
          edges.push([a, b]);
        }
      }
    }
  }

  self.postMessage({ particles, edges });
};
