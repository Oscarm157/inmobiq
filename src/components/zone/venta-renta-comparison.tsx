"use client"

import { Icon } from "@/components/icon"
import { useCurrency } from "@/contexts/currency-context"

interface VentaRentaData {
  ventaCount: number
  rentaCount: number
  ventaAvgPrice: number
  rentaAvgPrice: number
  ventaAvgPriceM2: number
  rentaAvgPriceM2: number
  ventaAvgArea: number
  rentaAvgArea: number
}

interface VentaRentaComparisonProps {
  data: VentaRentaData
}

export function VentaRentaComparison({ data }: VentaRentaComparisonProps) {
  const { formatPrice } = useCurrency()
  const hasVenta = data.ventaCount > 0
  const hasRenta = data.rentaCount > 0
  const total = data.ventaCount + data.rentaCount
  const ventaPct = total > 0 ? Math.round((data.ventaCount / total) * 100) : 0
  const rentaPct = total > 0 ? Math.round((data.rentaCount / total) * 100) : 0

  // Yield estimate: annual rent / purchase price
  const yieldPct =
    hasVenta && hasRenta && data.ventaAvgPrice > 0
      ? ((data.rentaAvgPrice * 12) / data.ventaAvgPrice) * 100
      : null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
        Venta vs Renta
      </h4>

      {/* Proportion bar */}
      <div className="mb-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {hasVenta && (
            <div
              className="bg-slate-700 transition-all duration-500"
              style={{ width: `${ventaPct}%` }}
            />
          )}
          {hasRenta && (
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${rentaPct}%` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-bold text-slate-700">
            Venta {ventaPct}% ({data.ventaCount})
          </span>
          <span className="text-[10px] font-bold text-emerald-500">
            Renta {rentaPct}% ({data.rentaCount})
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <ComparisonRow
          label="Precio promedio"
          venta={hasVenta ? formatPrice(data.ventaAvgPrice) : "—"}
          renta={hasRenta ? formatPrice(data.rentaAvgPrice) : "—"}
        />
        <ComparisonRow
          label="Precio / m²"
          venta={hasVenta ? formatPrice(data.ventaAvgPriceM2) : "—"}
          renta={hasRenta ? formatPrice(data.rentaAvgPriceM2) : "—"}
        />
        <ComparisonRow
          label="m² promedio"
          venta={hasVenta ? `${Math.round(data.ventaAvgArea)} m²` : "—"}
          renta={hasRenta ? `${Math.round(data.rentaAvgArea)} m²` : "—"}
        />
      </div>

      {/* Yield */}
      {yieldPct !== null && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Icon name="trending_up" className="text-sm text-emerald-600" />
            <span className="text-xs text-slate-500">Yield estimado</span>
            <span className="text-sm font-black text-emerald-600 ml-auto">
              {yieldPct.toFixed(1)}% anual
            </span>
          </div>
        </div>
      )}

      {!hasRenta && (
        <p className="text-[10px] text-slate-400 mt-3 italic">
          Sin datos de renta disponibles en esta zona actualmente
        </p>
      )}
    </div>
  )
}

function ComparisonRow({ label, venta, renta }: { label: string; venta: string; renta: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">{venta}</span>
        <span className="text-[10px] text-slate-300">vs</span>
        <span className="text-xs font-bold text-emerald-600">{renta}</span>
      </div>
    </div>
  )
}
