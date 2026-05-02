"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchMaterials } from "@/lib/api";
import type { MaterialItem } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBanner from "@/components/ui/ErrorBanner";
import PropertyBar from "@/components/ui/PropertyBar";
import Badge from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

const categories = ["All", "metal", "wood", "concrete", "paint", "glass", "insulation"];

const propertyLabels: Record<string, string> = {
  tensile_strength: "Tensile Strength",
  ductility: "Ductility",
  corrosion_resistance: "Corrosion Resistance",
  malleability: "Malleability",
  thermal_resistance: "Thermal Resistance",
  density: "Density",
};

export default function MaterialsPage() {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = {};
      if (selectedCategory !== "All") {
        filters.category = selectedCategory;
      }
      const data = await fetchMaterials(filters);
      setMaterials(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load materials. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  return (
    <div className="min-h-screen pt-16 pb-16">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[40px] font-bold tracking-tight text-[var(--color-text-heading)] mb-2">
            {t("materials.browse")}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("materials.subtitle")}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                selectedCategory === cat
                  ? "bg-[var(--color-forge-accent)] text-white border-[var(--color-forge-accent)]"
                  : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-primary-container)]"
              }`}
              id={`filter-${cat}`}
            >
              {cat === "All" ? t("materials.all") : cat}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSpinner size="lg" />}

        {/* Materials Grid */}
        {!loading && materials.length === 0 && !error && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-[var(--color-border-light)] mb-4">
              inventory_2
            </span>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("materials.noMaterials")}
            </p>
          </div>
        )}

        {!loading && materials.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material) => {
              const isExpanded = expandedMaterial === material.name;

              return (
                <div
                  key={material.name}
                  className={`bg-[var(--color-surface-card)] border rounded-[4px] transition-all cursor-pointer ${
                    isExpanded
                      ? "border-[var(--color-primary-container)] ring-1 ring-[var(--color-primary-container)]"
                      : "border-[var(--color-border-light)] hover:border-[var(--color-primary-container)]"
                  }`}
                  onClick={() =>
                    setExpandedMaterial(isExpanded ? null : material.name)
                  }
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {material.name}
                      </h3>
                      <Badge variant="category">{material.category}</Badge>
                    </div>
                    {material.grade && (
                      <p className="text-xs text-[var(--color-text-muted)] mb-3">
                        {material.grade}
                      </p>
                    )}

                    {/* Mini property bars */}
                    <div className="space-y-2">
                      {Object.entries(material.properties || {})
                        .filter(([key]) => key !== "surface_finish")
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] w-20 truncate">
                              {propertyLabels[key] || key}
                            </span>
                            <div className="flex-grow h-1.5 bg-[var(--color-surface-track)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-primary-container)] rounded-full"
                                style={{
                                  width: `${((value as number) / 10) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-border-light)] p-4 space-y-4">
                      {/* All properties */}
                      <div className="space-y-3">
                        {Object.entries(material.properties || {})
                          .filter(([key]) => key !== "surface_finish")
                          .map(([key, value]) => (
                            <PropertyBar
                              key={key}
                              label={propertyLabels[key] || key}
                              value={value as number}
                              maxValue={10}
                            />
                          ))}
                      </div>

                      {/* Use Cases */}
                      {material.use_cases && material.use_cases.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                            {t("materials.useCases")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {material.use_cases.map((uc) => (
                              <span
                                key={uc}
                                className="text-[10px] px-2 py-1 bg-[var(--color-surface-track)] border border-[var(--color-border-light)] rounded-[4px] text-[var(--color-text-secondary)]"
                              >
                                {uc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Standards */}
                      {material.standards && material.standards.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                            {t("materials.standards")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {material.standards.map((std) => (
                              <Badge key={std} variant="info">
                                {std}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Composition */}
                      {material.composition && Object.keys(material.composition).length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                            {t("results.composition")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(material.composition).map(
                              ([el, pct]) => (
                                <span
                                  key={el}
                                  className="text-xs font-medium text-[var(--color-text-primary)]"
                                >
                                  {el}: {pct}%
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
