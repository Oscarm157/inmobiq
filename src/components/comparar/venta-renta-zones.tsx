"use client"

import { Icon } from "@/components/icon"
import { InfoTooltip } from "@/components/info-tooltip"
import { useCurrency } from "@/contexts/currency-context"
import type { ComparisonListing } from "@/lib/data/comparison-listings"
import type { ZoneMetrics } from "@/types/database"

interface VentaRentaZonesProps {
  listings: ComparisonListing[]
  zones: ZoneMetrics[]
  colors: string[]
}

interface ZoneVRData {
  zone: ZoneMetrics
  color: string
  ventaCount: number
  rentaCount: number
  ventaAvgPrice: number
  rentaAvgPrice: number
  yieldPct: number | null
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

export function VentaRentaZones({ listings, zones, colors }: VentaRentaZonesProps) {
  if (zones.length === 0) return null

  const zoneData: ZoneVRData[] = zones.map((zone, i) => {
    const zoneLists = listings.filter((l) => l.zone_slug === zone.zone_slug)
    const ventas = zoneLists.filter((l) => l.listing_type === "venta")
    const rentas = zoneLists.filter((l) => l.listing_type === "renta")
    const ventaAvg = avg(ventas.map((l) => l.price))
    const rentaAvg = avg(rentas.map((l) => l.price))
    const yieldPct = ventas.length > 0 && rentas.length > 0 && ventaAvg > 0
      ? ((rentaAvg * 12) / ventaAvg) * 100
      : null

    return {
      zone,
      color: colors[i],
      ventaCount: ventas.length,
      rentaCount: rentas.length,
      ventaAvgPrice: ventaAvg,
      rentaAvgPrice: rentaAvg,
      yieldPct,
    }
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
        Venta vs Renta por zona
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Proporción de operaciones y yield estimado
      </p>
      <div className={`grid gap-4 ${zones.length === 2 ? "grid-cols-2" : zones.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
        {zoneData.map((d) => (
          <VRCard key={d.zone.zone_slug} data={d} />
        ))}
      </div>
    </div>
  )
}

function VRCard({ data }: { data: ZoneVRData }) {
  const { formatPrice } = useCurrency()
  const total = data.ventaCount + data.rentaCount
  const ventaPct = total > 0 ? Math.round((data.ventaCount / total) * 100) : 0
  const rentaPct = total > 0 ? 100 - ventaPct : 0

  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{data.zone.zone_name}</span>
      </div>

      {/* Proportion bar */}
      <div>
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {data.ventaCount > 0 && (
            <div className="bg-slate-700 transition-all duration-500" style={{ width: `${ventaPct}%` }} />
          )}
          {data.rentaCount > 0 && (
            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${rentaPct}%` }} />
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-bold text-slate-700">Venta {ventaPct}%</span>
          <span className="text-[10px] font-bold text-emerald-500">Renta {rentaPct}%</span>
        </div>
      </div>

      {/* Prices */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Precio prom.</p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs font-bold text-slate-700">{data.ventaCount > 0 ? formatPrice(data.ventaAvgPrice) : "—"}</span>
            <span className="text-[10px] text-slate-300">vs</span>
            <span className="text-xs font-bold text-emerald-600">{data.rentaCount > 0 ? formatPrice(data.rentaAvgPrice) : "—"}</span>
          </div>
        </div>

        {data.yieldPct !== null && (
          <div className="flex items-center gap-2 pt-1">
            <Icon name="trending_up" className="text-xs text-emerald-600" />
            <span className="text-[10px] text-slate-500">Yield</span>
            <InfoTooltip content="Rendimiento anual estimado: renta × 12 / precio de venta" />
            <span className="text-xs font-black text-emerald-600 ml-auto">{data.yieldPct.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
