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
  const s = vH / 6;
  return [
    `M 620 0`,
    `C 620 ${s * 0.4}, 80 ${s * 0.8}, 80 ${s * 1.3}`,
    `C 80 ${s * 1.7}, 420 ${s * 1.9}, 500 ${s * 2.1}`,
    `C 580 ${s * 2.3}, 940 ${s * 2.7}, 920 ${s * 3.1}`,
    `C 900 ${s * 3.5}, 480 ${s * 3.7}, 460 ${s * 3.9}`,
    `C 440 ${s * 4.1}, 60 ${s * 4.4}, 80 ${s * 4.7}`,
    `C 100 ${s * 5.0}, 520 ${s * 5.2}, 500 ${s * 5.5}`,
    `C 490 ${s * 5.7}, 460 ${s * 5.9}, 480 ${vH}`,
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
