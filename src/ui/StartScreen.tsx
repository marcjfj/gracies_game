import { useMemo } from "react";

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

type Props = { onStart: () => void };

export function StartScreen({ onStart }: Props) {
  const stars = useStars(180);
  const bigStars = useStars(12);

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
        </div>
      </div>
    </div>
  );
}
