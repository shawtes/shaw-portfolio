'use client';

/**
 * VerticalThreadLine — neon ribbon that draws as you scroll.
 * Starts from the left wall near the hero buttons.
 * Loops off-screen and returns with variable-speed drawing.
 */

import { useRef, useEffect, useState } from 'react';

const BASE_LERP = 0.088;

function buildPath(vH: number): string {
  if (vH < 100) return '';
  const s = vH / 12;
  return [
    // Start from left wall, below hero (~85% down first viewport)
    `M -20 ${s * 0.85}`,

    // Gentle curve entering from left, sweeping right
    `Q 60 ${s * 0.9}, 150 ${s * 1.1}`,
    `C 280 ${s * 1.3}, 500 ${s * 1.2}, 600 ${s * 1.5}`,

    // Smooth sweep further right
    `C 700 ${s * 1.8}, 800 ${s * 2.0}, 750 ${s * 2.3}`,

    // Loop #1 — off right edge, smooth circle back
    `C 700 ${s * 2.5}, 1080 ${s * 2.4}, 1100 ${s * 2.7}`,
    `C 1120 ${s * 3.0}, 1040 ${s * 3.2}, 920 ${s * 3.1}`,
    `C 800 ${s * 3.0}, 780 ${s * 3.3}, 700 ${s * 3.4}`,

    // Drift left with lazy S-curve
    `C 600 ${s * 3.6}, 350 ${s * 3.7}, 200 ${s * 4.0}`,
    `C 100 ${s * 4.2}, 60 ${s * 4.4}, 40 ${s * 4.6}`,

    // Loop #2 — off left edge, smooth return
    `C 20 ${s * 4.8}, -80 ${s * 4.7}, -100 ${s * 5.0}`,
    `C -120 ${s * 5.3}, -60 ${s * 5.5}, 40 ${s * 5.4}`,
    `C 140 ${s * 5.3}, 180 ${s * 5.5}, 220 ${s * 5.7}`,

    // Sweep right across mid-page
    `C 300 ${s * 5.9}, 550 ${s * 6.0}, 680 ${s * 6.3}`,

    // Loop #3 — tight mid-page curl
    `C 750 ${s * 6.5}, 780 ${s * 6.3}, 740 ${s * 6.1}`,
    `C 700 ${s * 5.9}, 640 ${s * 6.1}, 660 ${s * 6.4}`,
    `C 680 ${s * 6.7}, 750 ${s * 6.8}, 800 ${s * 7.0}`,

    // Sweep right and off edge
    `C 860 ${s * 7.2}, 950 ${s * 7.3}, 1000 ${s * 7.5}`,

    // Loop #4 — off right edge, big lazy arc back
    `C 1060 ${s * 7.7}, 1120 ${s * 7.9}, 1100 ${s * 8.2}`,
    `C 1080 ${s * 8.5}, 980 ${s * 8.6}, 850 ${s * 8.7}`,

    // Final meander left
    `C 700 ${s * 8.9}, 400 ${s * 9.1}, 250 ${s * 9.4}`,
    `C 150 ${s * 9.6}, 80 ${s * 9.8}, 60 ${s * 10.0}`,

    // Trail off bottom-left
    `C 40 ${s * 10.3}, 100 ${s * 10.8}, 200 ${s * 11.2}`,
    `Q 300 ${s * 11.6}, 400 ${vH}`,
  ].join(' ');
}

// Define which progress ranges are "loop" zones where the line speeds up
// Each loop zone gets faster lerp
const LOOP_ZONES: [number, number][] = [
  [0.18, 0.28],   // Loop #1
  [0.38, 0.48],   // Loop #2
  [0.52, 0.60],   // Loop #3
  [0.64, 0.74],   // Loop #4
];

function getLerpForProgress(progress: number): number {
  for (const [start, end] of LOOP_ZONES) {
    if (progress >= start && progress <= end) {
      // Ramp up in the loop zone — 2.5x faster at the peak
      const mid = (start + end) / 2;
      const dist = 1 - Math.abs(progress - mid) / ((end - start) / 2);
      return BASE_LERP + dist * BASE_LERP * 1.5;
    }
  }
  return BASE_LERP;
}

interface Props {
  color?: string;
  opacity?: number;
  strokeWidth?: number;
}

export default function VerticalThreadLine({
  color = '#c1ff00',
  opacity = 0.4,
  strokeWidth = 3,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lenRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);

  const [size, setSize] = useState({ w: 0, h: 0 });

  // Measure parent
  useEffect(() => {
    const parent = wrapRef.current?.parentElement;
    if (!parent) return;
    const measure = () => setSize({ w: parent.offsetWidth, h: parent.scrollHeight });
    measure();
    const timer = setTimeout(measure, 500);
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  // Measure path length
  useEffect(() => {
    if (!size.h) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const path = pathRef.current;
        if (!path) return;
        const len = path.getTotalLength();
        if (!len) return;
        lenRef.current = len;
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        if (glowRef.current) {
          glowRef.current.style.strokeDasharray = `${len}`;
          glowRef.current.style.strokeDashoffset = `${len}`;
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [size]);

  // Continuous lerp loop — variable speed based on position
  useEffect(() => {
    const loop = () => {
      rafIdRef.current = requestAnimationFrame(loop);
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) < 0.0001) {
        currentRef.current = targetRef.current;
      } else {
        const lerp = getLerpForProgress(currentRef.current);
        currentRef.current += diff * lerp;
      }
      const len = lenRef.current;
      if (len) {
        const offset = `${len * (1 - currentRef.current)}`;
        if (pathRef.current) pathRef.current.style.strokeDashoffset = offset;
        if (glowRef.current) glowRef.current.style.strokeDashoffset = offset;
      }
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, []);

  // Scroll → target progress
  useEffect(() => {
    const update = () => {
      const parent = wrapRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalH = parent.scrollHeight;
      const scrolled = -rect.top;
      const scrollable = totalH - vh;
      if (scrollable <= 0) return;
      const raw = scrolled / scrollable;
      targetRef.current = Math.min(1, Math.max(0, raw));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    const timer = setTimeout(update, 1000);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(timer);
    };
  }, []);

  if (!size.h) return <div ref={wrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;

  const pathD = buildPath(size.h);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    >
      <svg
        viewBox={`0 0 1000 ${size.h}`}
        preserveAspectRatio="none"
        width="100%"
        height={size.h}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Glow layer */}
        <path
          ref={glowRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 5}
          opacity={opacity * 0.15}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Core neon line */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
