import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Billboard, useGLTF } from "@react-three/drei";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Color,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import {
  registerEnemyHitHandler,
  unregisterEnemyHitHandler,
} from "./enemyRegistry";
import { sampleTerrainHeight } from "./Ground";

const LABUBU_URL = "/labubu/glb/model.glb";

type EnemySpec = {
  id: number;
  spawn: [number, number, number];
};

const MAX_HP = 60;
const WALK_SPEED = 2.4;
const CHARGE_SPEED = 6;
const DETECT_RADIUS = 14;
const LOSE_RADIUS = 22;
const WANDER_RADIUS = 10;
const WANDER_PICK_DIST = 1.5;
const CONTACT_RADIUS = 1.9;
const CONTACT_DAMAGE = 8;
const CONTACT_COOLDOWN = 0.6;

const MODEL_SCALE = 3.5;
const MODEL_Y_OFFSET = 1.7;
const MODEL_YAW_OFFSET = -Math.PI / 2; // rotate if model ships facing a different axis
const WALK_TILT = 0.18;
const CHARGE_TILT = 0.3;
const WALK_BOUNCE = 0.06;
const CHARGE_BOUNCE = 0.12;
const WALK_FREQ = 8;
const CHARGE_FREQ = 14;

const HB_WIDTH = 1.2;
const HB_HEIGHT = 0.11;
const HB_Y = 3.75;
const HB_FADE_IN = 0.25;
const COLOR_HIGH = new Color("#4dffb1");
const COLOR_MID = new Color("#ffd64d");
const COLOR_LOW = new Color("#ff4d6d");
const HIT_GLOW_COLOR = new Color("#9fe8ff");
const HIT_GLOW_INTENSITY = 4;
const _colorTmp = new Color();

function ground(x: number, z: number, lift: number): [number, number, number] {
  return [x, sampleTerrainHeight(x, z) + lift, z];
}

const ENEMIES: EnemySpec[] = [
  { id: 0, spawn: ground(22, 8, 2) },
  { id: 1, spawn: ground(-20, -14, 2) },
  { id: 2, spawn: ground(10, 26, 2) },
  { id: 3, spawn: ground(-24, 4, 2) },
  { id: 4, spawn: ground(28, -20, 2) },
];

type Props = {
  playerRef: RefObject<RapierRigidBody>;
  onPlayerDamage: (amount: number) => void;
};

export function Enemies({ playerRef, onPlayerDamage }: Props) {
  const damageRef = useRef(onPlayerDamage);
  damageRef.current = onPlayerDamage;

  return (
    <>
      {ENEMIES.map((spec) => (
        <Enemy
          key={spec.id}
          spec={spec}
          playerRef={playerRef}
          damageRef={damageRef}
        />
      ))}
    </>
  );
}

type EnemyProps = {
  spec: EnemySpec;
  playerRef: RefObject<RapierRigidBody>;
  damageRef: React.MutableRefObject<(amount: number) => void>;
};

type HitMatEntry = {
  mat: MeshStandardMaterial;
  origEmissive: Color;
  origIntensity: number;
};

function useLabubuInstance() {
  const { scene } = useGLTF(LABUBU_URL);

  return useMemo(() => {
    const root = scene.clone(true);
    const entries: HitMatEntry[] = [];

    const processMat = (m: Material): Material => {
      const cloned = m.clone();
      const std = cloned as MeshStandardMaterial;
      if ("emissive" in std && std.emissive) {
        entries.push({
          mat: std,
          origEmissive: std.emissive.clone(),
          origIntensity: std.emissiveIntensity ?? 1,
        });
      }
      return cloned;
    };

    root.traverse((obj: Object3D) => {
      const mesh = obj as Mesh;
      if (!(mesh as Mesh & { isMesh?: boolean }).isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(processMat);
      } else if (mesh.material) {
        mesh.material = processMat(mesh.material);
      }
    });

    return { scene: root, materials: entries };
  }, [scene]);
}

function Enemy({ spec, playerRef, damageRef }: EnemyProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const [alive, setAlive] = useState(true);
  const hpRef = useRef(MAX_HP);
  const flashRef = useRef(0);
  const chargeRef = useRef(false);
  const contactCooldownRef = useRef(0);
  const wanderTargetRef = useRef<[number, number]>([
    spec.spawn[0] + (Math.random() - 0.5) * 6,
    spec.spawn[2] + (Math.random() - 0.5) * 6,
  ]);
  const animGroupRef = useRef<Group>(null);
  const modelGroupRef = useRef<Group>(null);
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);
  const movingIntensityRef = useRef(0);
  const healthBarGroupRef = useRef<Group>(null);
  const healthBarFillRef = useRef<Mesh>(null);
  const healthBarBgMatRef = useRef<MeshBasicMaterial>(null);
  const healthBarFillMatRef = useRef<MeshBasicMaterial>(null);
  const healthBarFrameMatRef = useRef<MeshBasicMaterial>(null);
  const barFadeRef = useRef(0);
  const hasBeenHitRef = useRef(false);

  const { scene: modelScene, materials: modelMaterials } = useLabubuInstance();
  const materialsRef = useRef(modelMaterials);
  materialsRef.current = modelMaterials;

  const handleHit = useCallback(() => {
    if (hpRef.current <= 0) return;
    hpRef.current -= 1;
    flashRef.current = 1;
    hasBeenHitRef.current = true;
    if (hpRef.current <= 0) setAlive(false);
  }, []);

  useEffect(() => {
    registerEnemyHitHandler(spec.id, handleHit);
    return () => unregisterEnemyHitHandler(spec.id);
  }, [spec.id, handleHit]);

  useFrame((_, dt) => {
    if (!alive) return;
    const rb = rbRef.current;
    const player = playerRef.current;
    if (!rb || !player) return;

    const t = rb.translation();
    const p = player.translation();
    const dx = p.x - t.x;
    const dz = p.z - t.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (!chargeRef.current && dist < DETECT_RADIUS) chargeRef.current = true;
    else if (chargeRef.current && dist > LOSE_RADIUS) chargeRef.current = false;

    let targetX: number;
    let targetZ: number;
    let speed: number;

    if (chargeRef.current) {
      targetX = p.x;
      targetZ = p.z;
      speed = CHARGE_SPEED;
    } else {
      const [wx, wz] = wanderTargetRef.current;
      const wdx = wx - t.x;
      const wdz = wz - t.z;
      const wdist = Math.hypot(wdx, wdz);
      if (wdist < WANDER_PICK_DIST) {
        const angle = Math.random() * Math.PI * 2;
        const radius = WANDER_RADIUS * (0.3 + Math.random() * 0.7);
        wanderTargetRef.current = [
          spec.spawn[0] + Math.cos(angle) * radius,
          spec.spawn[2] + Math.sin(angle) * radius,
        ];
      }
      targetX = wanderTargetRef.current[0];
      targetZ = wanderTargetRef.current[1];
      speed = WALK_SPEED;
    }

    const moveDx = targetX - t.x;
    const moveDz = targetZ - t.z;
    const moveDist = Math.hypot(moveDx, moveDz);
    let vx = 0;
    let vz = 0;
    if (moveDist > 0.1) {
      vx = (moveDx / moveDist) * speed;
      vz = (moveDz / moveDist) * speed;
    }

    const vel = rb.linvel();
    rb.setLinvel({ x: vx, y: vel.y, z: vz }, true);

    if (vx !== 0 || vz !== 0) {
      const yaw = Math.atan2(vx, vz);
      rb.setRotation(
        { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
        true,
      );
    }

    contactCooldownRef.current = Math.max(0, contactCooldownRef.current - dt);
    if (dist < CONTACT_RADIUS && contactCooldownRef.current <= 0) {
      damageRef.current(CONTACT_DAMAGE);
      contactCooldownRef.current = CONTACT_COOLDOWN;
    }

    // Fake walk: side-to-side tilt + small bounce while moving
    const speedMag = Math.hypot(vx, vz);
    const targetMoving = speedMag > 0.2 ? 1 : 0;
    movingIntensityRef.current +=
      (targetMoving - movingIntensityRef.current) * Math.min(1, dt * 8);
    const freq = chargeRef.current ? CHARGE_FREQ : WALK_FREQ;
    const tilt = chargeRef.current ? CHARGE_TILT : WALK_TILT;
    const bounce = chargeRef.current ? CHARGE_BOUNCE : WALK_BOUNCE;
    walkPhaseRef.current += dt * freq * movingIntensityRef.current;
    const phase = walkPhaseRef.current;
    if (animGroupRef.current) {
      const rollTarget = Math.sin(phase) * tilt * movingIntensityRef.current;
      const bounceTarget =
        Math.abs(Math.sin(phase)) * bounce * movingIntensityRef.current;
      const yTarget = MODEL_Y_OFFSET + bounceTarget;
      const k = Math.min(1, dt * 10);
      animGroupRef.current.rotation.z +=
        (rollTarget - animGroupRef.current.rotation.z) * k;
      animGroupRef.current.position.y +=
        (yTarget - animGroupRef.current.position.y) * k;
      const popScale = MODEL_SCALE * (1 + flashRef.current * 0.12);
      animGroupRef.current.scale.setScalar(popScale);
    }

    const f = flashRef.current;
    for (const e of materialsRef.current) {
      e.mat.emissive.copy(e.origEmissive).lerp(HIT_GLOW_COLOR, f);
      e.mat.emissiveIntensity = e.origIntensity + f * HIT_GLOW_INTENSITY;
    }
    flashRef.current = Math.max(0, flashRef.current - dt * 5);

    // Health bar
    const showBar = hasBeenHitRef.current;
    if (healthBarGroupRef.current) healthBarGroupRef.current.visible = showBar;
    if (showBar) {
      barFadeRef.current = Math.min(1, barFadeRef.current + dt / HB_FADE_IN);
      const ratio = Math.max(0, hpRef.current / MAX_HP);
      if (healthBarFillRef.current) {
        healthBarFillRef.current.scale.x = Math.max(0.0001, ratio);
        healthBarFillRef.current.position.x = HB_WIDTH * 0.5 * ratio;
      }
      if (healthBarFillMatRef.current) {
        if (ratio > 0.6) {
          _colorTmp.copy(COLOR_MID).lerp(COLOR_HIGH, (ratio - 0.6) / 0.4);
        } else if (ratio > 0.3) {
          _colorTmp.copy(COLOR_LOW).lerp(COLOR_MID, (ratio - 0.3) / 0.3);
        } else {
          _colorTmp.copy(COLOR_LOW);
        }
        healthBarFillMatRef.current.color.copy(_colorTmp);
        healthBarFillMatRef.current.opacity = 0.95 * barFadeRef.current;
      }
      if (healthBarBgMatRef.current) {
        healthBarBgMatRef.current.opacity = 0.75 * barFadeRef.current;
      }
      if (healthBarFrameMatRef.current) {
        healthBarFrameMatRef.current.opacity = 0.9 * barFadeRef.current;
      }
    }
  });

  if (!alive) return null;

  return (
    <RigidBody
      ref={rbRef}
      colliders={false}
      type="dynamic"
      position={spec.spawn}
      enabledRotations={[false, true, false]}
      linearDamping={0.5}
      angularDamping={1}
      userData={{ type: "enemy", id: spec.id }}
    >
      <CapsuleCollider args={[0.55, 0.45]} position={[0, 1.0, 0]} />
      <group
        ref={animGroupRef}
        position={[0, MODEL_Y_OFFSET, 0]}
        scale={MODEL_SCALE}
      >
        <group ref={modelGroupRef} rotation={[0, MODEL_YAW_OFFSET, 0]}>
          <primitive object={modelScene} />
        </group>
      </group>
      <Billboard position={[0, HB_Y, 0]}>
        <group ref={healthBarGroupRef} visible={false}>
          <mesh renderOrder={10}>
            <planeGeometry args={[HB_WIDTH + 0.08, HB_HEIGHT + 0.06]} />
            <meshBasicMaterial
              ref={healthBarFrameMatRef}
              color="#0a0a14"
              transparent
              opacity={0.9}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
          <mesh position={[0, 0, 0.001]} renderOrder={11}>
            <planeGeometry args={[HB_WIDTH, HB_HEIGHT]} />
            <meshBasicMaterial
              ref={healthBarBgMatRef}
              color="#2a1218"
              transparent
              opacity={0.75}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
          <group position={[-HB_WIDTH * 0.5, 0, 0.002]}>
            <mesh
              ref={healthBarFillRef}
              position={[HB_WIDTH * 0.5, 0, 0]}
              renderOrder={12}
            >
              <planeGeometry args={[HB_WIDTH, HB_HEIGHT]} />
              <meshBasicMaterial
                ref={healthBarFillMatRef}
                color="#4dffb1"
                transparent
                opacity={0.95}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      </Billboard>
    </RigidBody>
  );
}

useGLTF.preload(LABUBU_URL);
