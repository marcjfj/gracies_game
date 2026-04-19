import { CylinderCollider, RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import {
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
} from "three";

const PLATFORM_RADIUS = 1.9;
const PLATFORM_HEIGHT = 0.32;
const SOLID_MS = 1400;
const FADE_MS = 1000;

type Props = { position: [number, number, number] };

export function SpawnPlatform({ position }: Props) {
  const startTs = useRef(performance.now());
  const bodyMatRef = useRef<MeshStandardMaterial>(null);
  const rimMatRef = useRef<MeshStandardMaterial>(null);
  const glowMatRef = useRef<MeshBasicMaterial>(null);
  const platformRef = useRef<Group>(null);
  const lightRef = useRef<PointLight>(null);
  const [solid, setSolid] = useState(true);
  const [hidden, setHidden] = useState(false);

  useFrame(() => {
    const elapsed = performance.now() - startTs.current;

    if (elapsed < SOLID_MS) {
      const pulse = Math.sin(elapsed / 180) * 0.25 + 1;
      if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = 1.1 * pulse;
      if (rimMatRef.current) rimMatRef.current.emissiveIntensity = 2.6 * pulse;
      if (lightRef.current) lightRef.current.intensity = 6 * pulse;
      return;
    }

    const t = Math.min(1, (elapsed - SOLID_MS) / FADE_MS);
    const alpha = 1 - t;
    if (bodyMatRef.current) {
      bodyMatRef.current.opacity = alpha;
      bodyMatRef.current.emissiveIntensity = alpha * 1.4;
    }
    if (rimMatRef.current) {
      rimMatRef.current.opacity = alpha * 0.9;
      rimMatRef.current.emissiveIntensity = alpha * 3;
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = alpha * 0.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = alpha * 6;
    }
    if (platformRef.current) {
      platformRef.current.scale.y = Math.max(0.05, 1 - t * 0.7);
      const xz = 1 + t * 0.35;
      platformRef.current.scale.x = xz;
      platformRef.current.scale.z = xz;
    }

    if (t >= 0.2 && solid) setSolid(false);
    if (t >= 1 && !hidden) setHidden(true);
  });

  if (hidden) return null;

  return (
    <>
      {solid && (
        <RigidBody type="fixed" colliders={false} position={position}>
          <CylinderCollider
            args={[PLATFORM_HEIGHT / 2, PLATFORM_RADIUS]}
            position={[0, PLATFORM_HEIGHT / 2, 0]}
          />
        </RigidBody>
      )}
      <group ref={platformRef} position={position}>
        <mesh position={[0, PLATFORM_HEIGHT / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PLATFORM_RADIUS, PLATFORM_RADIUS * 0.85, PLATFORM_HEIGHT, 56]} />
          <meshStandardMaterial
            ref={bodyMatRef}
            color="#3a2f80"
            emissive="#8a5dff"
            emissiveIntensity={1.1}
            transparent
            opacity={1}
            roughness={0.35}
            metalness={0.65}
          />
        </mesh>

        <mesh
          position={[0, PLATFORM_HEIGHT + 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[PLATFORM_RADIUS * 0.82, PLATFORM_RADIUS * 1.02, 72]} />
          <meshStandardMaterial
            ref={rimMatRef}
            color="#ffb3ff"
            emissive="#ff8be6"
            emissiveIntensity={2.6}
            transparent
            opacity={0.9}
            side={DoubleSide}
          />
        </mesh>

        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[PLATFORM_RADIUS * 1.0, PLATFORM_RADIUS * 1.8, 64]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color="#a87bff"
            transparent
            opacity={0.45}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <pointLight
          ref={lightRef}
          position={[0, PLATFORM_HEIGHT + 0.6, 0]}
          color="#c48bff"
          intensity={6}
          distance={8}
          decay={2}
        />
      </group>
    </>
  );
}
