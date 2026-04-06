"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/icon"
import { ZoneCard } from "@/components/zone-card"
import { useAuth } from "@/contexts/auth-context"
import { useCurrency } from "@/contexts/currency-context"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import type { ZoneMetrics } from "@/types/database"

const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  { ssr: false, loading: () => <div className="h-[500px] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"><div className="text-slate-400 text-sm font-medium">Cargando mapa…</div></div> }
)

type SortKey = "inventario" | "precio" | "tendencia" | "nombre"
type ViewMode = "grid" | "mapa"

const SORT_OPTIONS: { value: SortKey; label: string; icon: string }[] = [
  { value: "inventario", label: "Inventario", icon: "inventory_2" },
  { value: "precio", label: "Precio/m²", icon: "payments" },
  { value: "tendencia", label: "Tendencia", icon: "trending_up" },
  { value: "nombre", label: "Nombre", icon: "sort_by_alpha" },
]

interface ZonesGridClientProps {
  zones: ZoneMetrics[]
}

export function ZonesGridClient({ zones }: ZonesGridClientProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("precio")
  const [view, setView] = useState<ViewMode>("mapa")
  const [selectedZone, setSelectedZone] = useState<ZoneMetrics | null>(null)
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const isAnon = !user

  const filtered = useMemo(() => {
    let result = zones
    if (search.trim().length >= 2) {
      const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      result = result.filter((z) => {
        const name = z.zone_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        return name.includes(q)
      })
    }
    switch (sortBy) {
      case "inventario": result = [...result].sort((a, b) => b.total_listings - a.total_listings); break
      case "precio": result = [...result].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2); break
      case "tendencia": result = [...result].sort((a, b) => b.price_trend_pct - a.price_trend_pct); break
      case "nombre": result = [...result].sort((a, b) => a.zone_name.localeCompare(b.zone_name, "es")); break
    }
    return result
  }, [zones, search, sortBy])

  const maxListings = zones.reduce((max, z) => Math.max(max, z.total_listings), 1)

  function handleZoneClick(slug: string) {
    setSelectedZone(zones.find((z) => z.zone_slug === slug) ?? null)
  }

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar zona..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <Icon name="close" className="text-sm" />
            </button>
          )}
        </div>

        {/* Sort (grid view only) + View toggle */}
        <div className="flex gap-2">
          {view === "grid" && (
            <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === opt.value
                      ? "bg-slate-800 dark:bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon name={opt.icon} className="text-xs" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* View toggle */}
          <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setView("mapa")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "mapa" ? "bg-slate-800 dark:bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon name="map" className="text-xs" />
              <span className="hidden sm:inline">Mapa</span>
            </button>
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === "grid" ? "bg-slate-800 dark:bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon name="grid_view" className="text-xs" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
        {filtered.length} {filtered.length === 1 ? "zona" : "zonas"}
        {search && ` para "${search}"`}
      </p>

      {/* Map view */}
      {view === "mapa" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[400px] lg:h-[calc(100vh-280px)] lg:min-h-[450px]">
          <div className="lg:col-span-3 h-full rounded-xl overflow-hidden">
            <InteractiveMap zones={zones} height="100%" showLayerToggle onZoneClick={handleZoneClick} />
          </div>
          <div className="flex flex-col gap-3 h-full max-h-[400px] lg:max-h-none overflow-hidden">
            {/* Zone detail or empty */}
            <div className="flex-shrink-0">
              {selectedZone ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-black text-base mb-0.5">{selectedZone.zone_name}</h3>
                  <p className="text-[10px] text-slate-400 mb-3 uppercase font-semibold tracking-wide">Zona seleccionada</p>
                  <div className={`grid grid-cols-2 gap-3 ${isAnon ? "blur-[4px] select-none" : ""}`}>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Precio/m²</p>
                      <p className="text-sm font-black text-blue-700 dark:text-blue-400">{formatPrice(selectedZone.avg_price_per_m2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Actividad</p>
                      <p className="text-sm font-bold">{getZoneActivityLabel(selectedZone.total_listings)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Tendencia</p>
                      <p className={`text-sm font-bold ${selectedZone.price_trend_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedZone.price_trend_pct >= 0 ? "▲" : "▼"} {Math.abs(selectedZone.price_trend_pct).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Ticket</p>
                      <p className="text-sm font-bold">{formatPrice(selectedZone.avg_ticket)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/zona/${selectedZone.zone_slug}`)}
                    className="mt-3 w-full py-2 bg-blue-700 dark:bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors"
                  >
                    Ver análisis completo →
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-slate-400 text-xs font-medium text-center py-3">
                    Haz clic en una zona del mapa para ver sus métricas
                  </p>
                </div>
              )}
            </div>
            {/* Zone list */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {filtered.length} zonas
                </p>
                <div className="flex gap-0.5">
                  {(["precio", "nombre"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s === "nombre" ? "nombre" : "precio")}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                        (s === "precio" && sortBy === "precio") || (s === "nombre" && sortBy === "nombre")
                          ? "bg-slate-700 dark:bg-blue-600 text-white"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      {s === "precio" ? "Precio" : "A-Z"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                {filtered.map((zone, i) => (
                  <button
                    key={zone.zone_id}
                    onClick={() => handleZoneClick(zone.zone_slug)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      selectedZone?.zone_slug === zone.zone_slug
                        ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                    }`}
                  >
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex-1">{zone.zone_name}</span>
                    <span className={`text-[11px] font-bold text-blue-700 dark:text-blue-400 ${isAnon ? "blur-[4px] select-none" : ""}`}>{formatPrice(zone.avg_price_per_m2)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && (
        filtered.length > 0 ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isAnon && sortBy === "precio" ? "blur-[5px] select-none pointer-events-none" : ""}`} data-auth-gated={isAnon && sortBy === "precio" ? "" : undefined}>
            {filtered.map((zone, i) => (
              <ZoneCard key={zone.zone_id} zone={zone} rank={i + 1} maxListings={maxListings} hidePrice={isAnon && sortBy !== "precio"} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="location_off" className="text-4xl text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-500">No se encontraron zonas</p>
            <p className="text-xs text-slate-400 mt-1">Intenta con otro término de búsqueda</p>
          </div>
        )
      )}
    </div>
  )
}
