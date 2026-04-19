import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import {
  CanvasTexture,
  type Mesh,
  PlaneGeometry,
  type PointLight,
  RepeatWrapping,
} from "three";

const LAVA_START_Y = -5;
const LAVA_RISE_SPEED = 0.45; // units / second
const LAVA_MAX_Y = 58;
const LAVA_SIZE = 240;
const LAVA_SEGMENTS = 48;
const DAMAGE_PER_TICK = 14;
const DAMAGE_INTERVAL = 0.4;

type Props = {
  playerRef: RefObject<RapierRigidBody>;
  onPlayerDamage: (amount: number) => void;
};

function buildLavaTexture(): CanvasTexture {
  const SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // Dark magma base
  const base = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  base.addColorStop(0, "#5a1404");
  base.addColorStop(1, "#3a0a02");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Blobs of glowing magma
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = 18 + Math.random() * 70;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, "rgba(255, 220, 130, 0.95)");
    grd.addColorStop(0.35, "rgba(255, 130, 40, 0.7)");
    grd.addColorStop(1, "rgba(180, 40, 10, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Dark basalt "crust" cracks for contrast
  ctx.strokeStyle = "rgba(15, 4, 2, 0.55)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    let x = Math.random() * SIZE;
    let y = Math.random() * SIZE;
    ctx.moveTo(x, y);
    const segments = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < segments; s++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Tiny speckled bright embers
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const a = 0.3 + Math.random() * 0.7;
    ctx.fillStyle = `rgba(255, 210, 120, ${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function Lava({ playerRef, onPlayerDamage }: Props) {
  const meshRef = useRef<Mesh>(null);
  const glowLightRef = useRef<PointLight>(null);
  const damageRef = useRef(onPlayerDamage);
  damageRef.current = onPlayerDamage;
  const lavaYRef = useRef(LAVA_START_Y);
  const damageCooldownRef = useRef(0);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const g = new PlaneGeometry(LAVA_SIZE, LAVA_SIZE, LAVA_SEGMENTS, LAVA_SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const diffuseTexture = useMemo(buildLavaTexture, []);
  const emissiveTexture = useMemo(buildLavaTexture, []);

  useFrame((_, dt) => {
    timeRef.current += dt;
    const t = timeRef.current;
    const mesh = meshRef.current;
    if (!mesh) return;

    lavaYRef.current = Math.min(
      LAVA_MAX_Y,
      lavaYRef.current + LAVA_RISE_SPEED * dt,
    );
    mesh.position.y = lavaYRef.current;

    if (glowLightRef.current) {
      glowLightRef.current.position.y = lavaYRef.current + 1.2;
      glowLightRef.current.intensity = 6 + Math.sin(t * 2.1) * 1.2;
    }

    // Scroll the texture for a flowing magma feel
    diffuseTexture.offset.x = t * 0.012;
    diffuseTexture.offset.y = t * 0.008;
    emissiveTexture.offset.x = -t * 0.009;
    emissiveTexture.offset.y = t * 0.014;

    // Animate surface ripples
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const wave =
        Math.sin(x * 0.11 + t * 0.8) * 0.18 +
        Math.sin(z * 0.09 + t * 0.55) * 0.15 +
        Math.sin((x + z) * 0.06 + t * 0.4) * 0.12;
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;

    // Damage when player is below the surface
    damageCooldownRef.current = Math.max(0, damageCooldownRef.current - dt);
    const player = playerRef.current;
    if (!player) return;
    const pt = player.translation();
    const submerged = pt.y < lavaYRef.current + 0.35;
    if (submerged && damageCooldownRef.current <= 0) {
      damageRef.current(DAMAGE_PER_TICK);
      damageCooldownRef.current = DAMAGE_INTERVAL;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[0, LAVA_START_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={diffuseTexture}
          emissiveMap={emissiveTexture}
          color="#ffa060"
          emissive="#ff7020"
          emissiveIntensity={2.0}
          roughness={0.3}
          metalness={0.12}
        />
      </mesh>
      <pointLight
        ref={glowLightRef}
        position={[0, LAVA_START_Y + 1.2, 0]}
        color="#ff5a10"
        intensity={6}
        distance={50}
        decay={2}
      />
    </group>
  );
}
