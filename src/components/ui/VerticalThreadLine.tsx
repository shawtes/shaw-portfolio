'use client';

/**
 * VerticalThreadLine — neon ribbon that draws as you scroll.
 *
 * Lusion-style buttery smooth: uses requestAnimationFrame with
 * a gentle lerp (~0.035) so the line glides continuously rather
 * than jumping with scroll event bursts. The line is always
 * catching up to where you've scrolled, creating that liquid feel.
 */

import { useRef, useEffect, useState } from 'react';

const LERP = 0.0284;

function buildPath(vH: number): string {
  if (vH < 100) return '';
  const h = vH;

  return [
    // Enter from left wall, below hero buttons
    `M -20 ${h * 0.11}`,

    // Gentle drift rightward — the brush finds its rhythm
    `C 80 ${h * 0.12}, 300 ${h * 0.15}, 420 ${h * 0.18}`,

    // Flowing arc toward center-right
    `C 560 ${h * 0.21}, 680 ${h * 0.26}, 700 ${h * 0.30}`,

    // Whimsical loop #1 — a painter's flourish
    `C 720 ${h * 0.33}, 760 ${h * 0.31}, 740 ${h * 0.29}`,
    `C 710 ${h * 0.27}, 650 ${h * 0.28}, 660 ${h * 0.31}`,
    `C 670 ${h * 0.34}, 730 ${h * 0.36}, 750 ${h * 0.35}`,

    // Drift rightward, easing off the edge
    `C 800 ${h * 0.34}, 900 ${h * 0.37}, 960 ${h * 0.40}`,

    // Soft return — wide sweeping arc back toward center
    `C 1020 ${h * 0.43}, 900 ${h * 0.47}, 700 ${h * 0.49}`,

    // Long lazy drift left across the page
    `C 500 ${h * 0.51}, 300 ${h * 0.53}, 180 ${h * 0.56}`,

    // Whimsical loop #2 — spiral flourish near left side
    `C 100 ${h * 0.58}, 60 ${h * 0.56}, 80 ${h * 0.54}`,
    `C 100 ${h * 0.52}, 160 ${h * 0.53}, 150 ${h * 0.56}`,
    `C 140 ${h * 0.59}, 80 ${h * 0.60}, 60 ${h * 0.62}`,

    // Ease off left edge
    `C 20 ${h * 0.64}, -30 ${h * 0.66}, -20 ${h * 0.68}`,

    // Gentle return into the composition
    `C 0 ${h * 0.70}, 150 ${h * 0.71}, 350 ${h * 0.73}`,

    // Wide graceful arc across the full page
    `C 500 ${h * 0.75}, 700 ${h * 0.77}, 800 ${h * 0.79}`,

    // Whimsical loop #3 — elegant cursive loop
    `C 860 ${h * 0.80}, 880 ${h * 0.78}, 850 ${h * 0.77}`,
    `C 810 ${h * 0.76}, 780 ${h * 0.78}, 800 ${h * 0.80}`,
    `C 820 ${h * 0.82}, 870 ${h * 0.83}, 900 ${h * 0.82}`,

    // Ease off right edge
    `C 960 ${h * 0.81}, 1040 ${h * 0.83}, 1030 ${h * 0.86}`,

    // Final drift — the brush relaxes, trailing to center
    `C 1010 ${h * 0.89}, 800 ${h * 0.91}, 600 ${h * 0.93}`,
    `C 400 ${h * 0.95}, 300 ${h * 0.97}, 350 ${h * 0.99}`,

    // Trail off
    `L 380 ${h}`,
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

  // Buttery smooth animation loop.
  // Runs every frame. Lerps current toward target at 0.035 rate.
  // This creates the liquid, always-moving feel — the line never
  // snaps or stutters, it's always gently gliding.
  useEffect(() => {
    const loop = () => {
      rafIdRef.current = requestAnimationFrame(loop);
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) < 0.00005) {
        currentRef.current = targetRef.current;
      } else {
        currentRef.current += diff * LERP;
      }
      const len = lenRef.current;
      if (len) {
        const offset = len * (1 - currentRef.current);
        if (pathRef.current) pathRef.current.style.strokeDashoffset = `${offset}`;
        if (glowRef.current) glowRef.current.style.strokeDashoffset = `${offset}`;
      }
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, []);

  // Scroll position → target (raw, no smoothing here — the RAF loop handles that)
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
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}
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
