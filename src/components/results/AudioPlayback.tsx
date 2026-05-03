"use client";

import { useState, useRef, useEffect } from "react";
import { synthesizeVoice } from "@/lib/api";

export default function AudioPlayback({
  base64Audio,
  summaryText,
  languageCode,
}: {
  base64Audio: string | null;
  summaryText?: string;
  languageCode?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Convert base64 to playable URL
  const createAudioUrl = (b64: string): string => {
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  };

  // Load pre-generated audio if available
  useEffect(() => {
    if (!base64Audio) return;
    try {
      const url = createAudioUrl(base64Audio);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setAudioUrl(null);
    }
  }, [base64Audio]);

  // Generate TTS on demand via /api/voice/synthesize
  const handleGenerateAndPlay = async () => {
    if (!summaryText) return;
    setIsGenerating(true);
    try {
      // Map language to Sarvam-supported TTS languages
      let ttsLang: "hi-IN" | "kn-IN" | "en-IN" = "en-IN";
      if (languageCode === "hi-IN") ttsLang = "hi-IN";
      else if (languageCode === "kn-IN") ttsLang = "kn-IN";

      const truncatedText = summaryText.slice(0, 500);
      const result = await synthesizeVoice({
        text: truncatedText,
        language_code: ttsLang,
      });

      if (result.audio_base64) {
        // Revoke old URL if any
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = createAudioUrl(result.audio_base64);
        setAudioUrl(url);

        // Auto-play after generation
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }, 100);
      }
    } catch (err) {
      console.error("TTS synthesis failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleClick = () => {
    if (audioUrl) {
      togglePlay();
    } else {
      handleGenerateAndPlay();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] px-4 py-3">
      <button
        onClick={handleClick}
        disabled={isGenerating}
        className="w-10 h-10 rounded-full bg-[var(--color-forge-accent)] text-white flex items-center justify-center hover:bg-[var(--color-forge-accent-hover)] transition-colors shrink-0 disabled:opacity-50"
        id="audio-play-btn"
      >
        {isGenerating ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-lg">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        )}
      </button>
      <div className="flex-grow">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {isGenerating ? "Generating Audio..." : "Audio Summary"}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {audioUrl ? "Listen to the recommendation readout" : "Tap to generate voice summary"}
        </p>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
        />
      )}
    </div>
  );
}
