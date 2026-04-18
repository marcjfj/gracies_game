import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { IcosahedronGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Asteroid = {
  position: [number, number, number];
  radius: number;
  scale: [number, number, number];
  color: string;
  seed: number;
};

const ASTEROIDS: Asteroid[] = [
  // Chain A — east climb from spawn (medium)
  { position: [6, 1.8, 2], radius: 2.2, scale: [1, 0.75, 1], color: "#635866", seed: 1 },
  { position: [10, 4, 1], radius: 2, scale: [1.1, 0.7, 1], color: "#6b6270", seed: 2 },
  { position: [14, 6.5, -0.5], radius: 2.2, scale: [1, 0.72, 1.1], color: "#5a5360", seed: 3 },
  { position: [17, 9, -2.5], radius: 1.9, scale: [1.1, 0.72, 1], color: "#6e6474", seed: 4 },

  // Chain B — west short climb (medium)
  { position: [-8, 2.8, 4], radius: 2.3, scale: [1, 0.75, 1], color: "#5e5468", seed: 5 },
  { position: [-12, 5, 6.5], radius: 2, scale: [0.95, 0.78, 1.1], color: "#665c70", seed: 6 },
  { position: [-16, 7.2, 3], radius: 2.2, scale: [1, 0.72, 1], color: "#574f60", seed: 7 },

  // Chain C — far-east high tower (hard)
  { position: [25, 4.5, 15], radius: 2.5, scale: [1, 0.8, 1], color: "#4d4658", seed: 8 },
  { position: [30, 6, 18], radius: 2.2, scale: [1, 0.72, 1.1], color: "#5a536a", seed: 9 },
  { position: [34, 9.4, 20], radius: 2, scale: [1.1, 0.75, 1], color: "#655d78", seed: 10 },
  { position: [37, 13, 17], radius: 2, scale: [1, 0.72, 1], color: "#584f6a", seed: 11 },
  { position: [38, 16.2, 13], radius: 2.3, scale: [1.1, 0.78, 1], color: "#7a7290", seed: 12 },

  // Chain D — back-left mid (medium)
  { position: [-22, 4.5, -12], radius: 2.2, scale: [1, 0.75, 1], color: "#554c5f", seed: 13 },
  { position: [-26, 7.2, -15], radius: 2, scale: [1, 0.72, 1.1], color: "#635a70", seed: 14 },
  { position: [-30, 10, -13], radius: 1.9, scale: [1.1, 0.72, 1], color: "#574e62", seed: 15 },

  // Isolated floaters
  { position: [40, 4.2, -35], radius: 2.5, scale: [1, 0.72, 1], color: "#5a5268", seed: 16 },
  { position: [-40, 5, 28], radius: 2.4, scale: [1, 0.75, 1], color: "#5f566e", seed: 17 },
];

function makeGeometry(radius: number, seed: number, scale: [number, number, number]) {
  const raw = new IcosahedronGeometry(radius, 1);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const g = mergeVertices(raw);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = Math.sin((i + seed * 7.3) * 12.9898) * 43758.5453;
    const r = n - Math.floor(n);
    const factor = 1 + (r - 0.5) * 0.3;
    pos.setXYZ(i, pos.getX(i) * factor, pos.getY(i) * factor, pos.getZ(i) * factor);
  }
  g.scale(scale[0], scale[1], scale[2]);
  g.computeVertexNormals();
  return g;
}

export function Platforms() {
  const geoms = useMemo(
    () => ASTEROIDS.map((a) => makeGeometry(a.radius, a.seed, a.scale)),
    [],
  );
  return (
    <>
      {ASTEROIDS.map((a, i) => (
        <RigidBody key={i} type="fixed" colliders="hull" friction={1} position={a.position}>
          <mesh geometry={geoms[i]} castShadow receiveShadow>
            <meshStandardMaterial color={a.color} roughness={0.95} metalness={0.1} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
