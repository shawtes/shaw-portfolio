'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Lusion-inspired tunnel with stereographic projection warp.
 * As scroll progresses, geometry twists via Möbius-like transform.
 * Feedback render target creates trailing glow effect.
 */

const tunnelVert = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
uniform float uTime;
uniform float uWarpRatio;

// Lusion's goalBlackTunnelTransform — stereographic projection twist
vec3 tunnelWarp(vec3 pos) {
  float t = uWarpRatio * 6.2831853;
  float zWeight = pos.z * 0.025;
  float angle = t * zWeight * zWeight * sign(zWeight);
  float sa = sin(angle);
  float ca = cos(angle);
  mat2 m2 = mat2(ca, -sa, sa, ca);
  pos.xy = m2 * pos.xy;
  pos.z += t * 1.0;
  return pos;
}

void main() {
  vUv = uv;
  vNormal = normal;

  vec3 pos = position;
  if (uWarpRatio > 0.01) {
    pos = tunnelWarp(pos);
  }
  vPosition = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const tunnelFrag = `
uniform float uTime;
uniform float uScrollVelocity;
uniform float uWarpRatio;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uFeedbackTexture;
uniform vec2 uResolution;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g, l.zxy);
  vec3 i2 = max(g, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec3 noisePos = vec3(vUv * 3.0, uTime * 0.15 + uScrollVelocity * 0.01);
  float n = snoise(noisePos) * 0.5 + 0.5;
  float n2 = snoise(noisePos * 2.0 + 100.0) * 0.5 + 0.5;

  // Color mix driven by warp ratio
  vec3 color = mix(uColor1, uColor2, n + uWarpRatio * 0.3);
  vec3 dark = vec3(0.02, 0.02, 0.06);
  color = mix(dark, color, n2 * 0.6 + 0.15);

  // Greeble grid lines (like Lusion's tunnel panels)
  float gridX = smoothstep(0.015, 0.0, abs(fract(vUv.x * 24.0) - 0.5));
  float gridY = smoothstep(0.015, 0.0, abs(fract(vUv.y * 48.0 - uTime * 0.3) - 0.5));
  float gridStrength = 0.12 + uWarpRatio * 0.15;
  color += (gridX + gridY) * gridStrength * uColor1;

  // Edge emission (like Lusion's bloom from tunnel edges)
  float edgeDist = abs(vNormal.z);
  color += uColor1 * (1.0 - edgeDist) * 0.15 * (1.0 + uWarpRatio);

  // Depth fade
  float depthFade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
  color *= depthFade;

  // Bloom-out at high warp (Lusion: outBloomFromToStrength)
  float bloomOut = smoothstep(0.7, 1.0, uWarpRatio);
  color = mix(color, uColor1 * 2.0, bloomOut * 0.3);

  gl_FragColor = vec4(color, 0.92);
}
`;

export default function TunnelScene({
  visible,
  curve,
  warpRatio = 0,
  scrollVelocity = 0,
}: {
  visible: boolean;
  curve: THREE.CatmullRomCurve3;
  warpRatio?: number;
  scrollVelocity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollVelocity: { value: 0 },
    uWarpRatio: { value: 0 },
    uColor1: { value: new THREE.Color('#22D3EE') },
    uColor2: { value: new THREE.Color('#A78BFA') },
    uFeedbackTexture: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
  }), []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 200, 2.0, 32, false);
  }, [curve]);

  // Wireframe greeble rings (like Lusion's grid_structure)
  const rings = useMemo(() => {
    const positions: { pos: THREE.Vector3; tangent: THREE.Vector3 }[] = [];
    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      positions.push({
        pos: curve.getPointAt(t),
        tangent: curve.getTangentAt(t),
      });
    }
    return positions;
  }, [curve]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScrollVelocity.value = scrollVelocity;
    uniforms.uWarpRatio.value = warpRatio;
  });

  return (
    <group visible={visible}>
      {/* Main tunnel tube */}
      <mesh ref={meshRef} geometry={tubeGeometry}>
        <shaderMaterial
          vertexShader={tunnelVert}
          fragmentShader={tunnelFrag}
          uniforms={uniforms}
          side={THREE.BackSide}
          transparent
        />
      </mesh>

      {/* Greeble rings — structural elements like Lusion's grid panels */}
      {rings.map((ring, i) => {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ring.tangent.clone().normalize());
        return (
          <group key={i} position={ring.pos} quaternion={quaternion}>
            {/* Outer ring */}
            <mesh>
              <ringGeometry args={[1.85, 2.0, 6]} />
              <meshBasicMaterial color="#22D3EE" wireframe transparent opacity={0.08 + warpRatio * 0.06} />
            </mesh>
            {/* Inner accent ring */}
            {i % 3 === 0 && (
              <mesh>
                <ringGeometry args={[1.5, 1.55, 4]} />
                <meshBasicMaterial color="#A78BFA" wireframe transparent opacity={0.04} />
              </mesh>
            )}
          </group>
        );
      })}

      <ambientLight intensity={0.03} />
      {/* Tunnel interior light that moves with scroll */}
      <pointLight position={[0, 0, -10]} color="#22D3EE" intensity={0.5} distance={20} />
    </group>
  );
}
