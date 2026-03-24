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
  const vigCx = sampleW * 0.43, vigCy = sampleH * 0.42;
  const vigRx = sampleW * 0.42, vigRy = sampleH * 0.55;
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

  // === CLAHE (adaptive histogram equalization) ===
  var tileSize = 32;
  var tilesX = Math.ceil(sampleW / tileSize), tilesY = Math.ceil(sampleH / tileSize);
  var nBins = 256, clipLim = 4.0;
  var tileCDFs = [];
  for (var ty = 0; ty < tilesY; ty++) {
    for (var tx = 0; tx < tilesX; tx++) {
      var hist = new Float32Array(nBins), cnt2 = 0;
      var x0 = tx*tileSize, y0 = ty*tileSize;
      var x1 = Math.min(x0+tileSize, sampleW), y1 = Math.min(y0+tileSize, sampleH);
      for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) {
        hist[Math.min(nBins-1, Math.floor(gray[yy*sampleW+xx]*(nBins-1)))]++; cnt2++;
      }
      var clipCnt = clipLim * cnt2 / nBins, excess2 = 0;
      for (var ii = 0; ii < nBins; ii++) { if (hist[ii] > clipCnt) { excess2 += hist[ii]-clipCnt; hist[ii]=clipCnt; } }
      for (var ii = 0; ii < nBins; ii++) hist[ii] += excess2/nBins;
      var cdf = new Float32Array(nBins); cdf[0] = hist[0];
      for (var ii = 1; ii < nBins; ii++) cdf[ii] = cdf[ii-1]+hist[ii];
      var cMin = cdf[0], cMax = cdf[nBins-1];
      if (cMax > cMin) for (var ii = 0; ii < nBins; ii++) cdf[ii] = (cdf[ii]-cMin)/(cMax-cMin);
      tileCDFs.push(cdf);
    }
  }
  var clahe = new Float32Array(sampleW * sampleH);
  for (var yc = 0; yc < sampleH; yc++) {
    for (var xc = 0; xc < sampleW; xc++) {
      var bin = Math.min(nBins-1, Math.floor(gray[yc*sampleW+xc]*(nBins-1)));
      var tcx2 = (xc/tileSize)-0.5, tcy2 = (yc/tileSize)-0.5;
      var tx0 = Math.max(0,Math.floor(tcx2)), ty0 = Math.max(0,Math.floor(tcy2));
      var tx1b = Math.min(tilesX-1, tx0+1), ty1b = Math.min(tilesY-1, ty0+1);
      var fx = Math.max(0,Math.min(1,tcx2-tx0)), fy = Math.max(0,Math.min(1,tcy2-ty0));
      clahe[yc*sampleW+xc] = (1-fx)*(1-fy)*tileCDFs[ty0*tilesX+tx0][bin] + fx*(1-fy)*tileCDFs[ty0*tilesX+tx1b][bin]
        + (1-fx)*fy*tileCDFs[ty1b*tilesX+tx0][bin] + fx*fy*tileCDFs[ty1b*tilesX+tx1b][bin];
    }
  }

  // === Box blur helper ===
  function boxBlur2(src, w, h, rad) {
    var tmp = new Float32Array(w*h), out = new Float32Array(w*h);
    for (var y2=0;y2<h;y2++){var s=0,c=0;for(var x2=0;x2<Math.min(rad,w);x2++){s+=src[y2*w+x2];c++;}
    for(var x2=0;x2<w;x2++){if(x2+rad<w){s+=src[y2*w+x2+rad];c++;}if(x2-rad>0){s-=src[y2*w+x2-rad-1];c--;}tmp[y2*w+x2]=s/c;}}
    for(var x2=0;x2<w;x2++){var s=0,c=0;for(var y2=0;y2<Math.min(rad,h);y2++){s+=tmp[y2*w+x2];c++;}
    for(var y2=0;y2<h;y2++){if(y2+rad<h){s+=tmp[(y2+rad)*w+x2];c++;}if(y2-rad>0){s-=tmp[(y2-rad-1)*w+x2];c--;}out[y2*w+x2]=s/c;}}
    return out;
  }
  function sobelFn(src, w, h) {
    var out = new Float32Array(w*h);
    for(var y2=1;y2<h-1;y2++)for(var x2=1;x2<w-1;x2++){
      var tl=src[(y2-1)*w+(x2-1)],t=src[(y2-1)*w+x2],tr=src[(y2-1)*w+(x2+1)];
      var l=src[y2*w+(x2-1)],r=src[y2*w+(x2+1)];
      var bl=src[(y2+1)*w+(x2-1)],b=src[(y2+1)*w+x2],br=src[(y2+1)*w+(x2+1)];
      out[y2*w+x2]=Math.sqrt((-tl-2*l-bl+tr+2*r+br)**2+(-tl-2*t-tr+bl+2*b+br)**2);
    } return out;
  }
  function laplacianFn(src, w, h) {
    var out = new Float32Array(w*h);
    for(var y2=1;y2<h-1;y2++)for(var x2=1;x2<w-1;x2++){
      var c2=src[y2*w+x2];
      out[y2*w+x2]=Math.abs(-8*c2+src[(y2-1)*w+x2]+src[(y2+1)*w+x2]+src[y2*w+(x2-1)]+src[y2*w+(x2+1)]
        +src[(y2-1)*w+(x2-1)]+src[(y2-1)*w+(x2+1)]+src[(y2+1)*w+(x2-1)]+src[(y2+1)*w+(x2+1)]);
    } return out;
  }

  // Multi-scale Sobel + LoG on CLAHE
  var ub = boxBlur2(clahe, sampleW, sampleH, 6);
  var enh = new Float32Array(sampleW*sampleH);
  for(var i=0;i<clahe.length;i++) enh[i]=Math.max(0,Math.min(1,clahe[i]+10*(clahe[i]-ub[i])));
  var e1 = sobelFn(enh, sampleW, sampleH);
  var b2s = boxBlur2(clahe,sampleW,sampleH,2), bm=boxBlur2(b2s,sampleW,sampleH,4);
  var enh2=new Float32Array(sampleW*sampleH);
  for(var i=0;i<clahe.length;i++) enh2[i]=Math.max(0,Math.min(1,b2s[i]+8*(b2s[i]-bm[i])));
  var e2 = sobelFn(enh2, sampleW, sampleH);
  var b3s = boxBlur2(clahe,sampleW,sampleH,4), bc=boxBlur2(b3s,sampleW,sampleH,8);
  var enh3=new Float32Array(sampleW*sampleH);
  for(var i=0;i<clahe.length;i++) enh3[i]=Math.max(0,Math.min(1,b3s[i]+6*(b3s[i]-bc[i])));
  var e3 = sobelFn(enh3, sampleW, sampleH);
  var logB = boxBlur2(clahe,sampleW,sampleH,2);
  var eLaG = laplacianFn(logB, sampleW, sampleH);

  var edgeMap = new Float32Array(sampleW*sampleH);
  for(var i=0;i<edgeMap.length;i++) edgeMap[i]=Math.max(e1[i],e2[i]*1.2,e3[i]*1.4)+eLaG[i]*0.5;

  // Eye region boost
  for(var y2=0;y2<sampleH;y2++)for(var x2=0;x2<sampleW;x2++){
    var nx2=x2/sampleW, ny2=y2/sampleH;
    if((nx2>0.35&&nx2<0.52&&ny2>0.26&&ny2<0.38)||(nx2>0.50&&nx2<0.65&&ny2>0.24&&ny2<0.36))
      edgeMap[y2*sampleW+x2]*=2.5;
  }

  var maxEM = 0;
  for(var i=0;i<edgeMap.length;i++) if(edgeMap[i]>maxEM) maxEM=edgeMap[i];
  if(maxEM>0) for(var i=0;i<edgeMap.length;i++) edgeMap[i]/=maxEM;
  for(var i=0;i<edgeMap.length;i++) edgeMap[i]=Math.pow(edgeMap[i],0.45);
  for(var i=0;i<edgeMap.length;i++){if(edgeMap[i]<0.12)edgeMap[i]=0;else edgeMap[i]=(edgeMap[i]-0.12)/0.88;}

  // Build result with edge values + 3x3 neighborhood sampling
  var totalCount = n;
  // Eyeball injection
  var eyeSpots = [
    {cx:0.41,cy:0.31,rx:0.025,ry:0.015,count:35},
    {cx:0.58,cy:0.30,rx:0.028,ry:0.016,count:45},
  ];
  var extraCount = 0;
  for(var es=0;es<eyeSpots.length;es++) extraCount += eyeSpots[es].count;

  var xs = new Float64Array(totalCount + extraCount);
  var ys = new Float64Array(totalCount + extraCount);
  var brightnesses = new Float32Array(totalCount + extraCount);
  var fades = new Float32Array(totalCount + extraCount);
  var edgeVals = new Float32Array(totalCount + extraCount);

  for (var i = 0; i < n; i++) {
    var sx2 = points[i * 2], sy2 = points[i * 2 + 1];
    xs[i] = (sx2 / sampleW) * width;
    ys[i] = (sy2 / sampleH) * height;
    var ix = Math.floor(sx2), iy = Math.floor(sy2);
    var idx2 = iy * sampleW + ix;
    brightnesses[i] = gray[idx2] || 0.5;
    fades[i] = vignette[idx2] || 0;
    // 3x3 max edge
    var me = 0;
    for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){
      var nx3=Math.max(0,Math.min(sampleW-1,ix+dx)), ny3=Math.max(0,Math.min(sampleH-1,iy+dy));
      var ev=edgeMap[ny3*sampleW+nx3]; if(ev>me)me=ev;
    }
    edgeVals[i] = me;
  }

  // Add eyeball particles
  var ei = n;
  for(var es=0;es<eyeSpots.length;es++){
    var eye = eyeSpots[es];
    var ecx2=eye.cx*sampleW, ecy2=eye.cy*sampleH;
    var erx=eye.rx*sampleW, ery=eye.ry*sampleH;
    for(var j=0;j<eye.count;j++){
      var angle=Math.random()*Math.PI*2, r2=Math.sqrt(Math.random());
      var esx=ecx2+Math.cos(angle)*r2*erx, esy=ecy2+Math.sin(angle)*r2*ery;
      if(esx<1||esx>=sampleW-1||esy<1||esy>=sampleH-1)continue;
      xs[ei]=(esx/sampleW)*width; ys[ei]=(esy/sampleH)*height;
      brightnesses[ei]=0.05; fades[ei]=1.0; edgeVals[ei]=0.6+r2*0.4;
      ei++;
    }
  }
  var finalCount = ei;

  self.postMessage({ xs, ys, brightnesses, fades, edgeVals, count: finalCount },
    [xs.buffer, ys.buffer, brightnesses.buffer, fades.buffer, edgeVals.buffer]);
};
