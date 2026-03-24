'use client';

/**
 * VerticalThreadLine — neon ribbon that draws as you scroll.
 * Starts from the left wall near the hero buttons.
 * Loops off-screen and returns with variable-speed drawing.
 */

import { useRef, useEffect, useState } from 'react';

const LERP = 0.06;

function buildPath(vH: number): string {
  if (vH < 100) return '';
  // The line flows gently through the page like a lazy river.
  // Wide, graceful curves — never sharp, never zig-zaggy.
  // Each arc spans a huge vertical distance so it feels spacious.
  const h = vH;
  return [
    // Enter from left wall, well below the hero buttons
    `M -30 ${h * 0.12}`,

    // Long gentle arc drifting to the right — very wide radius
    `C 200 ${h * 0.14}, 700 ${h * 0.20}, 820 ${h * 0.30}`,

    // Ease off right edge
    `C 900 ${h * 0.37}, 1050 ${h * 0.40}, 1040 ${h * 0.44}`,

    // Wide gentle return to center-left
    `C 1020 ${h * 0.50}, 400 ${h * 0.52}, 200 ${h * 0.56}`,

    // Drift further left, just barely off-screen
    `C 60 ${h * 0.59}, -40 ${h * 0.62}, -30 ${h * 0.66}`,

    // Gentle arc back right across the page
    `C -10 ${h * 0.70}, 500 ${h * 0.73}, 780 ${h * 0.78}`,

    // Ease off right side again
    `C 950 ${h * 0.81}, 1060 ${h * 0.84}, 1040 ${h * 0.87}`,

    // Final gentle drift back to center, trailing off
    `C 1000 ${h * 0.90}, 600 ${h * 0.93}, 400 ${h * 0.96}`,
    `C 300 ${h * 0.98}, 250 ${h * 0.99}, 250 ${h}`,
  ].join(' ');
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
        currentRef.current += diff * LERP;
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
