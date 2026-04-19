import { useEffect, useRef } from "react";
import {
  setTouchFire,
  setTouchJump,
  setTouchLookRate,
  setTouchMove,
} from "../touch";

const JOY_MAX = 56;
const AIM_MAX = 56;
const FIRE_DEADZONE = 0.18;

type JoyHandlers = {
  onUpdate: (nx: number, ny: number) => void;
  onRelease: () => void;
};

function attachJoystick(
  el: HTMLDivElement,
  knob: HTMLDivElement,
  maxRadius: number,
  handlers: JoyHandlers,
) {
  let activeId: number | null = null;
  let cx = 0;
  let cy = 0;

  const update = (clientX: number, clientY: number) => {
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > maxRadius) {
      dx = (dx / len) * maxRadius;
      dy = (dy / len) * maxRadius;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    handlers.onUpdate(dx / maxRadius, dy / maxRadius);
  };

  const reset = () => {
    knob.style.transform = "translate(-50%, -50%)";
    handlers.onRelease();
  };

  const onDown = (e: PointerEvent) => {
    if (activeId !== null) return;
    activeId = e.pointerId;
    const rect = el.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
    el.setPointerCapture(e.pointerId);
    update(e.clientX, e.clientY);
    e.preventDefault();
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    update(e.clientX, e.clientY);
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    reset();
  };

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  return () => {
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    reset();
  };
}

export function TouchControls() {
  const moveJoyRef = useRef<HTMLDivElement>(null);
  const moveKnobRef = useRef<HTMLDivElement>(null);
  const aimJoyRef = useRef<HTMLDivElement>(null);
  const aimKnobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const joy = moveJoyRef.current;
    const knob = moveKnobRef.current;
    if (!joy || !knob) return;
    return attachJoystick(joy, knob, JOY_MAX, {
      onUpdate: (nx, ny) => setTouchMove(nx, ny),
      onRelease: () => setTouchMove(0, 0),
    });
  }, []);

  useEffect(() => {
    const joy = aimJoyRef.current;
    const knob = aimKnobRef.current;
    if (!joy || !knob) return;
    return attachJoystick(joy, knob, AIM_MAX, {
      onUpdate: (nx, ny) => {
        setTouchLookRate(nx, ny);
        setTouchFire(Math.hypot(nx, ny) > FIRE_DEADZONE);
      },
      onRelease: () => {
        setTouchLookRate(0, 0);
        setTouchFire(false);
      },
    });
  }, []);

  return (
    <>
      <div ref={moveJoyRef} className="touch-joy touch-joy-move" aria-hidden>
        <div ref={moveKnobRef} className="touch-joy-knob" />
      </div>
      <div ref={aimJoyRef} className="touch-joy touch-joy-aim" aria-hidden>
        <div ref={aimKnobRef} className="touch-joy-knob touch-joy-knob-aim" />
      </div>
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
