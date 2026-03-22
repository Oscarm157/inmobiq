"use client"

import { useState } from "react"
import Link from "next/link"
import { Icon } from "@/components/icon"
import { formatCurrency, formatPercent, MXN_USD_RATE } from "@/lib/utils"
import type { ZoneMetrics, ZoneRiskMetrics } from "@/types/database"

interface PriceTableProps {
  zones: ZoneMetrics[]
  riskData?: ZoneRiskMetrics[]
}

export function PriceTable({ zones, riskData = [] }: PriceTableProps) {
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN")

  const rentLookup = new Map(riskData.map((r) => [r.zone_slug, r.avg_rent_per_m2]))

  const sortedZones = [...zones].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)

  const fmt = (value: number) => formatCurrency(value, currency)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-blue-900/50 flex items-center justify-center">
            <Icon name="monitoring" className="text-xl text-slate-700 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Precio por m² — Tijuana</h3>
            <p className="text-xs text-slate-500 font-medium">
              Tipo de cambio: $1 USD = ${MXN_USD_RATE.toFixed(2)} MXN
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrency((c) => (c === "MXN" ? "USD" : "MXN"))}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Icon name="currency_exchange" className="text-base" />
          {currency}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-3">Zona</th>
              <th className="px-4 py-3 text-right">Precio/m² Venta</th>
              <th className="px-4 py-3 text-right">Renta/m² Mes</th>
              <th className="px-4 py-3 text-right">Tendencia</th>
              <th className="px-4 py-3 text-right">Actividad</th>
              <th className="px-4 py-3 text-right">Yield Anual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedZones.map((zone) => {
              const rentPerM2 = rentLookup.get(zone.zone_slug) ?? 0
              const yearlyRent = rentPerM2 * 12
              const yieldPct = zone.avg_price_per_m2 > 0 && yearlyRent > 0
                ? ((yearlyRent / zone.avg_price_per_m2) * 100).toFixed(1)
                : "—"
              const trendUp = zone.price_trend_pct > 0
              const trendDown = zone.price_trend_pct < 0

              return (
                <tr key={zone.zone_slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/zona/${zone.zone_slug}`} className="font-bold text-slate-800 dark:text-blue-400 hover:underline">
                      {zone.zone_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {fmt(zone.avg_price_per_m2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {rentPerM2 > 0 ? fmt(rentPerM2) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-bold ${
                      trendUp ? "text-green-600" : trendDown ? "text-red-500" : "text-slate-400"
                    }`}>
                      {trendUp && <Icon name="trending_up" className="text-sm" />}
                      {trendDown && <Icon name="trending_down" className="text-sm" />}
                      {!trendUp && !trendDown && <Icon name="trending_flat" className="text-sm" />}
                      {formatPercent(zone.price_trend_pct)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300 text-xs">
                    {zone.total_listings >= 150 ? "Alta" : zone.total_listings >= 50 ? "Moderada" : "Baja"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={`${Number(yieldPct) >= 8 ? "text-green-600 font-bold" : "text-slate-600 dark:text-slate-300"}`}>
                      {yieldPct === "—" ? "—" : `${yieldPct}%`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400 flex items-center justify-between">
        <span>Datos actualizados semanalmente de portales inmobiliarios</span>
        <span className="font-mono">Mar 2026</span>
      </div>
    </div>
  )
}
