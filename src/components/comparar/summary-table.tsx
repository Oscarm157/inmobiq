"use client"

import { formatPercent } from "@/lib/utils"
import { getZoneActivityLabel } from "@/lib/activity-labels"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics } from "@/types/database"

interface SummaryTableProps {
  zones: ZoneMetrics[]
  colors: string[]
}

function TableRow({
  label,
  values,
  highlight,
  higherIsBetter = false,
}: {
  label: string
  values: string[]
  highlight: number[]
  higherIsBetter?: boolean
}) {
  const best = higherIsBetter ? Math.max(...highlight) : Math.min(...highlight)

  return (
    <tr>
      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{label}</td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`px-6 py-3.5 text-right font-semibold ${
            highlight[i] === best
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {val}
          {highlight[i] === best && <span className="ml-1 text-xs">★</span>}
        </td>
      ))}
    </tr>
  )
}

export function SummaryTable({ zones, colors }: SummaryTableProps) {
  const { formatPrice } = useCurrency()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Métrica
            </th>
            {zones.map((z, i) => (
              <th
                key={z.zone_slug}
                className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                style={{ color: colors[i] }}
              >
                {z.zone_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          <TableRow
            label="Precio/m²"
            values={zones.map((z) => formatPrice(z.avg_price_per_m2))}
            highlight={zones.map((z) => z.avg_price_per_m2)}
          />
          <TableRow
            label="Tendencia"
            values={zones.map((z) => z.price_trend_pct === 0 ? "Acumulando" : formatPercent(z.price_trend_pct))}
            highlight={zones.map((z) => z.price_trend_pct)}
            higherIsBetter
          />
          <TableRow
            label="Inventario"
            values={zones.map((z) => getZoneActivityLabel(z.total_listings))}
            highlight={zones.map((z) => z.total_listings)}
            higherIsBetter
          />
          <TableRow
            label="Ticket promedio"
            values={zones.map((z) => formatPrice(z.avg_ticket))}
            highlight={zones.map((z) => z.avg_ticket)}
          />
        </tbody>
      </table>
    </div>
  )
}
