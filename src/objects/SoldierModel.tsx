'use client';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

type ActionName = 'Idle' | 'Run' | 'TPose' | 'Walk';

interface SoldierProps {
  action?: ActionName;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function SoldierModel({
  action = 'Idle',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.01,
}: SoldierProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/soldier.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as any;
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    const current = actions[action];
    if (!current) return;

    // Fade into the requested animation
    current.reset().fadeIn(0.5).play();

    return () => {
      current.fadeOut(0.5);
    };
  }, [action, actions]);

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale} dispose={null}>
      <primitive object={nodes.mixamorigHips} />
      <skinnedMesh
        name="vanguard_Mesh"
        geometry={nodes.vanguard_Mesh.geometry}
        material={materials.VanguardBodyMat}
        skeleton={nodes.vanguard_Mesh.skeleton}
        castShadow
      />
      <skinnedMesh
        name="vanguard_visor"
        geometry={nodes.vanguard_visor.geometry}
        material={materials.Vanguard_VisorMat}
        skeleton={nodes.vanguard_visor.skeleton}
        castShadow
      />
    </group>
  );
}

useGLTF.preload('/models/soldier.glb');
