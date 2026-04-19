import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  type AnimationClip,
  Color,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three";
import { getPlayerHitTick } from "../playerFlash";

const FLASH_RED = new Color("#ff1a2a");
const FLASH_DECAY = 4;
const FLASH_INTENSITY = 3.5;

type MatEntry = {
  mat: MeshStandardMaterial;
  origEmissive: Color;
  origIntensity: number;
};

export type CharacterId = "poodle" | "the_cat";

export type CharacterAnim =
  | "idle"
  | "walk"
  | "run"
  | "jumpStart"
  | "jump"
  | "jumpFall"
  | "jumpEnd";

const ANIM_FILENAMES: Record<CharacterAnim, string> = {
  idle: "idle/model_idle.glb",
  walk: "walk/model_walk.glb",
  run: "run/model_run.glb",
  jumpStart: "jump_start/model_jump_start.glb",
  jump: "jump/model_jump.glb",
  jumpFall: "jump_fall/model_jump_fall.glb",
  jumpEnd: "jump_end/model_jump_end.glb",
};

type CharacterConfig = {
  id: CharacterId;
  label: string;
  blurb: string;
  baseUrl: string;
  animUrls: Record<CharacterAnim, string>;
};

function buildConfig(id: CharacterId, label: string, blurb: string): CharacterConfig {
  const animUrls = Object.fromEntries(
    (Object.entries(ANIM_FILENAMES) as [CharacterAnim, string][]).map(([k, v]) => [
      k,
      `/${id}/animations/${v}`,
    ]),
  ) as Record<CharacterAnim, string>;
  return {
    id,
    label,
    blurb,
    baseUrl: `/${id}/animations/final_rig/model.glb`,
    animUrls,
  };
}

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  poodle: buildConfig("poodle", "Poodle", "Fluffy. Fearless. First on the scene."),
  the_cat: buildConfig("the_cat", "The Cat", "Quiet paws, cosmic curiosity."),
};

export const CHARACTER_ORDER: readonly CharacterId[] = ["poodle", "the_cat"] as const;

type Props = {
  character: CharacterId;
  animation: CharacterAnim;
  yOffset?: number;
  scale?: number;
};

export function Character({ character, animation, yOffset = 0, scale = 0.08 }: Props) {
  const cfg = CHARACTERS[character];
  const group = useRef<Group>(null);
  const { scene } = useGLTF(cfg.baseUrl);

  const idle = useGLTF(cfg.animUrls.idle);
  const walk = useGLTF(cfg.animUrls.walk);
  const run = useGLTF(cfg.animUrls.run);
  const jumpStart = useGLTF(cfg.animUrls.jumpStart);
  const jump = useGLTF(cfg.animUrls.jump);
  const jumpFall = useGLTF(cfg.animUrls.jumpFall);
  const jumpEnd = useGLTF(cfg.animUrls.jumpEnd);

  const matEntriesRef = useRef<MatEntry[]>([]);

  useEffect(() => {
    const entries: MatEntry[] = [];
    scene.traverse((obj: Object3D) => {
      const mesh = obj as Mesh & {
        isMesh?: boolean;
        castShadow?: boolean;
        receiveShadow?: boolean;
      };
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const collect = (mat: unknown) => {
        const std = mat as MeshStandardMaterial;
        if (std && "emissive" in std && std.emissive) {
          entries.push({
            mat: std,
            origEmissive: std.emissive.clone(),
            origIntensity: std.emissiveIntensity ?? 1,
          });
        }
      };
      if (Array.isArray(mesh.material)) mesh.material.forEach(collect);
      else if (mesh.material) collect(mesh.material);
    });
    matEntriesRef.current = entries;
    return () => {
      for (const e of entries) {
        e.mat.emissive.copy(e.origEmissive);
        e.mat.emissiveIntensity = e.origIntensity;
      }
    };
  }, [scene]);

  const flashRef = useRef(0);
  const prevTickRef = useRef(getPlayerHitTick());

  useFrame((_, dt) => {
    const tick = getPlayerHitTick();
    if (tick !== prevTickRef.current) {
      flashRef.current = 1;
      prevTickRef.current = tick;
    }
    const f = flashRef.current;
    for (const e of matEntriesRef.current) {
      e.mat.emissive.copy(e.origEmissive).lerp(FLASH_RED, f);
      e.mat.emissiveIntensity = e.origIntensity + f * FLASH_INTENSITY;
    }
    if (f > 0) flashRef.current = Math.max(0, f - dt * FLASH_DECAY);
  });

  const clips = useMemo<AnimationClip[]>(() => {
    const tag = (arr: AnimationClip[], name: string) =>
      arr.map((c) => {
        const cl = c.clone();
        cl.name = name;
        return cl;
      });
    return [
      ...tag(idle.animations, "idle"),
      ...tag(walk.animations, "walk"),
      ...tag(run.animations, "run"),
      ...tag(jumpStart.animations, "jumpStart"),
      ...tag(jump.animations, "jump"),
      ...tag(jumpFall.animations, "jumpFall"),
      ...tag(jumpEnd.animations, "jumpEnd"),
    ];
  }, [idle, walk, run, jumpStart, jump, jumpFall, jumpEnd]);

  const { actions } = useAnimations(clips, group);

  useEffect(() => {
    const next = actions[animation];
    if (!next) return;
    next.reset().fadeIn(0.15).play();
    return () => {
      next.fadeOut(0.15);
    };
  }, [animation, actions]);

  return (
    <group ref={group} position={[0, yOffset, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

export function preloadCharacter(id: CharacterId) {
  const cfg = CHARACTERS[id];
  useGLTF.preload(cfg.baseUrl);
  for (const url of Object.values(cfg.animUrls)) useGLTF.preload(url);
}
