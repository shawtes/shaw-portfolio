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
  // y positions for clean half-circle arcs
  // Start below hero buttons (~95% of first viewport)
  const y0 = s * 1.15;
  return [
    // Enter from left wall, below "View work" buttons
    `M -20 ${y0}`,

    // Half-circle arc #1 — sweeps right (open right semi-oval)
    `C -20 ${y0 + s * 1.6}, 1020 ${y0 + s * 1.6}, 1020 ${y0 + s * 3.2}`,

    // Half-circle arc #2 — sweeps back left (open left semi-oval, goes off-screen left)
    `C 1020 ${y0 + s * 4.6}, -80 ${y0 + s * 4.6}, -80 ${y0 + s * 5.8}`,

    // Half-circle arc #3 — sweeps right again (bigger arc)
    `C -80 ${y0 + s * 7.0}, 1060 ${y0 + s * 7.0}, 1060 ${y0 + s * 8.0}`,

    // Half-circle arc #4 — sweeps left, exits off left edge
    `C 1060 ${y0 + s * 9.0}, -40 ${y0 + s * 9.0}, -40 ${y0 + s * 9.8}`,

    // Final gentle arc trailing off bottom
    `C -40 ${y0 + s * 10.4}, 500 ${y0 + s * 10.4}, 500 ${vH}`,
  ].join(' ');
}

// Speed up at the turnaround points of each arc
const LOOP_ZONES: [number, number][] = [
  [0.15, 0.22],   // Arc #1 turnaround (right side)
  [0.35, 0.42],   // Arc #2 turnaround (left side)
  [0.55, 0.62],   // Arc #3 turnaround (right side)
  [0.75, 0.82],   // Arc #4 turnaround (left side)
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
