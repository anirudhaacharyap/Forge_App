"use client";

type InputMode = "simple" | "voice" | "photo" | "advanced";

const modes: { key: InputMode; label: string; icon: string }[] = [
  { key: "simple", label: "Text", icon: "edit" },
  { key: "voice", label: "Voice", icon: "mic" },
  { key: "photo", label: "Photo", icon: "photo_camera" },
];

export default function InputModeTabs({
  activeMode,
  onModeChange,
}: {
  activeMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}) {
  return (
    <div className="flex bg-[var(--color-surface-track)] p-1 rounded-[8px] w-full max-w-lg mx-auto">
      {modes.map((mode) => {
        const isActive = activeMode === mode.key;
        return (
          <button
            key={mode.key}
            onClick={() => onModeChange(mode.key)}
            id={`tab-${mode.key}`}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[6px] transition-all duration-200 ${
              isActive
                ? "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <span className="material-symbols-outlined text-base">{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
