import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useRef, type RefObject } from "react";
import { Vector3 } from "three";

type Props = {
  target: RefObject<RapierRigidBody>;
  offset?: [number, number, number];
  lerp?: number;
};

export function FollowCamera({ target, offset = [0, 7, 12], lerp = 0.08 }: Props) {
  const { camera } = useThree();
  const desired = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const offsetVec = useRef(new Vector3(...offset));

  useFrame(() => {
    const rb = target.current;
    if (!rb) return;
    const t = rb.translation();
    desired.current.set(t.x + offsetVec.current.x, t.y + offsetVec.current.y, t.z + offsetVec.current.z);
    camera.position.lerp(desired.current, lerp);
    lookAt.current.set(t.x, t.y + 1, t.z);
    camera.lookAt(lookAt.current);
  });

  return null;
}
