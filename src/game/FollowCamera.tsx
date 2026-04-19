import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useRef, type RefObject } from "react";
import { Vector3 } from "three";
import { readGamepad } from "../gamepad";
import { readMouseDelta } from "../mouseLook";

type Props = {
  target: RefObject<RapierRigidBody>;
  offset?: [number, number, number];
  lerp?: number;
};

const LOOK_AT_HEIGHT = 1;
const CAM_YAW_SPEED = 2.5;
const CAM_PITCH_SPEED = 1.8;
const MOUSE_YAW_SENS = 0.0022;
const MOUSE_PITCH_SENS = 0.0022;
const PITCH_MIN = -0.9;
const PITCH_MAX = 1.2;
const AIM_LOOKAT_BIAS_Y = 3.2;

export function FollowCamera({ target, offset = [0, 7, 12], lerp = 0.08 }: Props) {
  const { camera } = useThree();
  const desired = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);

  const horiz = Math.hypot(offset[0], offset[2]);
  const vert = offset[1] - LOOK_AT_HEIGHT;
  const baseYaw = useRef(Math.atan2(offset[0], offset[2]));
  const basePitch = useRef(Math.atan2(vert, horiz));
  const baseRadius = useRef(Math.hypot(horiz, vert));

  useFrame((_, dt) => {
    const rb = target.current;
    if (!rb) return;
    const gp = readGamepad();
    if (gp.connected) {
      yaw.current -= gp.camX * CAM_YAW_SPEED * dt;
      pitch.current += gp.camY * CAM_PITCH_SPEED * dt;
    }
    const md = readMouseDelta();
    if (md.locked) {
      yaw.current -= md.dx * MOUSE_YAW_SENS;
      pitch.current += md.dy * MOUSE_PITCH_SENS;
    }
    const pitchMin = PITCH_MIN - basePitch.current;
    const pitchMax = PITCH_MAX - basePitch.current;
    if (pitch.current < pitchMin) pitch.current = pitchMin;
    if (pitch.current > pitchMax) pitch.current = pitchMax;
    const yawAngle = baseYaw.current + yaw.current;
    const pitchAngle = basePitch.current + pitch.current;
    const h = Math.cos(pitchAngle) * baseRadius.current;
    const v = Math.sin(pitchAngle) * baseRadius.current;
    const t = rb.translation();
    desired.current.set(
      t.x + Math.sin(yawAngle) * h,
      t.y + LOOK_AT_HEIGHT + v,
      t.z + Math.cos(yawAngle) * h,
    );
    camera.position.lerp(desired.current, lerp);
    lookAt.current.set(
      t.x,
      t.y + LOOK_AT_HEIGHT + AIM_LOOKAT_BIAS_Y,
      t.z,
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}
