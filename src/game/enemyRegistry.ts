type HitHandler = () => void;

const handlers = new Map<number, HitHandler>();

export function registerEnemyHitHandler(id: number, h: HitHandler): void {
  handlers.set(id, h);
}

export function unregisterEnemyHitHandler(id: number): void {
  handlers.delete(id);
}

export function reportEnemyHit(id: number): void {
  handlers.get(id)?.();
}

export type EnemyUserData = { type: "enemy"; id: number };
