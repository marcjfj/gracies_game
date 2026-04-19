import { useGamepadButtonPress } from "../gamepad";

const SUBMIT_BUTTONS = [0, 9] as const;

type Props = { onBackToStart: () => void };

export function WinScreen({ onBackToStart }: Props) {
  useGamepadButtonPress(SUBMIT_BUTTONS, onBackToStart);
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
        <button className="play-button" onClick={onBackToStart} type="button">
          <span className="play-button-inner">
            <span className="play-glyph">↩</span>
            <span>Back to Start</span>
          </span>
          <span className="play-button-glow" aria-hidden />
        </button>
      </div>
    </div>
  );
}
