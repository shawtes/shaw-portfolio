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
      // Seated at desk, facing monitor (-Z direction)
      // Chair seat at y=0.42, z=0.4. Character origin is at feet,
      // so y=0.42 puts feet on chair seat. Scale 0.4 → ~0.72 units tall.
      group.current.position.set(0, 0.42, 0.4);
      group.current.position.y += Math.sin(t * 1.8) * 0.002;
      group.current.rotation.set(0, Math.PI, 0); // face monitor (-Z)
      group.current.scale.setScalar(0.4);
    } else if (p < 0.32) {
      // Getting pulled from chair toward monitor
      const pull = (p - 0.18) / 0.14;
      const ease = pull * pull * pull;
      group.current.position.set(0, 0.42 + ease * 0.3, 0.4 - ease * 0.8);
      group.current.rotation.set(-ease * 0.7, Math.PI, 0);
      group.current.scale.setScalar(0.4 * (1 - ease * 0.4));
    } else if (p < 0.85) {
      // INSIDE COMPUTER: Shaw travels into -Z through the grid
      // Guide wire: x=0, y=0, z goes from 0.5 to -5 (through many cells)
      // Scale shrinks as he goes deeper — perspective + distance effect
      const insideT = (p - 0.32) / 0.53;

      const startZ = 1;
      const endZ = -12;
      const shawZ = startZ + (endZ - startZ) * insideT;

      // Scale: small enough to fit through cell openings, shrinks further
      const scaleStart = 0.35;
      const scaleEnd = 0.08;
      const shawScale = scaleStart + (scaleEnd - scaleStart) * insideT;

      // Stay on guide wire: x=0, y=0, straight line into -Z
      // Offset Y down slightly so he's below center of camera view
      group.current.position.set(0, -0.3, shawZ);
      group.current.scale.setScalar(shawScale);

      // Face away from camera (into -Z), slight tumble
      limbPhase.current += delta * 1.5;
      const tumbleDecay = 1 - insideT * 0.7;
      group.current.rotation.x = -Math.PI * 0.3 + Math.sin(limbPhase.current * 0.6) * 0.15 * tumbleDecay;
      group.current.rotation.y = Math.PI;
      group.current.rotation.z = Math.cos(limbPhase.current * 0.5) * 0.1 * tumbleDecay;
    } else {
      // Emergence
      const emerge = (p - 0.85) / 0.15;
      group.current.position.set(0, -0.3, -12);
      group.current.rotation.set(0, Math.PI, 0);
      group.current.scale.setScalar(0.08 * (1 - emerge));
    }
  });

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <SoldierModel action={action} rotation={[-Math.PI / 2, 0, 0]} scale={0.01} />
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
  return (
    <group>
      {/* Desk */}
      <mesh position={[0,0.7,-0.15]}><boxGeometry args={[1.6,0.04,0.75]} /><meshStandardMaterial color="#2a1f14" roughness={0.6} /></mesh>
      {[[-0.72,0.35,-0.47],[0.72,0.35,-0.47],[-0.72,0.35,0.17],[0.72,0.35,0.17]].map((p,i)=>(
        <mesh key={i} position={p as [number,number,number]}><boxGeometry args={[0.04,0.7,0.04]} /><meshStandardMaterial color="#1f1710" /></mesh>
      ))}
      {/* Keyboard */}
      <mesh position={[0,0.74,0]}><boxGeometry args={[0.35,0.01,0.12]} /><meshStandardMaterial color="#111" metalness={0.3} /></mesh>
      {/* Monitor frame */}
      <mesh position={[0,1.15,-0.35]}><boxGeometry args={[0.84,0.54,0.025]} /><meshStandardMaterial color="#080808" metalness={0.6} /></mesh>
      {/* Monitor screen — emissive for bloom */}
      <mesh position={[0,1.15,-0.335]}>
        <planeGeometry args={[0.78,0.48]} />
        <shaderMaterial vertexShader={screenVert} fragmentShader={screenFrag} uniforms={u} />
      </mesh>
      {/* Monitor glow plane (invisible, emissive for bloom) */}
      <mesh position={[0,1.15,-0.33]}>
        <planeGeometry args={[0.9,0.6]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.08} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0,0.82,-0.33]}><boxGeometry args={[0.05,0.18,0.04]} /><meshStandardMaterial color="#080808" metalness={0.5} /></mesh>
      <mesh position={[0,0.73,-0.33]}><boxGeometry args={[0.22,0.015,0.1]} /><meshStandardMaterial color="#080808" metalness={0.5} /></mesh>
      {/* Chair */}
      <mesh position={[0,0.42,0.4]}><boxGeometry args={[0.42,0.035,0.38]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      <mesh position={[0,0.68,0.58]} rotation={[0.08,0,0]}><boxGeometry args={[0.4,0.45,0.03]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      {/* Floor — slightly reflective */}
      <mesh position={[0,0,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[14,14]} />
        <meshStandardMaterial color="#060710" metalness={0.3} roughness={0.8} />
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
      // === DESK: wide shot ===
      shawPos.current.set(0, 0.7, 0.2);
      targetPos.current.set(1.2, 1.5, 2.5);
      targetLook.current.set(0, 0.9, -0.1);
    } else if (p < 0.32) {
      // === PULL: camera follows Shaw toward monitor ===
      const t = (p - 0.18) / 0.14;
      shawPos.current.set(0, 0.7 + t * 0.1, 0.2 - t * 0.6);
      targetPos.current.set(1.2 - t * 1.0, 1.5 - t * 0.3, 2.5 - t * 2.3);
      targetLook.current.set(0, 0.85, -0.3 - t * 0.7);
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
        <SoldierModel action="Idle" rotation={[-Math.PI / 2, 0, 0]} scale={0.01} />
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
