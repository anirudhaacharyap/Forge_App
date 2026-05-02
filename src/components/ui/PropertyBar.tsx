export default function PropertyBar({
  label,
  value,
  maxValue = 10,
  displayValue,
}: {
  label: string;
  value: number;
  maxValue?: number;
  displayValue?: string;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {label}
        </span>
        <span className="text-xs font-bold text-[var(--color-text-primary)]">
          {displayValue ?? `${value}/${maxValue}`}
        </span>
      </div>
      <div className="w-full h-2 bg-[var(--color-surface-track)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-primary-container)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
