"use client"

import type { ValuationResult } from "@/types/database"
import { Icon } from "@/components/icon"

interface Props {
  result: ValuationResult
}

interface BarItem {
  label: string
  icon: string
  value: number
  unit: string
  max: number
}

function MiniBar({ label, icon, value, unit, max }: BarItem) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="text-xs text-slate-400 flex-shrink-0" />
      <span className="text-[10px] font-bold text-slate-500 w-16 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
        {value.toFixed(0)}{unit}
      </span>
    </div>
  )
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
      <div className="text-right">
        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{value}</span>
        {sub && <span className="text-[9px] text-slate-400 ml-1.5">{sub}</span>}
      </div>
    </div>
  )
}

export function ZoneProfileCard({ result: r }: Props) {
  const demo = r.demographics

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800 space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Perfil Socioeconomico
        </h4>
        {demo && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${demo.nse_profile_color}`}>
            NSE {demo.nse_profile}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 font-medium -mt-2">{r.zone_name}</p>

      {/* Demographics */}
      {demo && (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm font-black text-slate-800 dark:text-white">{demo.population.toLocaleString("es-MX")}</p>
              <p className="text-[8px] text-slate-400 uppercase tracking-wider">Poblacion</p>
            </div>
            <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm font-black text-slate-800 dark:text-white">{demo.households.toLocaleString("es-MX")}</p>
              <p className="text-[8px] text-slate-400 uppercase tracking-wider">Hogares</p>
            </div>
            <div className="text-center p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm font-black text-slate-800 dark:text-white">{demo.pea_ratio}%</p>
              <p className="text-[8px] text-slate-400 uppercase tracking-wider">PEA</p>
            </div>
          </div>

          {/* Comparison bars */}
          <div className="space-y-1.5">
            <MiniBar label="Internet" icon="wifi" value={demo.pct_internet} unit="%" max={100} />
            <MiniBar label="Automovil" icon="directions_car" value={demo.pct_car} unit="%" max={100} />
            <MiniBar label="Seg. Social" icon="health_and_safety" value={demo.pct_social_security} unit="%" max={100} />
          </div>
        </>
      )}

      {/* Investment metrics */}
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inversion</p>
        <MetricRow label="Riesgo" value={`${r.risk_score ?? 0}`} sub={`/100 ${r.risk_label ?? ""}`} />
        <MetricRow label="Liquidez" value={`${r.liquidity_score ?? 0}`} sub="/100" />
        {r.cap_rate != null && (
          <MetricRow label="Cap Rate" value={`${r.cap_rate.toFixed(1)}%`} />
        )}
        <MetricRow label="Asequibilidad" value={`${r.affordability_index ?? 0}`} sub="/100" />
        <MetricRow label="Plusvalia" value={`${r.appreciation_potential ?? 0}`} sub="/100" />
        <MetricRow label="Demanda" value={`${r.demand_pressure ?? 0}`} sub="/100" />
      </div>
    </div>
  )
}
