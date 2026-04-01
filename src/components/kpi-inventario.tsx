"use client"

import { Icon } from "@/components/icon"
import { InfoTooltip } from "@/components/info-tooltip"
import { formatCurrency } from "@/lib/utils"
import { SpringCard } from "@/components/motion-wrappers"

interface KPIInventarioProps {
  medianPrice: number
  avgPrice: number
  listingType?: string
}

export function KPIInventario({ medianPrice, avgPrice, listingType }: KPIInventarioProps) {
  const isRenta = listingType === "renta"

  return (
    <SpringCard>
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon name="sell" className="text-indigo-600" />
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase text-slate-500 tracking-widest">
            {isRenta ? "Ticket Renta" : "Ticket Venta"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Tijuana</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Mediana */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Mediana</span>
            <InfoTooltip content="El valor del medio: 50% de las propiedades cuestan más y 50% menos. Más estable que el promedio porque no se distorsiona con precios extremos." />
          </div>
          <span className="text-xl font-black text-slate-800">
            {medianPrice > 0 ? formatCurrency(medianPrice) : "—"}
          </span>
        </div>

        {/* Promedio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Promedio</span>
            <InfoTooltip content="La suma de todos los precios dividida entre el total. Puede ser más alto que la mediana si hay propiedades muy caras que jalan el número hacia arriba." />
          </div>
          <span className="text-lg font-bold text-slate-600">
            {avgPrice > 0 ? formatCurrency(avgPrice) : "—"}
          </span>
        </div>
      </div>
    </div>
    </SpringCard>
  )
}
