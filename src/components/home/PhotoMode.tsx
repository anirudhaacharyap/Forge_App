"use client";

import { useState, useRef } from "react";

export default function PhotoMode({
  onSubmit,
}: {
  onSubmit: (base64: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1]; // strip data:image/... prefix
      setPreview(reader.result as string);
      onSubmitRef.current = base64;
    };
    reader.readAsDataURL(file);
  };

  // Store base64 in a ref to avoid stale closures
  const onSubmitRef = useRef<string>("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[200px] border-2 border-dashed border-[var(--color-border-light)] rounded-[8px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--color-forge-accent)] hover:bg-[var(--color-surface-warm)] transition-all"
          id="photo-drop-zone"
        >
          <span className="material-symbols-outlined text-4xl text-[var(--color-text-secondary)]">
            add_photo_alternate
          </span>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Drop an image here or click to browse
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            JPG, PNG, WebP supported
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="relative bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Uploaded material"
              className="w-full max-h-[300px] object-contain"
            />
            <button
              onClick={() => {
                setPreview(null);
                setFileName("");
                onSubmitRef.current = "";
              }}
              className="absolute top-2 right-2 p-1 bg-[var(--color-surface-card)]/ rounded-full border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
              aria-label="Remove image"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 truncate">
            {fileName}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        id="photo-file-input"
      />

      {preview && (
        <button
          onClick={() => onSubmitRef.current && onSubmit(onSubmitRef.current)}
          className="w-full bg-[var(--color-forge-accent)] text-white py-4 text-lg font-semibold flex items-center justify-center gap-3 rounded-[4px] hover:bg-[var(--color-forge-accent-hover)] active:scale-[0.98] transition-all"
          id="photo-mode-submit"
        >
          Identify Material
          <span className="material-symbols-outlined">image_search</span>
        </button>
      )}
    </div>
  );
}
