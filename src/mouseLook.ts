let dx = 0;
let dy = 0;
let locked = false;
let leftButtonDown = false;

function onMouseMove(e: MouseEvent) {
  if (!locked) return;
  dx += e.movementX;
  dy += e.movementY;
}

function onLockChange() {
  locked = document.pointerLockElement !== null;
  if (!locked) leftButtonDown = false;
}

function onMouseDown(e: MouseEvent) {
  if (e.button === 0) leftButtonDown = true;
}

function onMouseUp(e: MouseEvent) {
  if (e.button === 0) leftButtonDown = false;
}

if (typeof document !== "undefined") {
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("pointerlockchange", onLockChange);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
}

export type MouseDelta = { dx: number; dy: number; locked: boolean };

export function readMouseDelta(): MouseDelta {
  const out = { dx, dy, locked };
  dx = 0;
  dy = 0;
  return out;
}

export function isPointerLocked(): boolean {
  return locked;
}

export function isMouseFiring(): boolean {
  return locked && leftButtonDown;
}

export function requestPointerLock(el?: Element | null): void {
  const target = (el as HTMLElement | null) ?? document.body;
  if (document.pointerLockElement === target) return;
  target.requestPointerLock?.();
}
