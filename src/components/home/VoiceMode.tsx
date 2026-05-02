"use client";

import { useState, useEffect, useRef } from "react";

export default function VoiceMode({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<ReturnType<typeof getSpeechRecognition> | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition
        : null;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  function getSpeechRecognition() {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (SpeechRecognition as any)();
  }

  const startRecording = () => {
    if (!supported) return;
    const recognition = getSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--color-text-secondary)]">
          mic_off
        </span>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
          Voice input is not supported in this browser. Please use Chrome or Edge for voice input, or try the Text mode instead.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Record Button */}
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-[var(--color-forge-accent)]/20 animate-pulse-ring" />
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? "bg-[var(--color-error)] scale-110"
              : "bg-[var(--color-forge-accent)] hover:bg-[var(--color-forge-accent-hover)]"
          }`}
          id="voice-record-btn"
        >
          <span className="material-symbols-outlined text-white text-3xl">
            {isRecording ? "stop" : "mic"}
          </span>
        </button>
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {isRecording ? "Listening... Tap to stop" : "Tap to start speaking"}
      </p>

      {/* Transcript */}
      {transcript && (
        <div className="w-full max-w-lg">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Transcript
            </p>
            <p className="text-sm text-[var(--color-text-primary)]">{transcript}</p>
          </div>
          <button
            onClick={() => transcript.trim() && onSubmit(transcript.trim())}
            className="w-full mt-4 bg-[var(--color-forge-accent)] text-white py-4 text-lg font-semibold flex items-center justify-center gap-3 rounded-[4px] hover:bg-[var(--color-forge-accent-hover)] active:scale-[0.98] transition-all"
            id="voice-mode-submit"
          >
            Find Material
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      )}
    </div>
  );
}
