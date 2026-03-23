'use client';
import { useRef, useEffect, useCallback, useState } from 'react';
import { damp } from '../lib/mathUtils';

/**
 * Custom virtual scroll system inspired by Lusion's ScrollPane.
 * body overflow:hidden — all scroll is virtual with momentum and friction.
 */
export interface VirtualScrollState {
  progress: number;       // 0..1 normalized
  scrollPixel: number;    // current pixel position (damped)
  velocity: number;       // current velocity
  direction: number;      // -1, 0, or 1
}

export function useVirtualScroll(totalPages: number = 8) {
  const state = useRef<VirtualScrollState>({
    progress: 0,
    scrollPixel: 0,
    velocity: 0,
    direction: 0,
  });

  const targetPixel = useRef(0);
  const lastTime = useRef(0);
  const rafId = useRef(0);
  const viewHeight = useRef(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [, forceUpdate] = useState(0);

  const contentSize = useRef(totalPages);

  const maxScroll = () => viewHeight.current * (contentSize.current - 1);

  // Wheel handler
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    targetPixel.current = Math.max(0, Math.min(maxScroll(), targetPixel.current + delta));
    state.current.direction = delta > 0 ? 1 : delta < 0 ? -1 : 0;
  }, []);

  // Touch handlers
  const touchStart = useRef(0);
  const touchStartPixel = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
    touchStartPixel.current = targetPixel.current;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const dy = touchStart.current - e.touches[0].clientY;
    targetPixel.current = Math.max(0, Math.min(maxScroll(), touchStartPixel.current + dy * 2));
    state.current.direction = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  }, []);

  // Animation loop
  const tick = useCallback((time: number) => {
    const dt = Math.min((time - lastTime.current) / 1000, 0.1) || 0.016;
    lastTime.current = time;

    const prev = state.current.scrollPixel;

    // Lusion uses friction-based damping — we use exponential damp
    state.current.scrollPixel = damp(state.current.scrollPixel, targetPixel.current, 8, dt);
    state.current.velocity = (state.current.scrollPixel - prev) / dt;

    const max = maxScroll();
    state.current.progress = max > 0 ? state.current.scrollPixel / max : 0;

    // Trigger re-render at ~60fps for subscribers
    forceUpdate(n => n + 1);
    rafId.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      viewHeight.current = window.innerHeight;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('resize', handleResize);

    lastTime.current = performance.now();
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId.current);
    };
  }, [onWheel, onTouchStart, onTouchMove, tick]);

  return state;
}
