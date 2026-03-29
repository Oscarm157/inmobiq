"use client"

import { Icon } from "@/components/icon"
import { InfoTooltip } from "@/components/info-tooltip"
import { useCurrency } from "@/contexts/currency-context"

interface InvestmentKPIsProps {
  yieldPct: number | null       // gross annual yield %
  capRate: number | null        // cap rate %
  investmentScore: number       // 0-100
  paybackYears: number | null   // years to recover investment
  hasRentaData: boolean
  // Enhanced rental metrics (Phase 2)
  netYieldPct?: number | null
  expenseRatioPct?: number | null
  rentalVelocityDays?: number | null
}

export function InvestmentKPIs({ yieldPct, capRate, investmentScore, paybackYears, hasRentaData, netYieldPct, expenseRatioPct, rentalVelocityDays }: InvestmentKPIsProps) {
  const scoreColor = investmentScore >= 70 ? "text-emerald-600" : investmentScore >= 40 ? "text-amber-600" : "text-red-600"
  const scoreLabel = investmentScore >= 70 ? "Atractivo" : investmentScore >= 40 ? "Moderado" : "Bajo"

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 mb-2">
          <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950">
            <Icon name="savings" className="text-base text-green-700 dark:text-green-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yield Bruto</span>
          <InfoTooltip content="Rendimiento bruto anualizado: (renta mensual × 12) / precio de venta × 100. No incluye gastos de mantenimiento, vacancia ni impuestos." />
        </div>
        <p className="text-xl font-black">
          {hasRentaData && yieldPct !== null ? `${yieldPct.toFixed(1)}%` : "—"}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">anual</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 mb-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950">
            <Icon name="percent" className="text-base text-violet-700 dark:text-violet-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {netYieldPct != null ? "Yield Neto" : "Cap Rate"}
          </span>
          <InfoTooltip content={netYieldPct != null
            ? "Rendimiento neto después de gastos operativos (vacancia, mantenimiento, predial, seguro, administración)."
            : "Tasa de capitalización. Similar al yield pero ajustado. Un cap rate del 5-7% es típico en Tijuana para residencial."
          } />
        </div>
        <p className="text-xl font-black">
          {hasRentaData && (netYieldPct ?? capRate) !== null ? `${(netYieldPct ?? capRate)!.toFixed(1)}%` : "—"}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {netYieldPct != null ? "neto anual" : "anual ajustado"}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 mb-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950">
            <Icon name="analytics" className="text-base text-blue-700 dark:text-blue-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</span>
          <InfoTooltip content="Score de inversión 0-100 que combina: potencial de apreciación, liquidez, rendimiento y riesgo. Mayor = más atractivo." />
        </div>
        <p className={`text-xl font-black ${scoreColor}`}>{investmentScore}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{scoreLabel}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 mb-2">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950">
            <Icon name="hourglass_top" className="text-base text-amber-700 dark:text-amber-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payback</span>
          <InfoTooltip content={netYieldPct != null
            ? "Años para recuperar la inversión basado en ingreso neto operativo (NOI) después de todos los gastos."
            : "Años estimados para recuperar la inversión vía renta. Asume 30% de gastos operativos (mantenimiento, vacancia, impuestos)."
          } />
        </div>
        <p className="text-xl font-black">
          {hasRentaData && paybackYears !== null && paybackYears !== Infinity ? `${paybackYears.toFixed(0)}` : "—"}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{hasRentaData && paybackYears && paybackYears !== Infinity ? "años" : ""}</p>
      </div>

      {/* Additional rental KPIs row */}
      {(expenseRatioPct != null || rentalVelocityDays != null) && (
        <>
          {expenseRatioPct != null && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 mb-2">
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950">
                  <Icon name="receipt_long" className="text-base text-red-700 dark:text-red-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gastos</span>
                <InfoTooltip content="Porcentaje de la renta bruta que se va en gastos operativos (vacancia, mantenimiento, predial, seguro, administración)." />
              </div>
              <p className="text-xl font-black">{expenseRatioPct.toFixed(0)}%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">de renta bruta</p>
            </div>
          )}
          {rentalVelocityDays != null && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950">
                  <Icon name="speed" className="text-base text-cyan-700 dark:text-cyan-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Velocidad</span>
                <InfoTooltip content="Días promedio que un listing de renta permanece activo. Menos días = mayor demanda." />
              </div>
              <p className="text-xl font-black">{rentalVelocityDays}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">días promedio</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
