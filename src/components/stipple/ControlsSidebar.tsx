'use client';

import { useCallback } from 'react';
import { Play, Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import PreprocessPreview from './PreprocessPreview';
import ExportButtons from './ExportButtons';
import type { StippleParticle } from './useStippleEngine';
import type { DrawingOverlayHandle } from './DrawingOverlay';

interface ControlsSidebarProps {
  // Image
  onImageLoad: (dataURL: string, fileName: string) => void;
  fileName: string;
  // Preprocessing
  brightness: number;
  contrast: number;
  gamma: number;
  invert: boolean;
  useCLAHE: boolean;
  onPreprocessChange: (key: string, value: number | boolean) => void;
  previewDataURL: string | null;
  // Stipple
  dotCount: number;
  lloydIterations: number;
  minDotSize: number;
  maxDotSize: number;
  whiteCutoff: number;
  onStippleChange: (key: string, value: number) => void;
  onGenerate: () => void;
  // Rendering
  renderMode: 'dots' | 'mesh' | 'both';
  colorScheme: 'dark' | 'light';
  mouseInteraction: boolean;
  onRenderChange: (key: string, value: string | boolean) => void;
  // Export
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  drawingCanvasRef?: React.RefObject<DrawingOverlayHandle | null>;
  particles: StippleParticle[];
  edges: [number, number][];
  // Status
  status: 'idle' | 'computing' | 'ready';
  progress: number; // 0-1
}

function Slider({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{value}{unit || ''}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#c1ff00' }}
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 12, color: '#888', marginBottom: 8, cursor: 'pointer',
    }}>
      {label}
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: value ? '#c1ff00' : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: value ? '#050507' : '#666',
          position: 'absolute', top: 2,
          left: value ? 18 : 2,
          transition: 'left 0.2s',
        }} />
      </div>
    </label>
  );
}

function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} style={{ marginBottom: 16 }}>
      <summary style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#666', cursor: 'pointer', paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 10,
        listStyle: 'none',
      }}>
        {title}
      </summary>
      {children}
    </details>
  );
}

export default function ControlsSidebar(props: ControlsSidebarProps) {
  const {
    onImageLoad, fileName,
    brightness, contrast, gamma, invert, useCLAHE, onPreprocessChange, previewDataURL,
    dotCount, lloydIterations, minDotSize, maxDotSize, whiteCutoff, onStippleChange, onGenerate,
    renderMode, colorScheme, mouseInteraction, onRenderChange,
    canvasRef, drawingCanvasRef, particles, edges, status, progress,
  } = props;

  const handlePreprocess = useCallback((key: string) => (v: number | boolean) => {
    onPreprocessChange(key, v);
  }, [onPreprocessChange]);

  const handleStipple = useCallback((key: string) => (v: number) => {
    onStippleChange(key, v);
  }, [onStippleChange]);

  return (
    <div style={{
      width: 300, padding: '20px 16px', overflowY: 'auto',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <h1 style={{ fontSize: 16, fontWeight: 600, color: '#f0f1fa', marginBottom: 4, marginTop: 0 }}>
        Stipple Generator
      </h1>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 16, marginTop: 0 }}>
        Upload an image and generate a stipple portrait
      </p>

      <Section title="Image">
        <ImageUploader onImageLoad={onImageLoad} currentFileName={fileName} compact={!!fileName} />
      </Section>

      <Section title="Preprocessing">
        <Slider label="Brightness" value={brightness} min={-100} max={100} step={1} onChange={handlePreprocess('brightness')} />
        <Slider label="Contrast" value={contrast} min={-100} max={100} step={1} onChange={handlePreprocess('contrast')} />
        <Slider label="Gamma" value={gamma} min={0.1} max={3.0} step={0.05} onChange={handlePreprocess('gamma')} />
        <Toggle label="Invert" value={invert} onChange={handlePreprocess('invert') as (v: boolean) => void} />
        <Toggle label="CLAHE (auto-contrast)" value={useCLAHE} onChange={handlePreprocess('useCLAHE') as (v: boolean) => void} />
        <PreprocessPreview dataURL={previewDataURL} />
      </Section>

      <Section title="Stipple">
        <Slider label="Dot Count" value={dotCount} min={500} max={20000} step={100} onChange={handleStipple('dotCount')} />
        <Slider label="Lloyd Iterations" value={lloydIterations} min={1} max={100} step={1} onChange={handleStipple('lloydIterations')} />
        <Slider label="Min Dot Size" value={minDotSize} min={0.3} max={3} step={0.1} onChange={handleStipple('minDotSize')} unit="px" />
        <Slider label="Max Dot Size" value={maxDotSize} min={1} max={8} step={0.1} onChange={handleStipple('maxDotSize')} unit="px" />
        <Slider label="White Cutoff" value={whiteCutoff} min={0} max={0.5} step={0.01} onChange={handleStipple('whiteCutoff')} />
        <div style={{ position: 'relative', width: '100%' }}>
          <button
            onClick={onGenerate}
            disabled={status === 'computing' || !previewDataURL}
            style={{
              width: '100%', padding: '10px 0',
              background: status === 'computing' ? 'rgba(193,255,0,0.12)' : '#c1ff00',
              color: status === 'computing' ? '#c1ff00' : '#050507',
              border: status === 'computing' ? '1px solid rgba(193,255,0,0.3)' : '1px solid transparent',
              borderRadius: 6,
              fontWeight: 600, fontSize: 13,
              cursor: status === 'computing' ? 'wait' : !previewDataURL ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              position: 'relative', overflow: 'hidden', zIndex: 1,
            }}
          >
            {status === 'computing' ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Play size={14} />
            )}
            {status === 'computing' ? `Generating ${Math.round(progress * 100)}%` : 'Generate'}
          </button>
          {/* Progress fill bar behind button */}
          {status === 'computing' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${progress * 100}%`,
              background: 'rgba(193,255,0,0.15)',
              borderRadius: 6,
              transition: 'width 0.2s ease-out',
              zIndex: 0,
            }} />
          )}
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </Section>

      <Section title="Rendering">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Mode</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['dots', 'mesh', 'both'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onRenderChange('renderMode', mode)}
                style={{
                  flex: 1, padding: '6px 0', fontSize: 11,
                  background: renderMode === mode ? 'rgba(193,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: renderMode === mode ? '#c1ff00' : '#888',
                  border: `1px solid ${renderMode === mode ? 'rgba(193,255,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Color Scheme</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['dark', 'light'] as const).map(scheme => (
              <button
                key={scheme}
                onClick={() => onRenderChange('colorScheme', scheme)}
                style={{
                  flex: 1, padding: '6px 0', fontSize: 11,
                  background: colorScheme === scheme ? 'rgba(193,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: colorScheme === scheme ? '#c1ff00' : '#888',
                  border: `1px solid ${colorScheme === scheme ? 'rgba(193,255,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {scheme}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Mouse Interaction" value={mouseInteraction} onChange={v => onRenderChange('mouseInteraction', v)} />
      </Section>

      <Section title="Export">
        <ExportButtons
          canvasRef={canvasRef}
          drawingCanvasRef={drawingCanvasRef}
          particles={particles}
          edges={edges}
          renderMode={renderMode}
          colorScheme={colorScheme}
          disabled={status !== 'ready'}
        />
      </Section>
    </div>
  );
}
