'use client';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

interface PostProcessingProps {
  enableBloom?: boolean;
  bloomIntensity?: number;
  chromaticOffset?: number;
  vignetteDarkness?: number;
}

export default function PostProcessingPipeline({
  enableBloom = true,
  bloomIntensity = 1.2,
  chromaticOffset = 0.0015,
  vignetteDarkness = 0.5,
}: PostProcessingProps) {
  return (
    <EffectComposer>
      <Bloom
        intensity={enableBloom ? bloomIntensity : 0}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(chromaticOffset, chromaticOffset)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0.0}
      />
      <Vignette darkness={vignetteDarkness} offset={0.3} />
    </EffectComposer>
  );
}
