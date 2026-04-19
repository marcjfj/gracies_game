import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isTouchDevice } from "./touch";

export type QualityTier = "low" | "medium" | "high";

export type QualitySettings = {
  dprMax: number;
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: number;
  fogFarMultiplier: number;
};

export const PRESETS: Record<QualityTier, QualitySettings> = {
  low: {
    dprMax: 1,
    antialias: false,
    shadows: false,
    shadowMapSize: 0,
    fogFarMultiplier: 0.7,
  },
  medium: {
    dprMax: 1.5,
    antialias: false,
    shadows: true,
    shadowMapSize: 1024,
    fogFarMultiplier: 0.85,
  },
  high: {
    dprMax: 2,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    fogFarMultiplier: 1,
  },
};

export const TIER_ORDER: readonly QualityTier[] = ["low", "medium", "high"] as const;

export const TIER_LABELS: Record<QualityTier, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const STORAGE_KEY = "poodle.quality";

export function detectDefaultTier(): QualityTier {
  if (typeof navigator === "undefined") return "high";
  const touch = isTouchDevice();
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (touch && (cores <= 4 || memory <= 4)) return "low";
  if (touch) return "medium";
  return "high";
}

function readStoredTier(): QualityTier | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "low" || v === "medium" || v === "high") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredTier(tier: QualityTier) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    /* ignore */
  }
}

export type QualityContextValue = {
  tier: QualityTier;
  settings: QualitySettings;
  setTier: (tier: QualityTier) => void;
};

export const QualityContext = createContext<QualityContextValue | null>(null);

export function QualityProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<QualityTier>(() => readStoredTier() ?? detectDefaultTier());

  useEffect(() => {
    writeStoredTier(tier);
  }, [tier]);

  const setTier = useCallback((next: QualityTier) => {
    setTierState(next);
  }, []);

  const value = useMemo<QualityContextValue>(
    () => ({ tier, settings: PRESETS[tier], setTier }),
    [tier, setTier],
  );

  return createElement(QualityContext.Provider, { value }, children);
}

export function useQuality(): QualityContextValue {
  const ctx = useContext(QualityContext);
  if (!ctx) {
    throw new Error("useQuality must be used inside <QualityProvider>");
  }
  return ctx;
}
