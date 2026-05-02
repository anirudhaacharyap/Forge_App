"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import InputModeTabs from "@/components/home/InputModeTabs";
import SimpleMode from "@/components/home/SimpleMode";

import AdvancedMode from "@/components/home/AdvancedMode";
import LocationSelector from "@/components/home/LocationSelector";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { submitAnalysis } from "@/lib/api";
import type { AnalysisPayload } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

type InputMode = "simple" | "voice" | "photo" | "advanced";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("simple");
  const { language, t } = useLanguage();
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 }); // Default: Bangalore
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: Partial<AnalysisPayload>) => {
    setLoading(true);
    setError(null);

    const fullPayload: AnalysisPayload = {
      input_type: payload.input_type || "text",
      text: payload.text || null,
      photo_base64: payload.photo_base64 || null,
      advanced_params: payload.advanced_params || null,
      location,
      language,
    };

    try {
      const result = await submitAnalysis(fullPayload);
      // Store result in sessionStorage for the results page
      sessionStorage.setItem("forge_analysis_result", JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleSubmit = (text: string) => {
    handleSubmit({ input_type: "text", text });
  };

  const handleVoiceSubmit = (text: string) => {
    handleSubmit({ input_type: "voice_transcript", text });
  };

  const handlePhotoSubmit = (base64: string) => {
    handleSubmit({ input_type: "photo", photo_base64: base64 });
  };

  const handleAdvancedSubmit = (params: NonNullable<AnalysisPayload["advanced_params"]>) => {
    handleSubmit({ input_type: "advanced", advanced_params: params });
  };

  return (
    <div className="min-h-screen pt-16 pb-16">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mt-12 sm:mt-20 mb-8"
        >
          <h1 className="text-[60px] sm:text-[80px] font-black tracking-tighter leading-none bg-gradient-to-r from-[var(--color-forge-red)] to-[var(--color-forge-accent)] bg-clip-text text-transparent drop-shadow-sm animate-forge-logo pb-1">
            {t("hero.title")}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
            {t("hero.tagline")}
          </p>
        </motion.div>

        {/* Settings Bar */}
        <div className="flex items-center justify-center gap-6 flex-wrap mb-8">
          <LocationSelector location={location} onLocationChange={setLocation} />
        </div>



        {/* Error Banner */}
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-[var(--color-surface-card)]/ backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {t("loading.analyzing")}
            </p>
          </div>
        )}

        {/* Input Mode Content */}
        <div>
          {mode === "simple" && (
            <SimpleMode 
              onSubmit={handleSimpleSubmit} 
              onPhotoSubmit={handlePhotoSubmit} 
            />
          )}

          {mode === "advanced" && (
            <div className="relative">
              <button onClick={() => setMode("simple")} className="absolute top-0 right-0 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] z-10" aria-label="Close">
                 <span className="material-symbols-outlined">close</span>
              </button>
              <AdvancedMode onSubmit={handleAdvancedSubmit} />
            </div>
          )}
        </div>

        {/* Advanced Mode Button */}
        {mode !== "advanced" && (
          <motion.div 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ delay: 1, duration: 1, ease: "easeInOut", times: [0, 0.5, 1] }}
            className="flex justify-center mt-6"
          >
            <button
              onClick={() => setMode("advanced")}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[8px] hover:border-[var(--color-forge-red)] hover:text-[var(--color-forge-red)] bg-[var(--color-surface-track)] hover:bg-[var(--color-surface-warm)] btn-primary"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              {t("button.advancedMode")}
            </button>
          </motion.div>
        )}

        <div className="mt-16">
          <h2 className="text-xl font-semibold text-[var(--color-text-heading)] mb-4">
            {t("categories.title")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "view_in_ar", labelKey: "category.steel" },
              { icon: "forest", labelKey: "category.timber" },
              { icon: "foundation", labelKey: "category.concrete" },
              { icon: "hardware", labelKey: "category.hardware" },
            ].map((cat) => (
              <button
                key={cat.labelKey}
                onClick={() => {
                  setMode("simple");
                  handleSimpleSubmit(`I need ${t(cat.labelKey).toLowerCase()} for construction`);
                }}
                className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] p-4 rounded-[4px] hover:border-[var(--color-primary-container)] transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-2"
              >
                <span className="material-symbols-outlined text-[var(--color-forge-red)] text-3xl">
                  {cat.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t(cat.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
