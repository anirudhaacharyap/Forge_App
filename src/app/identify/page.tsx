"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import CameraCaptureModal from "@/components/home/CameraCaptureModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Badge from "@/components/ui/Badge";
import { identifyPhoto } from "@/lib/api";
import type { IdentifyPhotoResponse } from "@/lib/api";

export default function IdentifyPage() {
  const { t } = useLanguage();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyPhotoResponse["identification"] | null>(null);

  const handlePhotoCapture = async (base64: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await identifyPhoto({ photo_base64: base64 });
      if (response.success) {
        setResult(response.identification);
      } else {
        setError("Failed to identify material.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-[40px] sm:text-[60px] font-black tracking-tighter leading-none text-[var(--color-forge-red)]">
            {t("identify.title")}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
            {t("identify.subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {t("loading.analyzing")}
            </p>
          </div>
        )}

        {!loading && !result && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-3 bg-[var(--color-forge-red)] text-white px-8 py-4 rounded-[8px] font-bold uppercase tracking-wider hover:opacity-90 shadow-lg hover:shadow-xl hover:-translate-y-1 btn-primary"
            >
              <span className="material-symbols-outlined text-2xl">photo_camera</span>
              {t("identify.button")}
            </button>
          </div>
        )}

        {!loading && result && (
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[8px] p-6 sm:p-8 mt-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--color-border-light)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  Identified Material
                </p>
                <h2 className="text-3xl font-bold text-[var(--color-text-heading)]">
                  {result.identified_material}
                </h2>
              </div>
              <div className="text-left sm:text-right">
                 <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  {t("identify.confidence")}
                </p>
                <Badge variant={result.confidence === "HIGH" ? "pass" : "warning"}>
                  {result.confidence}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  {t("identify.category")}
                </p>
                <p className="text-lg font-medium text-[var(--color-text-primary)] capitalize">
                  {result.material_category}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  {t("identify.condition")}
                </p>
                <p className="text-lg font-medium text-[var(--color-text-primary)] capitalize">
                  {result.visible_condition}
                </p>
              </div>
            </div>

            <div className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-[4px] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#F5A623] text-lg">
                  build
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
                  {t("identify.action")}
                </p>
              </div>
              <p className="text-sm text-[#F5A623] font-medium ml-7 capitalize">
                {result.recommended_action}
              </p>
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={() => setResult(null)}
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-forge-red)] hover:underline"
              >
                Scan Another Material
              </button>
            </div>
          </div>
        )}

        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
        />
      </div>
    </div>
  );
}
