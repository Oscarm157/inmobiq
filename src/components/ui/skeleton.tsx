export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function KPIRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-3 ${height}`}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <KPIRowSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}
