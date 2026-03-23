'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const monitorVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const monitorFragmentShader = `
uniform float uTime;
uniform float uPullProgress;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Fisheye distortion as pull progress increases
  vec2 center = uv - 0.5;
  float dist = length(center);
  float distortion = 1.0 + uPullProgress * 0.5 * dist;
  uv = center / distortion + 0.5;

  // Gradient background (cyan to purple)
  vec3 color1 = vec3(0.133, 0.827, 0.933); // #22D3EE
  vec3 color2 = vec3(0.655, 0.545, 0.98);  // #A78BFA
  vec3 bg = mix(color1, color2, uv.y + sin(uTime * 0.5) * 0.1);

  // Scanlines
  float scanline = sin(uv.y * 300.0 + uTime * 2.0) * 0.03;
  bg += scanline;

  // Horizontal flicker
  float flicker = sin(uTime * 15.0 + uv.y * 50.0) * 0.005;
  bg += flicker;

  // Brightness ramp as camera approaches
  float brightness = 1.0 + uPullProgress * 2.5;
  bg *= brightness;

  // White-out at high pull progress
  bg = mix(bg, vec3(1.0), smoothstep(0.7, 1.0, uPullProgress));

  // Vignette
  float vignette = 1.0 - smoothstep(0.3, 0.7, dist);
  bg *= mix(0.7, 1.0, vignette);

  gl_FragColor = vec4(bg, 1.0);
}
`;

export default function MonitorScreen({ position = [0, 0, 0] as [number, number, number] }) {
  const screenRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPullProgress: { value: 0 },
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={position}>
      {/* Monitor Frame */}
      <mesh>
        <boxGeometry args={[0.82, 0.52, 0.03]} />
        <meshStandardMaterial color="#111" flatShading />
      </mesh>
      {/* Monitor Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.016]}>
        <planeGeometry args={[0.76, 0.46]} />
        <shaderMaterial
          vertexShader={monitorVertexShader}
          fragmentShader={monitorFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {/* Monitor Stand */}
      <mesh position={[0, -0.34, 0.05]}>
        <boxGeometry args={[0.05, 0.2, 0.05]} />
        <meshStandardMaterial color="#111" flatShading />
      </mesh>
      {/* Monitor Base */}
      <mesh position={[0, -0.44, 0.05]}>
        <boxGeometry args={[0.25, 0.02, 0.12]} />
        <meshStandardMaterial color="#111" flatShading />
      </mesh>
    </group>
  );
}
