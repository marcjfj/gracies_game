export type TouchInput = {
  moveX: number;
  moveY: number;
  jump: boolean;
  fire: boolean;
};

const state: TouchInput = { moveX: 0, moveY: 0, jump: false, fire: false };
let lookDx = 0;
let lookDy = 0;

export function readTouchInput(): TouchInput {
  return { ...state };
}

export function readTouchLookDelta(): { dx: number; dy: number } {
  const out = { dx: lookDx, dy: lookDy };
  lookDx = 0;
  lookDy = 0;
  return out;
}

export function setTouchMove(x: number, y: number) {
  state.moveX = x;
  state.moveY = y;
}

export function addTouchLook(dx: number, dy: number) {
  lookDx += dx;
  lookDy += dy;
}

export function setTouchJump(pressed: boolean) {
  state.jump = pressed;
}

export function setTouchFire(pressed: boolean) {
  state.fire = pressed;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
  );
}
