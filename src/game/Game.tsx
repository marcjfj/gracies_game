import { Canvas } from "@react-three/fiber";
import { KeyboardControls, type KeyboardControlsEntry } from "@react-three/drei";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { controlMap, type ControlName } from "../controls";
import { Scene } from "./Scene";
import { Ground } from "./Ground";
import { Platforms } from "./Platforms";
import { Player } from "./Player";
import { FollowCamera } from "./FollowCamera";
import { Crystals } from "./Crystals";
import { CollectBurst } from "./CollectBurst";

const debug = new URLSearchParams(window.location.search).has("debug");

type Props = {
  collected: ReadonlySet<number>;
  onCollect: (id: number) => void;
};

type Burst = { key: number; position: [number, number, number] };

export function Game({ collected, onCollect }: Props) {
  const playerRef = useRef<RapierRigidBody>(null);
  const map = useMemo<KeyboardControlsEntry<ControlName>[]>(
    () => controlMap.map((c) => ({ name: c.name, keys: [...c.keys] })),
    [],
  );

  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstIdRef = useRef(0);

  const handleCollect = useCallback(
    (id: number, position: [number, number, number]) => {
      onCollect(id);
      const key = ++burstIdRef.current;
      setBursts((prev) => [...prev, { key, position }]);
    },
    [onCollect],
  );

  const removeBurst = useCallback((key: number) => {
    setBursts((prev) => prev.filter((b) => b.key !== key));
  }, []);

  return (
    <KeyboardControls map={map}>
      <Canvas shadows camera={{ fov: 60, position: [0, 7, 12], near: 0.1, far: 500 }}>
        <color attach="background" args={["#05060d"]} />
        <fog attach="fog" args={["#0a0a18", 80, 220]} />
        <Suspense fallback={null}>
          <Scene />
          <Physics debug={debug} gravity={[0, -20, 0]}>
            <Ground />
            <Platforms />
            <Crystals collected={collected} onCollect={handleCollect} />
            <Player ref={playerRef} spawn={[0, 3, 0]} />
          </Physics>
          {bursts.map((b) => (
            <CollectBurst
              key={b.key}
              position={b.position}
              onDone={() => removeBurst(b.key)}
            />
          ))}
          <FollowCamera target={playerRef} />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
