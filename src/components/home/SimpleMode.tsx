"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CameraCaptureModal from "./CameraCaptureModal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SimpleMode({
  onSubmit,
  onPhotoSubmit,
}: {
  onSubmit: (text: string) => void;
  onPhotoSubmit?: (base64: string) => void;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { t } = useLanguage();

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (onPhotoSubmit) onPhotoSubmit(base64);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = () => {
    if (!supported) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;

    // Capture text before recording starts to append properly
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

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
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

  // Determine right action button styles
  const getRightBtnStyle = () => {
    if (isRecording) {
      return "bg-[var(--color-error)] text-white scale-110 shadow-lg";
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
          placeholder={isRecording ? t("input.listening") : t("input.placeholder")}
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
          className={`absolute right-4 bottom-4 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 hover:scale-105 ${getRightBtnStyle()}`}
          aria-label={isRecording ? "Stop Recording" : text.trim() ? "Send" : "Voice Input"}
          title={isRecording ? "Stop Recording" : text.trim() ? "Send" : "Voice Input"}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isRecording ? "stop" : text.trim() ? "send" : "mic"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-xl absolute"
            >
              {isRecording ? "stop" : text.trim() ? "arrow_upward" : "mic"}
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
