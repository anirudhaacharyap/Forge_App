"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { login, getProjects } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectHistoryItem {
  id?: string;
  _id?: string;
  created_at?: string;
  data: AnalysisResponse;
}

export default function HistoryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await login();
        const data = await getProjects(token);
        
        // Ensure data maps properly to what we need
        // The API might return an array of { _id, created_at, data: AnalysisResponse }
        // or just an array of AnalysisResponse. We handle both:
        const formatted = data.map((item: any) => {
          if (item.data && item.data.recommendation) {
            return item;
          }
          // If the item itself is the analysis response
          if (item.recommendation) {
            return { data: item, created_at: new Date().toISOString() };
          }
          return null;
        }).filter(Boolean);

        setProjects(formatted);
      } catch (err) {
        console.error(err);
        setError("Failed to load project history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleViewProject = (data: AnalysisResponse) => {
    sessionStorage.setItem("forge_analysis_result", JSON.stringify(data));
    router.push("/results");
  };

  return (
    <div className="pt-24 pb-32 max-w-[1440px] mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[40px] font-bold leading-tight tracking-tight text-[var(--color-text-heading)]">
            Project History
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Review your previously saved material analyses.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#BA1A1A]/10 border border-[#BA1A1A]/20 rounded-[4px] p-6 text-center">
          <p className="text-[#BA1A1A] font-medium">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[var(--color-border-dark)] mb-4">
            history
          </span>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
            No saved projects yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Run an analysis and click "Save Project" to see it here.
          </p>
          <Link
            href="/"
            className="inline-block bg-[var(--color-forge-accent)] text-white px-6 py-3 rounded-[4px] text-sm font-bold uppercase tracking-wider hover:bg-[var(--color-forge-accent-hover)] transition-colors"
          >
            New Analysis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const { data } = project;
            const rec = data.recommendation;
            const date = project.created_at ? new Date(project.created_at).toLocaleDateString() : "Unknown Date";

            return (
              <motion.div
                key={project._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-5 flex flex-col gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleViewProject(data)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-heading)] group-hover:text-[var(--color-forge-red)] transition-colors">
                      {rec.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mt-1">
                      {rec.category}
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                    {date}
                  </span>
                </div>
                
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                  {rec.explanation}
                </p>

                <div className="mt-auto pt-4 border-t border-[var(--color-border-light)] flex justify-between items-center">
                  <div className="flex gap-2">
                    {data.standards.passed ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0F9B58]/10 text-[#0F9B58] px-2 py-0.5 rounded-[4px]">
                        Passed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#BA1A1A]/10 text-[#BA1A1A] px-2 py-0.5 rounded-[4px]">
                        Failed
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${
                      data.failure.risk_level === 'HIGH' ? 'bg-[#BA1A1A]/10 text-[#BA1A1A]' :
                      data.failure.risk_level === 'MEDIUM' ? 'bg-[#F5A623]/10 text-[#F5A623]' :
                      'bg-[#0F9B58]/10 text-[#0F9B58]'
                    }`}>
                      {data.failure.risk_level} Risk
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm group-hover:text-[var(--color-forge-red)] transition-colors">
                    arrow_forward
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
