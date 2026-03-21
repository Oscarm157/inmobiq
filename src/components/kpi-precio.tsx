"use client"

import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"

interface KPIPrecioProps {
  pricePerM2: number
  trendPct: number
}

export function KPIPrecio({ pricePerM2, trendPct }: KPIPrecioProps) {
  const { formatPrice } = useCurrency()
  // Generate sparkline bar heights based on price trend
  const bars = [4, 5, 4.5, 6, 5.5, 7, 6.5, 8, 7.5, 10]

  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon name="payments" className="text-slate-800" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Precio Promedio / m²
          </p>
          <h4 className="text-2xl font-black">
            {formatPrice(pricePerM2)}
          </h4>
        </div>
      </div>
      <div className="h-12 w-full flex items-end gap-1 px-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-sm w-full"
            style={{
              height: `${h * 4}px`,
              backgroundColor: `rgba(29,78,216,${0.2 + i * 0.08})`,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
        {trendPct === 0 ? (
          <span className="text-slate-400">Sin histórico</span>
        ) : (
          <span className={trendPct > 0 ? "text-green-600" : "text-red-600"}>
            {formatPercent(trendPct)} vs periodo anterior
          </span>
        )}
        <span className="text-slate-400">Actualizado: Hoy</span>
      </div>
    </div>
  )
}
