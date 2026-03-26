"use client"

import type { ValuationResult } from "@/types/database"
import { Icon } from "@/components/icon"

interface Props {
  result: ValuationResult
}

export function ZoneProfileCard({ result: r }: Props) {
  const demo = r.demographics

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl card-shadow border border-slate-100 dark:border-slate-800 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Perfil Socioeconomico
          </h4>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{r.zone_name}</p>
        </div>
        {demo && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${demo.nse_profile_color}`}>
            {demo.nse_profile}
          </span>
        )}
      </div>

      {demo && (
        <>
          {/* Stats row — compact horizontal */}
          <div className="flex items-stretch border-y border-slate-100 dark:border-slate-800">
            <Stat value={demo.population.toLocaleString("es-MX")} label="Poblacion" />
            <Stat value={demo.households.toLocaleString("es-MX")} label="Hogares" border />
            <Stat value={`${demo.pea_ratio}%`} label="PEA" border />
          </div>

          {/* Bars — tighter */}
          <div className="px-4 py-3 space-y-2 border-b border-slate-100 dark:border-slate-800">
            <BarRow icon="wifi" label="Internet" value={demo.pct_internet} />
            <BarRow icon="directions_car" label="Auto" value={demo.pct_car} />
            <BarRow icon="health_and_safety" label="Seg. Social" value={demo.pct_social_security} />
          </div>
        </>
      )}

      {/* Investment grid — 2 cols compact */}
      <div className="px-4 py-3 flex-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inversion</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <MetricInline label="Riesgo" value={r.risk_score ?? 0} max={100} accent={riskColor(r.risk_score)} />
          <MetricInline label="Liquidez" value={r.liquidity_score ?? 0} max={100} />
          {r.cap_rate != null && (
            <MetricInline label="Cap Rate" value={r.cap_rate} max={15} suffix="%" />
          )}
          <MetricInline label="Asequib." value={r.affordability_index ?? 0} max={100} />
          <MetricInline label="Plusvalia" value={r.appreciation_potential ?? 0} max={100} />
          <MetricInline label="Demanda" value={r.demand_pressure ?? 0} max={100} />
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <div className={`flex-1 text-center py-2.5 ${border ? "border-l border-slate-100 dark:border-slate-800" : ""}`}>
      <p className="text-base font-black text-slate-800 dark:text-white leading-tight">{value}</p>
      <p className="text-[8px] text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function BarRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  const pct = Math.min(100, value)
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="text-xs text-slate-400 flex-shrink-0 w-4" />
      <span className="text-[10px] font-bold text-slate-500 w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 w-8 text-right">{value.toFixed(0)}%</span>
    </div>
  )
}

function MetricInline({ label, value, max, suffix, accent }: { label: string; value: number; max: number; suffix?: string; accent?: string }) {
  const display = suffix ? `${value.toFixed(1)}${suffix}` : `${Math.round(value)}`
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-slate-400 font-bold">{label}</span>
      <span className={`text-xs font-black ${accent ?? "text-slate-800 dark:text-slate-100"}`}>
        {display}
      </span>
    </div>
  )
}

function riskColor(score: number | undefined): string {
  if (!score) return "text-slate-800 dark:text-slate-100"
  if (score >= 65) return "text-red-600 dark:text-red-400"
  if (score >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-emerald-600 dark:text-emerald-400"
}
