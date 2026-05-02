"use client";

import { useState, useRef, useEffect } from "react";

export default function AudioPlayback({
  base64Audio,
}: {
  base64Audio: string | null;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!base64Audio) return;

    try {
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      return () => URL.revokeObjectURL(url);
    } catch {
      // Silently fail if base64 is invalid
      setAudioUrl(null);
    }
  }, [base64Audio]);

  if (!base64Audio || !audioUrl) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] px-4 py-3">
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[var(--color-forge-accent)] text-white flex items-center justify-center hover:bg-[var(--color-forge-accent-hover)] transition-colors shrink-0"
        id="audio-play-btn"
      >
        <span className="material-symbols-outlined text-lg">
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>
      <div className="flex-grow">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Audio Summary
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Listen to the recommendation readout
        </p>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />
    </div>
  );
}
