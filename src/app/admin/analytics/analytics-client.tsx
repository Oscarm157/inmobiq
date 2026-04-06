"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Icon } from "@/components/icon"

interface AnalyticsData {
  period: { days: number; since: string; total_events: number }
  summary: {
    total_pageviews: number
    unique_sessions: number
    unique_users: number
    anonymous_sessions: number
  }
  top_pages: Array<{ path: string; views: number; avg_duration_s: number | null }>
  top_features: Array<{ name: string; count: number }>
  daily: Array<{ date: string; views: number; sessions: number; users: number }>
  hourly: number[]
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard (Precios)",
  "/zonas": "Zonas",
  "/comparar": "Comparador",
  "/brujula": "Brújula",
  "/buscar": "Buscar",
  "/riesgo": "Riesgo",
  "/mapa": "Mapa",
  "/portafolio": "Portafolio",
  "/pipeline": "Pipeline",
  "/precios": "Planes",
  "/perfil": "Perfil",
  "/login": "Login",
  "/glosario": "Glosario",
}

function formatPath(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path]
  if (path.startsWith("/zona/")) return `Zona: ${path.replace("/zona/", "")}`
  if (path.startsWith("/brujula/")) return "Brújula (resultado)"
  if (path.startsWith("/admin/")) return `Admin: ${path.replace("/admin/", "")}`
  return path
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatFeatureName(name: string): string {
  const [type, ...rest] = name.split(":")
  const featureName = rest.join(":")
  const typeLabels: Record<string, string> = {
    feature: "",
    export: "Export: ",
    brujula: "Brújula: ",
    search: "Búsqueda: ",
  }
  return `${typeLabels[type] ?? `${type}: `}${featureName}`
}

export function AnalyticsClient() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  const fetchData = useCallback(async (d: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?days=${d}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    if (!isAdmin) { router.push("/"); return }
    fetchData(days)
  }, [user, isAdmin, router, fetchData, days])

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-surface-inset rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-inset rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-surface-inset rounded-xl animate-pulse" />
      </div>
    )
  }

  const maxViews = Math.max(...data.top_pages.map((p) => p.views), 1)
  const maxHour = Math.max(...data.hourly, 1)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.period.total_events.toLocaleString()} eventos registrados
          </p>
        </div>
        <div className="flex gap-1 bg-surface-inset rounded-lg p-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                days === d
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pageviews", value: data.summary.total_pageviews, icon: "visibility", color: "text-blue-500" },
          { label: "Sesiones", value: data.summary.unique_sessions, icon: "devices", color: "text-emerald-500" },
          { label: "Usuarios", value: data.summary.unique_users, icon: "person", color: "text-violet-500" },
          { label: "Anónimos", value: data.summary.anonymous_sessions, icon: "person_off", color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl p-4 card-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Icon name={s.icon} className={`text-base ${s.color}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Daily chart (simple bar) */}
      {data.daily.length > 1 && (
        <div className="bg-surface rounded-xl p-6 card-shadow">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Actividad diaria</h3>
          <div className="flex items-end gap-1 h-32">
            {data.daily.map((d) => {
              const maxDaily = Math.max(...data.daily.map((x) => x.views), 1)
              const pct = (d.views / maxDaily) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-blue-500/80 dark:bg-blue-400/60 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-400"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  <span className="text-[8px] text-muted-foreground font-bold">
                    {new Date(d.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.views} views / {d.sessions} sesiones / {d.users} usuarios
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="bg-surface rounded-xl p-6 card-shadow">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Páginas más visitadas</h3>
          <div className="space-y-2">
            {data.top_pages.map((p, i) => (
              <div key={p.path} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground truncate">{formatPath(p.path)}</span>
                    {p.avg_duration_s !== null && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDuration(p.avg_duration_s)}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-surface-inset rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full"
                      style={{ width: `${(p.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">{p.views}</span>
              </div>
            ))}
            {data.top_pages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Top features */}
        <div className="bg-surface rounded-xl p-6 card-shadow">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Features más usadas</h3>
          <div className="space-y-2">
            {data.top_features.map((f, i) => {
              const maxFeat = data.top_features[0]?.count ?? 1
              return (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-muted-foreground w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-foreground truncate block">{formatFeatureName(f.name)}</span>
                    <div className="h-1.5 bg-surface-inset rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-violet-500/60 rounded-full"
                        style={{ width: `${(f.count / maxFeat) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{f.count}</span>
                </div>
              )
            })}
            {data.top_features.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos de features aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Hourly heatmap */}
      <div className="bg-surface rounded-xl p-6 card-shadow">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Actividad por hora</h3>
        <div className="flex gap-1">
          {data.hourly.map((count, hour) => {
            const intensity = count / maxHour
            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full h-8 rounded transition-colors"
                  style={{
                    backgroundColor: intensity > 0
                      ? `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`
                      : undefined,
                  }}
                />
                <span className="text-[8px] text-muted-foreground font-bold">
                  {hour.toString().padStart(2, "0")}
                </span>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {count} pageviews
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
