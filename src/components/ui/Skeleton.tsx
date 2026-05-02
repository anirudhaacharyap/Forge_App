export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 rounded bg-[var(--color-surface-track)] animate-shimmer ${className}`} />
  );
}

// Mimics the MaterialRecommendation + Standards + Failure blocks
export function SkeletonLeftColumn() {
  return (
    <div className="space-y-4 w-full">
      {/* Title block */}
      <div className="mb-8">
        <SkeletonLine className="w-2/3 h-10 mb-3" />
        <SkeletonLine className="w-full h-4 mb-2" />
        <SkeletonLine className="w-4/5 h-4 mb-2" />
        <SkeletonLine className="w-3/4 h-4" />
      </div>

      {/* Property Breakdown */}
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4">
        <SkeletonLine className="w-1/4 h-6 mb-6" />
        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i}>
               <SkeletonLine className="w-1/3 h-3 mb-2" />
               <SkeletonLine className="w-full h-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Standards */}
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4">
        <div className="flex justify-between mb-4">
          <SkeletonLine className="w-1/4 h-6" />
          <SkeletonLine className="w-20 h-6" />
        </div>
        <div className="space-y-3">
           <SkeletonLine className="w-full h-4" />
           <SkeletonLine className="w-full h-4" />
        </div>
      </div>
    </div>
  );
}

// Mimics the Cost Comparison block
export function SkeletonRightColumn() {
  return (
    <div className="space-y-4 w-full">
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[4px] p-4">
        <SkeletonLine className="w-1/2 h-6 mb-6" />
        <div className="space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i}>
               <SkeletonLine className="w-1/4 h-3 mb-1" />
               <SkeletonLine className="w-full h-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonResults() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-8">
        <SkeletonLeftColumn />
      </div>
      <div className="md:col-span-4">
        <SkeletonRightColumn />
      </div>
    </div>
  );
}
