"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationSelector from "@/components/home/LocationSelector";
import VendorList from "@/components/results/VendorList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { searchVendors } from "@/lib/api";
import type { Vendor } from "@/lib/api";

export default function VendorsPage() {
  const { t } = useLanguage();
  const [materialName, setMaterialName] = useState("");
  const [radius, setRadius] = useState(10);
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await searchVendors({
        material_name: materialName,
        location,
        radius_km: radius,
      });
      setVendors(response.vendors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search vendors.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-[40px] sm:text-[60px] font-black tracking-tighter leading-none text-[var(--color-forge-red)]">
            {t("vendors.title")}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">
            {t("vendors.subtitle")}
          </p>
        </div>

        <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[8px] p-6 mb-8 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <div className="flex bg-[var(--color-surface-track)] rounded-[8px] border border-[var(--color-border-light)] overflow-hidden focus-within:border-[var(--color-forge-red)] transition-colors">
                <div className="flex items-center pl-4 pr-2 text-[var(--color-text-secondary)]">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder={t("vendors.searchPlaceholder")}
                  className="w-full bg-transparent border-none py-4 px-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-full sm:w-1/2">
                <LocationSelector location={location} onLocationChange={setLocation} />
              </div>
              <div className="w-full sm:w-1/2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {t("vendors.radius")}
                  </label>
                  <span className="text-xs font-bold text-[var(--color-forge-red)]">{radius} KM</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-forge-red)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !materialName.trim()}
              className="w-full bg-[var(--color-forge-red)] text-white py-4 rounded-[8px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
            >
              {loading ? t("vendors.searching") : t("vendors.searchButton")}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-8">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && vendors !== null && (
          <div className="mt-8">
            <VendorList vendors={vendors} />
          </div>
        )}
      </div>
    </div>
  );
}
