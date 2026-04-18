import { useCallback, useState } from "react";
import { Game } from "./game/Game";
import { CRYSTAL_COUNT } from "./game/Crystals";

export default function App() {
  const [collected, setCollected] = useState<ReadonlySet<number>>(() => new Set());

  const handleCollect = useCallback((id: number) => {
    setCollected((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const collectedCount = collected.size;
  const remaining = CRYSTAL_COUNT - collectedCount;

  return (
    <div className="app">
      <Game collected={collected} onCollect={handleCollect} />
      <div className="hud">
        <strong>cat game</strong>
        <span>WASD to move · Space to jump · ?debug to show colliders</span>
      </div>
      <div className="hud hud-crystals">
        <strong>crystals</strong>
        <span>
          collected {collectedCount} · remaining {remaining}
        </span>
      </div>
    </div>
  );
}
