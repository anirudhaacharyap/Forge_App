"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageCode } from "@/lib/translations";

const languages: { code: LanguageCode; label: string }[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-1.5 relative px-2 py-1 hover:bg-[var(--color-surface-track)] rounded-[4px] transition-colors">
      <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-base">
        translate
      </span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="bg-transparent text-sm font-medium text-[var(--color-text-primary)] outline-none cursor-pointer appearance-none pr-4 relative z-10"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm absolute right-0 pointer-events-none">
        expand_more
      </span>
    </div>
  );
}
