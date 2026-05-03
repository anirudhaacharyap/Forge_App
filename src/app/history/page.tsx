"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { login, getProjects } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/api";

interface ProjectHistoryItem {
  id: string;
  created_at: string;
  data: AnalysisResponse;
}

export default function HistoryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      let backendProjects: ProjectHistoryItem[] = [];
      let localProjects: ProjectHistoryItem[] = [];

      // 1. Try fetching from backend API
      try {
        const token = await login();
        const raw = await getProjects(token);
        backendProjects = raw.map((item: any) => {
          if (item.data && item.data.recommendation) {
            return {
              id: item._id || item.id || Date.now().toString(),
              created_at: item.created_at || new Date().toISOString(),
              data: item.data,
            };
          }
          if (item.recommendation) {
            return {
              id: item._id || Date.now().toString(),
              created_at: item.created_at || new Date().toISOString(),
              data: item,
            };
          }
          return null;
        }).filter(Boolean);
      } catch {
        // Backend unavailable — that's fine
      }

      // 2. Load from localStorage
      try {
        const raw = localStorage.getItem("forge_saved_projects");
        if (raw) {
          localProjects = JSON.parse(raw);
        }
      } catch {
        // localStorage unavailable
      }

      // 3. Merge: deduplicate by id, prefer backend entries
      const seen = new Set<string>();
      const merged: ProjectHistoryItem[] = [];
      for (const p of [...backendProjects, ...localProjects]) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          merged.push(p);
        }
      }

      // Sort newest first
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setProjects(merged);
      setLoading(false);
    }
    loadHistory();
  }, []);

  const handleViewProject = (data: AnalysisResponse) => {
    sessionStorage.setItem("forge_analysis_result", JSON.stringify(data));
    router.push("/results");
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    // Also remove from localStorage
    try {
      const raw = localStorage.getItem("forge_saved_projects");
      if (raw) {
        const local = JSON.parse(raw).filter((p: ProjectHistoryItem) => p.id !== id);
        localStorage.setItem("forge_saved_projects", JSON.stringify(local));
      }
    } catch { /* ignore */ }
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
      ) : projects.length === 0 ? (
        <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[var(--color-border-dark)] mb-4 block">
            history
          </span>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
            No saved projects yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Run an analysis and click &quot;Save Project&quot; to see it here.
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
            const rec = project.data.recommendation;
            const date = new Date(project.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-5 flex flex-col gap-4 hover:-translate-y-[2px] hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleViewProject(project.data)}
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
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                    aria-label="Delete project"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                  {rec.explanation}
                </p>

                <div className="mt-auto pt-4 border-t border-[var(--color-border-light)] flex justify-between items-center">
                  <div className="flex gap-2">
                    {project.data.standards?.passed ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0F9B58]/10 text-[#0F9B58] px-2 py-0.5 rounded-[4px]">
                        Passed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#BA1A1A]/10 text-[#BA1A1A] px-2 py-0.5 rounded-[4px]">
                        Failed
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${
                      project.data.failure?.risk_level === "HIGH" ? "bg-[#BA1A1A]/10 text-[#BA1A1A]" :
                      project.data.failure?.risk_level === "MEDIUM" ? "bg-[#F5A623]/10 text-[#F5A623]" :
                      "bg-[#0F9B58]/10 text-[#0F9B58]"
                    }`}>
                      {project.data.failure?.risk_level || "LOW"} Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)]">{date}</span>
                    <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm group-hover:text-[var(--color-forge-red)] transition-colors">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
