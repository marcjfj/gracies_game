type Props = {
  muted: boolean;
  onToggle: () => void;
};

export function MusicToggle({ muted, onToggle }: Props) {
  return (
    <button
      type="button"
      className="music-toggle"
      onClick={onToggle}
      aria-label={muted ? "Unmute music" : "Mute music"}
      title={muted ? "Unmute music" : "Mute music"}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
          fill="currentColor"
          d="M4 9v6h4l5 4V5L8 9H4z"
        />
        {muted ? (
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M17 9l5 6M22 9l-5 6"
            fill="none"
          />
        ) : (
          <path
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            d="M16.5 8.5a5 5 0 010 7M19 6a8 8 0 010 12"
          />
        )}
      </svg>
    </button>
  );
}
