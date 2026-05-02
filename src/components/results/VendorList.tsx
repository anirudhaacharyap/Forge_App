import type { Vendor } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <span
          key={i}
          className="material-symbols-outlined text-[var(--color-forge-red)] text-sm fill"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <span
          key={i}
          className="material-symbols-outlined text-[var(--color-forge-red)] text-sm fill"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star_half
        </span>
      );
    } else {
      stars.push(
        <span
          key={i}
          className="material-symbols-outlined text-[var(--color-border-light)] text-sm"
        >
          star
        </span>
      );
    }
  }

  return <div className="flex">{stars}</div>;
}

export default function VendorList({ vendors }: { vendors: Vendor[] }) {
  const { t } = useLanguage();

  if (vendors.length === 0) {
    return (
      <section className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-3">
          {t("results.localVendors")}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          No vendors found in your area. Try adjusting your location.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4">
      <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-4">
        {t("results.localVendors")}
      </h3>
      <div className="space-y-3">
        {vendors.map((vendor, i) => (
          <div
            key={i}
            className="border border-[var(--color-border-light)] rounded-[4px] p-3 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md hover:border-[var(--color-primary-container)]"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {vendor.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={vendor.rating} />
                  <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                    {vendor.rating} ({vendor.total_ratings} reviews)
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-[var(--color-forge-red)] whitespace-nowrap">
                {vendor.distance_km} KM
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-base shrink-0">
                  location_on
                </span>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {vendor.address}
                </p>
              </div>
              {vendor.phone && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-base">
                    call
                  </span>
                  <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                    {vendor.phone}
                  </p>
                </div>
              )}
            </div>

            {vendor.maps_url && (
              <a
                href={vendor.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--color-forge-red)] hover:underline"
              >
                <span className="material-symbols-outlined text-sm">map</span>
                View on Maps
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
