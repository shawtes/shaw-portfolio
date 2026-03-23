'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ShawCharacter({ position = [0, 0, 0] as [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torsoRef.current) {
      torsoRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.008;
    }
  });

  const skin = '#8B6914';
  const hair = '#1a1a2e';
  const shirt = '#2d3748';
  const pants = '#1e293b';

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.82, -0.02]} scale={[1, 0.5, 1]}>
        <icosahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color={hair} flatShading />
      </mesh>
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.8, 0]}>
        <boxGeometry args={[0.45, 0.55, 0.25]} />
        <meshStandardMaterial color={shirt} flatShading />
      </mesh>
      {/* Left Upper Arm */}
      <mesh position={[-0.35, 0.85, 0.05]} rotation={[0.3, 0, 0.6]}>
        <cylinderGeometry args={[0.06, 0.055, 0.35, 6]} />
        <meshStandardMaterial color={shirt} flatShading />
      </mesh>
      {/* Left Forearm (reaching to desk) */}
      <mesh position={[-0.45, 0.65, 0.2]} rotation={[1.2, 0, 0.3]}>
        <cylinderGeometry args={[0.05, 0.045, 0.3, 6]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      {/* Right Upper Arm */}
      <mesh position={[0.35, 0.85, 0.05]} rotation={[0.3, 0, -0.6]}>
        <cylinderGeometry args={[0.06, 0.055, 0.35, 6]} />
        <meshStandardMaterial color={shirt} flatShading />
      </mesh>
      {/* Right Forearm */}
      <mesh position={[0.45, 0.65, 0.2]} rotation={[1.2, 0, -0.3]}>
        <cylinderGeometry args={[0.05, 0.045, 0.3, 6]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      {/* Left Thigh */}
      <mesh position={[-0.14, 0.35, 0.12]} rotation={[1.5, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.4, 6]} />
        <meshStandardMaterial color={pants} flatShading />
      </mesh>
      {/* Right Thigh */}
      <mesh position={[0.14, 0.35, 0.12]} rotation={[1.5, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.4, 6]} />
        <meshStandardMaterial color={pants} flatShading />
      </mesh>
      {/* Left Shin */}
      <mesh position={[-0.14, 0.1, 0.32]}>
        <cylinderGeometry args={[0.065, 0.06, 0.4, 6]} />
        <meshStandardMaterial color={pants} flatShading />
      </mesh>
      {/* Right Shin */}
      <mesh position={[0.14, 0.1, 0.32]}>
        <cylinderGeometry args={[0.065, 0.06, 0.4, 6]} />
        <meshStandardMaterial color={pants} flatShading />
      </mesh>
    </group>
  );
}
