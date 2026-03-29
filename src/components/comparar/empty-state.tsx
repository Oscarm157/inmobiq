"use client"

import { Icon } from "@/components/icon"
import { PRESET_COMPARISONS } from "./zone-selector"
import type { ZoneMetrics } from "@/types/database"

const ZONE_COLORS = ["#4361ee", "#2a9d8f", "#e76f51", "#9b5de5"]

interface EmptyStateProps {
  allZones: ZoneMetrics[]
  onSelectPreset: (slugs: string[]) => void
}

export function EmptyState({ allZones, onSelectPreset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <div className="text-center space-y-4 mb-12 pt-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 mb-2">
          <Icon name="balance" className="text-5xl" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Compara zonas de inversión
        </h2>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Selecciona 2 a 4 zonas para comparar métricas, tendencias y demografía
        </p>
      </div>

      {/* Preset cards */}
      <div className="w-full max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 text-center">
          Sugerencias Populares
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PRESET_COMPARISONS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onSelectPreset(preset.slugs)}
              className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg ${preset.iconBg} flex items-center justify-center`}>
                  <Icon name={preset.icon} className={`text-xl ${preset.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{preset.label}</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">
                {preset.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {preset.slugs.map((slug, i) => (
                  <span
                    key={slug}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full border border-slate-100 dark:border-slate-700"
                  >
                    {allZones.find((z) => z.zone_slug === slug)?.zone_name ?? slug}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className={`text-xs font-semibold ${preset.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Ver comparativa
                </span>
                <Icon name="arrow_forward_ios" className="text-xs text-slate-300 dark:text-slate-600 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
