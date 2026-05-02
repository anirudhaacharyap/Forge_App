"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Failure } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FailureWarning({ failure }: { failure: Failure }) {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const riskColors = {
    LOW: { bg: "bg-[#0F9B58]/10", border: "border-[#0F9B58]/20", text: "text-[#0F9B58]" },
    MEDIUM: { bg: "bg-[#F5A623]/10", border: "border-[#F5A623]/20", text: "text-[#F5A623]" },
    HIGH: { bg: "bg-[var(--color-surface-warm)]", border: "border-[var(--color-error)]/20", text: "text-[var(--color-error)]" },
  };

  const colors = riskColors[failure.risk_level] || riskColors.LOW;

  return (
    <section className={`${colors.bg} border ${colors.border} rounded-[4px] p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md`}>
      <div className="flex items-start gap-3 mb-3">
        <span className={`material-symbols-outlined ${colors.text} text-xl shrink-0 mt-0.5`}>
          {failure.risk_level === "HIGH" ? "report_problem" : failure.risk_level === "MEDIUM" ? "warning" : "info"}
        </span>
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              {t("results.failureWarning")}
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${colors.bg} ${colors.text} border ${colors.border} animate-risk-pulse`}
            >
              {failure.risk_level}
            </span>
          </div>
          <p className={`text-sm ${colors.text} opacity-80`}>
            {failure.overall_recommendation}
          </p>
        </div>
      </div>

      {/* Failure Modes */}
      {failure.failure_modes.length > 0 && (
        <div className="space-y-2 mt-4">
          {failure.failure_modes.map((mode, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-card)]/ border border-[var(--color-border-light)] rounded-[4px] overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === i ? null : i)
                }
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--color-surface-card)]/ transition-colors"
                id={`failure-mode-${i}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    mode.severity === "HIGH" ? "text-[var(--color-error)]" :
                    mode.severity === "MEDIUM" ? "text-[#F5A623]" : "text-[#0F9B58]"
                  }`}>
                    {mode.severity}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {mode.type}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-lg transition-transform duration-200"
                  style={{ transform: expandedIndex === i ? "rotate(180deg)" : "" }}
                >
                  expand_more
                </span>
              </button>
              <AnimatePresence initial={false}>
                {expandedIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-[var(--color-border-light)]">
                      <div className="pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                          Description
                        </p>
                        <p className="text-sm text-[var(--color-text-primary)]">
                          {mode.description}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                          Prevention
                        </p>
                        <p className="text-sm text-[var(--color-text-primary)]">
                          {mode.prevention}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
