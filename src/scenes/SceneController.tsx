'use client';
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import IntroScene from './IntroScene';
import TunnelScene from './TunnelScene';
import ProjectsZone from './ProjectsZone';
import AboutZone from './AboutZone';
import ExperienceZone from './ExperienceZone';
import ContactZone from './ContactZone';
import ParticleField from '../effects/ParticleField';
import ScreenPaint from '../effects/ScreenPaint';
import { remap, clamp } from '../lib/mathUtils';
import { SecondOrderDynamics } from '../lib/secondOrderDynamics';

/**
 * SceneController — Lusion-inspired scroll-driven scene manager.
 * Uses externally-provided scroll progress (0-1) instead of drei ScrollControls.
 * Camera motion uses SecondOrderDynamics for spring-based interpolation.
 */
export default function SceneController({
  scrollProgress,
  scrollVelocity,
  onSelectProject,
}: {
  scrollProgress: number;
  scrollVelocity: number;
  onSelectProject: (id: string) => void;
}) {
  const { camera } = useThree();
  const prevProgress = useRef(0);

  // Spring dynamics for camera (Lusion uses SecondOrderDynamics for all motion)
  const cameraDynamicsX = useRef(new SecondOrderDynamics(2.5, 0.7, 1.5, 0));
  const cameraDynamicsY = useRef(new SecondOrderDynamics(2.5, 0.7, 1.5, 1.2));
  const cameraDynamicsZ = useRef(new SecondOrderDynamics(2.5, 0.7, 1.5, 4));
  const lookDynamicsX = useRef(new SecondOrderDynamics(3, 0.8, 1, 0));
  const lookDynamicsY = useRef(new SecondOrderDynamics(3, 0.8, 1, 0.6));
  const lookDynamicsZ = useRef(new SecondOrderDynamics(3, 0.8, 1, -0.2));

  // Scene scroll ranges (like Lusion's page sections)
  const INTRO = [0, 0.12] as const;
  const TUNNEL = [0.10, 0.32] as const;
  const PROJECTS = [0.30, 0.55] as const;
  const ABOUT = [0.53, 0.72] as const;
  const EXPERIENCE = [0.70, 0.87] as const;
  const CONTACT = [0.85, 1.0] as const;

  // Tunnel curve
  const tunnelCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.45, -0.5),
      new THREE.Vector3(0, 0.5, -5),
      new THREE.Vector3(1, 1, -12),
      new THREE.Vector3(-1, 0, -20),
      new THREE.Vector3(0.5, -0.5, -28),
      new THREE.Vector3(-0.5, 0.5, -35),
      new THREE.Vector3(0, 0, -42),
      new THREE.Vector3(0, 0, -50),
    ]);
  }, []);

  // Scene positions along Z
  const projectsZ = -55;
  const aboutZ = -72;
  const experienceZ = -88;
  const contactZ = -104;

  // Tunnel warp ratio (Lusion's blackTunnelTransformRatio)
  const warpRatio = clamp(remap(scrollProgress, 0.15, 0.30, 0, 1), 0, 1);

  const isVisible = (range: readonly [number, number], offset: number) => {
    return offset >= range[0] - 0.05 && offset <= range[1] + 0.05;
  };

  useFrame((_, delta) => {
    const offset = scrollProgress;
    const dt = Math.min(delta, 0.1);

    // Determine target camera position based on scroll section
    let targetX = 0, targetY = 1.2, targetZ = 4;
    let lookX = 0, lookY = 0.6, lookZ = -0.2;

    if (offset <= INTRO[1]) {
      // Intro: camera looking at desk scene
      const p = remap(offset, INTRO[0], INTRO[1], 0, 1);
      targetZ = 4 - p * 4.5;
      targetY = 1.2 - p * 0.5;
      lookY = 0.6;
      lookZ = -0.2;
    } else if (offset <= TUNNEL[1]) {
      // Tunnel: camera follows spline curve
      const tunnelProgress = clamp(remap(offset, TUNNEL[0], TUNNEL[1], 0, 1), 0, 0.999);
      const point = tunnelCurve.getPointAt(tunnelProgress);
      const lookAt = tunnelCurve.getPointAt(Math.min(tunnelProgress + 0.02, 0.999));
      targetX = point.x;
      targetY = point.y;
      targetZ = point.z;
      lookX = lookAt.x;
      lookY = lookAt.y;
      lookZ = lookAt.z;
    } else if (offset <= PROJECTS[1]) {
      // Projects zone
      const p = remap(offset, PROJECTS[0], PROJECTS[1], 0, 1);
      targetY = 2 - p * 12;
      targetZ = projectsZ + 6;
      lookY = 2 - p * 12;
      lookZ = projectsZ;
    } else if (offset <= ABOUT[1]) {
      // About zone
      const p = remap(offset, ABOUT[0], ABOUT[1], 0, 1);
      targetX = -2 + p * 4;
      targetY = 0.5;
      targetZ = aboutZ + 5 - p * 2;
      lookZ = aboutZ;
    } else if (offset <= EXPERIENCE[1]) {
      // Experience zone
      const p = remap(offset, EXPERIENCE[0], EXPERIENCE[1], 0, 1);
      targetY = 3 - p * 8;
      targetZ = experienceZ + 5;
      lookY = 3 - p * 8;
      lookZ = experienceZ;
    } else {
      // Contact zone
      const p = remap(offset, CONTACT[0], CONTACT[1], 0, 1);
      targetZ = contactZ + 8 - p * 3;
      lookZ = contactZ;
    }

    // Apply SecondOrderDynamics for spring-based camera (Lusion's core motion feel)
    const cx = cameraDynamicsX.current.update(dt, targetX);
    const cy = cameraDynamicsY.current.update(dt, targetY);
    const cz = cameraDynamicsZ.current.update(dt, targetZ);
    const lx = lookDynamicsX.current.update(dt, lookX);
    const ly = lookDynamicsY.current.update(dt, lookY);
    const lz = lookDynamicsZ.current.update(dt, lookZ);

    camera.position.set(cx, cy, cz);
    camera.lookAt(lx, ly, lz);

    prevProgress.current = offset;
  });

  const offset = scrollProgress;

  return (
    <>
      {/* ScreenPaint — mouse-driven displacement (Lusion signature) */}
      <ScreenPaint />

      <IntroScene visible={isVisible(INTRO, offset)} />

      <TunnelScene
        visible={isVisible(TUNNEL, offset)}
        curve={tunnelCurve}
        warpRatio={warpRatio}
        scrollVelocity={scrollVelocity}
      />

      <group position={[0, 0, projectsZ]}>
        <ProjectsZone visible={isVisible(PROJECTS, offset)} onSelectProject={onSelectProject} />
      </group>

      <group position={[0, 0, aboutZ]}>
        <AboutZone visible={isVisible(ABOUT, offset)} />
      </group>

      <group position={[0, 0, experienceZ]}>
        <ExperienceZone visible={isVisible(EXPERIENCE, offset)} />
      </group>

      <group position={[0, 0, contactZ]}>
        <ContactZone visible={isVisible(CONTACT, offset)} />
      </group>

      {/* Global ambient particles — subtle dust */}
      <ParticleField count={30} radius={40} />
    </>
  );
}
