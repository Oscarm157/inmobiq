"use client"

import { useState, useEffect, useRef } from "react"
import { Icon } from "@/components/icon"
import type { ZoneMetrics } from "@/types/database"

const ZONE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b"]
const ZONE_BG_COLORS = [
  { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-100 dark:border-blue-900", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-100 dark:border-green-900", text: "text-green-700 dark:text-green-300" },
  { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-100 dark:border-red-900", text: "text-red-700 dark:text-red-300" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-100 dark:border-amber-900", text: "text-amber-700 dark:text-amber-300" },
]

export const PRESET_COMPARISONS = [
  {
    label: "Premium vs Económico",
    icon: "balance",
    color: "text-blue-600",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    slugs: ["playas-de-tijuana", "zona-rio", "otay", "centro"],
    description: "Las zonas más caras vs las más accesibles",
  },
  {
    label: "Alta Plusvalía",
    icon: "trending_up",
    color: "text-green-600",
    iconBg: "bg-green-50 dark:bg-green-950/30",
    slugs: ["playas-de-tijuana", "cacho", "hipodromo"],
    description: "Zonas con mayor tendencia positiva de precios",
  },
  {
    label: "Mayor Inventario",
    icon: "inventory_2",
    color: "text-amber-600",
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
    slugs: ["zona-rio", "playas-de-tijuana", "centro", "la-mesa"],
    description: "Zonas con más propiedades activas",
  },
]

function ZoneCombobox({ zones, onSelect }: { zones: ZoneMetrics[]; onSelect: (slug: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = search.trim().length >= 1
    ? zones.filter((z) => z.zone_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
    : zones.sort((a, b) => a.zone_name.localeCompare(b.zone_name, "es"))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-full text-sm font-medium hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
      >
        <Icon name="add" className="text-sm" />
        Agregar zona
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-64 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar zona..."
              autoFocus
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map((z) => (
              <button
                key={z.zone_slug}
                onClick={() => { onSelect(z.zone_slug); setOpen(false); setSearch("") }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                {z.zone_name}
              </button>
            )) : (
              <p className="px-4 py-3 text-xs text-slate-400">No se encontraron zonas</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ZoneSelectorProps {
  allZones: ZoneMetrics[]
  selectedSlugs: string[]
  onAddZone: (slug: string) => void
  onRemoveZone: (slug: string) => void
  onSelectPreset: (slugs: string[]) => void
}

export function ZoneSelector({ allZones, selectedSlugs, onAddZone, onRemoveZone, onSelectPreset }: ZoneSelectorProps) {
  const availableToAdd = allZones.filter((z) => !selectedSlugs.includes(z.zone_slug))

  return (
    <div className="space-y-4">
      {/* Zone chips */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedSlugs.map((slug, i) => {
          const zone = allZones.find((z) => z.zone_slug === slug)
          const style = ZONE_BG_COLORS[i] ?? ZONE_BG_COLORS[0]
          return (
            <div
              key={slug}
              className={`flex items-center gap-2 px-3 py-1.5 ${style.bg} border ${style.border} rounded-full text-sm font-semibold ${style.text}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ZONE_COLORS[i] }}
              />
              {zone?.zone_name ?? slug}
              <button
                onClick={() => onRemoveZone(slug)}
                aria-label={`Quitar ${zone?.zone_name ?? slug}`}
                className="hover:opacity-70 transition-opacity"
              >
                <Icon name="close" className="text-sm" />
              </button>
            </div>
          )
        })}
        {selectedSlugs.length < 4 && availableToAdd.length > 0 && (
          <ZoneCombobox zones={availableToAdd} onSelect={onAddZone} />
        )}
      </div>

      {/* Preset shortcuts */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          {selectedSlugs.length}/4 zonas seleccionadas
        </p>
        <div className="flex gap-2">
          {PRESET_COMPARISONS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onSelectPreset(preset.slugs)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
            >
              <Icon name={preset.icon} className="text-xs" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
