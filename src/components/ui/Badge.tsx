type BadgeVariant = "pass" | "fail" | "warning" | "info" | "category" | "tier";

const variantStyles: Record<BadgeVariant, string> = {
  pass: "bg-[#0F9B58]/10 border-[#0F9B58]/20 text-[#0F9B58]",
  fail: "bg-[var(--color-error)]/10 border-[var(--color-error)]/20 text-[var(--color-error)]",
  warning: "bg-[#F5A623]/10 border-[#F5A623]/20 text-[#F5A623]",
  info: "bg-[var(--color-surface-track)] border-[var(--color-border-light)] text-[var(--color-text-secondary)]",
  category: "bg-[var(--color-surface-track)] border-[var(--color-border-light)] text-[var(--color-text-secondary)]",
  tier: "bg-[var(--color-surface-warm)] border-[var(--color-forge-red)]/20 text-[var(--color-forge-red)]",
};

export default function Badge({
  children,
  variant = "info",
  dot = false,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}) {
  const dotColors: Record<BadgeVariant, string> = {
    pass: "bg-[#0F9B58]",
    fail: "bg-[var(--color-error)]",
    warning: "bg-[#F5A623]",
    info: "bg-[var(--color-text-secondary)]",
    category: "bg-[var(--color-text-secondary)]",
    tier: "bg-[var(--color-forge-red)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
