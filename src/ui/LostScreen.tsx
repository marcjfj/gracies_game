import { useGamepadButtonPress } from "../gamepad";

const RETRY_BUTTONS = [0] as const;
const MENU_BUTTONS = [1, 9] as const;

type Props = {
  onRetry: () => void;
  onBackToStart: () => void;
};

export function LostScreen({ onRetry, onBackToStart }: Props) {
  useGamepadButtonPress(RETRY_BUTTONS, onRetry);
  useGamepadButtonPress(MENU_BUTTONS, onBackToStart);
  return (
    <div className="lost-screen">
      <div className="lost-glow" />
      <div className="lost-noise" aria-hidden />
      <div className="lost-content">
        <div className="lost-eyebrow">Mission Failed</div>
        <h1 className="lost-title">You were overrun.</h1>
        <p className="lost-sub">
          The labubus got the best of you this time. Dust yourself off and try again.
        </p>
        <div className="lost-actions">
          <button className="play-button lost-retry" onClick={onRetry} type="button">
            <span className="play-button-inner">
              <span className="play-glyph">↻</span>
              <span>Try Again</span>
            </span>
            <span className="play-button-glow" aria-hidden />
          </button>
          <button
            className="lost-secondary"
            onClick={onBackToStart}
            type="button"
          >
            <span className="play-glyph">↩</span>
            <span>Back to Start</span>
          </button>
        </div>
      </div>
    </div>
  );
}
