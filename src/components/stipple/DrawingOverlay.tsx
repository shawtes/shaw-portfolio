'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export type DrawTool = 'brush' | 'pen' | 'eraser' | 'none';

interface DrawingOverlayProps {
  tool: DrawTool;
  color: string;
  brushSize: number;
  opacity: number;
}

export interface DrawingOverlayHandle {
  canvas: HTMLCanvasElement | null;
  clear: () => void;
  undo: () => void;
}

const DrawingOverlay = forwardRef<DrawingOverlayHandle, DrawingOverlayProps>(
  function DrawingOverlay({ tool, color, brushSize, opacity }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const historyRef = useRef<ImageData[]>([]);
    const sizeRef = useRef({ w: 600, h: 600 });

    // Expose canvas + actions to parent
    useImperativeHandle(ref, () => ({
      get canvas() { return canvasRef.current; },
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        // Save before clear
        saveSnapshot();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      undo: () => {
        const canvas = canvasRef.current;
        if (!canvas || historyRef.current.length === 0) return;
        const ctx = canvas.getContext('2d')!;
        const prev = historyRef.current.pop()!;
        ctx.putImageData(prev, 0, 0);
      },
    }));

    const saveSnapshot = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(snap);
      // Keep max 30 undo steps
      if (historyRef.current.length > 30) historyRef.current.shift();
    }, []);

    // Resize to match container
    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      // Preserve existing drawing on resize
      const ctx = canvas.getContext('2d')!;
      let existing: ImageData | null = null;
      if (canvas.width > 0 && canvas.height > 0) {
        existing = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w, h };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (existing) {
        // Restore at original size (top-left aligned)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(existing, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.restore();
      }
    }, []);

    useEffect(() => {
      setupCanvas();
      const container = containerRef.current;
      if (!container) return;
      const ro = new ResizeObserver(setupCanvas);
      ro.observe(container);
      return () => ro.disconnect();
    }, [setupCanvas]);

    // Get effective brush radius based on tool
    const getRadius = useCallback(() => {
      if (tool === 'pen') return Math.max(0.5, brushSize * 0.3);
      if (tool === 'eraser') return brushSize * 1.5;
      return brushSize;
    }, [tool, brushSize]);

    // Drawing logic
    const drawAt = useCallback((x: number, y: number, fromX?: number, fromY?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const radius = getRadius();

      ctx.save();
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = opacity;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (fromX !== undefined && fromY !== undefined) {
        // Line stroke for smooth drawing
        ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
        ctx.lineWidth = radius * 2;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        // Single dot
        ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }, [tool, color, opacity, getRadius]);

    const getCanvasPos = useCallback((e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    // Pointer events
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || tool === 'none') return;

      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDrawing.current = true;
        canvas.setPointerCapture(e.pointerId);
        saveSnapshot();
        const pos = getCanvasPos(e);
        lastPos.current = pos;
        drawAt(pos.x, pos.y);
      };

      const onMove = (e: PointerEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const pos = getCanvasPos(e);
        const prev = lastPos.current;
        if (prev) {
          drawAt(pos.x, pos.y, prev.x, prev.y);
        } else {
          drawAt(pos.x, pos.y);
        }
        lastPos.current = pos;
      };

      const onUp = (e: PointerEvent) => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPos.current = null;
        canvas.releasePointerCapture(e.pointerId);
      };

      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointerleave', onUp);

      return () => {
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointerleave', onUp);
      };
    }, [tool, drawAt, getCanvasPos, saveSnapshot]);

    // Cursor style
    const getCursor = () => {
      if (tool === 'none') return 'default';
      if (tool === 'pen') return 'crosshair';
      return 'crosshair';
    };

    return (
      <div
        ref={containerRef}
        style={{
          position: 'absolute', inset: 0,
          pointerEvents: tool === 'none' ? 'none' : 'auto',
          zIndex: 5,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: getCursor(),
          }}
        />
      </div>
    );
  }
);

export default DrawingOverlay;
