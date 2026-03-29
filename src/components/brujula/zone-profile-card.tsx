"use client"

import type { ValuationResult } from "@/types/database"
import { Icon } from "@/components/icon"

interface Props {
  result: ValuationResult
}

export function ZoneProfileCard({ result: r }: Props) {
  const demo = r.demographics

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl card-shadow border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Icon name="location_city" className="text-base text-slate-400" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Perfil Socioeconomico
          </h4>
          <span className="text-xs text-slate-400 font-medium">· {r.zone_name}</span>
        </div>
        {demo && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${demo.nse_profile_color}`}>
            NSE {demo.nse_profile}
          </span>
        )}
      </div>

      {/* 3-column body */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Column 1: Demographics */}
        <div className="p-5">
          {demo ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{demo.population.toLocaleString("es-MX")}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Población</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{demo.households.toLocaleString("es-MX")}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Hogares</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-lg font-black text-slate-800 dark:text-white">{demo.pea_ratio}%</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">Población económicamente activa</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sin datos demográficos</p>
          )}
        </div>

        {/* Column 2: Infrastructure bars */}
        <div className="p-5">
          {demo ? (
            <div className="space-y-3">
              <BarRow icon="wifi" label="Internet" value={demo.pct_internet} />
              <BarRow icon="directions_car" label="Automóvil" value={demo.pct_car} />
              <BarRow icon="health_and_safety" label="Seguridad social" value={demo.pct_social_security} />
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sin datos</p>
          )}
        </div>

        {/* Column 3: Investment metrics */}
        <div className="p-5 space-y-2">
          <MetricRow label="Riesgo" value={`${r.risk_score ?? 0}/100`} dot={dotColor(r.risk_score ?? 0, [40, 65])} />
          <MetricRow label="Liquidez" value={`${r.liquidity_score ?? 0}/100`} dot={dotColorInv(r.liquidity_score ?? 0, [30, 60])} />
          {r.cap_rate != null && (
            <MetricRow label="Cap Rate" value={`${r.cap_rate.toFixed(1)}%`} dot={dotColorInv(r.cap_rate, [5, 7])} />
          )}
          <MetricRow label="Asequibilidad" value={`${r.affordability_index ?? 0}/100`} />
          <MetricRow label="Plusvalía" value={`${r.appreciation_potential ?? 0}/100`} />
          <MetricRow label="Demanda" value={`${r.demand_pressure ?? 0}/100`} />
        </div>
      </div>
    </div>
  )
}

function BarRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  const pct = Math.min(100, value)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon name={icon} className="text-sm text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
        </div>
        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MetricRow({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{value}</span>
        {dot && <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />}
      </div>
    </div>
  )
}

function dotColor(v: number, t: [number, number]): string {
  if (v >= t[1]) return "bg-red-500"
  if (v >= t[0]) return "bg-amber-400"
  return "bg-emerald-500"
}

function dotColorInv(v: number, t: [number, number]): string {
  if (v <= t[0]) return "bg-red-500"
  if (v <= t[1]) return "bg-amber-400"
  return "bg-emerald-500"
}
