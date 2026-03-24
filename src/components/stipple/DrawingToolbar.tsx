'use client';

import { Paintbrush, PenTool, Eraser, Undo2, Trash2, MousePointer } from 'lucide-react';
import type { DrawTool } from './DrawingOverlay';

interface DrawingToolbarProps {
  tool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

const PRESETS = [
  { color: '#ffffff', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#888888', label: 'Gray' },
  { color: '#c1ff00', label: 'Accent' },
  { color: '#ff4444', label: 'Red' },
  { color: '#4488ff', label: 'Blue' },
];

const TOOLS: { id: DrawTool; icon: typeof Paintbrush; label: string }[] = [
  { id: 'none', icon: MousePointer, label: 'Select' },
  { id: 'brush', icon: Paintbrush, label: 'Brush' },
  { id: 'pen', icon: PenTool, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export default function DrawingToolbar({
  tool, onToolChange, color, onColorChange,
  brushSize, onBrushSizeChange, opacity, onOpacityChange,
  onUndo, onClear,
}: DrawingToolbarProps) {
  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, display: 'flex', alignItems: 'center', gap: 6,
      flexWrap: 'wrap', justifyContent: 'center',
      maxWidth: 'calc(100vw - 24px)',
      background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
      padding: '6px 10px', userSelect: 'none',
    }}>
      {/* Tool buttons */}
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onToolChange(id)}
          title={label}
          style={{
            width: 32, height: 32, border: 'none', borderRadius: 6,
            background: tool === id ? 'rgba(193,255,0,0.2)' : 'transparent',
            color: tool === id ? '#c1ff00' : '#777',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Icon size={16} />
        </button>
      ))}

      {/* Separator */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

      {/* Color presets */}
      {PRESETS.map(({ color: c, label }) => (
        <button
          key={c}
          onClick={() => onColorChange(c)}
          title={label}
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: c, cursor: 'pointer',
            border: color === c ? '2px solid #c1ff00' : '2px solid rgba(255,255,255,0.15)',
            boxShadow: c === '#000000' ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : 'none',
            transition: 'border-color 0.15s',
          }}
        />
      ))}

      {/* Custom color picker */}
      <label title="Custom color" style={{ position: 'relative', cursor: 'pointer' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
          border: '2px solid rgba(255,255,255,0.15)',
        }} />
        <input
          type="color"
          value={color}
          onChange={e => onColorChange(e.target.value)}
          style={{
            position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
            width: '100%', height: '100%',
          }}
        />
      </label>

      {/* Separator */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

      {/* Brush size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: '#666', width: 28, textAlign: 'right', fontFamily: 'monospace' }}>
          {brushSize}px
        </span>
        <input
          type="range" min={1} max={50} step={1} value={brushSize}
          onChange={e => onBrushSizeChange(parseInt(e.target.value))}
          style={{ width: 70, accentColor: '#c1ff00' }}
          title="Brush Size"
        />
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

      {/* Opacity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: '#666', width: 28, textAlign: 'right', fontFamily: 'monospace' }}>
          {Math.round(opacity * 100)}%
        </span>
        <input
          type="range" min={0.05} max={1} step={0.05} value={opacity}
          onChange={e => onOpacityChange(parseFloat(e.target.value))}
          style={{ width: 50, accentColor: '#c1ff00' }}
          title="Opacity"
        />
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

      {/* Undo / Clear */}
      <button
        onClick={onUndo}
        title="Undo (last stroke)"
        style={{
          width: 32, height: 32, border: 'none', borderRadius: 6,
          background: 'transparent', color: '#777', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Undo2 size={15} />
      </button>
      <button
        onClick={onClear}
        title="Clear all drawings"
        style={{
          width: 32, height: 32, border: 'none', borderRadius: 6,
          background: 'transparent', color: '#774444', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
