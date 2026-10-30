function Bar({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-black/[0.07] ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14" role="status" aria-label="Loading">
      <Bar className="h-3 w-20" />
      <Bar className="mt-4 h-9 w-56" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Bar key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Bar className="mt-12 h-7 w-40" />
      <Bar className="mt-5 h-64 rounded-2xl" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14" role="status" aria-label="Loading">
      <Bar className="h-3 w-24" />
      <Bar className="mt-4 h-9 w-64" />
      <Bar className="mt-3 h-3 w-40" />
      <div className="mt-12 flex flex-col gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-cream-dark/70 p-6">
            <div className="flex justify-between gap-4">
              <Bar className="h-4 w-40" />
              <Bar className="h-5 w-24 rounded-full" />
            </div>
            <Bar className="mt-5 h-3 w-full" />
            <Bar className="mt-2 h-3 w-3/5" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
