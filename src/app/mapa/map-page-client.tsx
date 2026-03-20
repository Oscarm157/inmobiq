"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { ZoneMetrics } from "@/types/database"
import { formatNumber } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"

// Dynamic import to avoid SSR issues with Mapbox GL
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  { ssr: false, loading: () => <div className="h-[600px] bg-slate-100 rounded-xl flex items-center justify-center"><div className="text-slate-400 text-sm font-medium">Cargando mapa…</div></div> }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Map */}
      <div className="lg:col-span-3">
        <InteractiveMap
          zones={zones}
          height="600px"
          showLayerToggle
          onZoneClick={handleZoneClick}
        />
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {selectedZone ? (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-black text-lg mb-1">{selectedZone.zone_name}</h3>
            <p className="text-[11px] text-slate-400 mb-4 uppercase font-semibold tracking-wide">Zona seleccionada</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 font-semibold">Precio promedio/m²</p>
                <p className="text-xl font-black text-blue-700">{formatPrice(selectedZone.avg_price_per_m2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold">Propiedades activas</p>
                <p className="text-base font-bold">{formatNumber(selectedZone.total_listings)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold">Tendencia semanal</p>
                <p className={`text-base font-bold ${selectedZone.price_trend_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {selectedZone.price_trend_pct >= 0 ? "▲" : "▼"} {Math.abs(selectedZone.price_trend_pct).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold">Ticket promedio</p>
                <p className="text-base font-bold">{formatPrice(selectedZone.avg_ticket)}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/zona/${selectedZone.zone_slug}`)}
              className="mt-5 w-full py-2.5 bg-blue-700 text-white text-sm font-bold rounded-lg hover:bg-blue-800 transition-colors"
            >
              Ver análisis completo →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-sm font-medium text-center py-6">
              Haz clic en una zona del mapa para ver sus métricas
            </p>
          </div>
        )}

        {/* All zones list */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-3">Todas las zonas</p>
          <div className="space-y-2">
            {[...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2).map((zone) => (
              <button
                key={zone.zone_id}
                onClick={() => handleZoneClick(zone.zone_slug)}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedZone?.zone_slug === zone.zone_slug
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <span className="text-xs font-semibold text-slate-700">{zone.zone_name}</span>
                <span className="text-xs font-bold text-blue-700">{formatPrice(zone.avg_price_per_m2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
