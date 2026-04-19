import {
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Vector3 } from "three";
import type { ControlName } from "../controls";
import { readGamepad } from "../gamepad";
import { isMouseFiring } from "../mouseLook";
import { Character, type CharacterAnim, type CharacterId } from "./Character";

const MOVE_SPEED = 12;
const JUMP_VELOCITY = 13;
const GROUND_RAY_LENGTH = 0.7;
const COYOTE_TIME = 0.15;
const RISE_VEL_THRESHOLD = 4.0;
const FALL_VEL_THRESHOLD = -3.0;

const CHAR_SCALE = 0.04;
const CHAR_Y_OFFSET = 1.35;
const CHAR_RADIUS = 0.55;
const CHAR_CYL_HALF_HEIGHT = 0.7;
const CHAR_HALF_Y = CHAR_CYL_HALF_HEIGHT + CHAR_RADIUS;
const CHAR_AIR_LIFT = 0;

const forward = new Vector3();
const right = new Vector3();
const move = new Vector3();

export type PlayerHandle = RapierRigidBody;

type PlayerProps = {
  spawn?: [number, number, number];
  character: CharacterId;
};

export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { spawn = [0, 3, 0], character },
  ref,
) {
  const rb = useRef<RapierRigidBody>(null);
  useImperativeHandle(ref, () => rb.current as RapierRigidBody);

  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const [, get] = useKeyboardControls<ControlName>();

  const [anim, setAnim] = useState<CharacterAnim>("idle");
  const animRef = useRef<CharacterAnim>("idle");
  const coyoteTimer = useRef(0);
  const inAir = anim === "jump" || anim === "jumpFall";
  const colliderCenterY = CHAR_HALF_Y + (inAir ? CHAR_AIR_LIFT : 0);

  useFrame((_, dt) => {
    const body = rb.current;
    if (!body) return;

    if (body.translation().y < -15) {
      body.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const input = get();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.set(-forward.z, 0, forward.x);

    const gp = readGamepad();

    move.set(0, 0, 0);
    if (input.forward) move.add(forward);
    if (input.backward) move.sub(forward);
    if (input.left) move.sub(right);
    if (input.right) move.add(right);
    if (gp.connected) {
      move.addScaledVector(forward, -gp.moveY);
      move.addScaledVector(right, gp.moveX);
    }
    const moving = move.lengthSq() > 0;
    if (moving) {
      const len = move.length();
      if (len > 1) move.normalize();
      move.multiplyScalar(MOVE_SPEED);
    }

    const vel = body.linvel();
    body.setLinvel({ x: move.x, y: vel.y, z: move.z }, true);

    const firing = input.fire || (gp.connected && gp.fire) || isMouseFiring();
    if (firing && (forward.x !== 0 || forward.z !== 0)) {
      const yaw = Math.atan2(forward.x, forward.z);
      body.setRotation(
        { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
        true,
      );
    } else if (moving) {
      const yaw = Math.atan2(move.x, move.z);
      body.setRotation(
        { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
        true,
      );
    }

    const groundRayYOffset =
      animRef.current === "jump" || animRef.current === "jumpFall"
        ? CHAR_AIR_LIFT
        : 0;
    const grounded = isGrounded(body, world, rapier, groundRayYOffset);

    if (grounded) {
      coyoteTimer.current = COYOTE_TIME;
    } else {
      coyoteTimer.current = Math.max(0, coyoteTimer.current - dt);
    }
    const airborne = coyoteTimer.current <= 0;

    let justJumped = false;
    const jumpPressed = input.jump || (gp.connected && gp.jump);
    if (jumpPressed && grounded) {
      body.setLinvel({ x: vel.x, y: JUMP_VELOCITY, z: vel.z }, true);
      coyoteTimer.current = 0;
      justJumped = true;
    }

    let next: CharacterAnim;
    if (justJumped || vel.y > RISE_VEL_THRESHOLD) {
      next = "jump";
    } else if (airborne && vel.y < FALL_VEL_THRESHOLD) {
      next = "jumpFall";
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
      <CapsuleCollider
        args={[CHAR_CYL_HALF_HEIGHT, CHAR_RADIUS]}
        position={[0, colliderCenterY, 0]}
      />
      <Character
        character={character}
        animation={anim}
        yOffset={CHAR_Y_OFFSET}
        scale={CHAR_SCALE}
      />
    </RigidBody>
  );
});

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
  const hit = world.castRay(
    ray,
    maxDist,
    true,
    undefined,
    undefined,
    undefined,
    body,
  );
  return hit !== null && hit.timeOfImpact <= maxDist;
}
