'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/*
  GLASS BREAK TRANSITION

  Sits on top of the portfolio page. Starts as a solid frosted glass pane.
  After a brief moment, cracks appear, then shards fly outward revealing
  the portfolio content behind.

  The character "breaks through" — shards explode from the center outward.
  Shards have rainbow edges (from tesseract), gravity, rotation, opacity decay.
*/

interface Shard {
  verts: [number, number][];
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  angle: number;
  rotSpeed: number;
  scale: number;
  opacity: number;
  hue: number;
  delay: number; // staggered start
}

function generateShards(w: number, h: number): Shard[] {
  const shards: Shard[] = [];
  const centerX = w / 2;
  const centerY = h / 2;

  // Create a grid of shards — more density in center (impact point)
  for (let i = 0; i < 60; i++) {
    // Distribute across the screen with more near center
    const angle = Math.random() * Math.PI * 2;
    const maxR = Math.sqrt(w * w + h * h) / 2;
    const r = Math.pow(Math.random(), 0.7) * maxR; // bias toward center
    const sx = centerX + Math.cos(angle) * r;
    const sy = centerY + Math.sin(angle) * r;

    // Triangle shard
    const numVerts = 3 + Math.floor(Math.random() * 2);
    const verts: [number, number][] = [];
    const baseAngle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 50;

    for (let j = 0; j < numVerts; j++) {
      const a = baseAngle + (j / numVerts) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const rv = radius * (0.5 + Math.random() * 0.5);
      verts.push([Math.cos(a) * rv, Math.sin(a) * rv]);
    }

    // Direction: away from center (impact point)
    const dx = sx - centerX;
    const dy = sy - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Speed: faster near center (impact), slower at edges
    const speed = 4 + (1 - r / maxR) * 12;

    // Delay: center shards go first, edges later (crack propagation)
    const delay = (r / maxR) * 8; // 0-8 frames delay

    shards.push({
      verts,
      cx: sx,
      cy: sy,
      vx: (dx / dist) * speed + (Math.random() - 0.5) * 3,
      vy: (dy / dist) * speed + (Math.random() - 0.5) * 3 - 2,
      angle: 0,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      opacity: 1,
      hue: Math.random(),
      delay,
    });
  }

  return shards;
}

export default function GlassBreak({
  trigger,
  onComplete,
}: {
  trigger: boolean;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!trigger || startedRef.current) return;
    startedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const shards = generateShards(w, h);
    let frame = 0;

    // Phase 1: Show frosted glass with crack lines (frames 0-15)
    // Phase 2: Shards fly (frames 15+)

    let rafId: number;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      if (frame <= 12) {
        // PHASE 1: Frosted glass with growing cracks
        const crackProgress = frame / 12;

        // Frosted glass fill
        ctx.fillStyle = `rgba(8, 12, 20, ${0.85 - crackProgress * 0.3})`;
        ctx.fillRect(0, 0, w, h);

        // Draw crack lines from center
        ctx.strokeStyle = `rgba(180, 200, 255, ${0.5 * crackProgress})`;
        ctx.lineWidth = 1;
        const cx = w / 2, cy = h / 2;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 + Math.random() * 0.1;
          const len = crackProgress * (100 + Math.random() * 200);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          // Jagged crack line
          let px = cx, py = cy;
          for (let s = 0; s < 5; s++) {
            px += Math.cos(a + (Math.random() - 0.5) * 0.5) * len / 5;
            py += Math.sin(a + (Math.random() - 0.5) * 0.5) * len / 5;
            ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        rafId = requestAnimationFrame(animate);
        return;
      }

      // PHASE 2: Shards flying
      const shatterFrame = frame - 12;
      let allDone = true;

      for (const shard of shards) {
        // Stagger start
        const localFrame = shatterFrame - shard.delay;
        if (localFrame < 0) {
          // Still waiting — draw as static piece
          allDone = false;
          ctx.save();
          ctx.translate(shard.cx, shard.cy);
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(shard.verts[0][0], shard.verts[0][1]);
          for (let i = 1; i < shard.verts.length; i++) ctx.lineTo(shard.verts[i][0], shard.verts[i][1]);
          ctx.closePath();
          ctx.fillStyle = 'rgba(8, 12, 20, 0.7)';
          ctx.fill();
          ctx.strokeStyle = `rgba(150, 170, 220, 0.3)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
          continue;
        }

        if (shard.opacity <= 0.01) continue;
        allDone = false;

        // Physics
        shard.cx += shard.vx;
        shard.cy += shard.vy;
        shard.vy += 0.2; // gravity
        shard.vx *= 0.98;
        shard.angle += shard.rotSpeed;
        shard.scale += 0.008;
        shard.opacity -= 0.02;

        // Draw
        ctx.save();
        ctx.translate(shard.cx, shard.cy);
        ctx.rotate(shard.angle);
        ctx.scale(shard.scale, shard.scale);
        ctx.globalAlpha = Math.max(0, shard.opacity);

        ctx.beginPath();
        ctx.moveTo(shard.verts[0][0], shard.verts[0][1]);
        for (let i = 1; i < shard.verts.length; i++) ctx.lineTo(shard.verts[i][0], shard.verts[i][1]);
        ctx.closePath();

        // Glass fill
        ctx.fillStyle = `rgba(8, 12, 20, ${0.5 * shard.opacity})`;
        ctx.fill();

        // Rainbow edge (tesseract colors)
        const hue = Math.floor(shard.hue * 360);
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${shard.opacity * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Specular glint
        ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * shard.opacity})`;
        ctx.fill();

        ctx.restore();
      }

      if (allDone || shatterFrame > 90) {
        cancelAnimationFrame(rafId);
        onComplete();
        return;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [trigger, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  );
}
