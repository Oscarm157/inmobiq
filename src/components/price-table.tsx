"use client"

import { useState } from "react"
import Link from "next/link"
import { Icon } from "@/components/icon"
import { formatCurrency, formatPercent, MXN_USD_RATE } from "@/lib/utils"
import type { ZoneMetrics, ZoneRiskMetrics } from "@/types/database"

type SortKey = "price" | "rent" | "trend" | "activity" | "yield"
type SortDir = "asc" | "desc"

interface PriceTableProps {
  zones: ZoneMetrics[]
  rentaZones?: ZoneMetrics[]
  riskData?: ZoneRiskMetrics[]
}

export function PriceTable({ zones, rentaZones = [], riskData = [] }: PriceTableProps) {
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN")
  const [sortKey, setSortKey] = useState<SortKey>("price")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Build renta lookup from real data, fallback to riskData mock
  const rentaRealLookup = new Map(rentaZones.map((z) => [z.zone_slug, z.avg_price_per_m2]))
  const rentaMockLookup = new Map(riskData.map((r) => [r.zone_slug, r.avg_rent_per_m2]))

  const fmt = (value: number) => formatCurrency(value, currency)

  // Build rows with computed values
  const rows = zones.map((zone) => {
    const rentPerM2 = rentaRealLookup.get(zone.zone_slug) ?? rentaMockLookup.get(zone.zone_slug) ?? 0
    const yearlyRent = rentPerM2 * 12
    const yieldPct = zone.avg_price_per_m2 > 0 && yearlyRent > 0
      ? (yearlyRent / zone.avg_price_per_m2) * 100
      : 0
    return { zone, rentPerM2, yieldPct }
  })

  // Sort
  const sorted = [...rows].sort((a, b) => {
    let va = 0, vb = 0
    switch (sortKey) {
      case "price": va = a.zone.avg_price_per_m2; vb = b.zone.avg_price_per_m2; break
      case "rent": va = a.rentPerM2; vb = b.rentPerM2; break
      case "trend": va = a.zone.price_trend_pct; vb = b.zone.price_trend_pct; break
      case "activity": va = a.zone.total_listings; vb = b.zone.total_listings; break
      case "yield": va = a.yieldPct; vb = b.yieldPct; break
    }
    return sortDir === "desc" ? vb - va : va - vb
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function SortHeader({ label, col, align = "right" }: { label: string; col: SortKey; align?: string }) {
    const active = sortKey === col
    return (
      <th
        className={`px-4 py-3 text-${align} cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors`}
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (
            <Icon
              name={sortDir === "desc" ? "arrow_downward" : "arrow_upward"}
              className="text-[10px]"
            />
          )}
        </span>
      </th>
    )
  }

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
              <SortHeader label="Precio/m² Venta" col="price" />
              <SortHeader label="Renta/m² Mes" col="rent" />
              <SortHeader label="Tendencia" col="trend" />
              <SortHeader label="Actividad" col="activity" />
              <SortHeader label="Yield Anual" col="yield" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map(({ zone, rentPerM2, yieldPct }) => {
              const trendUp = zone.price_trend_pct > 0
              const trendDown = zone.price_trend_pct < 0
              const yieldStr = yieldPct > 0 ? `${yieldPct.toFixed(1)}%` : "—"

              return (
                <tr key={zone.zone_slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/zona/${zone.zone_slug}`} className="font-bold text-slate-800 dark:text-blue-400 hover:underline">
                      {zone.zone_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {zone.avg_price_per_m2 > 0 ? fmt(zone.avg_price_per_m2) : "—"}
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
                    <span className={`${yieldPct >= 4 && yieldPct <= 15 ? "text-green-600 font-bold" : "text-slate-600 dark:text-slate-300"}`}>
                      {yieldStr}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Datos actualizados semanalmente de portales inmobiliarios</span>
          <span className="font-mono">Mar 2026</span>
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-600">
          Demografía: Censo 2020 · Encuesta Intercensal 2025 disponible sep. 2026
        </span>
      </div>
    </div>
  )
}
