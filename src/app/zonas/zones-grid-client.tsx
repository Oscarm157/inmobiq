"use client"

import { useState, useMemo } from "react"
import { Icon } from "@/components/icon"
import { ZoneCard } from "@/components/zone-card"
import type { ZoneMetrics } from "@/types/database"

type SortKey = "inventario" | "precio" | "tendencia" | "nombre"

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
  const [sortBy, setSortBy] = useState<SortKey>("inventario")

  const filtered = useMemo(() => {
    let result = zones

    // Text search
    if (search.trim().length >= 2) {
      const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      result = result.filter((z) => {
        const name = z.zone_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        return name.includes(q)
      })
    }

    // Sort
    switch (sortBy) {
      case "inventario":
        result = [...result].sort((a, b) => b.total_listings - a.total_listings)
        break
      case "precio":
        result = [...result].sort((a, b) => b.avg_price_per_m2 - a.avg_price_per_m2)
        break
      case "tendencia":
        result = [...result].sort((a, b) => b.price_trend_pct - a.price_trend_pct)
        break
      case "nombre":
        result = [...result].sort((a, b) => a.zone_name.localeCompare(b.zone_name, "es"))
        break
    }

    return result
  }, [zones, search, sortBy])

  const maxListings = zones.reduce((max, z) => Math.max(max, z.total_listings), 1)

  return (
    <div className="space-y-4">
      {/* Search + Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
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
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icon name="close" className="text-sm" />
            </button>
          )}
        </div>

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
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400 font-medium">
        {filtered.length} {filtered.length === 1 ? "zona" : "zonas"}
        {search && ` para "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((zone, i) => (
            <ZoneCard key={zone.zone_id} zone={zone} rank={i + 1} maxListings={maxListings} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="location_off" className="text-4xl text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-500">No se encontraron zonas</p>
          <p className="text-xs text-slate-400 mt-1">Intenta con otro término de búsqueda</p>
        </div>
      )}
    </div>
  )
}
