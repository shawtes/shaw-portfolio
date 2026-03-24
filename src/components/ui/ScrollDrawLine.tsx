'use client';

/**
 * ScrollDrawLine — organic SVG path that draws/erases as you scroll.
 * stroke-dashoffset driven by scroll position with ease-out cubic.
 */

import { useRef, useEffect, useMemo } from 'react';

function seededRand(seed: number) {
  let s = seed | 1;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashSeed(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function buildPath(seed: string): string {
  const rand = seededRand(hashSeed(seed));
  const W = 1000, H = 400;
  const sy = rand() * H * 0.5 + H * 0.25;
  const ey = rand() * H * 0.5 + H * 0.25;
  const cp1x = W * (0.18 + rand() * 0.14), cp1y = rand() * H;
  const cp2x = W * (0.38 + rand() * 0.10), cp2y = rand() * H;
  const mid = rand() * H * 0.4 + H * 0.3;
  const cp3x = W * (0.52 + rand() * 0.14), cp3y = rand() * H;
  const cp4x = W * (0.72 + rand() * 0.14), cp4y = rand() * H;
  return (
    `M 0 ${sy} ` +
    `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${W * 0.5} ${mid} ` +
    `C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${W} ${ey}`
  );
}

interface Props {
  seed?: string;
  color?: string;
  opacity?: number;
  height?: string | number;
  style?: React.CSSProperties;
}

export default function ScrollDrawLine({
  seed = 'default',
  color = '#c1ff00',
  opacity = 0.35,
  height = 120,
  style,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const lenRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const pathD = useMemo(() => buildPath(seed), [seed]);

  useEffect(() => {
    const measure = () => {
      const path = pathRef.current;
      if (!path) return;
      const len = path.getTotalLength();
      if (len === 0) { requestAnimationFrame(measure); return; }
      lenRef.current = len;
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      update();
    };
    requestAnimationFrame(measure);
  }, [pathD]);

  const update = () => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    if (!wrap || !path || lenRef.current === 0) return;
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const raw = (vh - rect.top) / (vh * 0.75);
    const progress = Math.min(1, Math.max(0, raw));
    const eased = 1 - Math.pow(1 - progress, 2.5);
    path.style.strokeDashoffset = `${lenRef.current * (1 - eased)}`;
  };

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        update();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={wrapRef}>
      <svg
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        style={{
          display: 'block',
          width: '100%',
          height,
          overflow: 'visible',
          pointerEvents: 'none',
          ...style,
        }}
      >
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={opacity}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
