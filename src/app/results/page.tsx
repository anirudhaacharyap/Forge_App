"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import MaterialRecommendation from "@/components/results/MaterialRecommendation";
import StandardsCompliance from "@/components/results/StandardsCompliance";
import FailureWarning from "@/components/results/FailureWarning";
import CostComparison from "@/components/results/CostComparison";
import VendorList from "@/components/results/VendorList";
import PDFDownload from "@/components/results/PDFDownload";
import AudioPlayback from "@/components/results/AudioPlayback";
import { SkeletonResults } from "@/components/ui/Skeleton";
import { login, saveProject } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResultsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("forge_analysis_result");
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        // No data — redirect to home
        router.push("/");
      }
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="pt-16">
        <SkeletonResults />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const handleSaveProject = async () => {
    if (!data) return;
    setSaving(true);
    try {
      // Always save to localStorage (works offline, no auth needed)
      const existing = JSON.parse(localStorage.getItem("forge_saved_projects") || "[]");
      const project = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        data,
      };
      existing.unshift(project); // newest first
      localStorage.setItem("forge_saved_projects", JSON.stringify(existing));
      setSaved(true);

      // Best-effort: also try to sync to backend (non-blocking)
      try {
        const token = await login();
        await saveProject(token, data);
      } catch {
        // Backend sync failed — that's fine, localStorage has it
      }
    } catch (err) {
      console.error("Failed to save project:", err);
      alert("Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-16 pb-32">
      {/* Top Action Bar */}
      <div className="max-w-[1440px] mx-auto px-6 pt-6 flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-forge-red)] hover:underline"
          id="new-search-btn"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {t("results.newSearch")}
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveProject}
            disabled={saving || saved}
            className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-colors border ${
              saved 
                ? "bg-[#0F9B58]/10 text-[#0F9B58] border-[#0F9B58]/20" 
                : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-dark)]"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {saved ? "check_circle" : saving ? "hourglass_empty" : "save"}
            </span>
            {saved ? "Saved" : saving ? "Saving..." : "Save Project"}
          </button>
          <PDFDownload analysisData={data} />
          <AudioPlayback base64Audio={data.tts_audio_base64} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          {/* Left Column — Primary Data (8/12) */}
          <div className="md:col-span-8 space-y-4">
            {/* Conflict Warning */}
            {data.conflict_warning?.detected && (
              <motion.div variants={itemVariants} className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-[4px] p-4">
                <div className="flex items-center gap-2 text-[#F5A623] mb-2">
                  <span className="material-symbols-outlined text-xl">warning</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Tradeoff Conflict Detected
                  </span>
                </div>
                <div className="space-y-1 pl-7">
                  {data.conflict_warning.conflicts.map((conflict, i) => (
                    <p key={i} className="text-sm text-[#F5A623]/90">• {conflict}</p>
                  ))}
                  {data.conflict_warning.resolution && (
                    <p className="text-sm font-medium text-[#F5A623] mt-2 border-t border-[#F5A623]/20 pt-2">
                      Resolution: {data.conflict_warning.resolution}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Material Recommendation */}
            <motion.div variants={itemVariants}>
              <MaterialRecommendation recommendation={data.recommendation} />
            </motion.div>

            {/* Standards Compliance */}
            <motion.div variants={itemVariants}>
              <StandardsCompliance standards={data.standards} />
            </motion.div>

            {/* Failure Warning */}
            <motion.div variants={itemVariants}>
              <FailureWarning failure={data.failure} />
            </motion.div>
          </div>

          {/* Right Column — Cost, Vendors, Actions (4/12) */}
          <div className="md:col-span-4 space-y-4">
            {/* Cost Comparison */}
            <motion.div variants={itemVariants}>
              <CostComparison
                cost={data.cost}
                alternatives={data.alternatives}
              />
            </motion.div>

            {/* Vendor List */}
            <motion.div variants={itemVariants}>
              <VendorList vendors={data.vendors?.vendors || []} />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-[var(--color-surface-card)] border-t border-[var(--color-border-light)]">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex gap-3">
            <Link
              href="/"
              className="btn-primary bg-[var(--color-primary-container)] text-white px-6 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              {t("results.newAnalysis")}
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
              {t("results.material")}: {data.recommendation.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
