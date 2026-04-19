import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { BufferAttribute, PlaneGeometry } from "three";

const SIZE = 140;
const SEGMENTS = 180;

const TIERS = [-1.5, 1.2, 3.8, 6.4, 9.0, 12.0];
const SPAWN_FLATTEN_RADIUS_SQ = 42;
const SPAWN_TIER = TIERS[1];

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
  for (let i = 0; i < 4; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export function sampleIceTerrainHeight(x: number, z: number): number {
  const broad = fbm(x * 0.018, z * 0.018);
  const ridge = fbm(x * 0.06 + 17.3, z * 0.06 - 4.1) * 0.15;

  const t = Math.max(0, Math.min(0.999, broad));
  const tierSteps = TIERS.length;
  const raw = t * tierSteps;
  const idx = Math.min(tierSteps - 1, Math.floor(raw));
  let height = TIERS[idx];

  const detail = (fbm(x * 0.28, z * 0.28) - 0.5) * 0.22;
  height += detail + ridge * 0.1;

  const spawnBlend = Math.exp(-(x * x + z * z) / SPAWN_FLATTEN_RADIUS_SQ);
  height = height * (1 - spawnBlend) + SPAWN_TIER * spawnBlend;
  return height;
}

export function sampleIceTerrainTier(x: number, z: number): number {
  const broad = fbm(x * 0.018, z * 0.018);
  const t = Math.max(0, Math.min(0.999, broad));
  const tierSteps = TIERS.length;
  return Math.min(tierSteps - 1, Math.floor(t * tierSteps));
}

export const ICE_TIERS = TIERS;
export const ICE_TERRAIN_SIZE = SIZE;

export function IceGround() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const deepIce: [number, number, number] = [0.42, 0.56, 0.78];
    const midIce: [number, number, number] = [0.66, 0.80, 0.94];
    const snowCap: [number, number, number] = [0.92, 0.97, 1.0];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = sampleIceTerrainHeight(x, z);
      pos.setY(i, y);
      const range = TIERS[TIERS.length - 1] - TIERS[0];
      const tRaw = (y - TIERS[0]) / range;
      const t = Math.max(0, Math.min(1, tRaw));
      let r: number, gr: number, b: number;
      if (t < 0.55) {
        const k = t / 0.55;
        r = deepIce[0] + (midIce[0] - deepIce[0]) * k;
        gr = deepIce[1] + (midIce[1] - deepIce[1]) * k;
        b = deepIce[2] + (midIce[2] - deepIce[2]) * k;
      } else {
        const k = (t - 0.55) / 0.45;
        r = midIce[0] + (snowCap[0] - midIce[0]) * k;
        gr = midIce[1] + (snowCap[1] - midIce[1]) * k;
        b = midIce[2] + (snowCap[2] - midIce[2]) * k;
      }
      const jitter = (Math.sin((x + z) * 3.3) * 0.5 + 0.5) * 0.04;
      colors[i * 3] = Math.min(1, r + jitter);
      colors[i * 3 + 1] = Math.min(1, gr + jitter);
      colors[i * 3 + 2] = Math.min(1, b + jitter * 0.5);
    }
    pos.needsUpdate = true;
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={0.85}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
    </RigidBody>
  );
}
