"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { ZoneMetrics } from "@/types/database"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"

// Dynamic import to avoid SSR issues with Mapbox GL
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  { ssr: false, loading: () => <div className="h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"><div className="text-slate-400 text-sm font-medium">Cargando mapa…</div></div> }
)

interface MapPageClientProps {
  zones: ZoneMetrics[]
}

export function MapPageClient({ zones }: MapPageClientProps) {
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const [selectedZone, setSelectedZone] = useState<ZoneMetrics | null>(null)

  function handleZoneClick(slug: string) {
    const zone = zones.find((z) => z.zone_slug === slug)
    setSelectedZone(zone ?? null)
  }

  const sortedZones = [...zones]
    .filter((z) => z.zone_slug !== "otros")
    .sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 h-[400px] lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
      {/* Map — fills the full height */}
      <div className="lg:col-span-5 h-full rounded-xl overflow-hidden">
        <InteractiveMap
          zones={zones}
          height="100%"
          showLayerToggle
          onZoneClick={handleZoneClick}
        />
      </div>

      {/* Sidebar — flex column, scrollable zone list */}
      <div className="flex flex-col gap-3 h-full max-h-[400px] lg:max-h-none overflow-hidden">
        {/* Zone details or empty state */}
        <div className="flex-shrink-0">
          {selectedZone ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-black text-base mb-0.5">{selectedZone.zone_name}</h3>
              <p className="text-[10px] text-slate-400 mb-3 uppercase font-semibold tracking-wide">Zona seleccionada</p>
              <div className="grid grid-cols-2 gap-3">
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

        {/* All zones list — scrollable */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 pt-3 pb-2 flex-shrink-0">
            Todas las zonas ({sortedZones.length})
          </p>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {sortedZones.map((zone, i) => (
              <button
                key={zone.zone_id}
                onClick={() => handleZoneClick(zone.zone_slug)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  selectedZone?.zone_slug === zone.zone_slug
                    ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-4 text-right flex-shrink-0">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1">{zone.zone_name}</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{formatPrice(zone.avg_price_per_m2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
