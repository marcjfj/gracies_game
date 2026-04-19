import { useEffect, useRef } from "react";
import {
  addTouchLook,
  setTouchFire,
  setTouchJump,
  setTouchMove,
} from "../touch";

const JOY_MAX = 56;

export function TouchControls() {
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const joy = joyRef.current;
    const knob = knobRef.current;
    if (!joy || !knob) return;
    let joyId: number | null = null;
    let cx = 0;
    let cy = 0;

    const update = (x: number, y: number) => {
      let dx = x - cx;
      let dy = y - cy;
      const len = Math.hypot(dx, dy);
      if (len > JOY_MAX) {
        dx = (dx / len) * JOY_MAX;
        dy = (dy / len) * JOY_MAX;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      setTouchMove(dx / JOY_MAX, dy / JOY_MAX);
    };

    const onDown = (e: PointerEvent) => {
      if (joyId !== null) return;
      joyId = e.pointerId;
      const rect = joy.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
      joy.setPointerCapture(e.pointerId);
      update(e.clientX, e.clientY);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== joyId) return;
      update(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== joyId) return;
      joyId = null;
      knob.style.transform = "translate(-50%, -50%)";
      setTouchMove(0, 0);
    };

    joy.addEventListener("pointerdown", onDown);
    joy.addEventListener("pointermove", onMove);
    joy.addEventListener("pointerup", onUp);
    joy.addEventListener("pointercancel", onUp);
    return () => {
      joy.removeEventListener("pointerdown", onDown);
      joy.removeEventListener("pointermove", onMove);
      joy.removeEventListener("pointerup", onUp);
      joy.removeEventListener("pointercancel", onUp);
      setTouchMove(0, 0);
    };
  }, []);

  useEffect(() => {
    const look = lookRef.current;
    if (!look) return;
    let lookId: number | null = null;
    let lx = 0;
    let ly = 0;

    const onDown = (e: PointerEvent) => {
      if (lookId !== null) return;
      lookId = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
      look.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== lookId) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      addTouchLook(dx, dy);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== lookId) return;
      lookId = null;
    };

    look.addEventListener("pointerdown", onDown);
    look.addEventListener("pointermove", onMove);
    look.addEventListener("pointerup", onUp);
    look.addEventListener("pointercancel", onUp);
    return () => {
      look.removeEventListener("pointerdown", onDown);
      look.removeEventListener("pointermove", onMove);
      look.removeEventListener("pointerup", onUp);
      look.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <>
      <div ref={lookRef} className="touch-look" aria-hidden />
      <div ref={joyRef} className="touch-joy" aria-hidden>
        <div ref={knobRef} className="touch-joy-knob" />
      </div>
      <button
        type="button"
        className="touch-btn touch-btn-fire"
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
          setTouchFire(true);
        }}
        onPointerUp={() => setTouchFire(false)}
        onPointerCancel={() => setTouchFire(false)}
        onPointerLeave={() => setTouchFire(false)}
        aria-label="Fire"
      >
        <span className="touch-btn-label">FIRE</span>
      </button>
      <button
        type="button"
        className="touch-btn touch-btn-jump"
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
          setTouchJump(true);
        }}
        onPointerUp={() => setTouchJump(false)}
        onPointerCancel={() => setTouchJump(false)}
        onPointerLeave={() => setTouchJump(false)}
        aria-label="Jump"
      >
        <span className="touch-btn-label">JUMP</span>
      </button>
    </>
  );
}
