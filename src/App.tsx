import { useCallback, useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { CRYSTAL_COUNT } from "./game/Crystals";
import { StartScreen } from "./ui/StartScreen";
import { WinScreen } from "./ui/WinScreen";
import { useBackgroundMusic } from "./ui/useBackgroundMusic";
import { useSoundEffect } from "./ui/useSoundEffect";
import { MusicToggle } from "./ui/MusicToggle";

type Phase = "start" | "playing" | "won";

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [collected, setCollected] = useState<ReadonlySet<number>>(() => new Set());

  const playCollect = useSoundEffect("/ewoo.mp3", 0.6);
  const playCollectRef = useRef(playCollect);
  playCollectRef.current = playCollect;
  const mutedRef = useRef(false);

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

  const [pulseTick, setPulseTick] = useState(0);
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (collected.size > prevCountRef.current) {
      setPulseTick((n) => n + 1);
    }
    prevCountRef.current = collected.size;
  }, [collected]);

  const music = useBackgroundMusic("/bensound-deepblue.mp3", 0.35);
  mutedRef.current = music.muted;

  const startGame = useCallback(() => {
    setCollected(new Set());
    setPhase("playing");
    music.play();
  }, [music]);

  const collectedCount = collected.size;
  const remaining = CRYSTAL_COUNT - collectedCount;

  return (
    <div className="app">
      {phase !== "start" && (
        <>
          <Game collected={collected} onCollect={handleCollect} />
          <div className="hud">
            <strong>Gracie's Game</strong>
            <span className="hud-controls">
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
              <span className="hud-label">move</span>
              <span className="hud-sep">·</span>
              <kbd>Space</kbd>
              <span className="hud-label">jump</span>
            </span>
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
        </>
      )}
      {phase === "start" && <StartScreen onStart={startGame} />}
      {phase === "won" && <WinScreen onPlayAgain={startGame} />}
      {phase !== "start" && (
        <MusicToggle muted={music.muted} onToggle={music.toggleMute} />
      )}
    </div>
  );
}
