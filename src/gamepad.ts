import { useEffect, useRef } from "react";

const DEADZONE = 0.18;

export type GamepadInput = {
  connected: boolean;
  moveX: number;
  moveY: number;
  camX: number;
  camY: number;
  jump: boolean;
  fire: boolean;
};

const EMPTY: GamepadInput = {
  connected: false,
  moveX: 0,
  moveY: 0,
  camX: 0,
  camY: 0,
  jump: false,
  fire: false,
};

function applyDeadzone(v: number): number {
  if (Math.abs(v) < DEADZONE) return 0;
  const sign = v < 0 ? -1 : 1;
  return sign * ((Math.abs(v) - DEADZONE) / (1 - DEADZONE));
}

export function readGamepad(): GamepadInput {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return EMPTY;
  const pads = navigator.getGamepads();
  for (const pad of pads) {
    if (!pad || !pad.connected) continue;
    return {
      connected: true,
      moveX: applyDeadzone(pad.axes[0] ?? 0),
      moveY: applyDeadzone(pad.axes[1] ?? 0),
      camX: applyDeadzone(pad.axes[2] ?? 0),
      camY: applyDeadzone(pad.axes[3] ?? 0),
      jump: !!pad.buttons[0]?.pressed,
      fire:
        !!pad.buttons[7]?.pressed ||
        !!pad.buttons[5]?.pressed ||
        (pad.buttons[7]?.value ?? 0) > 0.3,
    };
  }
  return EMPTY;
}

export function useGamepadButtonPress(buttons: readonly number[], onPress: () => void) {
  const handler = useRef(onPress);
  handler.current = onPress;
  useEffect(() => {
    const prev = new Map<number, boolean>();
    let raf = 0;
    const tick = () => {
      const pads = typeof navigator !== "undefined" && navigator.getGamepads
        ? navigator.getGamepads()
        : [];
      for (const pad of pads) {
        if (!pad || !pad.connected) continue;
        for (const b of buttons) {
          const pressed = !!pad.buttons[b]?.pressed;
          const wasPressed = prev.get(b) ?? false;
          if (pressed && !wasPressed) handler.current();
          prev.set(b, pressed);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [buttons]);
}
