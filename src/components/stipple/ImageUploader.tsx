'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageLoad: (dataURL: string, fileName: string) => void;
  currentFileName?: string;
  compact?: boolean;
}

export default function ImageUploader({ onImageLoad, currentFileName, compact }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageLoad(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (compact) {
    return (
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(193,255,0,0.08)', border: '1px solid rgba(193,255,0,0.25)',
          borderRadius: 6, padding: '8px 16px', color: '#c1ff00',
          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', width: '100%',
        }}
      >
        <Upload size={14} />
        {currentFileName || 'Upload Image'}
        <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      </button>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#c1ff00' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 12,
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        background: dragging ? 'rgba(193,255,0,0.05)' : 'transparent',
      }}
    >
      <div style={{ marginBottom: 12, opacity: 0.5 }}>
        {currentFileName ? <ImageIcon size={32} /> : <Upload size={32} />}
      </div>
      <p style={{ fontSize: 14, color: '#aaa', margin: 0 }}>
        {currentFileName || 'Drop an image here or click to upload'}
      </p>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </div>
  );
}
