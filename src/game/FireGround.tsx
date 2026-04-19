import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { BufferAttribute, PlaneGeometry } from "three";

const SIZE = 140;
const SEGMENTS = 160;

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

const SPAWN_FLOOR_RADIUS = 6.5;
const SPAWN_TRANSITION_END = 10;
const SPAWN_FLOOR_Y = -0.25;
const SINK_DEPTH = 10;

export function sampleFireTerrainHeight(x: number, z: number): number {
  const r = Math.sqrt(x * x + z * z);

  // Flat spawn arena: subtle bumps only
  if (r < SPAWN_FLOOR_RADIUS) {
    const bump = (fbm(x * 0.55, z * 0.55) - 0.5) * 0.1;
    return SPAWN_FLOOR_Y + bump;
  }

  // Short ragged rim, then steep drop into the lava basin
  const noise = (fbm(x * 0.12, z * 0.12) - 0.5) * 2.4;
  const ridge = (fbm(x * 0.28 + 7.1, z * 0.28 - 3.3) - 0.5) * 1.0;

  if (r < SPAWN_TRANSITION_END) {
    const t = (r - SPAWN_FLOOR_RADIUS) / (SPAWN_TRANSITION_END - SPAWN_FLOOR_RADIUS);
    const floorBlend = SPAWN_FLOOR_Y + noise * 0.2;
    const dropStart = SPAWN_FLOOR_Y - 1.5;
    return floorBlend * (1 - t) + dropStart * t;
  }

  let h = SPAWN_FLOOR_Y - 1.5 - (r - SPAWN_TRANSITION_END) * 0.5 + noise + ridge;
  h = Math.max(h, -SINK_DEPTH);

  // Jagged outer caldera wall
  if (r > 48) {
    h += (r - 48) * 0.5;
  }
  return h;
}

export const FIRE_TERRAIN_SIZE = SIZE;
export const FIRE_SPAWN_FLOOR_Y = SPAWN_FLOOR_Y;

export function FireGround() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    // Dark volcanic basalt — pointedly NOT lava-colored so the ground reads
    // as cold solid rock against the glowing magma below.
    const charcoal: [number, number, number] = [0.045, 0.04, 0.045];
    const basalt: [number, number, number] = [0.12, 0.11, 0.12];
    const ashy: [number, number, number] = [0.26, 0.24, 0.24];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = sampleFireTerrainHeight(x, z);
      pos.setY(i, y);

      // Weathering / ash mottling via two octaves of noise
      const grain = fbm(x * 0.55, z * 0.55);
      const broad = fbm(x * 0.11 + 3.7, z * 0.11 - 2.1);
      const heightT = Math.max(0, Math.min(1, (y + 6) / 10));
      // base: blend charcoal→basalt with height
      let r = charcoal[0] + (basalt[0] - charcoal[0]) * heightT;
      let gr = charcoal[1] + (basalt[1] - charcoal[1]) * heightT;
      let b = charcoal[2] + (basalt[2] - charcoal[2]) * heightT;
      // broad ash patches
      const ashMix = Math.max(0, Math.min(1, (broad - 0.45) * 1.6));
      r += (ashy[0] - r) * ashMix * 0.6;
      gr += (ashy[1] - gr) * ashMix * 0.6;
      b += (ashy[2] - b) * ashMix * 0.6;
      // fine grain jitter
      const jitter = (grain - 0.5) * 0.08;
      colors[i * 3] = Math.max(0, Math.min(1, r + jitter));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, gr + jitter));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b + jitter));
    }
    pos.needsUpdate = true;
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>
    </RigidBody>
  );
}
