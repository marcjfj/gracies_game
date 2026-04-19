import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { BoxGeometry, BufferAttribute } from "three";

type FireBlock = {
  position: [number, number, number];
  size: [number, number, number];
  rotationY?: number;
  color: string;
  emissive: string;
  seed: number;
};

// Zig-zag ascent to a summit around y=51. Every platform is a forgiving slab —
// sizes still vary to keep visual interest, but no tightrope beams or thin
// pillars that punish a sloppy landing. Vertical steps stay ~3.3u, well under
// the ~4.2u max jump.
const BLOCKS: FireBlock[] = [
  // LAUNCH PAD east of spawn
  { position: [6.0, 3.0, 1.8], size: [5.2, 0.7, 4.6], color: "#2a2422", emissive: "#ff4410", seed: 1 },

  // Medium slab further east
  { position: [9.5, 6.5, 4.5], size: [3.4, 0.6, 3.2], color: "#2c2523", emissive: "#ff4212", seed: 2 },

  // Turning north
  { position: [8.0, 10.0, 8.8], size: [3.8, 0.6, 3.2], color: "#2c2523", emissive: "#ff4412", seed: 3 },

  // REST PAD — checkpoint
  { position: [3.4, 13.5, 11.2], size: [4.4, 0.7, 3.8], color: "#2f2725", emissive: "#ff4a14", seed: 4 },

  // Small stepping slab
  { position: [-0.6, 17.0, 10.2], size: [2.4, 0.6, 2.4], color: "#2a2422", emissive: "#ff4812", seed: 5 },

  // Medium slab turning west
  { position: [-4.6, 20.5, 7.8], size: [3.4, 0.6, 3.2], color: "#2c2523", emissive: "#ff4412", seed: 6 },

  // Medium slab over open pit
  { position: [-8.6, 23.5, 3.8], size: [3.6, 0.6, 3.2], color: "#2c2523", emissive: "#ff4412", seed: 7 },

  // REST PAD — safe mid-climb checkpoint
  { position: [-10.0, 27.0, -2.2], size: [4.6, 0.75, 4.2], color: "#322925", emissive: "#ff5018", seed: 8 },

  // Slab heading south
  { position: [-6.8, 30.5, -6.2], size: [3.4, 0.6, 3.0], color: "#2c2523", emissive: "#ff4412", seed: 9 },

  // Small stepping slab
  { position: [-2.4, 34.0, -8.4], size: [2.6, 0.6, 2.6], color: "#2a2422", emissive: "#ff4812", seed: 10 },

  // Small slab
  { position: [2.6, 37.5, -7.4], size: [2.4, 0.6, 2.4], color: "#2a2422", emissive: "#ff4812", seed: 11 },

  // Slab starting final spiral
  { position: [6.2, 41.0, -4.0], size: [3.2, 0.6, 3.0], color: "#2c2523", emissive: "#ff4612", seed: 12 },

  // Medium slab
  { position: [4.6, 44.5, 0.8], size: [3.4, 0.6, 3.0], color: "#2c2523", emissive: "#ff4412", seed: 13 },

  // Penultimate slab
  { position: [2.0, 48.0, 4.6], size: [2.8, 0.6, 2.6], color: "#2c2523", emissive: "#ff4612", seed: 14 },

  // SUMMIT — wide finish platform
  { position: [0, 51.0, 0.6], size: [6.4, 0.8, 6.4], color: "#38302b", emissive: "#ff6020", seed: 15 },
];

function jitterColors(
  geometry: BoxGeometry,
  seed: number,
  baseColor: [number, number, number],
) {
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const n = Math.sin((i + seed * 13.7) * 19.19) * 43758.5453;
    const r = n - Math.floor(n);
    const jitter = (r - 0.5) * 0.3;
    colors[i * 3] = Math.max(0, Math.min(1, baseColor[0] + jitter * 0.18));
    colors[i * 3 + 1] = Math.max(0, Math.min(1, baseColor[1] + jitter * 0.12));
    colors[i * 3 + 2] = Math.max(0, Math.min(1, baseColor[2] + jitter * 0.1));
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildGeometry(b: FireBlock) {
  const g = new BoxGeometry(b.size[0], b.size[1], b.size[2], 2, 2, 2);
  // Roughen faces slightly so blocks read as carved rock, not smooth cubes
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = Math.sin((i + b.seed * 7.3) * 12.9898) * 43758.5453;
    const r = n - Math.floor(n);
    const d = (r - 0.5) * 0.08;
    pos.setXYZ(i, pos.getX(i) + d, pos.getY(i) + d * 0.5, pos.getZ(i) + d);
  }
  g.computeVertexNormals();
  jitterColors(g, b.seed, hexToRgb(b.color));
  return g;
}

export function FirePlatforms() {
  const geoms = useMemo(() => BLOCKS.map(buildGeometry), []);
  return (
    <>
      {BLOCKS.map((b, i) => (
        <RigidBody
          key={i}
          type="fixed"
          colliders="cuboid"
          friction={1}
          position={b.position}
          rotation={[0, b.rotationY ?? 0, 0]}
        >
          <mesh geometry={geoms[i]} castShadow receiveShadow>
            <meshStandardMaterial
              vertexColors
              color={b.color}
              roughness={0.88}
              metalness={0.18}
              emissive={b.emissive}
              emissiveIntensity={0.1}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

export const FIRE_PLATFORM_BLOCKS = BLOCKS;
