import { Canvas } from "@react-three/fiber";
import { KeyboardControls, type KeyboardControlsEntry } from "@react-three/drei";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useMemo, useRef } from "react";
import { controlMap, type ControlName } from "../controls";
import { Scene } from "./Scene";
import { Ground } from "./Ground";
import { Platforms } from "./Platforms";
import { Player } from "./Player";
import { FollowCamera } from "./FollowCamera";
import { Crystals } from "./Crystals";

const debug = new URLSearchParams(window.location.search).has("debug");

type Props = {
  collected: ReadonlySet<number>;
  onCollect: (id: number) => void;
};

export function Game({ collected, onCollect }: Props) {
  const playerRef = useRef<RapierRigidBody>(null);
  const map = useMemo<KeyboardControlsEntry<ControlName>[]>(
    () => controlMap.map((c) => ({ name: c.name, keys: [...c.keys] })),
    [],
  );

  return (
    <KeyboardControls map={map}>
      <Canvas shadows camera={{ fov: 60, position: [0, 6, 10], near: 0.1, far: 200 }}>
        <color attach="background" args={["#87b3d9"]} />
        <Suspense fallback={null}>
          <Scene />
          <Physics debug={debug} gravity={[0, -20, 0]}>
            <Ground />
            <Platforms />
            <Crystals collected={collected} onCollect={onCollect} />
            <Player ref={playerRef} spawn={[0, 3, 0]} />
          </Physics>
          <FollowCamera target={playerRef} />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
