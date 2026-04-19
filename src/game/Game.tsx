import { Canvas } from "@react-three/fiber";
import { KeyboardControls, type KeyboardControlsEntry } from "@react-three/drei";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { controlMap, type ControlName } from "../controls";
import { Player } from "./Player";
import { FollowCamera } from "./FollowCamera";
import { Crystals } from "./Crystals";
import { CollectBurst } from "./CollectBurst";
import type { CharacterId } from "./Character";
import { SpawnPlatform } from "./SpawnPlatform";
import { Laser } from "./Laser";
import { Enemies } from "./Enemies";
import { requestPointerLock } from "../mouseLook";
import { MAPS, type MapId } from "./Maps";
import { QualityContext, useQuality } from "../quality";

const debug = new URLSearchParams(window.location.search).has("debug");

const SPAWN_Y_LIFT = 6;
const SPAWN_PLATFORM_OFFSET_Y = 0.5;

type Props = {
  map: MapId;
  collected: ReadonlySet<number>;
  onCollect: (id: number) => void;
  character: CharacterId;
  onPlayerDamage: (amount: number) => void;
  muted: boolean;
};

type Burst = { key: number; position: [number, number, number] };

export function Game({
  map,
  collected,
  onCollect,
  character,
  onPlayerDamage,
  muted,
}: Props) {
  const playerRef = useRef<RapierRigidBody>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyMap = useMemo<KeyboardControlsEntry<ControlName>[]>(
    () => controlMap.map((c) => ({ name: c.name, keys: [...c.keys] })),
    [],
  );

  const cfg = MAPS[map];
  const spawn: [number, number, number] = cfg.spawn ?? [0, SPAWN_Y_LIFT, 0];
  const showSpawnPlatform = cfg.showSpawnPlatform ?? true;
  const quality = useQuality();
  const { settings } = quality;
  const fogFar = cfg.fogFar * settings.fogFarMultiplier;

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

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.pointerType === "touch") return;
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) requestPointerLock(canvas);
  }, []);

  const MapGround = cfg.Ground;
  const MapPlatforms = cfg.Platforms;
  const MapScene = cfg.Scene;
  const MapHazards = cfg.Hazards;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      style={{ position: "absolute", inset: 0 }}
    >
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows={settings.shadows}
          dpr={[1, settings.dprMax]}
          gl={{ antialias: settings.antialias }}
          camera={{ fov: 60, position: [0, 7, 12], near: 0.1, far: 500 }}
        >
          <color attach="background" args={[cfg.background]} />
          <fog attach="fog" args={[cfg.fogColor, cfg.fogNear, fogFar]} />
          <QualityContext.Provider value={quality}>
          <Suspense fallback={null}>
            <MapScene />
            <Physics debug={debug} gravity={[0, -20, 0]}>
              <MapGround />
              <MapPlatforms />
              <Crystals
                spawns={cfg.crystalSpawns}
                collected={collected}
                onCollect={handleCollect}
                scale={cfg.crystalScale}
              />
              {showSpawnPlatform && (
                <SpawnPlatform
                  position={[spawn[0], spawn[1] - SPAWN_PLATFORM_OFFSET_Y, spawn[2]]}
                />
              )}
              <Enemies
                spawns={cfg.enemySpawns}
                playerRef={playerRef}
                onPlayerDamage={onPlayerDamage}
              />
              <Player ref={playerRef} spawn={spawn} character={character} />
              <Laser playerRef={playerRef} muted={muted} />
              {MapHazards && (
                <MapHazards
                  playerRef={playerRef}
                  onPlayerDamage={onPlayerDamage}
                />
              )}
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
          </QualityContext.Provider>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
