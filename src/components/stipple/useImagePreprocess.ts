'use client';

import { useState, useEffect, useRef } from 'react';

export interface PreprocessParams {
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  gamma: number;        // 0.1 to 3.0
  invert: boolean;
}

interface PreprocessResult {
  preprocessedData: ImageData | null;
  previewDataURL: string | null;
  sampleW: number;
  sampleH: number;
}

export function useImagePreprocess(
  imageDataURL: string | null,
  params: PreprocessParams
): PreprocessResult {
  const [result, setResult] = useState<PreprocessResult>({
    preprocessedData: null, previewDataURL: null, sampleW: 0, sampleH: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!imageDataURL) {
      setResult({ preprocessedData: null, previewDataURL: null, sampleW: 0, sampleH: 0 });
      return;
    }

    // Debounce
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxW = 500;
        const ar = img.naturalWidth / img.naturalHeight;
        const sW = Math.min(img.naturalWidth, maxW);
        const sH = Math.round(sW / ar);

        const offscreen = document.createElement('canvas');
        offscreen.width = sW;
        offscreen.height = sH;
        const ctx = offscreen.getContext('2d')!;

        // Apply brightness and contrast via CSS filter
        const b = 1 + params.brightness / 100;
        const c = 1 + params.contrast / 100;
        ctx.filter = `brightness(${b}) contrast(${c})`;
        ctx.drawImage(img, 0, 0, sW, sH);
        ctx.filter = 'none';

        // Get pixel data for gamma + invert
        const imageData = ctx.getImageData(0, 0, sW, sH);
        const data = imageData.data;

        // Gamma correction
        if (params.gamma !== 1.0) {
          const invGamma = 1 / params.gamma;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round(Math.pow(data[i] / 255, invGamma) * 255);
            data[i + 1] = Math.round(Math.pow(data[i + 1] / 255, invGamma) * 255);
            data[i + 2] = Math.round(Math.pow(data[i + 2] / 255, invGamma) * 255);
          }
        }

        // Invert
        if (params.invert) {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const previewDataURL = offscreen.toDataURL('image/png');

        setResult({ preprocessedData: imageData, previewDataURL, sampleW: sW, sampleH: sH });
      };
      img.src = imageDataURL;
    }, 150);

    return () => clearTimeout(timerRef.current);
  }, [imageDataURL, params.brightness, params.contrast, params.gamma, params.invert]);

  return result;
}
