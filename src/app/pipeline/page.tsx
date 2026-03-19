import { Icon } from "@/components/icon"
import { PIPELINE_PROJECTS_EXTENDED } from "@/lib/mock-data"
import { formatNumber } from "@/lib/utils"
import type { ProjectStatus } from "@/types/database"

export const metadata = {
  title: "Development Pipeline — Inmobiq",
  description: "Pipeline de desarrollo inmobiliario en Tijuana.",
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; icon: string }> = {
  planificacion: { label: "Planificación", color: "bg-orange-100 text-orange-700", icon: "draft" },
  preventa: { label: "Pre-Venta", color: "bg-blue-100 text-blue-700", icon: "sell" },
  construccion: { label: "En Construcción", color: "bg-green-100 text-green-700", icon: "construction" },
  entregado: { label: "Entregado", color: "bg-slate-100 text-slate-700", icon: "check_circle" },
}

export default function PipelinePage() {
  const projects = PIPELINE_PROJECTS_EXTENDED

  const totalUnits = projects.reduce((s, p) => s + p.units_total, 0)
  const totalSold = projects.reduce((s, p) => s + p.units_sold, 0)
  const avgSoldPct = Math.round((totalSold / totalUnits) * 100)

  const grouped: Record<string, typeof projects> = {
    planificacion: projects.filter((p) => p.status === "planificacion"),
    preventa: projects.filter((p) => p.status === "preventa"),
    construccion: projects.filter((p) => p.status === "construccion"),
  }

  // Zone distribution
  const zoneCount: Record<string, number> = {}
  projects.forEach((p) => {
    zoneCount[p.zone_name] = (zoneCount[p.zone_name] || 0) + 1
  })
  const zoneDist = Object.entries(zoneCount)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
              Development Pipeline
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
              {projects.length} Proyectos
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Pipeline de Desarrollo
          </h2>
          <p className="text-slate-500 max-w-xl font-medium">
            Seguimiento de proyectos inmobiliarios en desarrollo, pre-venta, y construcción en Tijuana.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Icon name="filter_list" className="text-sm" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Icon name="add" className="text-sm" />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Icon name="apartment" className="text-purple-700" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Total Proyectos
              </p>
              <h4 className="text-2xl font-black">{projects.length}</h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon name="home" className="text-blue-700" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Total Unidades
              </p>
              <h4 className="text-2xl font-black">
                {formatNumber(totalUnits)}
                <span className="text-sm font-medium text-slate-500"> unidades</span>
              </h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Icon name="trending_up" className="text-green-700" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Absorción Global
              </p>
              <h4 className="text-2xl font-black">{avgSoldPct}%</h4>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${avgSoldPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kanban View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["planificacion", "preventa", "construccion"] as ProjectStatus[]).map((status) => {
          const config = statusConfig[status]
          const items = grouped[status] || []
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <Icon name={config.icon} className={`text-sm ${config.color.split(" ")[1]}`} />
                <h3 className="text-sm font-black uppercase tracking-tighter">
                  {config.label}
                </h3>
                <span className="ml-auto text-[10px] font-bold text-slate-400">
                  {items.length}
                </span>
              </div>
              <div className="space-y-4">
                {items.map((project) => {
                  const soldPct = project.units_total > 0
                    ? Math.round((project.units_sold / project.units_total) * 100)
                    : 0
                  return (
                    <div
                      key={project.id}
                      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100"
                    >
                      <div className="aspect-video w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={project.img}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-sm">{project.name}</h5>
                          <span className={`px-2 py-0.5 ${project.badge_color} text-[9px] font-black rounded-full`}>
                            {project.status_label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-1">
                          {project.zone_name}
                        </p>
                        <p className="text-[10px] text-slate-400 mb-3">
                          {project.description}
                        </p>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span>{project.units_sold}/{project.units_total} unidades</span>
                            <span>{soldPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${soldPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-3">
                          <span className="text-slate-500 font-medium">
                            <Icon name="calendar_today" className="text-xs align-middle mr-1" />
                            {project.delivery_date}
                          </span>
                          <span className="font-bold text-blue-700">
                            {project.investor_label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Zone Distribution */}
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h3 className="text-xl font-bold mb-1">Distribución por Zona</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">
          Proyectos activos por zona geográfica
        </p>
        <div className="space-y-3">
          {zoneDist.map(([zone, count]) => (
            <div key={zone} className="flex items-center gap-4">
              <span className="text-sm font-bold w-40 shrink-0">{zone}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${(count / projects.length) * 100}%` }}
                >
                  <span className="text-[10px] font-bold text-white">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
