'use client';
import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import SoldierModel from '../objects/SoldierModel';
import AwakeningGeometry from './3d/AwakeningGeometry';

/* 4D geometry removed — replaced by AwakeningGeometry (Doctor Strange fractal shift) */

/* ═══════════ SHAW CHARACTER ═══════════ */
function Shaw({ progress, landed }: { progress: number; landed: boolean }) {
  const group = useRef<THREE.Group>(null);
  const limbPhase = useRef(0);

  const action = useMemo(() => {
    if (landed) return 'Idle' as const;
    if (progress < 0.18) return 'Idle' as const;
    if (progress < 0.32) return 'Idle' as const;
    if (progress < 0.85) return 'TPose' as const; // falling — arms out
    return 'Idle' as const;
  }, [progress < 0.18, progress < 0.32, progress < 0.85, landed]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const p = progress;

    if (landed) {
      group.current.position.set(0, 0, 0);
      group.current.rotation.set(0, 0, 0);
      group.current.scale.setScalar(1);
      return;
    }

    if (p < 0.18) {
      // Standing in front of desk, facing monitor (-Z direction)
      // Standing, facing the monitor screen
      group.current.position.set(0, 0, 0.6);
      group.current.position.y += Math.sin(t * 1.2) * 0.003;
      group.current.rotation.set(0, 0, 0);
      group.current.scale.setScalar(0.9);
    } else if (p < 0.32) {
      // Getting pulled from standing position toward monitor
      const pull = (p - 0.18) / 0.14;
      const ease = pull * pull * pull;
      group.current.position.set(0, ease * 0.5, 0.6 - ease * 1.2);
      group.current.rotation.set(-ease * 0.8, 0, 0);
      group.current.scale.setScalar(0.9 * (1 - ease * 0.5));
    } else if (p < 0.85) {
      // INSIDE COMPUTER: Shaw travels into -Z
      const insideT = (p - 0.32) / 0.53;

      const startZ = 1;
      const endZ = -12;
      const shawZ = startZ + (endZ - startZ) * insideT;

      const scaleStart = 0.35;
      const scaleEnd = 0.08;
      const shawScale = scaleStart + (scaleEnd - scaleStart) * insideT;

      group.current.position.set(0, -0.3, shawZ);
      group.current.scale.setScalar(shawScale);

      // Face into -Z, slight tumble
      limbPhase.current += delta * 1.5;
      const tumbleDecay = 1 - insideT * 0.7;
      group.current.rotation.x = -Math.PI * 0.3 + Math.sin(limbPhase.current * 0.6) * 0.15 * tumbleDecay;
      group.current.rotation.y = 0;
      group.current.rotation.z = Math.cos(limbPhase.current * 0.5) * 0.1 * tumbleDecay;
    } else {
      // Emergence
      const emerge = (p - 0.85) / 0.15;
      group.current.position.set(0, -0.3, -12);
      group.current.rotation.set(0, 0, 0);
      group.current.scale.setScalar(0.08 * (1 - emerge));
    }
  });

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <SoldierModel action={action} rotation={[-Math.PI / 2, 0, Math.PI + 0.15]} scale={0.01} />
      </Suspense>
    </group>
  );
}

/* ═══════════ DESK + ROOM ═══════════ */
const screenVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const screenFrag = `
uniform float uTime, uPull; varying vec2 vUv;
void main() {
  vec2 uv = vUv, c = uv - 0.5; float d = length(c);
  float a = uPull * 8.0 * d; float sa = sin(a); float ca = cos(a);
  c = mat2(ca,-sa,sa,ca) * c;
  uv = c / (1.0 + uPull * 2.0 * d) + 0.5;
  vec3 c1 = vec3(0.133,0.827,0.933), c2 = vec3(0.655,0.545,0.98);
  vec3 bg = mix(c1,c2,uv.y+sin(uTime*0.5)*0.1);
  bg += sin(uv.y*200.0+uTime*3.0)*0.02;
  bg *= 1.2 + uPull*2.0;
  bg = mix(bg, vec3(0.8), smoothstep(0.5,1.0,uPull));
  gl_FragColor = vec4(bg,1.0);
}`;

function Room({ pullProgress }: { pullProgress: number }) {
  const u = useMemo(() => ({ uTime: { value: 0 }, uPull: { value: 0 } }), []);
  useFrame((s) => { u.uTime.value = s.clock.elapsedTime; u.uPull.value = pullProgress; });

  const wallColor = '#1a1820';
  const floorColor = '#2a2018';
  const trimColor = '#0e0d12';
  const shelfColor = '#1c1712';

  return (
    <group>
      {/* ═══ FLOOR — dark wood ═══ */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color={floorColor} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Floor planks (subtle lines) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`plank${i}`} position={[-2.5 + i * 0.72, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.01, 5]} />
          <meshStandardMaterial color="#181210" roughness={1} />
        </mesh>
      ))}

      {/* ═══ WALLS ═══ */}
      {/* Back wall */}
      <mesh position={[0, 1.5, -1.2]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-3, 1.5, 1.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[3, 1.5, 1.3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 3, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color="#0d0c10" roughness={1} />
      </mesh>
      {/* Baseboard trim */}
      <mesh position={[0, 0.04, -1.18]}>
        <boxGeometry args={[6, 0.08, 0.02]} />
        <meshStandardMaterial color={trimColor} roughness={0.5} />
      </mesh>

      {/* ═══ WINDOW on left wall — ambient light source ═══ */}
      <group position={[-2.98, 1.6, 0.5]}>
        {/* Window frame */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.0, 1.3, 0.05]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Window glass — emissive blue for moonlight */}
        <mesh position={[0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.85, 1.15]} />
          <meshStandardMaterial color="#1a2a40" emissive="#1a3050" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
        {/* Window cross bar */}
        <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.85, 0.025, 0.02]} />
          <meshStandardMaterial color="#0a0a0e" />
        </mesh>
        <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.025, 1.15, 0.02]} />
          <meshStandardMaterial color="#0a0a0e" />
        </mesh>
      </group>
      {/* Moonlight from window */}
      <pointLight position={[-2.5, 1.6, 0.5]} color="#4477aa" intensity={1.2} distance={5} decay={2} />

      {/* ═══ DESK — dark walnut ═══ */}
      <mesh position={[0, 0.7, -0.15]}>
        <boxGeometry args={[1.6, 0.045, 0.75]} />
        <meshStandardMaterial color="#2a1f14" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Desk legs — tapered metal */}
      {[[-0.72, 0.35, -0.47], [0.72, 0.35, -0.47], [-0.72, 0.35, 0.17], [0.72, 0.35, 0.17]].map((p, i) => (
        <mesh key={`leg${i}`} position={p as [number, number, number]}>
          <boxGeometry args={[0.035, 0.7, 0.035]} />
          <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ═══ MONITOR ═══ */}
      <mesh position={[0, 1.15, -0.35]}>
        <boxGeometry args={[0.84, 0.54, 0.02]} />
        <meshStandardMaterial color="#060606" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.15, -0.335]}>
        <planeGeometry args={[0.78, 0.48]} />
        <shaderMaterial vertexShader={screenVert} fragmentShader={screenFrag} uniforms={u} />
      </mesh>
      <mesh position={[0, 1.15, -0.33]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.08} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.82, -0.33]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color="#060606" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.725, -0.33]}>
        <boxGeometry args={[0.22, 0.012, 0.12]} />
        <meshStandardMaterial color="#060606" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* ═══ KEYBOARD + MOUSE ═══ */}
      <mesh position={[0, 0.74, 0.02]}>
        <boxGeometry args={[0.38, 0.012, 0.13]} />
        <meshStandardMaterial color="#111" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Mouse */}
      <mesh position={[0.32, 0.735, 0.05]}>
        <boxGeometry args={[0.05, 0.015, 0.08]} />
        <meshStandardMaterial color="#111" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Mousepad */}
      <mesh position={[0.32, 0.723, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 0.18]} />
        <meshStandardMaterial color="#0f0f14" roughness={0.95} />
      </mesh>

      {/* ═══ DESK LAMP — right side ═══ */}
      <group position={[-0.6, 0.73, -0.1]}>
        {/* Base */}
        <mesh>
          <cylinderGeometry args={[0.06, 0.07, 0.02, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, 0.2, -0.05]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, 0.38, -0.12]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.06, 0.08, 16, 1, true]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Lamp light */}
        <pointLight position={[0, 0.35, -0.12]} color="#ffddaa" intensity={0.8} distance={2} decay={2} />
      </group>

      {/* ═══ COFFEE MUG ═══ */}
      <mesh position={[0.55, 0.78, 0.1]}>
        <cylinderGeometry args={[0.032, 0.028, 0.07, 12]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
      </mesh>
      {/* Mug handle */}
      <mesh position={[0.585, 0.78, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.02, 0.005, 8, 12, Math.PI]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
      </mesh>

      {/* ═══ BOOKSHELF — right wall ═══ */}
      <group position={[2.2, 0, -0.5]}>
        {/* Shelf frame */}
        {[0, 0.7, 1.4, 2.1].map((y, i) => (
          <mesh key={`shelf${i}`} position={[0, y, 0]}>
            <boxGeometry args={[0.7, 0.025, 0.28]} />
            <meshStandardMaterial color={shelfColor} roughness={0.7} />
          </mesh>
        ))}
        {/* Sides */}
        <mesh position={[-0.34, 1.05, 0]}>
          <boxGeometry args={[0.02, 2.1, 0.28]} />
          <meshStandardMaterial color={shelfColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.34, 1.05, 0]}>
          <boxGeometry args={[0.02, 2.1, 0.28]} />
          <meshStandardMaterial color={shelfColor} roughness={0.7} />
        </mesh>
        {/* Books — colored spines */}
        {[
          { x: -0.2, y: 0.45, h: 0.28, c: '#8b2252' },
          { x: -0.1, y: 0.43, h: 0.24, c: '#2255aa' },
          { x: 0.0, y: 0.47, h: 0.32, c: '#1a6644' },
          { x: 0.1, y: 0.44, h: 0.26, c: '#aa7722' },
          { x: 0.2, y: 0.46, h: 0.30, c: '#552288' },
          { x: -0.15, y: 1.15, h: 0.26, c: '#993333' },
          { x: -0.02, y: 1.17, h: 0.30, c: '#336699' },
          { x: 0.1, y: 1.14, h: 0.24, c: '#448844' },
          { x: 0.22, y: 1.16, h: 0.28, c: '#885522' },
          { x: -0.1, y: 1.85, h: 0.24, c: '#664488' },
          { x: 0.05, y: 1.87, h: 0.28, c: '#cc6633' },
          { x: 0.18, y: 1.84, h: 0.22, c: '#337755' },
        ].map((b, i) => (
          <mesh key={`book${i}`} position={[b.x, b.y, 0.02]}>
            <boxGeometry args={[0.06, b.h, 0.18]} />
            <meshStandardMaterial color={b.c} roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* ═══ POTTED PLANT — left side of desk ═══ */}
      <group position={[-1.2, 0, 0.2]}>
        {/* Pot */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.1, 0.08, 0.3, 12]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
        </mesh>
        {/* Soil */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 12]} />
          <meshStandardMaterial color="#1a1208" roughness={1} />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.008, 0.01, 0.5, 6]} />
          <meshStandardMaterial color="#2a4420" roughness={0.9} />
        </mesh>
        {/* Leaves — simple flat planes */}
        {[
          { pos: [0.06, 0.65, 0.03], rot: [0.3, 0.5, 0.2] },
          { pos: [-0.05, 0.7, -0.04], rot: [-0.2, -0.8, 0.1] },
          { pos: [0.03, 0.75, -0.02], rot: [0.1, 1.2, -0.3] },
          { pos: [-0.04, 0.6, 0.05], rot: [0.4, -0.3, 0.5] },
          { pos: [0.02, 0.8, 0.01], rot: [-0.3, 0.2, -0.1] },
        ].map((l, i) => (
          <mesh key={`leaf${i}`} position={l.pos as [number, number, number]} rotation={l.rot as [number, number, number]}>
            <planeGeometry args={[0.12, 0.06]} />
            <meshStandardMaterial color="#1a4422" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* ═══ WALL ART — framed poster on back wall ═══ */}
      <group position={[1.2, 1.7, -1.18]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.55, 0.75, 0.025]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Art — abstract gradient */}
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[0.48, 0.68]} />
          <meshStandardMaterial color="#0c1520" emissive="#0a1828" emissiveIntensity={0.3} roughness={0.9} />
        </mesh>
      </group>

      {/* ═══ SMALL FRAME — left of monitor on back wall ═══ */}
      <group position={[-1.0, 1.4, -1.18]}>
        <mesh>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.25, 0.25]} />
          <meshStandardMaterial color="#1a1520" emissive="#150a20" emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
      </group>

      {/* ═══ RUG under desk area ═══ */}
      <mesh position={[0, 0.003, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1.8]} />
        <meshStandardMaterial color="#151222" roughness={0.95} />
      </mesh>

      {/* ═══ CABLE on floor ═══ */}
      <mesh position={[0.3, 0.005, -0.5]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.008, 1.2]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ═══════════ HYPERSPACE — replaced with Awakening Geometry ═══════════ */
/* The old 4D polytope wireframes are gone. The entire dimensional
   journey is now the Doctor Strange-inspired fractal kaleidoscope. */

/* ═══════════ SCENE ═══════════
   Two distinct spaces:
   1. DESK (progress 0→0.32): Shaw at desk, camera follows him toward monitor
   2. INSIDE COMPUTER (progress 0.32→0.85): Shaw moves forward through empty space,
      the BOUNDARY of the space is the stereographic projection (skybox).
      Camera follows behind Shaw, fixed forward direction. Never orbits.
   3. EMERGENCE (0.85→1.0): white-out → portfolio
═══════════ */
function Scene({ progress, onComplete }: { progress: number; onComplete: () => void }) {
  const { camera } = useThree();
  const completed = useRef(false);
  const pull = Math.max(0, Math.min(1, (progress - 0.18) / 0.14));
  const insideComputer = progress > 0.32;
  const insideProgress = Math.max(0, Math.min(1, (progress - 0.32) / 0.53)); // 0.32→0.85
  const whiteOut = Math.max(0, Math.min(1, (progress - 0.85) / 0.15));

  // Shaw's position — camera follows behind
  const shawPos = useRef(new THREE.Vector3(0, 0.7, 0.2));
  const camPos = useRef(new THREE.Vector3(1.2, 1.5, 2.5));
  const camLook = useRef(new THREE.Vector3(0, 0.9, -0.1));
  const targetPos = useRef(new THREE.Vector3(1.2, 1.5, 2.5));
  const targetLook = useRef(new THREE.Vector3(0, 0.9, -0.1));

  useFrame((_, delta) => {
    const p = progress;

    if (p < 0.18) {
      // === DESK: wide shot of standing character ===
      shawPos.current.set(0, 0.8, 0.6);
      targetPos.current.set(1.5, 1.2, 3.2);
      targetLook.current.set(0, 0.8, 0);
    } else if (p < 0.32) {
      // === PULL: camera follows Shaw toward monitor ===
      const t = (p - 0.18) / 0.14;
      shawPos.current.set(0, 0.8 + t * 0.2, 0.6 - t * 1.0);
      targetPos.current.set(1.5 - t * 1.3, 1.2 - t * 0.1, 3.2 - t * 2.8);
      targetLook.current.set(0, 0.8, -0.2 - t * 0.8);
    } else if (p < 0.85) {
      // === INSIDE COMPUTER ===
      // Must match Shaw character: z goes from 1 to -12, y=-0.3
      const t = insideProgress;
      const shawZ = 1 + (-12 - 1) * t;

      shawPos.current.set(0, -0.3, shawZ);

      // Camera: dead center behind Shaw, same Y, fixed distance back
      targetPos.current.set(0, 0, shawZ + 3);
      targetLook.current.set(0, -0.3, shawZ);
    } else {
      // === EMERGENCE: white-out ===
      const t = (p - 0.85) / 0.15;
      shawPos.current.set(0, -0.3, -12);
      targetPos.current.set(0, 0, -12 + 3);
      targetLook.current.set(0, -0.3, -12);
    }

    // Camera follow — snap when inside computer, lerp otherwise
    if (insideComputer) {
      // Snap to position — no lerp delay
      camPos.current.copy(targetPos.current);
      camLook.current.copy(targetLook.current);
    } else {
      const lerpFactor = 1 - Math.pow(0.001, delta);
      camPos.current.lerp(targetPos.current, lerpFactor);
      camLook.current.lerp(targetLook.current, lerpFactor);
    }

    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);

    if (p >= 0.92 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  // Post-processing
  // Post-processing values removed for memory — using static bloom only

  return (
    <>
      {/* === DESK SCENE LIGHTING (only when at desk) === */}
      {!insideComputer && (
        <>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 1.15, -0.2]} color="#22D3EE" intensity={4} distance={3} decay={2} />
          <pointLight position={[-0.5, 1.0, 0.8]} color="#22D3EE" intensity={2} distance={4} decay={2} />
          <spotLight position={[2, 3, 3]} color="#A78BFA" intensity={0.8} angle={0.6} penumbra={0.9} />
          <pointLight position={[1, 2.5, 1]} color="#ffeedd" intensity={0.6} distance={6} decay={2} />
          <pointLight position={[0, 0.1, 0.5]} color="#22D3EE" intensity={0.3} distance={2} decay={2} />

          <Sparkles count={20} scale={[4, 3, 4]} size={1.5} speed={0.3} opacity={0.4} color="#22D3EE" />
        </>
      )}

      {/* === INSIDE COMPUTER LIGHTING === */}
      {insideComputer && (
        <>
          <ambientLight intensity={0.15} />
          {/* Light follows Shaw so he's always visible */}
          <pointLight
            position={[shawPos.current.x, shawPos.current.y + 2, shawPos.current.z + 2]}
            color="#22D3EE" intensity={3} distance={12} decay={2}
          />
          <pointLight
            position={[shawPos.current.x - 2, shawPos.current.y, shawPos.current.z]}
            color="#A78BFA" intensity={1.5} distance={8} decay={2}
          />
        </>
      )}

      {/* === DESK ROOM (only before entering computer) === */}
      {progress < 0.35 && <Room pullProgress={pull} />}

      {/* === SHAW === */}
      <Shaw progress={progress} landed={false} />

      {/* === PROJECTION ENVIRONMENT (the space inside the computer) === */}
      {insideComputer && (
        <AwakeningGeometry progress={insideProgress} />
      )}

      {/* === WHITE-OUT === */}
      {whiteOut > 0.01 && (
        <mesh
          position={camPos.current.clone().add(new THREE.Vector3(0, 0, -2))}
          renderOrder={999}
        >
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial color="#fff" transparent opacity={whiteOut} depthTest={false} />
        </mesh>
      )}

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.7} mipmapBlur />
      </EffectComposer>
    </>
  );
}

/* ═══════════ MINI SHAW ═══════════ */
export function MiniShaw() {
  const group = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (group.current) {
      group.current.position.y = Math.sin(s.clock.elapsedTime * 1.2) * 0.02;
      group.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <SoldierModel action="Idle" rotation={[-Math.PI / 2, 0, Math.PI + 0.15]} scale={0.01} />
      </Suspense>
    </group>
  );
}

/* ═══════════ SCROLL-DRIVEN TEXT OVERLAYS ═══════════ */
function IntroOverlays({ progress }: { progress: number }) {
  // Text reveals synced to scroll
  const showTitle = progress >= 0 && progress < 0.15;
  const showPullText = progress > 0.20 && progress < 0.35;
  const showHyperText = progress > 0.45 && progress < 0.70;

  return (
    <>
      {/* Hero title */}
      <div style={{
        position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none', zIndex: 10,
        opacity: showTitle ? 1 : 0, transition: 'opacity 0.8s ease',
      }}>
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px, 4vw, 56px)',
          fontWeight: 700, color: '#E2E8F0', letterSpacing: '-0.02em',
          textShadow: '0 0 40px rgba(34,211,238,0.3)',
        }}>
          Shaw Tesfaye
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 'clamp(10px, 1.2vw, 14px)',
          color: '#64748B', marginTop: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          Software Engineer & ML Systems
        </div>
      </div>

      {/* Hyperspace text */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none', zIndex: 10,
        opacity: showHyperText ? 0.7 : 0, transition: 'opacity 1.2s ease',
      }}>
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: 'clamp(20px, 3vw, 42px)',
          fontWeight: 300, color: '#E2E8F0', letterSpacing: '0.15em',
          textTransform: 'uppercase',
          textShadow: '0 0 60px rgba(167,139,250,0.5)',
        }}>
          Step into a new world
        </div>
      </div>
    </>
  );
}

/* ═══════════ INTRO EXPERIENCE — Lenis scroll-jacking ═══════════
   Lenis intercepts wheel/touch events and manages a virtual scroll position.
   It ticks inside rAF so the scrollProgress and WebGL render are on the
   exact same frame — zero desync. The lerp gives the "breath" feeling
   where the scene coasts after you stop scrolling.
═══════════ */
export default function IntroExperience({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    // Total virtual scroll distance (equivalent to 500vh - 100vh = 400vh worth of scrolling)
    const totalScroll = window.innerHeight * 4;
    let virtualScroll = 0;
    let targetScroll = 0;

    // Lenis-style lerp factor: lower = smoother coast, higher = snappier
    const LERP = 0.08;

    // Intercept wheel events
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetScroll = Math.max(0, Math.min(totalScroll, targetScroll + e.deltaY));
    };

    // Intercept touch events
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const delta = (touchStartY - e.touches[0].clientY) * 1.8; // touchMultiplier
      targetScroll = Math.max(0, Math.min(totalScroll, targetScroll + delta));
      touchStartY = e.touches[0].clientY;
    };

    // rAF loop — Lenis-style with auto-scroll through the computer section
    let rafId: number;
    let autoScrollActive = false;

    const tick = () => {
      // Normalize current progress
      const currentP = virtualScroll / totalScroll;

      // AUTO-SCROLL: once inside computer (progress > 0.32), auto-advance
      // User can still scroll to speed up, but it moves on its own
      if (currentP >= 0.30 && currentP < 0.92) {
        if (!autoScrollActive) autoScrollActive = true;
        // Auto-advance target at a steady rate (~6 seconds to traverse)
        // totalScroll * 0.53 = the inside-computer portion (0.32 to 0.85)
        // 6 seconds at 60fps = 360 frames
        const autoSpeed = (totalScroll * 0.55) / 150; // ~2.5 seconds
        targetScroll = Math.min(totalScroll, targetScroll + autoSpeed);
      }

      // Lerp toward target — the "breath" / coast effect
      virtualScroll += (targetScroll - virtualScroll) * LERP;

      // Normalize to 0→1
      const p = Math.max(0, Math.min(1, virtualScroll / totalScroll));
      progressRef.current = p;
      setProgress(p);

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Add listeners with { passive: false } to prevent default
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    // Prevent native scroll entirely
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
      <Canvas camera={{ fov: 50, near: 0.1, far: 200, position: [1.2, 1.5, 2.5] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)}
        style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 0.5, 8]} />
        <Scene progress={progress} onComplete={onComplete} />
      </Canvas>

      {/* Text overlays */}
      <IntroOverlays progress={progress} />

      {/* Scroll hint */}
      {progress < 0.05 && (
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, color: '#64748B', fontFamily: 'monospace', pointerEvents: 'none',
          letterSpacing: '.15em', textTransform: 'uppercase', animation: 'pulse 2s infinite' }}>
          scroll down
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 20, left: 24, display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#22D3EE', opacity: 0.5 }}>
          {Math.round(progress * 100).toString().padStart(2, '0')}%
        </div>
        <div style={{ width: 50, height: 1.5, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg,#22D3EE,#A78BFA)' }} />
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
