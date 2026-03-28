import { Icon } from "@/components/icon"

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
}

export function EmptyState({
  icon = "bar_chart_off",
  title = "Sin datos suficientes",
  description = "No hay datos disponibles para esta vista con los filtros actuales.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon name={icon} className="text-3xl text-slate-300 dark:text-slate-600 mb-2" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-0.5">{description}</p>
    </div>
  )
}
