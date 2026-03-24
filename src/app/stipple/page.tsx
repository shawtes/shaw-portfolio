'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import ControlsSidebar from '@/components/stipple/ControlsSidebar';
import StippleCanvas from '@/components/stipple/StippleCanvas';
import ProgressBar from '@/components/stipple/ProgressBar';
import ImageUploader from '@/components/stipple/ImageUploader';
import DrawingOverlay, { type DrawTool, type DrawingOverlayHandle } from '@/components/stipple/DrawingOverlay';
import DrawingToolbar from '@/components/stipple/DrawingToolbar';
import { useStippleEngine } from '@/components/stipple/useStippleEngine';
import { useImagePreprocess } from '@/components/stipple/useImagePreprocess';

export default function StipplePage() {
  // Image state
  const [imageDataURL, setImageDataURL] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  // Preprocessing
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [gamma, setGamma] = useState(1.0);
  const [invert, setInvert] = useState(false);
  const [useCLAHE, setUseCLAHE] = useState(true);

  // Stipple params
  const [dotCount, setDotCount] = useState(4000);
  const [lloydIterations, setLloydIterations] = useState(40);
  const [minDotSize, setMinDotSize] = useState(0.6);
  const [maxDotSize, setMaxDotSize] = useState(3.5);
  const [whiteCutoff, setWhiteCutoff] = useState(0.03);

  // Rendering
  const [renderMode, setRenderMode] = useState<'dots' | 'mesh' | 'both'>('both');
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');
  const [mouseInteraction, setMouseInteraction] = useState(true);

  // Drawing state
  const [drawTool, setDrawTool] = useState<DrawTool>('none');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<DrawingOverlayHandle>(null);

  // Preprocessing hook
  const preprocessParams = useMemo(() => ({ brightness, contrast, gamma, invert }), [brightness, contrast, gamma, invert]);
  const { preprocessedData, previewDataURL, sampleW, sampleH } = useImagePreprocess(imageDataURL, preprocessParams);

  // Stipple engine hook
  const stippleConfig = useMemo(() => ({
    particleCount: dotCount,
    lloydIterations,
    whiteCutoff,
    densityPower: 1.5,
    useCLAHE,
    useEdgeDetection: true,
    minDotSize,
    maxDotSize,
    maxLineLength: 18,
  }), [dotCount, lloydIterations, whiteCutoff, useCLAHE, minDotSize, maxDotSize]);

  const { particles, edges, progress, iteration, total, status, generate } = useStippleEngine(stippleConfig);

  // Disable mouse interaction on stipple when drawing
  const effectiveMouseInteraction = mouseInteraction && drawTool === 'none';

  // Handlers
  const onImageLoad = useCallback((dataURL: string, name: string) => {
    setImageDataURL(dataURL);
    setFileName(name);
  }, []);

  const onPreprocessChange = useCallback((key: string, value: number | boolean) => {
    switch (key) {
      case 'brightness': setBrightness(value as number); break;
      case 'contrast': setContrast(value as number); break;
      case 'gamma': setGamma(value as number); break;
      case 'invert': setInvert(value as boolean); break;
      case 'useCLAHE': setUseCLAHE(value as boolean); break;
    }
  }, []);

  const onStippleChange = useCallback((key: string, value: number) => {
    switch (key) {
      case 'dotCount': setDotCount(value); break;
      case 'lloydIterations': setLloydIterations(value); break;
      case 'minDotSize': setMinDotSize(value); break;
      case 'maxDotSize': setMaxDotSize(value); break;
      case 'whiteCutoff': setWhiteCutoff(value); break;
    }
  }, []);

  const onRenderChange = useCallback((key: string, value: string | boolean) => {
    switch (key) {
      case 'renderMode': setRenderMode(value as 'dots' | 'mesh' | 'both'); break;
      case 'colorScheme': setColorScheme(value as 'dark' | 'light'); break;
      case 'mouseInteraction': setMouseInteraction(value as boolean); break;
    }
  }, []);

  const onGenerate = useCallback(() => {
    if (preprocessedData && sampleW > 0 && sampleH > 0) {
      generate(preprocessedData, sampleW, sampleH);
    }
  }, [preprocessedData, sampleW, sampleH, generate]);

  const handleUndo = useCallback(() => drawingRef.current?.undo(), []);
  const handleClearDrawing = useCallback(() => drawingRef.current?.clear(), []);

  const hasCanvas = particles.length > 0 || status === 'computing';

  return (
    <div style={{
      display: 'flex', height: '100vh', background: '#050507',
      color: '#f0f1fa', fontFamily: '"Inter Tight", system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <ControlsSidebar
        onImageLoad={onImageLoad}
        fileName={fileName}
        brightness={brightness}
        contrast={contrast}
        gamma={gamma}
        invert={invert}
        useCLAHE={useCLAHE}
        onPreprocessChange={onPreprocessChange}
        previewDataURL={previewDataURL}
        dotCount={dotCount}
        lloydIterations={lloydIterations}
        minDotSize={minDotSize}
        maxDotSize={maxDotSize}
        whiteCutoff={whiteCutoff}
        onStippleChange={onStippleChange}
        onGenerate={onGenerate}
        renderMode={renderMode}
        colorScheme={colorScheme}
        mouseInteraction={mouseInteraction}
        onRenderChange={onRenderChange}
        canvasRef={canvasRef}
        drawingCanvasRef={drawingRef}
        particles={particles}
        edges={edges}
        status={status}
        progress={progress}
      />

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressBar
          progress={progress}
          iteration={iteration}
          total={total}
          visible={status === 'computing'}
        />

        {/* Drawing toolbar — always visible when stipple is rendered */}
        {hasCanvas && (
          <DrawingToolbar
            tool={drawTool}
            onToolChange={setDrawTool}
            color={drawColor}
            onColorChange={setDrawColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            opacity={drawOpacity}
            onOpacityChange={setDrawOpacity}
            onUndo={handleUndo}
            onClear={handleClearDrawing}
          />
        )}

        {!hasCanvas ? (
          /* Empty state — show large uploader */
          <div style={{ maxWidth: 400, width: '100%', padding: 40 }}>
            {!imageDataURL ? (
              <ImageUploader onImageLoad={onImageLoad} />
            ) : (
              <div style={{ textAlign: 'center', color: '#555', fontSize: 14 }}>
                <p>Image loaded. Adjust preprocessing, then click <strong style={{ color: '#c1ff00' }}>Generate</strong>.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <StippleCanvas
              particles={particles}
              edges={edges}
              renderMode={renderMode}
              colorScheme={colorScheme}
              mouseInteraction={effectiveMouseInteraction}
              canvasRef={canvasRef}
            />
            {/* Drawing overlay sits on top */}
            <DrawingOverlay
              ref={drawingRef}
              tool={drawTool}
              color={drawColor}
              brushSize={brushSize}
              opacity={drawOpacity}
            />
          </div>
        )}
      </div>
    </div>
  );
}
