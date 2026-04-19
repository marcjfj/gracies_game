import { useEffect, useRef, useState } from "react";
import { TIER_LABELS, TIER_ORDER, type QualityTier } from "../quality";

type Props = {
  tier: QualityTier;
  onChange: (tier: QualityTier) => void;
};

export function QualityToggle({ tier, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="quality-toggle-wrap" ref={wrapRef}>
      {open && (
        <div className="quality-popover" role="menu" aria-label="Graphics quality">
          {TIER_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitemradio"
              aria-checked={t === tier}
              className={`quality-popover-item${t === tier ? " is-active" : ""}`}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
            >
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="quality-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Graphics quality: ${TIER_LABELS[tier]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Graphics: ${TIER_LABELS[tier]}`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" />
          <rect x="10" y="9" width="4" height="11" rx="1" fill="currentColor" />
          <rect x="17" y="4" width="4" height="16" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
