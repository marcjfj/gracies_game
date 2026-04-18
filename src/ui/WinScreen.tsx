type Props = { onPlayAgain: () => void };

export function WinScreen({ onPlayAgain }: Props) {
  return (
    <div className="win-screen">
      <div className="win-burst" />
      <div className="win-rays" />
      <div className="win-content">
        <div className="win-eyebrow">MISSION COMPLETE</div>
        <h1 className="win-title">You saved the galaxy!</h1>
        <p className="win-sub">
          Every crystal collected. Gracie is officially a cosmic hero.
        </p>
        <button className="play-button" onClick={onPlayAgain} type="button">
          <span className="play-button-inner">
            <span className="play-glyph">↻</span>
            <span>Play Again</span>
          </span>
          <span className="play-button-glow" aria-hidden />
        </button>
      </div>
    </div>
  );
}
