import { Icon } from "@/components/icon"
import type { PipelineProject } from "@/types/database"

interface PipelinePreviewCardProps {
  project: PipelineProject
}

const statusIcons: Record<string, string> = {
  planificacion: "draft",
  preventa: "sell",
  construccion: "construction",
  entregado: "check_circle",
}

export function PipelinePreviewCard({ project }: PipelinePreviewCardProps) {
  const progress = Math.round((project.units_sold / project.units_total) * 100)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold">{project.name}</p>
          <p className="text-xs text-slate-400 font-medium">{project.zone_name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${project.badge_color}`}>
          {project.status_label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
          <span>{project.units_sold}/{project.units_total} unidades</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <Icon name={statusIcons[project.status] ?? "info"} className="text-sm" />
          <span className="font-medium">{project.price_range}</span>
        </div>
        <span className="text-slate-400 font-medium">Entrega: {project.delivery_date}</span>
      </div>
    </div>
  )
}
