let tick = 0;

export function emitPlayerHitFlash(): void {
  tick++;
}

export function getPlayerHitTick(): number {
  return tick;
}
