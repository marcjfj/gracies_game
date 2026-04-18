import { RigidBody } from "@react-three/rapier";

type Box = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};

const PLATFORMS: Box[] = [
  { position: [4, 0.5, 0], size: [3, 1, 3], color: "#c97b63" },
  { position: [8, 1.5, 2], size: [3, 1, 3], color: "#d49567" },
  { position: [11, 3, -1], size: [3, 1, 3], color: "#d9a86c" },
  { position: [8, 4.5, -4], size: [3, 1, 3], color: "#c69466" },
  { position: [3, 6, -3], size: [4, 1, 3], color: "#b07a55" },
  { position: [-4, 2, -2], size: [2, 1, 2], color: "#8a6d4e" },
];

export function Platforms() {
  return (
    <>
      {PLATFORMS.map((p, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid" friction={1}>
          <mesh castShadow receiveShadow position={p.position}>
            <boxGeometry args={p.size} />
            <meshStandardMaterial color={p.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
