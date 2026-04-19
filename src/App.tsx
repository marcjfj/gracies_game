import { useCallback, useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { CRYSTAL_COUNT } from "./game/Crystals";
import type { CharacterId } from "./game/Character";
import { StartScreen } from "./ui/StartScreen";
import { WinScreen } from "./ui/WinScreen";
import { LostScreen } from "./ui/LostScreen";
import { useBackgroundMusic } from "./ui/useBackgroundMusic";
import { useSoundEffect } from "./ui/useSoundEffect";
import { MusicToggle } from "./ui/MusicToggle";
import { CROSSHAIR_TOP_PERCENT } from "./crosshair";
import { emitPlayerHitFlash } from "./playerFlash";

type Phase = "start" | "playing" | "won" | "lost";

const MAX_HEALTH = 100;

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [collected, setCollected] = useState<ReadonlySet<number>>(() => new Set());
  const [character, setCharacter] = useState<CharacterId>("poodle");
  const [health, setHealth] = useState(MAX_HEALTH);
  const [gameKey, setGameKey] = useState(0);
  const healthRef = useRef(MAX_HEALTH);
  healthRef.current = health;

  const playCollect = useSoundEffect("/ewoo.mp3", 1);
  const playCollectRef = useRef(playCollect);
  playCollectRef.current = playCollect;
  const playHit = useSoundEffect("/bruh.mp3", 0.8);
  const playHitRef = useRef(playHit);
  playHitRef.current = playHit;
  const mutedRef = useRef(false);

  const handlePlayerDamage = useCallback((amount: number) => {
    if (healthRef.current <= 0) return;
    setHealth((h) => Math.max(0, h - amount));
    emitPlayerHitFlash();
    if (!mutedRef.current) playHitRef.current();
  }, []);

  const handleCollect = useCallback((id: number) => {
    let added = false;
    setCollected((prev) => {
      if (prev.has(id)) return prev;
      added = true;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (added && !mutedRef.current) playCollectRef.current();
  }, []);

  useEffect(() => {
    if (phase === "playing" && collected.size >= CRYSTAL_COUNT) {
      setPhase("won");
    }
  }, [collected, phase]);

  useEffect(() => {
    if (phase === "playing" && health <= 0) {
      setPhase("lost");
    }
  }, [health, phase]);

  const [pulseTick, setPulseTick] = useState(0);
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (collected.size > prevCountRef.current) {
      setPulseTick((n) => n + 1);
    }
    prevCountRef.current = collected.size;
  }, [collected]);

  const music = useBackgroundMusic("/bensound-deepblue.mp3", 0.15);
  mutedRef.current = music.muted;

  const startGame = useCallback(() => {
    setCollected(new Set());
    setHealth(MAX_HEALTH);
    setGameKey((k) => k + 1);
    setPhase("playing");
    music.play();
  }, [music]);

  const returnToStart = useCallback(() => {
    setPhase("start");
    setCollected(new Set());
    setHealth(MAX_HEALTH);
  }, []);

  const collectedCount = collected.size;
  const remaining = CRYSTAL_COUNT - collectedCount;

  return (
    <div className="app">
      {phase !== "start" && (
        <>
          <Game
            key={gameKey}
            collected={collected}
            onCollect={handleCollect}
            character={character}
            onPlayerDamage={handlePlayerDamage}
            muted={music.muted}
          />
          <div className="hud hud-health">
            <strong>Health</strong>
            <span className="hud-health-row">
              <span className={`hud-health-value${health <= 25 ? " is-low" : ""}`}>
                {health}
              </span>
              <span className="hud-divider">/</span>
              <span className="hud-total">{MAX_HEALTH}</span>
            </span>
            <div className="hud-progress hud-health-progress" aria-hidden>
              <div
                className={`hud-health-fill${health <= 25 ? " is-low" : ""}`}
                style={{ width: `${(health / MAX_HEALTH) * 100}%` }}
              />
            </div>
          </div>
          <div className="hud hud-crystals">
            <strong>Crystals</strong>
            <span className="hud-counter">
              <span className="hud-count" key={pulseTick}>
                {collectedCount}
              </span>
              <span className="hud-divider">/</span>
              <span className="hud-total">{CRYSTAL_COUNT}</span>
              <span className="hud-remaining">
                {remaining === 0 ? "complete" : `${remaining} left`}
              </span>
            </span>
            <div className="hud-progress" aria-hidden>
              <div
                className="hud-progress-fill"
                style={{ width: `${(collectedCount / CRYSTAL_COUNT) * 100}%` }}
              />
              <div className="hud-progress-pulse" key={pulseTick} />
            </div>
          </div>
          <div
            className="crosshair"
            style={{ top: `${CROSSHAIR_TOP_PERCENT}%` }}
            aria-hidden
          >
            <span className="crosshair-tick crosshair-tick-t" />
            <span className="crosshair-tick crosshair-tick-b" />
            <span className="crosshair-tick crosshair-tick-l" />
            <span className="crosshair-tick crosshair-tick-r" />
            <span className="crosshair-dot" />
          </div>
        </>
      )}
      {phase === "start" && (
        <StartScreen
          onStart={startGame}
          selectedCharacter={character}
          onSelectCharacter={setCharacter}
        />
      )}
      {phase === "won" && <WinScreen onBackToStart={returnToStart} />}
      {phase === "lost" && (
        <LostScreen onRetry={startGame} onBackToStart={returnToStart} />
      )}
      {phase !== "start" && (
        <MusicToggle muted={music.muted} onToggle={music.toggleMute} />
      )}
    </div>
  );
}
