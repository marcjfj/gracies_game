import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { BufferAttribute, PlaneGeometry } from "three";

const SIZE = 140;
const SEGMENTS = 120;
const MAX_HEIGHT = 6;

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function fbm(x: number, y: number): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < 5; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

const CRATERS: { x: number; z: number; r: number; depth: number }[] = [
  { x: -22, z: 18, r: 9, depth: 4 },
  { x: 30, z: -10, r: 11, depth: 5 },
  { x: 6, z: 38, r: 8, depth: 3.5 },
  { x: -42, z: -30, r: 10, depth: 4.5 },
  { x: 45, z: 40, r: 7, depth: 3 },
];

const SPAWN_FLATTEN_RADIUS_SQ = 36;
const SPAWN_FLATTEN_HEIGHT = 0.3;

export function sampleTerrainHeight(x: number, z: number): number {
  const base = fbm(x * 0.035, z * 0.035);
  let h = base * MAX_HEIGHT;
  for (const c of CRATERS) {
    const dx = x - c.x;
    const dz = z - c.z;
    const d2 = dx * dx + dz * dz;
    const fall = Math.exp(-d2 / (c.r * c.r));
    h -= c.depth * fall;
  }
  const spawnBlend = Math.exp(-(x * x + z * z) / SPAWN_FLATTEN_RADIUS_SQ);
  h = h * (1 - spawnBlend) + SPAWN_FLATTEN_HEIGHT * spawnBlend;
  return h;
}

export const TERRAIN_SIZE = SIZE;

export function Ground() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const low: [number, number, number] = [0.15, 0.10, 0.22];
    const mid: [number, number, number] = [0.32, 0.22, 0.38];
    const high: [number, number, number] = [0.55, 0.48, 0.58];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = sampleTerrainHeight(x, z);
      pos.setY(i, y);
      const t = Math.max(0, Math.min(1, (y + 2) / (MAX_HEIGHT + 2)));
      let r: number, gr: number, b: number;
      if (t < 0.5) {
        const k = t * 2;
        r = low[0] + (mid[0] - low[0]) * k;
        gr = low[1] + (mid[1] - low[1]) * k;
        b = low[2] + (mid[2] - low[2]) * k;
      } else {
        const k = (t - 0.5) * 2;
        r = mid[0] + (high[0] - mid[0]) * k;
        gr = mid[1] + (high[1] - mid[1]) * k;
        b = mid[2] + (high[2] - mid[2]) * k;
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = gr;
      colors[i * 3 + 2] = b;
    }
    pos.needsUpdate = true;
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0.05} />
      </mesh>
    </RigidBody>
  );
}
