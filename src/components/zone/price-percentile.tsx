"use client"

import { useCurrency } from "@/contexts/currency-context"

interface PricePercentileProps {
  zonePrice: number
  allZonePrices: { name: string; price: number }[]
  zoneName: string
}

export function PricePercentile({ zonePrice, allZonePrices, zoneName }: PricePercentileProps) {
  const { formatPrice } = useCurrency()

  const sorted = [...allZonePrices].sort((a, b) => a.price - b.price)
  const rank = sorted.findIndex((z) => z.name === zoneName) + 1
  const percentile = Math.round((rank / sorted.length) * 100)
  const totalZones = sorted.length

  const cheapest = sorted[0]
  const mostExpensive = sorted[sorted.length - 1]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
        Posición de Precio
      </h3>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
        Dónde se ubica esta zona respecto a las {totalZones} zonas de Tijuana
      </p>

      {/* Percentile bar */}
      <div className="relative mb-4">
        <div className="h-3 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 dark:from-emerald-900 dark:via-amber-900 dark:to-red-900 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 dark:bg-white rounded-full border-2 border-white dark:border-slate-800 shadow-md"
          style={{ left: `calc(${percentile}% - 8px)` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-slate-400 mb-4">
        <span>Más barata</span>
        <span>Más cara</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold">Más barata</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{cheapest.name}</p>
          <p className="text-[10px] text-slate-400">{formatPrice(cheapest.price)}/m²</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg py-2">
          <p className="text-[10px] text-slate-400 font-semibold">Esta zona</p>
          <p className="text-lg font-black text-blue-700 dark:text-blue-400">P{percentile}</p>
          <p className="text-[10px] text-slate-400">#{rank} de {totalZones}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-semibold">Más cara</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{mostExpensive.name}</p>
          <p className="text-[10px] text-slate-400">{formatPrice(mostExpensive.price)}/m²</p>
        </div>
      </div>
    </div>
  )
}
