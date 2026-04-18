import { useCallback, useEffect, useRef } from "react";

export function useSoundEffect(src: string, volume = 0.6) {
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    let cancelled = false;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .then((buf) => {
        if (!cancelled) bufferRef.current = buf;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ctx.close().catch(() => {});
      ctxRef.current = null;
      bufferRef.current = null;
    };
  }, [src]);

  return useCallback(() => {
    const ctx = ctxRef.current;
    const buf = bufferRef.current;
    if (!ctx || !buf) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = volumeRef.current;
    source.connect(gain).connect(ctx.destination);
    source.start(0);
  }, []);
}
