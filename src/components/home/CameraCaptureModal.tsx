"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check your browser permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // Convert to base64, removing the data URI prefix
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        onCapture(base64);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-[500px] min-w-[320px] bg-[var(--color-surface-card)] rounded-[8px] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border-light)]">
          <h3 className="font-bold text-[var(--color-text-heading)]">Take Photo</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Video Area */}
        <div className="relative bg-black h-[400px] flex items-center justify-center">
          {error ? (
            <p className="text-white text-sm px-4 text-center">{error}</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-6 flex justify-center bg-[var(--color-surface-card)]">
          <button
            onClick={handleCapture}
            disabled={!!error}
            className="w-16 h-16 rounded-full border-4 border-[var(--color-forge-accent)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-track)] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Snap Photo"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-forge-accent)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
