import { Skeleton, KPIRowSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/skeleton"

export default function ZonaLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-4" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* KPI ticker strip */}
      <KPIRowSkeleton count={5} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 pb-px">
        {["General", "Precios", "Composición", "Inversión", "Tendencias", "Zona"].map((t) => (
          <Skeleton key={t} className="h-9 w-24 rounded-t-lg" />
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartSkeleton />
          <ChartSkeleton height="h-48" />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}
