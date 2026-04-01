"use client"

import { useCurrency } from "@/contexts/currency-context"
import { InfoTooltip } from "@/components/info-tooltip"
import type { RentalExpenseModel } from "@/lib/data/rental-expenses"
import { getExpenseBreakdown } from "@/lib/data/rental-expenses"

interface ExpenseBreakdownProps {
  model: RentalExpenseModel
  avgMonthlyRent: number
}

export function ExpenseBreakdown({ model, avgMonthlyRent }: ExpenseBreakdownProps) {
  const { formatPrice } = useCurrency()
  const breakdown = getExpenseBreakdown(model, avgMonthlyRent)
  const grossAnnual = avgMonthlyRent * 12

  if (grossAnnual <= 0 || breakdown.length === 0) return null

  // For the stacked bar, use expense items only (exclude net income)
  const expenseItems = breakdown.filter((b) => b.label !== "Ingreso Neto")
  const netIncome = breakdown.find((b) => b.label === "Ingreso Neto")

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Desglose de Gastos
        </h4>
        <InfoTooltip content="Modelo de gastos operativos estimados para una propiedad en renta. Incluye vacancia, mantenimiento, predial, seguro y administración. Los valores son promedios de la zona." />
      </div>

      {/* Stacked bar */}
      <div className="mb-4">
        <div className="flex h-4 rounded-full overflow-hidden">
          {expenseItems.map((item) => (
            <div
              key={item.label}
              className="transition-all duration-500"
              style={{
                width: `${item.pct_of_rent}%`,
                backgroundColor: item.color,
                minWidth: item.pct_of_rent > 0 ? "2px" : "0",
              }}
              title={`${item.label}: ${item.pct_of_rent}%`}
            />
          ))}
          {netIncome && netIncome.pct_of_rent > 0 && (
            <div
              className="transition-all duration-500"
              style={{
                width: `${netIncome.pct_of_rent}%`,
                backgroundColor: netIncome.color,
              }}
              title={`${netIncome.label}: ${netIncome.pct_of_rent}%`}
            />
          )}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="space-y-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className={`text-xs ${item.label === "Ingreso Neto" ? "font-black text-emerald-600 dark:text-emerald-400" : "font-medium text-slate-600 dark:text-slate-400"}`}>
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">{item.pct_of_rent}%</span>
              <span className={`text-xs font-bold ${item.label === "Ingreso Neto" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                {formatPrice(Math.round(item.amount / 12))}/mes
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ratio de Gastos</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{model.expense_ratio_pct}%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NOI Anual</p>
            <p className="text-sm font-black text-emerald-600">{formatPrice(model.noi)}</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-3 italic">
        Supuestos: predial {model.predial_pct}%, seguro {model.insurance_pct}%, administración {model.management_pct}%, vacancia {model.vacancy_pct}%
      </p>
    </div>
  )
}
