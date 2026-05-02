import type { Cost, Alternative } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CostComparison({
  cost,
  alternatives,
}: {
  cost: Cost;
  alternatives: Alternative[];
}) {
  const { t } = useLanguage();

  const tierColors: Record<string, string> = {
    budget: "bg-[var(--color-secondary-container)]",
    "Budget": "bg-[var(--color-secondary-container)]",
    "mid-range": "bg-[var(--color-primary-container)]",
    "Mid-Range": "bg-[var(--color-primary-container)]",
    "Mid": "bg-[var(--color-primary-container)]",
    premium: "bg-[var(--color-inverse-surface)]",
    "Premium": "bg-[var(--color-inverse-surface)]",
  };

  const tierTextColors: Record<string, string> = {
    budget: "text-[var(--color-text-secondary)]",
    "Budget": "text-[var(--color-text-secondary)]",
    "mid-range": "text-[var(--color-forge-red)]",
    "Mid-Range": "text-[var(--color-forge-red)]",
    "Mid": "text-[var(--color-forge-red)]",
    premium: "text-[var(--color-text-primary)]",
    "Premium": "text-[var(--color-text-primary)]",
  };

  // Calculate bar widths relative to max price
  const maxPrice = Math.max(
    ...cost.comparison.map((item) => item.price_per_kg_max || 0),
    1
  );

  return (
    <div className="space-y-4">
      {/* Cost Comparison Card */}
      <section className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
        <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-6">
          {t("results.marketCostIndex")}
        </h3>
        <div className="space-y-5">
          {cost.comparison.map((item, i) => {
            const width = ((item.price_per_kg_max || item.price_per_kg_min) / maxPrice) * 100;
            const barColor = tierColors[item.tier] || "bg-[var(--color-secondary-container)]";
            const textColor = tierTextColors[item.tier] || "text-[var(--color-text-secondary)]";

            return (
              <div key={i}>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                  {item.tier.toUpperCase()} ({item.name})
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex-grow h-6 bg-[var(--color-surface-track)] border border-[var(--color-border-light)]">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${textColor} whitespace-nowrap`}>
                    {item.price_display}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-2">
            {t("results.recommendedAlternatives")}
          </h3>
          {alternatives.map((alt, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4 flex items-center justify-between transition-all duration-300 hover:border-[var(--color-primary-container)] hover:-translate-y-[2px] hover:shadow-md cursor-pointer"
            >
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  {alt.name}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {alt.reason}
                </p>
                {alt.cost_difference && (
                  <span className="text-[10px] font-bold text-[#0F9B58] mt-1 inline-block">
                    {alt.cost_difference}
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-[var(--color-text-secondary)]">
                chevron_right
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
