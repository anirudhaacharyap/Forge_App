"use client";

import { useState, useMemo } from "react";

interface AdvancedParams {
  tensile_strength: number;
  ductility: number;
  corrosion_resistance: number;
  malleability: number;
  thermal_resistance: number;
  density: number;
  surface_finish: "glossy" | "matte" | "brushed";
}

const sliderConfig = [
  { key: "tensile_strength" as const, label: "Tensile Strength" },
  { key: "ductility" as const, label: "Ductility" },
  { key: "corrosion_resistance" as const, label: "Corrosion Resistance" },
  { key: "malleability" as const, label: "Malleability" },
  { key: "thermal_resistance" as const, label: "Thermal Resistance" },
  { key: "density" as const, label: "Density" },
];

const finishes = ["glossy", "matte", "brushed"] as const;

export default function AdvancedMode({
  onSubmit,
}: {
  onSubmit: (params: AdvancedParams) => void;
}) {
  const [params, setParams] = useState<AdvancedParams>({
    tensile_strength: 5,
    ductility: 5,
    corrosion_resistance: 5,
    malleability: 5,
    thermal_resistance: 5,
    density: 5,
    surface_finish: "matte",
  });

  const conflicts = useMemo(() => {
    const warnings: string[] = [];
    if (params.malleability >= 8 && params.tensile_strength >= 8) {
      warnings.push(
        "High Malleability (≥8) and High Tensile Strength (≥8) are typically mutually exclusive. The recommendation will find the best realistic tradeoff."
      );
    }
    if (params.density <= 2 && params.tensile_strength >= 9) {
      warnings.push(
        "Very Low Density (≤2) with Very High Tensile Strength (≥9) severely limits material options. Consider relaxing one parameter."
      );
    }
    if (params.corrosion_resistance >= 9 && params.malleability >= 9) {
      warnings.push(
        "Maximum Corrosion Resistance (≥9) and Maximum Malleability (≥9) conflict. Very few materials satisfy both."
      );
    }
    return warnings;
  }, [params]);

  const updateParam = (key: keyof AdvancedParams, value: number | string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-6 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-text-heading)]">
            Advanced Mode
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Configure high-precision material parameters for industrial specification.
          </p>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 gap-8">
          {sliderConfig.map(({ key, label }) => {
            const value = params[key] as number;
            const thumbPercent = ((value - 1) / 9) * 100;
            return (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex justify-between items-center relative">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                    {label}
                  </label>
                  {/* Value Tooltip */}
                  <div
                    className="absolute -top-6 bg-[var(--color-forge-red)] text-white text-[10px] font-bold px-2 py-1 rounded-sm pointer-events-none transition-all duration-200 ease-out"
                    style={{ left: `${thumbPercent}%`, transform: "translateX(-50%)" }}
                  >
                    {value}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--color-forge-red)] rotate-45" />
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={value}
                  onChange={(e) => updateParam(key, parseInt(e.target.value))}
                  id={`slider-${key}`}
                  className="w-full h-2 bg-[var(--color-surface-track)] rounded-lg cursor-pointer accent-[var(--color-forge-red)] hover:accent-[var(--color-forge-accent)] transition-all"
                />
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Surface Finish */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
            Surface Finish
          </label>
          <div className="flex bg-[var(--color-surface-track)] p-1 rounded-[8px]">
            {finishes.map((finish) => (
              <button
                key={finish}
                onClick={() => updateParam("surface_finish", finish)}
                className={`flex-1 py-3 text-sm font-medium rounded-[6px] transition-all capitalize ${
                  params.surface_finish === finish
                    ? "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                id={`finish-${finish}`}
              >
                {finish}
              </button>
            ))}
          </div>
        </div>

        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <div className="bg-[var(--color-surface-warm)] border border-[var(--color-error)]/20 rounded-[4px] p-4">
            <div className="flex items-center gap-2 text-[var(--color-error)] mb-2">
              <span className="material-symbols-outlined text-xl">warning</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Conflict Detected
              </span>
            </div>
            {conflicts.map((warning, i) => (
              <p key={i} className="text-sm text-[var(--color-error)]/80 mb-1 last:mb-0">
                {warning}
              </p>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => onSubmit(params)}
          className="w-full bg-[var(--color-forge-accent)] text-white py-4 text-lg font-semibold flex items-center justify-center gap-3 rounded-[4px] hover:bg-[var(--color-forge-accent-hover)] active:scale-[0.98] transition-all"
          id="advanced-mode-submit"
        >
          Find Material
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
    </div>
  );
}
