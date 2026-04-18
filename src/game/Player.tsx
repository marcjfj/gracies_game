import { CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Vector3 } from "three";
import type { ControlName } from "../controls";
import { Poodle, type PoodleAnim } from "./Poodle";

const MOVE_SPEED = 5;
const JUMP_VELOCITY = 9;
const GROUND_RAY_LENGTH = 0.15;

const POODLE_SCALE = 0.04;
const POODLE_Y_OFFSET = 1.35;
const POODLE_HALF_X = 0.59;
const POODLE_HALF_Y = 1.25;
const POODLE_HALF_Z = 1.35;
const POODLE_AIR_LIFT = 0.9;

const forward = new Vector3();
const right = new Vector3();
const move = new Vector3();

export type PlayerHandle = RapierRigidBody;

export const Player = forwardRef<PlayerHandle, { spawn?: [number, number, number] }>(
  function Player({ spawn = [0, 3, 0] }, ref) {
    const rb = useRef<RapierRigidBody>(null);
    useImperativeHandle(ref, () => rb.current as RapierRigidBody);

    const { camera } = useThree();
    const { world, rapier } = useRapier();
    const [, get] = useKeyboardControls<ControlName>();


    const [anim, setAnim] = useState<PoodleAnim>("idle");
    const animRef = useRef<PoodleAnim>("idle");
    const inAir = anim === "jump" || anim === "jumpFall";
    const colliderCenterY = POODLE_HALF_Y + (inAir ? POODLE_AIR_LIFT : 0);

    useFrame(() => {
      const body = rb.current;
      if (!body) return;

      const input = get();

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.set(-forward.z, 0, forward.x);

      move.set(0, 0, 0);
      if (input.forward) move.add(forward);
      if (input.backward) move.sub(forward);
      if (input.left) move.sub(right);
      if (input.right) move.add(right);
      const moving = move.lengthSq() > 0;
      if (moving) move.normalize().multiplyScalar(MOVE_SPEED);

      const vel = body.linvel();
      body.setLinvel({ x: move.x, y: vel.y, z: move.z }, true);

      if (moving) {
        const yaw = Math.atan2(move.x, move.z);
        body.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true);
      }

      const groundRayYOffset = animRef.current === "jump" || animRef.current === "jumpFall" ? POODLE_AIR_LIFT : 0;
      const grounded = isGrounded(body, world, rapier, groundRayYOffset);

      if (input.jump && grounded) {
        body.setLinvel({ x: vel.x, y: JUMP_VELOCITY, z: vel.z }, true);
      }

      let next: PoodleAnim;
      if (!grounded) {
        next = vel.y > 0.5 ? "jump" : "jumpFall";
      } else if (moving) {
        next = "run";
      } else {
        next = "idle";
      }

      if (next !== animRef.current) {
        animRef.current = next;
        setAnim(next);
      }
    });

    return (
      <RigidBody
        ref={rb}
        colliders={false}
        position={spawn}
        enabledRotations={[false, true, false]}
        linearDamping={0.5}
        angularDamping={1}
        ccd
      >
        <CuboidCollider args={[POODLE_HALF_X, POODLE_HALF_Y, POODLE_HALF_Z]} position={[0, colliderCenterY, 0]} />
        <Poodle animation={anim} yOffset={POODLE_Y_OFFSET} scale={POODLE_SCALE} />
      </RigidBody>
    );
  },
);

function isGrounded(
  body: RapierRigidBody,
  world: ReturnType<typeof useRapier>["world"],
  rapier: ReturnType<typeof useRapier>["rapier"],
  yLift: number,
): boolean {
  const origin = body.translation();
  const rayOrigin = { x: origin.x, y: origin.y + yLift + 0.05, z: origin.z };
  const maxDist = GROUND_RAY_LENGTH + yLift + 0.05;
  const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 });
  const hit = world.castRay(ray, maxDist, true, undefined, undefined, undefined, body);
  return hit !== null && hit.timeOfImpact <= maxDist;
}
