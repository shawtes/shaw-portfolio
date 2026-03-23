'use client';
import { useState, useEffect } from 'react';

export type PerformanceTier = 'desktop' | 'tablet' | 'mobile';

export function useMobileDetect(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('desktop');

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w <= 640) setTier('mobile');
      else if (w <= 1024) setTier('tablet');
      else setTier('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return tier;
}

export function getPerformanceSettings(tier: PerformanceTier) {
  switch (tier) {
    case 'mobile':
      return { particleCount: 80, tunnelSegments: 32, dpr: 1, enableScreenPaint: false, enableBloom: false };
    case 'tablet':
      return { particleCount: 200, tunnelSegments: 64, dpr: Math.min(window.devicePixelRatio, 1.5), enableScreenPaint: false, enableBloom: true };
    default:
      return { particleCount: 500, tunnelSegments: 128, dpr: Math.min(window.devicePixelRatio, 2), enableScreenPaint: true, enableBloom: true };
  }
}
