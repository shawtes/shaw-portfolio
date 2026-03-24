'use client';

/**
 * VerticalThreadLine — neon ribbon that draws as you scroll.
 * Uses getBoundingClientRect for reliable scroll tracking.
 * Lerp-based smooth animation.
 */

import { useRef, useEffect, useState } from 'react';

const LERP = 0.08;

function buildPath(vH: number): string {
  if (vH < 100) return '';
  const s = vH / 10;
  return [
    // Start top-right, sweep left
    `M 620 0`,
    `C 620 ${s * 0.3}, 120 ${s * 0.6}, 80 ${s * 1.0}`,

    // Loop #1 — spirals off the left edge and comes back
    `C 30 ${s * 1.2}, -60 ${s * 1.1}, -40 ${s * 1.4}`,
    `C -20 ${s * 1.7}, 50 ${s * 1.9}, 120 ${s * 1.8}`,
    `C 200 ${s * 1.7}, 160 ${s * 2.0}, 140 ${s * 2.2}`,

    // Sweep right across the page
    `C 120 ${s * 2.4}, 500 ${s * 2.5}, 580 ${s * 2.8}`,

    // Loop #2 — goes off right edge, circles back
    `C 660 ${s * 3.0}, 1080 ${s * 2.9}, 1060 ${s * 3.2}`,
    `C 1040 ${s * 3.5}, 960 ${s * 3.3}, 900 ${s * 3.5}`,
    `C 840 ${s * 3.7}, 920 ${s * 3.9}, 860 ${s * 4.0}`,

    // Drift back left with a gentle S-curve
    `C 800 ${s * 4.1}, 400 ${s * 4.3}, 300 ${s * 4.5}`,

    // Loop #3 — tight curl mid-page
    `C 200 ${s * 4.7}, 140 ${s * 4.6}, 180 ${s * 4.4}`,
    `C 220 ${s * 4.2}, 320 ${s * 4.3}, 340 ${s * 4.6}`,
    `C 360 ${s * 4.9}, 200 ${s * 5.1}, 160 ${s * 5.3}`,

    // Sweep right again
    `C 120 ${s * 5.5}, 500 ${s * 5.6}, 600 ${s * 5.9}`,

    // Loop #4 — dips off right edge, lazy return
    `C 700 ${s * 6.2}, 1100 ${s * 6.1}, 1060 ${s * 6.5}`,
    `C 1020 ${s * 6.9}, 800 ${s * 7.0}, 700 ${s * 7.2}`,

    // Meander left
    `C 600 ${s * 7.4}, 200 ${s * 7.6}, 120 ${s * 7.9}`,

    // Final sweep to center-right
    `C 40 ${s * 8.2}, 400 ${s * 8.5}, 500 ${s * 8.8}`,
    `C 560 ${s * 9.0}, 520 ${s * 9.4}, 480 ${vH}`,
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
    // Re-measure after fonts/content loads
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

  // Continuous lerp loop — updates both core + glow paths
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

  // Scroll → target progress using getBoundingClientRect (reliable)
  useEffect(() => {
    const update = () => {
      const parent = wrapRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalH = parent.scrollHeight;
      // How far the top of the container has scrolled past the viewport top
      const scrolled = -rect.top;
      const scrollable = totalH - vh;
      if (scrollable <= 0) return;
      const raw = scrolled / scrollable;
      targetRef.current = Math.min(1, Math.max(0, raw));
    };
    window.addEventListener('scroll', update, { passive: true });
    // Also update on resize
    window.addEventListener('resize', update, { passive: true });
    // Initial
    update();
    // Update after a delay too (content may shift)
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
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    >
      <svg
        viewBox={`0 0 1000 ${size.h}`}
        preserveAspectRatio="none"
        width="100%"
        height={size.h}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Glow layer — wider, more transparent, no filter for perf */}
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
