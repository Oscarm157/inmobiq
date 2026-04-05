"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"

interface HeatmapCardProps {
  zoneName: string
  pricePerM2: number
  trendPct: number
}

export function HeatmapCard({ zoneName, pricePerM2, trendPct }: HeatmapCardProps) {
  const { formatPrice, currency } = useCurrency()
  const [view, setView] = useState("VENTA")

  return (
    <div className="bg-surface rounded-xl p-6 card-shadow overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">Mapa de Densidad de Precios</h3>
          <p className="text-xs text-slate-500 font-medium">
            Visualización de plusvalía por m² en tiempo real
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-full">
          {["VENTA", "RENTA"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-[10px] font-bold rounded-full transition-all ${
                view === v
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full rounded-lg relative overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfIuGhp5qZaBeJy7gLI8Vg50Bt-yUN8E7SlG9FyPF4WGNaYFSa6BTvYrEdRfrcZ3N1N0vI8q3j6QJsfr9k1_DGMS7RMvPuqTJXMnScfqgbK0Jm0Nkj3Fcsq84auytlNFzRuW8biF0YYIUIMoPqgC9Ex3_VXGO6VbV5cIvpn0udfNXQkDYngzQAsw11Lm9Va7UCh7sCNz1RVNQZRevMyuuAUj2HlXgjkrdRY7XM6O7PHMXVYnAimYh1WR8QEsSIKtODWRCNGfT0SVK4"
          alt="City heatmap"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-700/10 mix-blend-multiply" />

        {/* Tooltip */}
        <div className="absolute top-1/4 right-1/3 bg-white/95 backdrop-blur p-4 rounded-xl shadow-2xl border border-blue-200 pointer-events-none">
          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter mb-1">
            Punto Caliente: {zoneName}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black">
              {formatPrice(pricePerM2)}
            </span>
            <span className="text-xs font-bold text-slate-500 pb-1">
              {currency}/m²
            </span>
          </div>
          <div
            className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${
              trendPct > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <Icon
              name={trendPct > 0 ? "trending_up" : "trending_down"}
              className="text-xs"
            />
            <span>{formatPercent(trendPct)} YoY</span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-8 bg-gradient-to-r from-blue-100 to-blue-900 rounded-full" />
            <span className="text-[10px] font-bold">Escala de Valor</span>
          </div>
        </div>
      </div>
    </div>
  )
}
