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
import type { CharacterId } from "./Character";
import { SpawnPlatform } from "./SpawnPlatform";
import { Laser } from "./Laser";
import { Enemies } from "./Enemies";
import { requestPointerLock } from "../mouseLook";

const debug = new URLSearchParams(window.location.search).has("debug");

const SPAWN: [number, number, number] = [0, 6, 0];
const SPAWN_PLATFORM_OFFSET_Y = 0.5;

type Props = {
  collected: ReadonlySet<number>;
  onCollect: (id: number) => void;
  character: CharacterId;
  onPlayerDamage: (amount: number) => void;
  muted: boolean;
};

type Burst = { key: number; position: [number, number, number] };

export function Game({ collected, onCollect, character, onPlayerDamage, muted }: Props) {
  const playerRef = useRef<RapierRigidBody>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const handlePointerDown = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) requestPointerLock(canvas);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      style={{ position: "absolute", inset: 0 }}
    >
      <KeyboardControls map={map}>
        <Canvas shadows camera={{ fov: 60, position: [0, 7, 12], near: 0.1, far: 500 }}>
          <color attach="background" args={["#0c0f1f"]} />
          <fog attach="fog" args={["#1a1a33", 110, 300]} />
          <Suspense fallback={null}>
            <Scene />
            <Physics debug={debug} gravity={[0, -20, 0]}>
              <Ground />
              <Platforms />
              <Crystals collected={collected} onCollect={handleCollect} />
              <SpawnPlatform
                position={[SPAWN[0], SPAWN[1] - SPAWN_PLATFORM_OFFSET_Y, SPAWN[2]]}
              />
              <Enemies playerRef={playerRef} onPlayerDamage={onPlayerDamage} />
              <Player ref={playerRef} spawn={SPAWN} character={character} />
              <Laser playerRef={playerRef} muted={muted} />
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
    </div>
  );
}
