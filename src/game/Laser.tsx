import { useFrame, useThree } from "@react-three/fiber";
import {
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import { useEffect, useRef, type RefObject } from "react";
import {
  AdditiveBlending,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import type { ControlName } from "../controls";
import { readGamepad } from "../gamepad";
import { isMouseFiring } from "../mouseLook";
import { CROSSHAIR_NDC_Y } from "../crosshair";
import { reportEnemyHit, type EnemyUserData } from "./enemyRegistry";

type Props = {
  playerRef: RefObject<RapierRigidBody>;
  muted?: boolean;
};

const FIRING_SOUND_SRC = "/meow.mp3";
const FIRING_SOUND_VOLUME = 0.5;

const MAX_DIST = 80;
const CORE_RADIUS = 0.04;
const INNER_RADIUS = 0.1;
const OUTER_RADIUS = 0.22;
const MOUTH_UP = 1.75;
const MOUTH_FORWARD = 0.9;
const COLOR_CORE = "#f2fcff";
const COLOR_INNER = "#7fe4ff";
const COLOR_OUTER = "#2a7bff";

const UP = new Vector3(0, 1, 0);
const LOCAL_FORWARD = new Vector3(0, 0, 1);
const _origin = new Vector3();
const _dir = new Vector3();
const _end = new Vector3();
const _mid = new Vector3();
const _quat = new Quaternion();
const _charQuat = new Quaternion();
const _face = new Vector3();
const _camPos = new Vector3();
const _raycaster = new Raycaster();
const _ndc = new Vector2(0, CROSSHAIR_NDC_Y);

export function Laser({ playerRef, muted = false }: Props) {
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const [, get] = useKeyboardControls<ControlName>();

  const firingAudioRef = useRef<HTMLAudioElement | null>(null);
  const wasFiringRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(FIRING_SOUND_SRC);
    audio.loop = true;
    audio.volume = FIRING_SOUND_VOLUME;
    audio.preload = "auto";
    firingAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      firingAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (firingAudioRef.current) firingAudioRef.current.muted = muted;
  }, [muted]);

  const coreRef = useRef<Mesh>(null);
  const innerRef = useRef<Mesh>(null);
  const outerRef = useRef<Mesh>(null);
  const muzzleRef = useRef<Mesh>(null);
  const muzzleHaloRef = useRef<Mesh>(null);
  const impactRef = useRef<Mesh>(null);
  const impactHaloRef = useRef<Mesh>(null);
  const impactLightRef = useRef<PointLight>(null);
  const muzzleLightRef = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    const body = playerRef.current;
    const core = coreRef.current;
    const inner = innerRef.current;
    const outer = outerRef.current;
    const muzzle = muzzleRef.current;
    const muzzleHalo = muzzleHaloRef.current;
    const impact = impactRef.current;
    const impactHalo = impactHaloRef.current;
    const impactLight = impactLightRef.current;
    const muzzleLight = muzzleLightRef.current;
    if (
      !body ||
      !core ||
      !inner ||
      !outer ||
      !muzzle ||
      !muzzleHalo ||
      !impact ||
      !impactHalo ||
      !impactLight ||
      !muzzleLight
    ) {
      return;
    }

    const keys = get();
    const gp = readGamepad();
    const firing = keys.fire || (gp.connected && gp.fire) || isMouseFiring();

    if (firing !== wasFiringRef.current) {
      const audio = firingAudioRef.current;
      if (audio) {
        if (firing) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      wasFiringRef.current = firing;
    }

    if (!firing) {
      core.visible = false;
      inner.visible = false;
      outer.visible = false;
      muzzle.visible = false;
      muzzleHalo.visible = false;
      impact.visible = false;
      impactHalo.visible = false;
      impactLight.intensity = 0;
      muzzleLight.intensity = 0;
      return;
    }

    const t = body.translation();
    const r = body.rotation();
    _charQuat.set(r.x, r.y, r.z, r.w);
    _face.copy(LOCAL_FORWARD).applyQuaternion(_charQuat);
    _origin.set(t.x, t.y + MOUTH_UP, t.z).addScaledVector(_face, MOUTH_FORWARD);

    _raycaster.setFromCamera(_ndc, camera);
    _dir.copy(_raycaster.ray.direction);
    _camPos.copy(_raycaster.ray.origin);

    const rayMax = _camPos.distanceTo(_origin) + MAX_DIST;
    const ray = new rapier.Ray(_camPos, _dir);
    const hit = world.castRay(
      ray,
      rayMax,
      true,
      undefined,
      undefined,
      undefined,
      body,
    );

    if (hit) {
      _end.copy(_camPos).addScaledVector(_dir, hit.timeOfImpact);
      const ud = hit.collider.parent()?.userData as EnemyUserData | undefined;
      if (ud?.type === "enemy") reportEnemyHit(ud.id);
    } else {
      _end.copy(_origin).addScaledVector(_dir, MAX_DIST);
    }

    _dir.copy(_end).sub(_origin);
    const len = Math.max(0.01, _dir.length());
    _dir.normalize();

    _mid.copy(_origin).addScaledVector(_dir, len * 0.5);
    _quat.setFromUnitVectors(UP, _dir);

    const time = clock.elapsedTime;
    const fast = 0.85 + Math.sin(time * 42) * 0.15;
    const mid = 0.75 + Math.sin(time * 17 + 1.3) * 0.25;
    const slow = 0.7 + Math.sin(time * 9) * 0.3;
    const flicker = 0.92 + (Math.sin(time * 73) + Math.sin(time * 57)) * 0.04;
    const widthFast = 0.9 + Math.sin(time * 26) * 0.25;
    const widthSlow = 1 + Math.sin(time * 12 + 0.7) * 0.35;

    // Core beam
    core.position.copy(_mid);
    core.quaternion.copy(_quat);
    core.scale.set(fast * flicker, len, fast * flicker);
    core.visible = true;

    // Inner beam
    inner.position.copy(_mid);
    inner.quaternion.copy(_quat);
    inner.scale.set(widthFast, len, widthFast);
    (inner.material as MeshBasicMaterial).opacity = 0.65 * mid;
    inner.visible = true;

    // Outer halo beam
    outer.position.copy(_mid);
    outer.quaternion.copy(_quat);
    outer.scale.set(widthSlow * 1.4, len, widthSlow * 1.4);
    (outer.material as MeshBasicMaterial).opacity = 0.3 * slow;
    outer.visible = true;

    // Muzzle flash
    muzzle.position.copy(_origin);
    muzzle.scale.setScalar(0.18 + fast * 0.18);
    muzzle.visible = true;
    muzzleHalo.position.copy(_origin);
    muzzleHalo.scale.setScalar(0.55 + slow * 0.5);
    (muzzleHalo.material as MeshBasicMaterial).opacity = 0.45 * mid;
    muzzleHalo.visible = true;

    muzzleLight.position.copy(_origin).addScaledVector(_dir, 0.3);
    muzzleLight.intensity = 6 + fast * 6;

    // Impact
    const hitActive = !!hit;
    impact.visible = hitActive;
    impactHalo.visible = hitActive;
    if (hitActive) {
      impact.position.copy(_end);
      impact.scale.setScalar(0.22 + fast * 0.22);
      impactHalo.position.copy(_end);
      impactHalo.scale.setScalar(0.55 + slow * 0.8);
      (impactHalo.material as MeshBasicMaterial).opacity = 0.5 * mid;
      impactLight.position.copy(_end);
      impactLight.intensity = 10 + slow * 14;
    } else {
      impactLight.intensity = 0;
    }
  });

  return (
    <group>
      <mesh ref={coreRef} visible={false}>
        <cylinderGeometry args={[CORE_RADIUS, CORE_RADIUS, 1, 8, 1, true]} />
        <meshBasicMaterial
          color={COLOR_CORE}
          transparent
          opacity={1}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={innerRef} visible={false}>
        <cylinderGeometry args={[INNER_RADIUS, INNER_RADIUS, 1, 12, 1, true]} />
        <meshBasicMaterial
          color={COLOR_INNER}
          transparent
          opacity={0.7}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={outerRef} visible={false}>
        <cylinderGeometry args={[OUTER_RADIUS, OUTER_RADIUS, 1, 14, 1, true]} />
        <meshBasicMaterial
          color={COLOR_OUTER}
          transparent
          opacity={0.3}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={muzzleRef} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={COLOR_CORE}
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={muzzleHaloRef} visible={false}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial
          color={COLOR_INNER}
          transparent
          opacity={0.45}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={muzzleLightRef}
        color={COLOR_INNER}
        intensity={0}
        distance={5}
        decay={2}
      />

      <mesh ref={impactRef} visible={false}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial
          color={COLOR_CORE}
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={impactHaloRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={COLOR_INNER}
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={impactLightRef}
        color={COLOR_INNER}
        intensity={0}
        distance={9}
        decay={2}
      />
    </group>
  );
}
