import Badge from "@/components/ui/Badge";
import type { Standards } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StandardsCompliance({
  standards,
}: {
  standards: Standards;
}) {
  const { t } = useLanguage();
  const statusVariant = (status: string) => {
    switch (status) {
      case "PASS":
        return "pass" as const;
      case "FAIL":
        return "fail" as const;
      case "WARNING":
        return "warning" as const;
      default:
        return "info" as const;
    }
  };

  return (
    <section className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">
          {t("results.standardsCompliance")}
        </h3>
        <Badge variant={standards.passed ? "pass" : "fail"} dot className={standards.passed ? "badge-glow-pass" : "badge-glow-fail"}>
          {standards.passed ? "ALL PASS" : "ISSUES FOUND"}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {standards.details.map((detail, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Badge 
              variant={statusVariant(detail.status)} 
              dot 
              className={detail.status === "PASS" ? "badge-glow-pass" : detail.status === "FAIL" ? "badge-glow-fail" : ""}
            >
              {detail.standard} {detail.status}
            </Badge>
            {detail.note && (
              <p className="text-[11px] text-[var(--color-text-muted)] ml-4 max-w-xs">
                {detail.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
