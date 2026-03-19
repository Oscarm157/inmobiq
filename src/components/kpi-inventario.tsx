import { Icon } from "@/components/icon"
import { formatNumber } from "@/lib/utils"

interface KPIInventarioProps {
  totalListings: number
  absorptionPct: number
}

export function KPIInventario({ totalListings, absorptionPct }: KPIInventarioProps) {
  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon name="inventory_2" className="text-indigo-600" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Inventario Total
          </p>
          <h4 className="text-2xl font-black">
            {formatNumber(totalListings)}{" "}
            <span className="text-sm font-medium text-slate-500">Unidades</span>
          </h4>
        </div>
      </div>
      <div className="relative pt-4">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span>Absorción de Mercado</span>
          <span>{absorptionPct}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(29,78,216,0.4)] transition-all duration-700"
            style={{ width: `${absorptionPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
