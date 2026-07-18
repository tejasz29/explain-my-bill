export function LoadingSkeleton() {
  return (
    <section className="animate-float-up space-y-6">
      <div className="glass-panel overflow-hidden rounded-[32px] p-7">
        <div className="mb-4 h-4 w-28 animate-pulse rounded-full bg-stone-200" />
        <div className="mb-3 h-12 w-44 animate-pulse rounded-full bg-stone-300" />
        <div className="h-4 w-full animate-pulse rounded-full bg-stone-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-[32px] p-7">
          <div className="mb-6 h-5 w-40 animate-pulse rounded-full bg-stone-200" />
          <div className="h-72 animate-pulse rounded-[24px] bg-stone-200" />
        </div>
        <div className="glass-panel rounded-[32px] p-7">
          <div className="mb-6 h-5 w-40 animate-pulse rounded-full bg-stone-200" />
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-[22px] bg-stone-200" />
            <div className="h-20 animate-pulse rounded-[22px] bg-stone-200" />
            <div className="h-20 animate-pulse rounded-[22px] bg-stone-200" />
          </div>
        </div>
      </div>
    </section>
  );
}
