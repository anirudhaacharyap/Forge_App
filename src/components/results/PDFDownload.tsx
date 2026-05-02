"use client";

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { generateReport } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/api";

export default function PDFDownload({
  analysisData,
}: {
  analysisData: AnalysisResponse;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controls = useAnimation();

  const handleDownload = async () => {
    // Trigger bounce animation
    await controls.start({
      y: [0, 5, 0],
      transition: { duration: 0.3, ease: "easeInOut" }
    });

    setLoading(true);
    setError(null);
    try {
      const blob = await generateReport(analysisData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forge-report-${analysisData.recommendation.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:border-[var(--color-primary-container)] hover:text-[var(--color-forge-red)] transition-all disabled:opacity-50 btn-primary"
        id="pdf-download-btn"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-[var(--color-surface-track)] border-t-[var(--color-forge-accent)] rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <motion.span animate={controls} className="material-symbols-outlined text-sm">picture_as_pdf</motion.span>
            Export PDF
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-[var(--color-error)] mt-2">{error}</p>
      )}
    </div>
  );
}
