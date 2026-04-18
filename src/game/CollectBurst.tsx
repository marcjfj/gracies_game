import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
} from "three";

const DURATION = 0.9;
const SHARD_COUNT = 10;
const SHARD_SPEED = 6;

type Props = {
  position: [number, number, number];
  onDone: () => void;
};

export function CollectBurst({ position, onDone }: Props) {
  const glowRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const shardRefs = useRef<(Mesh | null)[]>([]);
  const tRef = useRef(0);
  const doneRef = useRef(false);

  const shards = useMemo(
    () =>
      Array.from({ length: SHARD_COUNT }, (_, i) => {
        const theta = (i / SHARD_COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const phi = Math.random() * Math.PI - Math.PI / 2;
        return {
          dir: [
            Math.cos(theta) * Math.cos(phi),
            Math.sin(phi) * 0.6 + 0.4,
            Math.sin(theta) * Math.cos(phi),
          ] as [number, number, number],
          speed: SHARD_SPEED * (0.6 + Math.random() * 0.8),
        };
      }),
    [],
  );

  useFrame((_, dt) => {
    if (doneRef.current) return;
    tRef.current += dt;
    const t = Math.min(tRef.current / DURATION, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    if (glowRef.current) {
      const s = 0.3 + eased * 2.6;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as MeshBasicMaterial).opacity = (1 - t) * 0.95;
    }

    if (ringRef.current) {
      const s = 0.2 + eased * 4.5;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as MeshBasicMaterial).opacity = (1 - t) ** 1.4 * 0.85;
    }

    if (lightRef.current) {
      lightRef.current.intensity = (1 - t) ** 2 * 10;
    }

    for (let i = 0; i < shards.length; i++) {
      const m = shardRefs.current[i];
      if (!m) continue;
      const s = shards[i];
      const travel = s.speed * eased;
      m.position.set(s.dir[0] * travel, s.dir[1] * travel, s.dir[2] * travel);
      const scale = (1 - t) * 0.28 + 0.04;
      m.scale.setScalar(scale);
      (m.material as MeshBasicMaterial).opacity = (1 - t) ** 1.2;
    }

    if (t >= 1 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color="#b8d4ff"
        intensity={10}
        distance={14}
        decay={2}
      />
      <mesh ref={glowRef} renderOrder={10}>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshBasicMaterial
          color="#e8f2ff"
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={11}>
        <ringGeometry args={[0.42, 0.5, 48]} />
        <meshBasicMaterial
          color="#bcd9ff"
          transparent
          opacity={0.85}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {shards.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => (shardRefs.current[i] = m)}
          renderOrder={12}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#d7b4ff" : "#bcd9ff"}
            transparent
            opacity={1}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
