'use client';
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * ScreenPaint — Lusion-inspired mouse-driven distortion.
 * Renders mouse trail into a texture used as displacement in post-processing.
 * Simplified version: renders a fading trail of circles into an offscreen FBO.
 */

const paintVert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const paintFrag = `
uniform sampler2D uPrevFrame;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform float uRadius;
uniform float uStrength;
uniform float uDissipation;
uniform vec2 uResolution;
uniform float uAspect;
varying vec2 vUv;

void main() {
  vec4 prev = texture2D(uPrevFrame, vUv) * uDissipation;

  vec2 mouse = uMouse;
  vec2 prevMouse = uPrevMouse;

  // Current brush
  vec2 diff = vUv - mouse;
  diff.x *= uAspect;
  float dist = length(diff);
  float brush = smoothstep(uRadius, 0.0, dist) * uStrength;

  // Velocity direction
  vec2 vel = (mouse - prevMouse) * 20.0;

  prev.xy += vel * brush;
  prev.z += brush;

  // Clamp
  prev.xy = clamp(prev.xy, -1.0, 1.0);

  gl_FragColor = prev;
}
`;

export default function ScreenPaint() {
  const { size, gl } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const prevMouseRef = useRef(new THREE.Vector2(0.5, 0.5));

  const targets = useMemo(() => {
    const opts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };
    return [
      new THREE.WebGLRenderTarget(256, 256, opts),
      new THREE.WebGLRenderTarget(256, 256, opts),
    ];
  }, []);

  const pingPong = useRef(0);

  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  const uniforms = useMemo(() => ({
    uPrevFrame: { value: null as THREE.Texture | null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uRadius: { value: 0.05 },
    uStrength: { value: 0.3 },
    uDissipation: { value: 0.965 },
    uResolution: { value: new THREE.Vector2(256, 256) },
    uAspect: { value: size.width / size.height },
  }), [size]);

  const mesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: paintVert,
      fragmentShader: paintFrag,
      uniforms,
    });
    const m = new THREE.Mesh(geo, mat);
    scene.add(m);
    return m;
  }, [scene, uniforms]);

  useFrame((state) => {
    // Update mouse
    prevMouseRef.current.copy(mouseRef.current);
    mouseRef.current.set(
      (state.pointer.x + 1) * 0.5,
      (state.pointer.y + 1) * 0.5,
    );

    uniforms.uMouse.value.copy(mouseRef.current);
    uniforms.uPrevMouse.value.copy(prevMouseRef.current);
    uniforms.uAspect.value = size.width / size.height;

    const read = targets[pingPong.current];
    const write = targets[1 - pingPong.current];
    uniforms.uPrevFrame.value = read.texture;

    // Render paint pass
    const prevTarget = gl.getRenderTarget();
    gl.setRenderTarget(write);
    gl.render(scene, camera);
    gl.setRenderTarget(prevTarget);

    pingPong.current = 1 - pingPong.current;

    // Expose texture on global for post-processing to consume
    (state as unknown as Record<string, unknown>).__screenPaintTexture = write.texture;
  });

  return null;
}

export function getScreenPaintTexture(state: Record<string, unknown>): THREE.Texture | null {
  return (state.__screenPaintTexture as THREE.Texture) || null;
}
