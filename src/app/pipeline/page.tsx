import { Icon } from "@/components/icon"
import { getPipelineProjects } from "@/lib/data/pipeline"
import { formatNumber } from "@/lib/utils"
import type { ProjectStatus } from "@/types/database"

export const metadata = {
  title: "Development Pipeline — Inmobiq",
  description: "Pipeline de desarrollo inmobiliario en Tijuana.",
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; icon: string }> = {
  planificacion: { label: "Planificación", color: "bg-orange-100 text-orange-700", icon: "draft" },
  preventa: { label: "Pre-Venta", color: "bg-slate-100 text-slate-800", icon: "sell" },
  construccion: { label: "En Construcción", color: "bg-green-100 text-green-700", icon: "construction" },
  entregado: { label: "Entregado", color: "bg-slate-100 text-slate-700", icon: "check_circle" },
}

export default function PipelinePage() {
  const projects = getPipelineProjects()

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
            Proyectos inmobiliarios en desarrollo activo en Tijuana. Desde planificación hasta entrega.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Icon name="filter_list" className="text-sm" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg shadow-slate-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Icon name="ios_share" className="text-sm" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Proyectos</p>
          <p className="text-3xl font-black">{projects.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Unidades</p>
          <p className="text-3xl font-black">{formatNumber(totalUnits)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Unidades Vendidas</p>
          <p className="text-3xl font-black text-green-600">{formatNumber(totalSold)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Absorción Promedio</p>
          <p className="text-3xl font-black">{avgSoldPct}%</p>
        </div>
      </div>

      {/* Zone Distribution */}
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Distribución por Zona</h3>
        <div className="flex flex-wrap gap-3">
          {zoneDist.map(([zone, count]) => (
            <span key={zone} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
              {zone} · {count}
            </span>
          ))}
        </div>
      </div>

      {/* Kanban by status */}
      {Object.entries(grouped).map(([status, statusProjects]) => {
        if (!statusProjects.length) return null
        const cfg = statusConfig[status as ProjectStatus]
        return (
          <section key={status}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex items-center gap-2 px-3 py-1.5 ${cfg.color} rounded-full`}>
                <Icon name={cfg.icon} className="text-sm" />
                <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
              </div>
              <span className="text-sm text-slate-400 font-semibold">{statusProjects.length} proyectos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusProjects.map((project) => (
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
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold text-lg leading-tight">{project.name}</h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{project.zone_name}</p>
                      </div>
                      <span className={`px-2 py-0.5 ${project.badge_color} text-[10px] font-black rounded-full whitespace-nowrap`}>
                        {project.status_label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mb-4">{project.description}</p>
                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Unidades vendidas</span>
                        <span className="font-bold">{project.units_sold}/{project.units_total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-700 rounded-full"
                          style={{ width: `${(project.units_sold / project.units_total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rango de precio</span>
                        <span className="font-bold">{project.price_range}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Entrega estimada</span>
                        <span className="font-bold">{project.delivery_date}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(project.investors, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-6 w-6 rounded-full border-2 border-white ${["bg-slate-200", "bg-slate-300", "bg-slate-400"][i]}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">{project.investor_label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
