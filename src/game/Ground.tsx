import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Grid } from "@react-three/drei";

const SIZE = 50;
const THICKNESS = 1;

export function Ground() {
  return (
    <RigidBody type="fixed" colliders={false} friction={1}>
      <CuboidCollider args={[SIZE / 2, THICKNESS / 2, SIZE / 2]} position={[0, -THICKNESS / 2, 0]} />
      <mesh receiveShadow position={[0, -THICKNESS / 2, 0]}>
        <boxGeometry args={[SIZE, THICKNESS, SIZE]} />
        <meshStandardMaterial color="#2d3a2e" />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[SIZE, SIZE]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3f5242"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#6b8f70"
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </RigidBody>
  );
}
