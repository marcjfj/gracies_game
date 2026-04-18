import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { type AnimationClip, type Group, type Object3D } from "three";

export const POODLE_BASE_URL = "/poodle/animations/final_rig/model.glb";

const ANIM_URLS = {
  idle: "/poodle/animations/idle/model_idle.glb",
  walk: "/poodle/animations/walk/model_walk.glb",
  run: "/poodle/animations/run/model_run.glb",
  jumpStart: "/poodle/animations/jump_start/model_jump_start.glb",
  jump: "/poodle/animations/jump/model_jump.glb",
  jumpFall: "/poodle/animations/jump_fall/model_jump_fall.glb",
  jumpEnd: "/poodle/animations/jump_end/model_jump_end.glb",
} as const;

export type PoodleAnim = keyof typeof ANIM_URLS;

type Props = {
  animation: PoodleAnim;
  yOffset?: number;
  scale?: number;
};

export function Poodle({ animation, yOffset = 0, scale = 0.08 }: Props) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(POODLE_BASE_URL);

  const idle = useGLTF(ANIM_URLS.idle);
  const walk = useGLTF(ANIM_URLS.walk);
  const run = useGLTF(ANIM_URLS.run);
  const jumpStart = useGLTF(ANIM_URLS.jumpStart);
  const jump = useGLTF(ANIM_URLS.jump);
  const jumpFall = useGLTF(ANIM_URLS.jumpFall);
  const jumpEnd = useGLTF(ANIM_URLS.jumpEnd);

  useEffect(() => {
    scene.traverse((obj: Object3D) => {
      const m = obj as Object3D & { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene]);

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

useGLTF.preload(POODLE_BASE_URL);
Object.values(ANIM_URLS).forEach((u) => useGLTF.preload(u));
