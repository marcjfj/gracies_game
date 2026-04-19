import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@react-three/drei";

type Props = {
  prepare?: () => void;
  onReady: () => void;
};

const MIN_DISPLAY_MS = 600;
const GRACE_MS = 250;

export function LoadingScreen({ prepare, onReady }: Props) {
  const { progress, loaded, total, active } = useProgress();
  const [graceElapsed, setGraceElapsed] = useState(false);
  const mountedAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    prepare?.();
    const t = window.setTimeout(() => setGraceElapsed(true), GRACE_MS);
    return () => window.clearTimeout(t);
  }, [prepare]);

  useEffect(() => {
    if (!graceElapsed) return;
    if (active) return;
    if (total > 0 && loaded < total) return;
    const elapsed = Date.now() - mountedAt;
    const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
    const t = window.setTimeout(onReady, wait);
    return () => window.clearTimeout(t);
  }, [graceElapsed, active, loaded, total, onReady, mountedAt]);

  const pct =
    total === 0 ? (graceElapsed ? 100 : 0) : Math.min(100, Math.round(progress));

  const dots = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const rand = (seed: number) => {
          const x = Math.sin(seed * 9301 + 49297) * 233280;
          return x - Math.floor(x);
        };
        return {
          left: rand(i + 1) * 100,
          top: rand(i + 17) * 100,
          size: 0.6 + rand(i + 31) * 1.8,
          delay: rand(i + 7) * 4,
          duration: 2.5 + rand(i + 11) * 4,
        };
      }),
    [],
  );

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-nebula loading-nebula-a" aria-hidden />
      <div className="loading-nebula loading-nebula-b" aria-hidden />
      <div className="loading-stars" aria-hidden>
        {dots.map((s, i) => (
          <span
            key={i}
            className="loading-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="loading-content">
        <div className="loading-eyebrow">Preparing</div>
        <div className="loading-title">Charting the path…</div>
        <div className="loading-bar" aria-hidden>
          <div className="loading-bar-fill" style={{ width: `${pct}%` }} />
          <div className="loading-bar-shimmer" />
        </div>
        <div className="loading-pct">{pct}%</div>
      </div>
    </div>
  );
}
