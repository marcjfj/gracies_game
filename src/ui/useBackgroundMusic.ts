import { useCallback, useEffect, useRef, useState } from "react";

export function useBackgroundMusic(src: string, volume = 0.35) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src, volume]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {});
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  return { play, muted, toggleMute };
}
