"use client";

import { useState } from "react";

export default function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 rounded-[4px] px-4 py-3 flex items-start gap-3" role="alert">
      <span className="material-symbols-outlined text-[var(--color-error)] text-xl shrink-0 mt-0.5">
        error
      </span>
      <p className="text-sm text-[var(--color-error)] flex-grow">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="text-[var(--color-error)] hover:opacity-70 transition-opacity shrink-0"
        aria-label="Dismiss error"
        id="dismiss-error-btn"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
