import PropertyBar from "@/components/ui/PropertyBar";
import Badge from "@/components/ui/Badge";
import type { Recommendation } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const formatLabel = (key: string, t: any) => {
  const translationKey = `property.${key}`;
  const translated = t(translationKey);
  return translated !== translationKey 
    ? translated 
    : key.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

export default function MaterialRecommendation({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const { t } = useLanguage();
  const properties = recommendation.properties;
  const composition = recommendation.composition;

  return (
    <div>
      {/* Title Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h1 className="text-[40px] font-bold leading-tight tracking-tight text-[var(--color-text-heading)]">
            {recommendation.name}
          </h1>
          <Badge variant="category">
            {t(`category.${recommendation.category.toLowerCase()}`) !== `category.${recommendation.category.toLowerCase()}` 
              ? t(`category.${recommendation.category.toLowerCase()}`) 
              : recommendation.category}
          </Badge>
          {recommendation.grade && (
            <Badge variant="tier">{recommendation.grade}</Badge>
          )}
        </div>
        <p className="text-base leading-relaxed text-[var(--color-text-secondary)] max-w-3xl">
          {recommendation.explanation}
        </p>
      </div>

      {/* Property Breakdown */}
      <section className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4 mb-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
        <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-6">
          {t("results.propertyBreakdown")}
        </h3>
        <div className="space-y-5">
          {Object.entries(properties).map(([key, value]) => {
            if (key === "surface_finish") return null;
            return (
              <PropertyBar
                key={key}
                label={formatLabel(key, t)}
                value={value as number}
                maxValue={(value as number) > 10 ? 100 : 10}
              />
            );
          })}
        </div>
        {properties.surface_finish && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {t("property.surface_finish")}
            </span>
            <span className="ml-2 text-sm font-medium text-[var(--color-text-primary)] capitalize">
              {properties.surface_finish}
            </span>
          </div>
        )}
      </section>

      {/* Composition */}
      {composition && Object.keys(composition).length > 0 && (
        <section className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
          <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-4">
            {t("results.composition")}
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(composition).map(([element, percentage]) => (
              <div
                key={element}
                className="flex items-center gap-2 bg-[var(--color-surface-track)] px-3 py-2 rounded-[4px]"
              >
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  {element}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {percentage}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
