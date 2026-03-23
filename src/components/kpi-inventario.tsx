import { Icon } from "@/components/icon"
import { formatCurrency } from "@/lib/utils"

interface KPIInventarioProps {
  medianPrice: number
  listingType?: string
}

export function KPIInventario({ medianPrice, listingType }: KPIInventarioProps) {
  const isRenta = listingType === "renta"

  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon name="sell" className="text-indigo-600" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Ticket Promedio
          </p>
          <h4 className="text-2xl font-black">
            {medianPrice > 0 ? formatCurrency(medianPrice) : "Sin datos"}
          </h4>
        </div>
      </div>
      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
        <p className="text-[10px] font-medium text-indigo-800 leading-tight">
          {isRenta ? "Renta mediana mensual" : "Precio mediano de venta"} en Tijuana
        </p>
      </div>
    </div>
  )
}
