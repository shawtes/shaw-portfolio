'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/*
  TESSERACT INFINITY MIRROR — the space inside the computer.
  3 bounces, static colors (computed once), no per-frame color update.
*/

type V4 = [number, number, number, number];

const UNIT_VERTS: V4[] = [];
for (let i = 0; i < 16; i++) {
  UNIT_VERTS.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
}

const UNIT_EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    const xor = i ^ j;
    if (xor && !(xor & (xor - 1))) UNIT_EDGES.push([i, j]);
  }
}

function hslToRGB(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [f(h + 1/3), f(h), f(h - 1/3)];
}

function buildInfinityMirror(tesseractSize: number, gap: number, bounces: number, decay: number) {
  const d = 2.5;
  const verts: THREE.Vector3[] = [];
  let maxCoord = 0;
  for (const v of UNIT_VERTS) {
    const [x, y, z, w] = v;
    const scale = d / (d - w);
    const p = new THREE.Vector3(x * scale * tesseractSize, y * scale * tesseractSize, z * scale * tesseractSize);
    verts.push(p);
    maxCoord = Math.max(maxCoord, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  }
  const roomHalf = maxCoord + gap;
  const cellSpacing = roomHalf * 2;

  const allPos: number[] = [];
  const allCol: number[] = [];

  for (let ix = -bounces; ix <= bounces; ix++) {
    for (let iy = -bounces; iy <= bounces; iy++) {
      for (let iz = -bounces; iz <= bounces; iz++) {
        const dist = Math.sqrt(ix*ix + iy*iy + iz*iz);
        const brightness = Math.pow(decay, dist);
        if (brightness < 0.05) continue;

        const flipX = (Math.abs(ix) % 2 === 1) ? -1 : 1;
        const flipY = (Math.abs(iy) % 2 === 1) ? -1 : 1;
        const flipZ = (Math.abs(iz) % 2 === 1) ? -1 : 1;
        const ox = ix * cellSpacing, oy = iy * cellSpacing, oz = iz * cellSpacing;

        for (let e = 0; e < UNIT_EDGES.length; e++) {
          const [a, b] = UNIT_EDGES[e];
          const pa = verts[a], pb = verts[b];
          allPos.push(
            pa.x * flipX + ox, pa.y * flipY + oy, pa.z * flipZ + oz,
            pb.x * flipX + ox, pb.y * flipY + oy, pb.z * flipZ + oz,
          );
          const hue = ((e / 32 + (ix + iy + iz) * 0.07 + dist * 0.04) % 1 + 1) % 1;
          const [r, g, bl] = hslToRGB(hue, 0.9, 0.52);
          allCol.push(r*brightness, g*brightness, bl*brightness, r*brightness, g*brightness, bl*brightness);
        }
      }
    }
  }

  return { edgePos: new Float32Array(allPos), edgeCol: new Float32Array(allCol) };
}

export default function AwakeningGeometry({ progress }: { progress: number }) {
  const { edgePos, edgeCol } = useMemo(
    () => buildInfinityMirror(0.35, 0.04, 3, 0.72), []
  );

  if (progress <= 0) return null;

  return (
    <group>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[edgeCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={1}
        />
      </lineSegments>
    </group>
  );
}
