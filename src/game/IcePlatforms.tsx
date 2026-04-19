import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { ConeGeometry, IcosahedronGeometry, OctahedronGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { sampleIceTerrainHeight } from "./IceGround";

type Shape = "shard" | "boulder" | "spike";

type IceChunk = {
  position: [number, number, number];
  radius: number;
  scale: [number, number, number];
  color: string;
  seed: number;
  shape: Shape;
};

function onTier(
  x: number,
  z: number,
  liftBase: number,
  radius: number,
  scale: [number, number, number],
  color: string,
  seed: number,
  shape: Shape,
): IceChunk {
  const y = sampleIceTerrainHeight(x, z) + liftBase + radius * scale[1] * 0.55;
  return { position: [x, y, z], radius, scale, color, seed, shape };
}

const CHUNKS: IceChunk[] = [
  // Near spawn — navigable stepping shards
  onTier(6, 2, 0.1, 1.6, [1, 0.9, 1], "#bcd7ef", 1, "shard"),
  onTier(-7, 3, 0.1, 1.8, [1.1, 0.85, 1], "#9ec6e8", 2, "shard"),
  onTier(2, 12, 0.1, 2.0, [1, 0.9, 1.1], "#cde4f7", 3, "boulder"),

  // East tier climb
  onTier(14, -2, 0.2, 2.0, [1, 1.2, 1], "#a6cee8", 4, "spike"),
  onTier(20, -6, 0.2, 2.2, [1, 0.85, 1], "#b8d6ee", 5, "boulder"),
  onTier(26, -10, 0.2, 2.1, [1, 1.0, 1], "#cfe4f5", 6, "shard"),
  onTier(31, -14, 0.3, 1.9, [1, 1.3, 1], "#d9ebf8", 7, "spike"),

  // North glacier-top gardens
  onTier(-4, 24, 0.2, 2.2, [1, 0.8, 1.1], "#a1c8e9", 8, "boulder"),
  onTier(-14, 30, 0.2, 2.0, [1, 1.1, 1], "#b6d4ee", 9, "shard"),
  onTier(6, 34, 0.3, 2.1, [1, 1.4, 1], "#e3f0fa", 10, "spike"),

  // West back-country
  onTier(-22, 8, 0.2, 2.1, [1.1, 0.9, 1], "#9bc2e6", 11, "boulder"),
  onTier(-30, 0, 0.25, 2.3, [1, 1.0, 1.1], "#b1d1ea", 12, "shard"),
  onTier(-34, -10, 0.3, 2.0, [1, 1.25, 1], "#d6e8f6", 13, "spike"),

  // South-east cliff peaks
  onTier(24, 14, 0.3, 2.3, [1, 1.1, 1], "#cbe1f3", 14, "boulder"),
  onTier(32, 22, 0.35, 2.0, [1, 1.4, 1], "#e7f2fa", 15, "spike"),

  // Isolated icebergs
  onTier(-32, 24, 0.15, 2.5, [1.1, 0.75, 1], "#88b4db", 16, "boulder"),
  onTier(38, -30, 0.15, 2.4, [1, 0.8, 1.1], "#9bc2e6", 17, "boulder"),
];

function perturb(geometry: ReturnType<typeof mergeVertices>, seed: number, strength = 0.18) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = Math.sin((i + seed * 7.3) * 12.9898) * 43758.5453;
    const r = n - Math.floor(n);
    const factor = 1 + (r - 0.5) * strength;
    pos.setXYZ(
      i,
      pos.getX(i) * factor,
      pos.getY(i) * factor,
      pos.getZ(i) * factor,
    );
  }
}

function makeShardGeometry(radius: number, seed: number, scale: [number, number, number]) {
  const raw = new OctahedronGeometry(radius, 0);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw);
  perturb(g, seed, 0.12);
  g.scale(scale[0], scale[1] * 1.3, scale[2]);
  g.computeVertexNormals();
  return g;
}

function makeBoulderGeometry(radius: number, seed: number, scale: [number, number, number]) {
  const raw = new IcosahedronGeometry(radius, 1);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw);
  perturb(g, seed, 0.25);
  g.scale(scale[0], scale[1], scale[2]);
  g.computeVertexNormals();
  return g;
}

function makeSpikeGeometry(radius: number, seed: number, scale: [number, number, number]) {
  const raw = new ConeGeometry(radius, radius * 2.4, 6);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw);
  perturb(g, seed, 0.1);
  g.translate(0, radius * 1.2, 0);
  g.scale(scale[0], scale[1], scale[2]);
  g.computeVertexNormals();
  return g;
}

function buildGeometry(chunk: IceChunk) {
  switch (chunk.shape) {
    case "shard":
      return makeShardGeometry(chunk.radius, chunk.seed, chunk.scale);
    case "boulder":
      return makeBoulderGeometry(chunk.radius, chunk.seed, chunk.scale);
    case "spike":
      return makeSpikeGeometry(chunk.radius, chunk.seed, chunk.scale);
  }
}

export function IcePlatforms() {
  const geoms = useMemo(() => CHUNKS.map(buildGeometry), []);
  return (
    <>
      {CHUNKS.map((c, i) => (
        <RigidBody key={i} type="fixed" colliders="hull" friction={0.85} position={c.position}>
          <mesh geometry={geoms[i]} castShadow receiveShadow>
            <meshStandardMaterial
              color={c.color}
              roughness={0.35}
              metalness={0.25}
              emissive={"#1f3a5c"}
              emissiveIntensity={0.12}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

export const ICE_PLATFORM_CHUNKS = CHUNKS;
