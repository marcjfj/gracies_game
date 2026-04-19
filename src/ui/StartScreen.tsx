import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useGamepadButtonPress } from "../gamepad";
import {
  CHARACTERS,
  CHARACTER_ORDER,
  Character,
  type CharacterId,
} from "../game/Character";

const SUBMIT_BUTTONS = [0, 9] as const;

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
};

export function StartScreen({ onStart, selectedCharacter, onSelectCharacter }: Props) {
  const stars = useStars(180);
  const bigStars = useStars(12);
  useGamepadButtonPress(SUBMIT_BUTTONS, onStart);

  const cycleCharacter = useCallback(
    (direction: 1 | -1) => {
      const idx = CHARACTER_ORDER.indexOf(selectedCharacter);
      const next = CHARACTER_ORDER[(idx + direction + CHARACTER_ORDER.length) % CHARACTER_ORDER.length];
      onSelectCharacter(next);
    },
    [selectedCharacter, onSelectCharacter],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        cycleCharacter(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        cycleCharacter(1);
      } else if (e.key === "Enter") {
        onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleCharacter, onStart]);

  useGamepadDirectional(cycleCharacter);

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

        <div className="character-picker" role="radiogroup" aria-label="Choose your character">
          <div className="character-picker-label">Choose your hero</div>
          <div className="character-grid">
            {CHARACTER_ORDER.map((id) => (
              <CharacterCard
                key={id}
                id={id}
                selected={id === selectedCharacter}
                onSelect={onSelectCharacter}
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
          <span><kbd>←</kbd><kbd>→</kbd> switch hero</span>
          <span className="sep">·</span>
          <span>Gamepad: left stick / ✕</span>
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

function useGamepadDirectional(onDirection: (dir: 1 | -1) => void) {
  const ref = useRef(onDirection);
  ref.current = onDirection;
  useEffect(() => {
    const prev = { dpadLeft: false, dpadRight: false, stickLeft: false, stickRight: false };
    let raf = 0;
    const tick = () => {
      const pads =
        typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad || !pad.connected) continue;
        const dpadLeft = !!pad.buttons[14]?.pressed;
        const dpadRight = !!pad.buttons[15]?.pressed;
        const axis = pad.axes[0] ?? 0;
        const stickLeft = axis < -0.55;
        const stickRight = axis > 0.55;
        if (dpadLeft && !prev.dpadLeft) ref.current(-1);
        if (dpadRight && !prev.dpadRight) ref.current(1);
        if (stickLeft && !prev.stickLeft) ref.current(-1);
        if (stickRight && !prev.stickRight) ref.current(1);
        prev.dpadLeft = dpadLeft;
        prev.dpadRight = dpadRight;
        prev.stickLeft = stickLeft;
        prev.stickRight = stickRight;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
