export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`}
      style={style}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

/** KPI card skeleton — matches KPITickerStrip layout */
export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

export function KPIRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Chart skeleton — mimics a bar chart with axis lines */
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 ${height}`}>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex items-end gap-2 h-[calc(100%-60px)]">
        {[40, 65, 50, 80, 35, 70, 55].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

/** Zone card grid skeleton */
export function ZoneGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-28" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <KPIRowSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}
