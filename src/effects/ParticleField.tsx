'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const particleVert = `
uniform float uTime;
uniform float uSize;
attribute float aRandom;
varying float vAlpha;

void main() {
  vec3 pos = position;
  pos.x += sin(uTime * 0.3 + aRandom * 10.0) * 0.15;
  pos.y += cos(uTime * 0.2 + aRandom * 8.0) * 0.1;
  pos.z += sin(uTime * 0.4 + aRandom * 6.0) * 0.1;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * (30.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);
  gl_Position = projectionMatrix * mvPosition;

  vAlpha = 0.15 + aRandom * 0.25;
}
`;

const particleFrag = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.15, d) * vAlpha;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export default function ParticleField({ count = 60, zone = 'default', radius = 20 }: {
  count?: number; zone?: string; radius?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius;
      rnd[i] = Math.random();
    }
    return { positions: pos, randoms: rnd };
  }, [count, radius]);

  const color = zone === 'intro' ? '#22D3EE' : zone === 'tunnel' ? '#A78BFA' : '#22D3EE';

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: 1.0 },
    uColor: { value: new THREE.Color(color) },
  }), [zone, color]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVert}
        fragmentShader={particleFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
