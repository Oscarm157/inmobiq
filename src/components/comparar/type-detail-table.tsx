"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"
import type { ZoneMetrics, PropertyType } from "@/types/database"

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "casa", label: "Casa", icon: "home" },
  { value: "departamento", label: "Departamento", icon: "apartment" },
  { value: "terreno", label: "Terreno", icon: "landscape" },
  { value: "local", label: "Local", icon: "store" },
  { value: "oficina", label: "Oficina", icon: "business" },
]

interface TypeDetailTableProps {
  zones: ZoneMetrics[]
  colors: string[]
}

export function TypeDetailTable({ zones, colors }: TypeDetailTableProps) {
  const { formatPrice } = useCurrency()
  const [expanded, setExpanded] = useState(false)

  if (zones.length === 0) return null

  // Sort types by total count across all zones
  const typesWithTotal = PROPERTY_TYPES.map((pt) => ({
    ...pt,
    total: zones.reduce((sum, z) => sum + (z.listings_by_type[pt.value] ?? 0), 0),
  })).sort((a, b) => b.total - a.total)

  const visibleTypes = expanded ? typesWithTotal : typesWithTotal.slice(0, 3)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Desglose por tipo de propiedad
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inventario y ticket promedio por tipo
          </p>
        </div>
        {typesWithTotal.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            {expanded ? "Ver menos" : `Ver todos (${typesWithTotal.length})`}
            <Icon name={expanded ? "expand_less" : "expand_more"} className="text-sm" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Tipo
              </th>
              {zones.map((z, i) => (
                <th
                  key={z.zone_slug}
                  colSpan={2}
                  className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: colors[i] }}
                >
                  {z.zone_name}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
              <th />
              {zones.map((z) => (
                <Fragment key={z.zone_slug}>
                  <th className="text-right px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase">
                    Inv.
                  </th>
                  <th className="text-right px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase">
                    Ticket
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleTypes.map((pt) => {
              const inventories = zones.map((z) => z.listings_by_type[pt.value] ?? 0)
              const tickets = zones.map((z) => z.avg_ticket_by_type[pt.value] ?? 0)
              const bestInv = Math.max(...inventories)
              const bestTicket = Math.min(...tickets.filter((t) => t > 0))

              return (
                <tr key={pt.value} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="flex items-center gap-2">
                      <Icon name={pt.icon} className="text-sm text-slate-400" />
                      {pt.label}
                    </span>
                  </td>
                  {zones.map((z, i) => {
                    const inv = z.listings_by_type[pt.value] ?? 0
                    const ticket = z.avg_ticket_by_type[pt.value] ?? 0
                    return (
                      <Fragment key={z.zone_slug}>
                        <td className={`text-right px-3 py-3 font-semibold ${
                          inv === bestInv && inv > 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}>
                          {inv > 0 ? inv : "—"}
                          {inv === bestInv && inv > 0 && <span className="ml-0.5 text-[10px]">★</span>}
                        </td>
                        <td className={`text-right px-3 py-3 font-semibold ${
                          ticket === bestTicket && ticket > 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}>
                          {ticket > 0 ? formatPrice(ticket) : "—"}
                          {ticket === bestTicket && ticket > 0 && <span className="ml-0.5 text-[10px]">★</span>}
                        </td>
                      </Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Fragment helper for JSX
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
