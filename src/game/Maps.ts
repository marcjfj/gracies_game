import type { ComponentType, RefObject } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import { Ground, sampleTerrainHeight } from "./Ground";
import { Platforms } from "./Platforms";
import { Scene } from "./Scene";
import { IceGround, sampleIceTerrainHeight } from "./IceGround";
import { IcePlatforms } from "./IcePlatforms";
import { IceScene } from "./IceScene";
import { FireGround } from "./FireGround";
import { FirePlatforms } from "./FirePlatforms";
import { FireScene } from "./FireScene";
import { Lava } from "./Lava";

export type MapId = "asteroid" | "ice_planet" | "fire_planet";

export type HazardProps = {
  playerRef: RefObject<RapierRigidBody>;
  onPlayerDamage: (amount: number) => void;
};

export type MapConfig = {
  id: MapId;
  label: string;
  blurb: string;
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  Ground: ComponentType;
  Platforms: ComponentType;
  Scene: ComponentType;
  Hazards?: ComponentType<HazardProps>;
  spawn?: [number, number, number];
  showSpawnPlatform?: boolean;
  crystalScale?: number;
  crystalSpawns: readonly [number, number, number][];
  enemySpawns: readonly [number, number, number][];
};

function asteroidGround(x: number, z: number, offset = 1.0): [number, number, number] {
  return [x, sampleTerrainHeight(x, z) + offset, z];
}

const ASTEROID_CRYSTALS: [number, number, number][] = [
  asteroidGround(0, 10),
  asteroidGround(-10, -4),
  asteroidGround(12, 12),
  asteroidGround(-28, 6),
  asteroidGround(9, -22),
  asteroidGround(-10, 32),
  asteroidGround(-22, 18),
  asteroidGround(30, -10),
  asteroidGround(6, 38),
  [10, 6.4, 1],
  [-16, 9.78, 3],
  [-26, 9.65, -15],
  [34, 11.9, 20],
  [17, 11.4, -2.5],
  [38, 19.0, 13],
  [40, 7.0, -35],
  [-40, 7.8, 28],
  [-30, 12.4, -13],
];

const ASTEROID_ENEMIES: [number, number, number][] = [
  asteroidGround(22, 8, 2),
  asteroidGround(-20, -14, 2),
  asteroidGround(10, 26, 2),
  asteroidGround(-24, 4, 2),
  asteroidGround(28, -20, 2),
];

function iceGround(x: number, z: number, offset = 1.2): [number, number, number] {
  return [x, sampleIceTerrainHeight(x, z) + offset, z];
}

const ICE_CRYSTALS: [number, number, number][] = [
  // On spawn plateau
  iceGround(0, 8),
  iceGround(-6, -5),
  iceGround(9, -3),
  // On lower tiers around the world
  iceGround(-12, 14),
  iceGround(14, 10),
  iceGround(-18, -2),
  iceGround(20, -18),
  iceGround(-26, 18),
  iceGround(10, 26),
  // Near ice platforms on the tier surface (not atop — spikes are tall cones)
  iceGround(17, 0),
  iceGround(22, -3),
  iceGround(28, -8),
  iceGround(34, -12),
  iceGround(-11, 28),
  iceGround(9, 32),
  iceGround(-31, -8),
  iceGround(29, 24),
  iceGround(-27, 2),
];

const ICE_ENEMIES: [number, number, number][] = [
  iceGround(18, 6, 1.5),
  iceGround(-16, -12, 1.5),
  iceGround(8, 22, 1.5),
  iceGround(-22, 4, 1.5),
  iceGround(26, -22, 1.5),
];

// Fire planet: a single trophy crystal on the summit. Reaching it = winning.
const FIRE_CRYSTALS: [number, number, number][] = [
  [0, 54.0, 0.6],
];

export const MAPS: Record<MapId, MapConfig> = {
  asteroid: {
    id: "asteroid",
    label: "Asteroid Field",
    blurb: "Drifting cosmic rubble. Purple dusk.",
    background: "#0c0f1f",
    fogColor: "#1a1a33",
    fogNear: 110,
    fogFar: 300,
    Ground,
    Platforms,
    Scene,
    crystalSpawns: ASTEROID_CRYSTALS,
    enemySpawns: ASTEROID_ENEMIES,
  },
  ice_planet: {
    id: "ice_planet",
    label: "Glacier World",
    blurb: "Tiered cliffs. Frozen dawn.",
    background: "#0b1724",
    fogColor: "#8fb8d8",
    fogNear: 60,
    fogFar: 220,
    Ground: IceGround,
    Platforms: IcePlatforms,
    Scene: IceScene,
    crystalSpawns: ICE_CRYSTALS,
    enemySpawns: ICE_ENEMIES,
  },
  fire_planet: {
    id: "fire_planet",
    label: "Magma Ascent",
    blurb: "Climb fast. The lava is rising.",
    background: "#180502",
    fogColor: "#4a0f05",
    fogNear: 40,
    fogFar: 180,
    Ground: FireGround,
    Platforms: FirePlatforms,
    Scene: FireScene,
    Hazards: Lava,
    spawn: [0, 2, 0],
    showSpawnPlatform: false,
    crystalScale: 3,
    crystalSpawns: FIRE_CRYSTALS,
    enemySpawns: [],
  },
};

export const MAP_ORDER: readonly MapId[] = [
  "asteroid",
  "ice_planet",
  "fire_planet",
] as const;

export function getMapCrystalCount(id: MapId): number {
  return MAPS[id].crystalSpawns.length;
}
