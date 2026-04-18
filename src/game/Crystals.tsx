import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RigidBody } from "@react-three/rapier";
import { useMemo, useRef } from "react";
import { Box3, Vector3, type Group, type Mesh, type Object3D } from "three";

const URL = "/crystals/scene.gltf";
const CLUSTER_SCALE = 0.6;
const PICKUP_RADIUS = 0.8;
const SPIN_SPEED = 1.2;
const KEEP_MATERIAL = "Crystal_Self";

const SPAWNS: [number, number, number][] = [
  [4, 1.5, 0],
  [8, 2.5, 2],
  [11, 4, -1],
  [8, 5.5, -4],
  [3, 7, -3],
  [-4, 3, -2],
  [-6, 0.6, 3],
  [2, 0.6, -6],
  [-2, 0.6, 5],
  [6, 0.6, 6],
];

export const CRYSTAL_COUNT = SPAWNS.length;

type Props = {
  collected: ReadonlySet<number>;
  onCollect: (id: number) => void;
};

export function Crystals({ collected, onCollect }: Props) {
  const { scene } = useGLTF(URL);

  const centerOffset = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    const keep: Mesh[] = [];
    const drop: Mesh[] = [];
    scene.traverse((obj: Object3D) => {
      const o = obj as Object3D & { isMesh?: boolean };
      if (!o.isMesh) return;
      const mesh = obj as Mesh;
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mat?.name === KEEP_MATERIAL) {
        mesh.castShadow = true;
        keep.push(mesh);
      } else {
        mesh.visible = false;
        drop.push(mesh);
      }
    });
    void drop;
    const box = new Box3();
    for (const m of keep) box.expandByObject(m);
    const center = box.getCenter(new Vector3());
    return center.negate();
  }, [scene]);

  const spinRefs = useRef<(Group | null)[]>([]);
  useFrame((_, dt) => {
    for (const g of spinRefs.current) {
      if (g) g.rotation.y += SPIN_SPEED * dt;
    }
  });

  return (
    <>
      {SPAWNS.map((pos, i) => {
        if (collected.has(i)) return null;
        return (
          <RigidBody
            key={i}
            type="fixed"
            colliders={false}
            position={pos}
            onIntersectionEnter={() => {
              if (!collected.has(i)) onCollect(i);
            }}
          >
            <BallCollider args={[PICKUP_RADIUS]} sensor />
            <group ref={(g) => (spinRefs.current[i] = g)} scale={CLUSTER_SCALE}>
              <group position={centerOffset}>
                <Clone object={scene} />
              </group>
            </group>
          </RigidBody>
        );
      })}
    </>
  );
}

useGLTF.preload(URL);
