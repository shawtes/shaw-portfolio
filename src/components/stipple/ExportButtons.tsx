'use client';

import { Download } from 'lucide-react';
import type { StippleParticle } from './useStippleEngine';
import type { DrawingOverlayHandle } from './DrawingOverlay';

interface ExportButtonsProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  drawingCanvasRef?: React.RefObject<DrawingOverlayHandle | null>;
  particles: StippleParticle[];
  edges: [number, number][];
  renderMode: 'dots' | 'mesh' | 'both';
  colorScheme: 'dark' | 'light';
  disabled: boolean;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportButtons({
  canvasRef, drawingCanvasRef, particles, edges, renderMode, colorScheme, disabled,
}: ExportButtonsProps) {
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    const ctx = temp.getContext('2d')!;

    // Background
    const isDark = colorScheme === 'dark';
    if (isDark) {
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, temp.width, temp.height);
    }

    // Stipple layer
    ctx.drawImage(canvas, 0, 0);

    // Drawing overlay layer
    const drawCanvas = drawingCanvasRef?.current?.canvas;
    if (drawCanvas && drawCanvas.width > 0) {
      ctx.drawImage(drawCanvas, 0, 0);
    }

    temp.toBlob((blob) => {
      if (blob) triggerDownload(blob, 'stipple.png');
    }, 'image/png');
  };

  const exportSVG = () => {
    if (particles.length === 0) return;

    const canvas = canvasRef.current;
    const w = canvas ? canvas.clientWidth : 800;
    const h = canvas ? canvas.clientHeight : 800;

    const isDark = colorScheme === 'dark';
    const bgColor = isDark ? '#050507' : '#ffffff';
    const dotColor = (brightness: number) => {
      const dark = 1 - brightness;
      if (isDark) {
        const c = Math.round(240 - dark * 160);
        return `rgb(${c},${c},${c})`;
      } else {
        const c = Math.round(10 + (1 - dark) * 80);
        return `rgb(${c},${c},${c})`;
      }
    };

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n`;
    svg += `<rect width="100%" height="100%" fill="${bgColor}"/>\n`;

    // Mesh lines
    if (renderMode === 'mesh' || renderMode === 'both') {
      svg += '<g opacity="0.3">\n';
      for (const [a, b] of edges) {
        const pa = particles[a], pb = particles[b];
        if (!pa || !pb) continue;
        const lineColor = isDark ? 'rgb(180,180,190)' : 'rgb(80,80,90)';
        svg += `<line x1="${(pa.ox * w).toFixed(1)}" y1="${(pa.oy * h).toFixed(1)}" x2="${(pb.ox * w).toFixed(1)}" y2="${(pb.oy * h).toFixed(1)}" stroke="${lineColor}" stroke-width="0.4"/>\n`;
      }
      svg += '</g>\n';
    }

    // Dots
    if (renderMode === 'dots' || renderMode === 'both') {
      for (const p of particles) {
        const dark = 1 - p.brightness;
        const alpha = (0.25 + dark * 0.7).toFixed(2);
        svg += `<circle cx="${(p.ox * w).toFixed(1)}" cy="${(p.oy * h).toFixed(1)}" r="${p.size.toFixed(1)}" fill="${dotColor(p.brightness)}" opacity="${alpha}"/>\n`;
      }
    }

    // Drawing overlay as embedded raster image
    const drawCanvas = drawingCanvasRef?.current?.canvas;
    if (drawCanvas && drawCanvas.width > 0) {
      const dataURL = drawCanvas.toDataURL('image/png');
      svg += `<image href="${dataURL}" width="${w}" height="${h}"/>\n`;
    }

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    triggerDownload(blob, 'stipple.svg');
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '8px 14px', color: '#ccc',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12,
    fontFamily: 'inherit', opacity: disabled ? 0.4 : 1, flex: 1,
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={btnStyle} onClick={exportPNG} disabled={disabled}>
        <Download size={13} /> PNG
      </button>
      <button style={btnStyle} onClick={exportSVG} disabled={disabled}>
        <Download size={13} /> SVG
      </button>
    </div>
  );
}
