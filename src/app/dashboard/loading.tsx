function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <Skeleton className="h-44 rounded-2xl" />

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 dark:border-slate-700 dark:bg-slate-900/80">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Recent proposals */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-6 w-56" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>

      {/* Job feed */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-6 w-64" />
        <Skeleton className="mt-5 h-10 w-full" />
      </div>
    </div>
  );
}
