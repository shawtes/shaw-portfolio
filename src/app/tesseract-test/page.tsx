'use client';
import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/*
  TESSERACT INFINITY MIRROR — Final Version

  ONE real tesseract (thick tubes, cube-in-cube) +
  mathematical reflections across 6 mirror walls +
  connecting struts between reflections +
  fog for natural distance fade +
  rainbow iridescent colors from mockup style
*/

type V4 = [number, number, number, number];

const UNIT_VERTS: V4[] = [];
for (let i = 0; i < 16; i++) {
  UNIT_VERTS.push([
    (i & 1) ? 1 : -1,
    (i & 2) ? 1 : -1,
    (i & 4) ? 1 : -1,
    (i & 8) ? 1 : -1,
  ]);
}

const UNIT_EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    const xor = i ^ j;
    if (xor && !(xor & (xor - 1))) UNIT_EDGES.push([i, j]);
  }
}

// ═══════════ HSL HELPER ═══════════
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

// ═══════════ PROJECT THE TESSERACT ═══════════
function projectTesseract(size: number): { positions: THREE.Vector3[]; outerHalf: number } {
  // Standard 4D perspective: scale = d / (d - w)
  // w=+1 → scale=d/(d-1) → OUTER cube (larger)
  // w=-1 → scale=d/(d+1) → INNER cube (smaller)
  const d = 2.5;
  const positions: THREE.Vector3[] = [];
  let maxCoord = 0;
  for (const v of UNIT_VERTS) {
    const [x, y, z, w] = v;
    const scale = d / (d - w);
    const p = new THREE.Vector3(x * scale * size, y * scale * size, z * scale * size);
    positions.push(p);
    maxCoord = Math.max(maxCoord, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  }
  return { positions, outerHalf: maxCoord };
}

// ═══════════ BUILD EVERYTHING ═══════════
interface EdgeData {
  start: THREE.Vector3;
  end: THREE.Vector3;
  hue: number;
  brightness: number;
}

interface StrutData {
  start: THREE.Vector3;
  end: THREE.Vector3;
  hue: number;
  brightnessA: number;
  brightnessB: number;
}

function buildInfinityMirror(
  tesseractSize: number,
  gap: number, // gap between outer edge of tesseract and mirror wall
  bounces: number,
  decay: number,
) {
  const { positions: verts, outerHalf } = projectTesseract(tesseractSize);
  const allEdges: EdgeData[] = [];
  const allStruts: StrutData[] = [];

  // Room wall = outerHalf + gap
  // Cell spacing = 2 * (outerHalf + gap)
  const roomHalfSize = outerHalf + gap;
  const cellSpacing = roomHalfSize * 2;

  for (let ix = -bounces; ix <= bounces; ix++) {
    for (let iy = -bounces; iy <= bounces; iy++) {
      for (let iz = -bounces; iz <= bounces; iz++) {
        const ox = ix * cellSpacing;
        const oy = iy * cellSpacing;
        const oz = iz * cellSpacing;

        // Distance for brightness decay
        const dist = Math.sqrt(ix*ix + iy*iy + iz*iz);
        const brightness = Math.pow(decay, dist);
        if (brightness < 0.03) continue; // skip invisible reflections

        // Reflection parity — odd reflections are mirrored
        const flipX = (Math.abs(ix) % 2 === 1) ? -1 : 1;
        const flipY = (Math.abs(iy) % 2 === 1) ? -1 : 1;
        const flipZ = (Math.abs(iz) % 2 === 1) ? -1 : 1;

        // Add tesseract edges for this reflection
        for (const [a, b] of UNIT_EDGES) {
          const pa = verts[a], pb = verts[b];
          const edgeHash = (a + b) / 32 + dist * 0.04 + (ix + iy + iz) * 0.07;

          allEdges.push({
            start: new THREE.Vector3(pa.x * flipX + ox, pa.y * flipY + oy, pa.z * flipZ + oz),
            end: new THREE.Vector3(pb.x * flipX + ox, pb.y * flipY + oy, pb.z * flipZ + oz),
            hue: edgeHash,
            brightness,
          });
        }

        // Struts to +X, +Y, +Z neighbors
        const axes: [number, number, number][] = [[1,0,0],[0,1,0],[0,0,1]];
        for (const [ax, ay, az] of axes) {
          const nix = ix + ax, niy = iy + ay, niz = iz + az;
          if (Math.abs(nix) > bounces || Math.abs(niy) > bounces || Math.abs(niz) > bounces) continue;

          const nDist = Math.sqrt(nix*nix + niy*niy + niz*niz);
          const nBrightness = Math.pow(decay, nDist);
          if (nBrightness < 0.03) continue;

          const nox = nix * cellSpacing;
          const noy = niy * cellSpacing;
          const noz = niz * cellSpacing;

          // Strut from face of this cell to face of neighbor
          allStruts.push({
            start: new THREE.Vector3(
              flipX * outerHalf * ax + ox + (1-Math.abs(ax)) * ox * 0,
              flipY * outerHalf * ay + oy,
              flipZ * outerHalf * az + oz,
            ),
            end: new THREE.Vector3(
              nox - ((Math.abs(nix) % 2 === 1) ? -1 : 1) * outerHalf * ax,
              noy - ((Math.abs(niy) % 2 === 1) ? -1 : 1) * outerHalf * ay,
              noz - ((Math.abs(niz) % 2 === 1) ? -1 : 1) * outerHalf * az,
            ),
            hue: (ax * 3 + ay * 5 + az * 7 + dist * 0.04),
            brightnessA: brightness,
            brightnessB: nBrightness,
          });
        }
      }
    }
  }

  // Convert to buffer arrays
  const edgePos = new Float32Array(allEdges.length * 6);
  const edgeCol = new Float32Array(allEdges.length * 6);

  for (let i = 0; i < allEdges.length; i++) {
    const e = allEdges[i];
    edgePos[i*6] = e.start.x; edgePos[i*6+1] = e.start.y; edgePos[i*6+2] = e.start.z;
    edgePos[i*6+3] = e.end.x; edgePos[i*6+4] = e.end.y; edgePos[i*6+5] = e.end.z;

    const [r, g, b] = hslToRGB(e.hue, 0.9, 0.55);
    edgeCol[i*6] = r*e.brightness; edgeCol[i*6+1] = g*e.brightness; edgeCol[i*6+2] = b*e.brightness;
    edgeCol[i*6+3] = r*e.brightness; edgeCol[i*6+4] = g*e.brightness; edgeCol[i*6+5] = b*e.brightness;
  }

  const strutPos = new Float32Array(allStruts.length * 6);
  const strutCol = new Float32Array(allStruts.length * 6);

  for (let i = 0; i < allStruts.length; i++) {
    const s = allStruts[i];
    strutPos[i*6] = s.start.x; strutPos[i*6+1] = s.start.y; strutPos[i*6+2] = s.start.z;
    strutPos[i*6+3] = s.end.x; strutPos[i*6+4] = s.end.y; strutPos[i*6+5] = s.end.z;

    const [r1, g1, b1] = hslToRGB(s.hue, 0.85, 0.5);
    const [r2, g2, b2] = hslToRGB(s.hue + 0.05, 0.85, 0.5);
    strutCol[i*6] = r1*s.brightnessA; strutCol[i*6+1] = g1*s.brightnessA; strutCol[i*6+2] = b1*s.brightnessA;
    strutCol[i*6+3] = r2*s.brightnessB; strutCol[i*6+4] = g2*s.brightnessB; strutCol[i*6+5] = b2*s.brightnessB;
  }

  return { edgePos, edgeCol, strutPos, strutCol };
}

// ═══════════ SCENE ═══════════
function InfinityTesseract() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { edgePos, edgeCol, edgeMeta } = useMemo(() => {
    const result = buildInfinityMirror(0.35, 0.04, 5, 0.75);

    // Build metadata for animated colors: per-edge [edgeIdx, cellDist, brightness]
    // We need to know which of the 32 tesseract edges each line segment is
    const meta: { edgeIdx: number; cellIx: number; cellIy: number; cellIz: number; brightness: number }[] = [];

    // The edges are built in order: for each cell, 32 edges from UNIT_EDGES
    // We can reconstruct from the order they were pushed
    let idx = 0;
    const bounces = 5;
    const decay = 0.75;
    for (let ix = -bounces; ix <= bounces; ix++) {
      for (let iy = -bounces; iy <= bounces; iy++) {
        for (let iz = -bounces; iz <= bounces; iz++) {
          const dist = Math.sqrt(ix*ix + iy*iy + iz*iz);
          const brightness = Math.pow(decay, dist);
          if (brightness < 0.03) continue;

          for (let e = 0; e < UNIT_EDGES.length; e++) {
            meta.push({
              edgeIdx: e,
              cellIx: ix, cellIy: iy, cellIz: iz,
              brightness,
            });
          }
        }
      }
    }

    return { edgePos: result.edgePos, edgeCol: result.edgeCol, edgeMeta: meta };
  }, []);

  // Animate colors every frame — rainbow shimmer like the mockup
  useFrame((state) => {
    if (!linesRef.current) return;
    const t = state.clock.elapsedTime;
    const shift = t * 0.08; // color cycling speed

    const col = linesRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < edgeMeta.length; i++) {
      const m = edgeMeta[i];
      const dist = Math.sqrt(m.cellIx**2 + m.cellIy**2 + m.cellIz**2);

      // Per-edge hue: edgeIdx/32 spreads edges across rainbow
      // + spatial offset + time shift for shimmer
      const hue = ((m.edgeIdx / 32 + (m.cellIx + m.cellIy + m.cellIz) * 0.07 + dist * 0.04 + shift) % 1 + 1) % 1;

      // HSL to RGB (s=0.9, l=0.52 — same as mockup)
      const [r, g, b] = hslToRGB(hue, 0.9, 0.52);

      const br = m.brightness;
      col[i*6]   = r*br; col[i*6+1] = g*br; col[i*6+2] = b*br;
      col[i*6+3] = r*br; col[i*6+4] = g*br; col[i*6+5] = b*br;
    }

    linesRef.current.geometry.attributes.color.needsUpdate = true;

    // Slow orbit
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.06;
      groupRef.current.rotation.x = Math.sin(t * 0.025) * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[edgeCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={1} />
      </lineSegments>
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 0.5, 5]} />

      <InfinityTesseract />

      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.2} luminanceSmoothing={0.8} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export default function TesseractTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
        camera={{ fov: 60, position: [0.3, 0.2, 2], near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
      >
        <Suspense fallback={null}>
          <Scene />
          <OrbitControls enableDamping dampingFactor={0.05} maxDistance={6} />
        </Suspense>
      </Canvas>

      <div style={{
        position: 'absolute', top: 20, left: 20, color: '#444',
        fontFamily: 'monospace', fontSize: 12,
      }}>
        Tesseract Infinity Mirror — drag to orbit
      </div>
    </div>
  );
}
