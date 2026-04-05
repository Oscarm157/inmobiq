import { Icon } from "@/components/icon"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"
import { HeroHeader, HeroStat } from "@/components/hero-header"
import { getPipelineProjects } from "@/lib/data/pipeline"
import { formatNumber } from "@/lib/utils"
import type { ProjectStatus } from "@/types/database"

export const metadata = {
  title: "Pipeline de Desarrollo — Inmobiq",
  description: "Pipeline de desarrollo inmobiliario en Tijuana.",
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; darkColor: string; icon: string }> = {
  planificacion: { label: "Planificación", color: "bg-badge-amber-bg text-badge-amber-text", darkColor: "dark:bg-amber-950/30 dark:text-amber-400", icon: "draft" },
  preventa: { label: "Pre-Venta", color: "bg-badge-neutral-bg text-badge-neutral-text", darkColor: "", icon: "sell" },
  construccion: { label: "En Construcción", color: "bg-badge-green-bg text-badge-green-text", darkColor: "", icon: "construction" },
  entregado: { label: "Entregado", color: "bg-badge-neutral-bg text-badge-neutral-text", darkColor: "", icon: "check_circle" },
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
    <StaggerContainer className="space-y-10">
      {/* Hero Header */}
      <FadeInUp>
        <HeroHeader
          badge="Pipeline de Desarrollo"
          badgeIcon="construction"
          title="Pipeline de Desarrollo"
          subtitle="Proyectos inmobiliarios en desarrollo activo en Tijuana. Desde planificación hasta entrega."
          accent="violet"
          badges={[{ label: `${projects.length} Proyectos`, variant: "green" }]}
          actions={
            <>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] backdrop-blur-sm text-white rounded-full text-sm font-bold hover:bg-white/[0.14] transition-all border border-white/[0.06]">
                <Icon name="filter_list" className="text-sm" />
                Filtrar
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold shadow-lg shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Icon name="ios_share" className="text-sm" />
                Exportar
              </button>
            </>
          }
        >
          <HeroStat icon="apartment" label="Proyectos" value={projects.length} color="violet" />
          <HeroStat icon="grid_view" label="Unidades" value={formatNumber(totalUnits)} color="blue" />
          <HeroStat icon="trending_up" label="Absorción" value={`${avgSoldPct}%`} color="emerald" />
        </HeroHeader>
      </FadeInUp>

      {/* Zone Distribution */}
      <FadeInUp><div className="bg-surface rounded-xl p-6 card-shadow">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Distribución por Zona</h3>
        <div className="flex flex-wrap gap-3">
          {zoneDist.map(([zone, count]) => (
            <span key={zone} className="px-3 py-1.5 bg-surface-inset rounded-full text-xs font-bold text-foreground">
              {zone} · {count}
            </span>
          ))}
        </div>
      </div></FadeInUp>

      {/* Kanban by status */}
      {Object.entries(grouped).map(([status, statusProjects]) => {
        if (!statusProjects.length) return null
        const cfg = statusConfig[status as ProjectStatus]
        return (
          <FadeInUp key={status}><section>
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex items-center gap-2 px-3 py-1.5 ${cfg.color} ${cfg.darkColor} rounded-full`}>
                <Icon name={cfg.icon} className="text-sm" />
                <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
              </div>
              <span className="text-sm text-muted-foreground font-semibold">{statusProjects.length} proyectos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-border/50"
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
                        <h5 className="font-bold text-lg leading-tight text-foreground">{project.name}</h5>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{project.zone_name}</p>
                      </div>
                      <span className={`px-2 py-0.5 ${project.badge_color} text-[10px] font-black rounded-full whitespace-nowrap`}>
                        {project.status_label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-4">{project.description}</p>
                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unidades vendidas</span>
                        <span className="font-bold text-foreground">{project.units_sold}/{project.units_total}</span>
                      </div>
                      <div className="h-1.5 bg-surface-inset rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/70 rounded-full"
                          style={{ width: `${(project.units_sold / project.units_total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rango de precio</span>
                        <span className="font-bold text-foreground">{project.price_range}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrega estimada</span>
                        <span className="font-bold text-foreground">{project.delivery_date}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(project.investors, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-6 w-6 rounded-full border-2 border-surface ${["bg-muted", "bg-border", "bg-muted-foreground/30"][i]}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-foreground">{project.investor_label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section></FadeInUp>
        )
      })}
    </StaggerContainer>
  )
}
