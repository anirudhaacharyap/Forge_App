"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CameraCaptureModal from "./CameraCaptureModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { transcribeVoice } from "@/lib/api";

// Languages that support Sarvam server-side transcription
const SARVAM_LANGUAGES = ["hi-IN", "kn-IN", "ta-IN", "te-IN", "ml-IN", "en-IN"];

export default function SimpleMode({
  onSubmit,
  onPhotoSubmit,
}: {
  onSubmit: (text: string) => void;
  onPhotoSubmit?: (base64: string) => void;
}) {
  const [text, setText] = useState("");
  const textRef = useRef(text);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { language, t } = useLanguage();

  // Keep textRef in sync with text state
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [supported, setSupported] = useState(true);

  // Check if we should use Sarvam (server-side) or browser SpeechRecognition
  const useSarvam = SARVAM_LANGUAGES.includes(language) && language !== "en-IN";

  useEffect(() => {
    if (useSarvam) {
      // Sarvam uses MediaRecorder — check support
      setSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    } else {
      const SpeechRecognition =
        typeof window !== "undefined"
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;
      setSupported(!!SpeechRecognition);
    }
  }, [useSarvam]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (onPhotoSubmit) onPhotoSubmit(base64);
    };
    reader.readAsDataURL(file);
  };

  // ── WAV encoding helper ──
  const encodeWav = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buffer], { type: "audio/wav" });
  };

  // ── Sarvam Server-Side Recording ──
  const startSarvamRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsTranscribing(true);

        try {
          // Decode the webm audio to raw PCM, then re-encode as real WAV
          const webmBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const arrayBuffer = await webmBlob.arrayBuffer();
          const audioCtx = new AudioContext();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const pcmData = audioBuffer.getChannelData(0); // mono
          const wavBlob = encodeWav(pcmData, audioBuffer.sampleRate);
          await audioCtx.close();

          // Convert WAV blob to base64
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(wavBlob);
          });

          if (!base64 || base64.length < 500) {
            setIsTranscribing(false);
            return;
          }

          const result = await transcribeVoice({
            audio_base64: base64,
            language_code: language as "hi-IN" | "kn-IN" | "ta-IN" | "te-IN" | "ml-IN" | "en-IN",
            audio_format: "wav",
          });

          if (result.transcript) {
            const currentText = textRef.current;
            const initialText = currentText.trim() ? currentText.trim() + " " : "";
            setText(initialText + result.transcript);
          }
        } catch (err) {
          console.error("Sarvam transcription failed:", err);
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required for voice input.");
    }
  };

  const stopSarvamRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // ── Browser SpeechRecognition (English fallback) ──
  const startBrowserRecording = () => {
    if (!supported) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;

    const initialText = text.trim() ? text.trim() + " " : "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setText(initialText + currentTranscript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopBrowserRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // ── Unified handlers ──
  const startRecording = () => {
    if (useSarvam) {
      startSarvamRecording();
    } else {
      startBrowserRecording();
    }
  };

  const stopRecording = () => {
    if (useSarvam) {
      stopSarvamRecording();
    } else {
      stopBrowserRecording();
    }
  };

  const handleSendOrVoice = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (text.trim()) {
      onSubmit(text.trim());
    } else {
      startRecording();
    }
  };

  const getRightBtnStyle = () => {
    if (isRecording) {
      return "bg-[var(--color-error)] text-white scale-110 shadow-lg";
    }
    if (isTranscribing) {
      return "bg-[var(--color-forge-accent)] text-white";
    }
    if (text.trim()) {
      return "bg-[var(--color-forge-accent)] text-white hover:bg-[var(--color-forge-accent-hover)] shadow-md";
    }
    return "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-track)]";
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) {
                if (isRecording) stopRecording();
                onSubmit(text.trim());
              }
            }
          }}
          className={`w-full min-h-[160px] p-6 pl-12 pr-14 bg-[var(--color-surface-card)] border rounded-[8px] transition-all duration-300 outline-none text-sm resize-none placeholder:text-[var(--color-text-secondary)] shadow-sm focus:shadow-[0_0_0_4px_oklch(from_var(--color-primary-container)_l_c_h_/_0.15)] ${
            isRecording
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border-light)] focus:border-[var(--color-primary-container)]"
          }`}
          placeholder={isRecording ? t("input.listening") : isTranscribing ? "Transcribing..." : t("input.placeholder")}
          id="simple-mode-input"
        />
        
        <div className="absolute left-4 bottom-4 flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-track)] hover:scale-110 active:scale-95 rounded-full transition-all"
            aria-label="Upload photo"
            title="Upload photo"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          
          <button
            onClick={() => setIsCameraOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-track)] hover:scale-110 active:scale-95 rounded-full transition-all"
            aria-label="Take photo"
            title="Take photo"
          >
            <span className="material-symbols-outlined text-xl">photo_camera</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            if (e.target) e.target.value = '';
          }}
          id="simple-photo-upload"
        />

        {/* Right Action: Voice or Send */}
        <button
          onClick={handleSendOrVoice}
          disabled={isTranscribing}
          className={`absolute right-4 bottom-4 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 hover:scale-105 ${getRightBtnStyle()}`}
          aria-label={isRecording ? "Stop Recording" : text.trim() ? "Send" : "Voice Input"}
          title={isRecording ? "Stop Recording" : text.trim() ? "Send" : "Voice Input"}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isTranscribing ? "transcribing" : isRecording ? "stop" : text.trim() ? "send" : "mic"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-xl absolute"
            >
              {isTranscribing ? "hourglass_empty" : isRecording ? "stop" : text.trim() ? "arrow_upward" : "mic"}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(base64) => {
          if (onPhotoSubmit) onPhotoSubmit(base64);
        }}
      />
    </div>
  );
}
