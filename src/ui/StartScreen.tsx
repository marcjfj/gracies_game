import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useGamepadButtonPress } from "../gamepad";
import {
  CHARACTERS,
  CHARACTER_ORDER,
  Character,
  preloadCharacter,
  type CharacterId,
} from "../game/Character";
import { MAPS, MAP_ORDER, type MapId } from "../game/Maps";

const SUBMIT_BUTTONS = [0, 9] as const;

type Row = "character" | "map";

type Star = { left: number; top: number; size: number; delay: number; duration: number };

function useStars(count: number): Star[] {
  return useMemo(() => {
    const rand = mulberry32(1337);
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: 0.5 + rand() * 2.2,
      delay: rand() * 6,
      duration: 2 + rand() * 5,
    }));
  }, [count]);
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = {
  onStart: () => void;
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  selectedMap: MapId;
  onSelectMap: (id: MapId) => void;
};

export function StartScreen({
  onStart,
  selectedCharacter,
  onSelectCharacter,
  selectedMap,
  onSelectMap,
}: Props) {
  const stars = useStars(180);
  const bigStars = useStars(12);
  const [activeRow, setActiveRow] = useState<Row>("character");
  useGamepadButtonPress(SUBMIT_BUTTONS, onStart);

  const cycleCharacter = useCallback(
    (direction: 1 | -1) => {
      const idx = CHARACTER_ORDER.indexOf(selectedCharacter);
      const next =
        CHARACTER_ORDER[
          (idx + direction + CHARACTER_ORDER.length) % CHARACTER_ORDER.length
        ];
      onSelectCharacter(next);
    },
    [selectedCharacter, onSelectCharacter],
  );

  const cycleMap = useCallback(
    (direction: 1 | -1) => {
      const idx = MAP_ORDER.indexOf(selectedMap);
      const next = MAP_ORDER[(idx + direction + MAP_ORDER.length) % MAP_ORDER.length];
      onSelectMap(next);
    },
    [selectedMap, onSelectMap],
  );

  const cycleActive = useCallback(
    (direction: 1 | -1) => {
      if (activeRow === "character") cycleCharacter(direction);
      else cycleMap(direction);
    },
    [activeRow, cycleCharacter, cycleMap],
  );

  const switchRow = useCallback((direction: 1 | -1) => {
    setActiveRow((prev) => {
      if (direction === 1) return prev === "character" ? "map" : "map";
      return prev === "map" ? "character" : "character";
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        cycleActive(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        cycleActive(1);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        switchRow(1);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        switchRow(-1);
      } else if (e.key === "Tab") {
        e.preventDefault();
        switchRow(e.shiftKey ? -1 : 1);
      } else if (e.key === "Enter") {
        onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleActive, switchRow, onStart]);

  useGamepadNav(cycleActive, switchRow);

  return (
    <div className="start-screen">
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="nebula nebula-c" />
      <div className="stars">
        {stars.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
        {bigStars.map((s, i) => (
          <span
            key={`b-${i}`}
            className="star star-big"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="shooting-star shooting-star-1" />
      <div className="shooting-star shooting-star-2" />

      <div className="planet planet-ring">
        <div className="planet-body" />
        <div className="planet-ring-band" />
      </div>
      <div className="planet planet-small" />

      <div className="start-content">
        <div className="title-eyebrow">A COSMIC ADVENTURE</div>
        <h1 className="title">
          <span className="title-word title-word-1">Gracie's</span>
          <span className="title-word title-word-2">Game</span>
        </h1>
        <p className="tagline">
          Drift through the asteroid fields. Collect every crystal. Save the galaxy.
        </p>

        <div
          className={`character-picker${activeRow === "character" ? " is-active" : ""}`}
          role="radiogroup"
          aria-label="Choose your character"
          onMouseEnter={() => setActiveRow("character")}
        >
          <div className="character-picker-label">Choose your hero</div>
          <div className="character-grid">
            {CHARACTER_ORDER.map((id) => (
              <CharacterCard
                key={id}
                id={id}
                selected={id === selectedCharacter}
                onSelect={(nextId) => {
                  setActiveRow("character");
                  onSelectCharacter(nextId);
                }}
              />
            ))}
          </div>
        </div>

        <div
          className={`map-picker${activeRow === "map" ? " is-active" : ""}`}
          role="radiogroup"
          aria-label="Choose your world"
          onMouseEnter={() => setActiveRow("map")}
        >
          <div className="character-picker-label">Choose your world</div>
          <div className="map-grid">
            {MAP_ORDER.map((id) => (
              <MapCard
                key={id}
                id={id}
                selected={id === selectedMap}
                onSelect={(nextId) => {
                  setActiveRow("map");
                  onSelectMap(nextId);
                }}
              />
            ))}
          </div>
        </div>

        <button className="play-button" onClick={onStart} type="button">
          <span className="play-button-inner">
            <span className="play-glyph">▶</span>
            <span>Launch</span>
          </span>
          <span className="play-button-glow" aria-hidden />
        </button>

        <div className="controls-hint">
          <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span>
          <span className="sep">·</span>
          <span><kbd>Space</kbd> jump</span>
          <span className="sep">·</span>
          <span><kbd>←</kbd><kbd>→</kbd> cycle</span>
          <span className="sep">·</span>
          <span><kbd>↑</kbd><kbd>↓</kbd> hero / world</span>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  id: CharacterId;
  selected: boolean;
  onSelect: (id: CharacterId) => void;
};

function CharacterCard({ id, selected, onSelect }: CardProps) {
  const cfg = CHARACTERS[id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`character-card${selected ? " is-selected" : ""}`}
      onClick={() => onSelect(id)}
      onMouseEnter={() => preloadCharacter(id)}
      onFocus={() => preloadCharacter(id)}
    >
      <div className="character-card-canvas">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.1, 3.2], fov: 32 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[3, 5, 4]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#b8c8ff" />
          <Suspense fallback={null}>
            <group rotation={[0, -0.35, 0]}>
              <Character character={id} animation="idle" yOffset={-0.9} scale={0.045} />
            </group>
            <ContactShadows
              position={[0, -0.9, 0]}
              opacity={0.45}
              scale={4}
              blur={2.4}
              far={2}
            />
          </Suspense>
        </Canvas>
      </div>
      <div className="character-card-info">
        <div className="character-card-name">{cfg.label}</div>
        <div className="character-card-blurb">{cfg.blurb}</div>
      </div>
      <div className="character-card-glow" aria-hidden />
    </button>
  );
}

type MapCardProps = {
  id: MapId;
  selected: boolean;
  onSelect: (id: MapId) => void;
};

function MapCard({ id, selected, onSelect }: MapCardProps) {
  const cfg = MAPS[id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`map-card map-card--${id}${selected ? " is-selected" : ""}`}
      onClick={() => onSelect(id)}
    >
      <div className={`map-card-art map-art--${id}`} aria-hidden>
        <MapArt id={id} />
      </div>
      <div className="map-card-info">
        <div className="map-card-name">{cfg.label}</div>
        <div className="map-card-blurb">{cfg.blurb}</div>
      </div>
      <div className="character-card-glow" aria-hidden />
    </button>
  );
}

function MapArt({ id }: { id: MapId }) {
  if (id === "asteroid") {
    return (
      <>
        <div className="map-art-stars" />
        <div className="map-art-asteroid map-art-asteroid-1" />
        <div className="map-art-asteroid map-art-asteroid-2" />
        <div className="map-art-asteroid map-art-asteroid-3" />
        <div className="map-art-planet-ring" />
      </>
    );
  }
  if (id === "ice_planet") {
    return (
      <>
        <div className="map-art-stars" />
        <div className="map-art-aurora" />
        <div className="map-art-cliff map-art-cliff-back" />
        <div className="map-art-cliff map-art-cliff-mid" />
        <div className="map-art-cliff map-art-cliff-front" />
        <div className="map-art-shard map-art-shard-1" />
        <div className="map-art-shard map-art-shard-2" />
      </>
    );
  }
  return (
    <>
      <div className="map-art-stars" />
      <div className="map-art-heat-haze" />
      <div className="map-art-volcano map-art-volcano-back" />
      <div className="map-art-volcano map-art-volcano-front" />
      <div className="map-art-lava-pool" />
      <div className="map-art-ember map-art-ember-1" />
      <div className="map-art-ember map-art-ember-2" />
      <div className="map-art-ember map-art-ember-3" />
    </>
  );
}

function useGamepadNav(
  onHorizontal: (dir: 1 | -1) => void,
  onVertical: (dir: 1 | -1) => void,
) {
  const horiz = useRef(onHorizontal);
  horiz.current = onHorizontal;
  const vert = useRef(onVertical);
  vert.current = onVertical;
  useEffect(() => {
    const prev = {
      dpadLeft: false,
      dpadRight: false,
      dpadUp: false,
      dpadDown: false,
      stickLeft: false,
      stickRight: false,
      stickUp: false,
      stickDown: false,
    };
    let raf = 0;
    const tick = () => {
      const pads =
        typeof navigator !== "undefined" && navigator.getGamepads
          ? navigator.getGamepads()
          : [];
      for (const pad of pads) {
        if (!pad || !pad.connected) continue;
        const dpadUp = !!pad.buttons[12]?.pressed;
        const dpadDown = !!pad.buttons[13]?.pressed;
        const dpadLeft = !!pad.buttons[14]?.pressed;
        const dpadRight = !!pad.buttons[15]?.pressed;
        const axisX = pad.axes[0] ?? 0;
        const axisY = pad.axes[1] ?? 0;
        const stickLeft = axisX < -0.55;
        const stickRight = axisX > 0.55;
        const stickUp = axisY < -0.55;
        const stickDown = axisY > 0.55;
        if (dpadLeft && !prev.dpadLeft) horiz.current(-1);
        if (dpadRight && !prev.dpadRight) horiz.current(1);
        if (dpadUp && !prev.dpadUp) vert.current(-1);
        if (dpadDown && !prev.dpadDown) vert.current(1);
        if (stickLeft && !prev.stickLeft) horiz.current(-1);
        if (stickRight && !prev.stickRight) horiz.current(1);
        if (stickUp && !prev.stickUp) vert.current(-1);
        if (stickDown && !prev.stickDown) vert.current(1);
        prev.dpadLeft = dpadLeft;
        prev.dpadRight = dpadRight;
        prev.dpadUp = dpadUp;
        prev.dpadDown = dpadDown;
        prev.stickLeft = stickLeft;
        prev.stickRight = stickRight;
        prev.stickUp = stickUp;
        prev.stickDown = stickDown;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
