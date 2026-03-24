'use client';

import { useRef, useState, useCallback } from 'react';
import Delaunator from 'delaunator';

export interface StippleParticle {
  x: number; y: number;
  ox: number; oy: number;
  vx: number; vy: number;
  size: number;
  brightness: number;
  edge: number;
}

export interface StippleConfig {
  particleCount: number;
  lloydIterations: number;
  whiteCutoff: number;
  densityPower: number;
  useCLAHE: boolean;
  useEdgeDetection: boolean;
  minDotSize: number;
  maxDotSize: number;
  maxLineLength: number;
}

interface StippleEngineResult {
  particles: StippleParticle[];
  edges: [number, number][];
  progress: number;
  iteration: number;
  total: number;
  status: 'idle' | 'computing' | 'ready';
  generate: (imageData: ImageData, sampleW: number, sampleH: number) => void;
}

export function useStippleEngine(config: StippleConfig): StippleEngineResult {
  const [particles, setParticles] = useState<StippleParticle[]>([]);
  const [edges, setEdges] = useState<[number, number][]>([]);
  const [progress, setProgress] = useState(0);
  const [iteration, setIteration] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'computing' | 'ready'>('idle');
  const workerRef = useRef<Worker | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const generate = useCallback((imageData: ImageData, sampleW: number, sampleH: number) => {
    // Kill any running worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setStatus('computing');
    setProgress(0);
    setIteration(0);
    setTotal(configRef.current.lloydIterations);

    const worker = new Worker('/workers/stipple-worker.js');
    workerRef.current = worker;

    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (msg.type === 'progress') {
        setProgress(msg.iteration / msg.total);
        setIteration(msg.iteration);
        setTotal(msg.total);
      } else if (msg.type === 'result') {
        const { xs, ys, brightnesses, sizes, edgeVals, count } = msg;
        const cfg = configRef.current;

        // Build particles with normalized coords (will be scaled by canvas)
        const newParticles: StippleParticle[] = [];
        for (let i = 0; i < count; i++) {
          newParticles.push({
            x: xs[i], y: ys[i],
            ox: xs[i], oy: ys[i],
            vx: 0, vy: 0,
            size: sizes[i],
            brightness: brightnesses[i],
            edge: edgeVals[i],
          });
        }

        // Delaunay triangulation on main thread
        const newEdges: [number, number][] = [];
        if (count >= 3) {
          const coords = new Float64Array(count * 2);
          for (let i = 0; i < count; i++) {
            coords[i * 2] = xs[i];
            coords[i * 2 + 1] = ys[i];
          }
          const delaunay = new Delaunator(coords);
          const tris = delaunay.triangles;
          const maxSq = Math.pow(cfg.maxLineLength / 1000, 2); // normalized coords
          const seen = new Set<string>();
          for (let i = 0; i < tris.length; i += 3) {
            const pairs: [number, number][] = [
              [tris[i], tris[i + 1]],
              [tris[i + 1], tris[i + 2]],
              [tris[i + 2], tris[i]],
            ];
            for (const [a, b] of pairs) {
              const key = a < b ? `${a}-${b}` : `${b}-${a}`;
              if (seen.has(key)) continue;
              seen.add(key);
              const dx = newParticles[a].ox - newParticles[b].ox;
              const dy = newParticles[a].oy - newParticles[b].oy;
              if (dx * dx + dy * dy <= maxSq) newEdges.push([a, b]);
            }
          }
        }

        setParticles(newParticles);
        setEdges(newEdges);
        setProgress(1);
        setStatus('ready');
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = () => {
      setStatus('idle');
      worker.terminate();
      workerRef.current = null;
    };

    const buffer = imageData.data.buffer.slice(0);
    worker.postMessage({
      imageData: buffer,
      sampleW,
      sampleH,
      canvasW: 0,
      canvasH: 0,
      config: {
        particleCount: configRef.current.particleCount,
        lloydIterations: configRef.current.lloydIterations,
        whiteCutoff: configRef.current.whiteCutoff,
        densityPower: configRef.current.densityPower,
        useCLAHE: configRef.current.useCLAHE,
        useEdgeDetection: configRef.current.useEdgeDetection,
        minDotSize: configRef.current.minDotSize,
        maxDotSize: configRef.current.maxDotSize,
      },
    }, [buffer]);
  }, []);

  return { particles, edges, progress, iteration, total, status, generate };
}
