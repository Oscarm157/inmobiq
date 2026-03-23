import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"

interface KPIPlusvaliaProps {
  trendPct: number
  riskNote: string
  listingType?: string
}

export function KPIPlusvalia({ trendPct, riskNote, listingType }: KPIPlusvaliaProps) {
  const isRenta = listingType === "renta"
  const title = isRenta ? "Rendimiento Renta" : "Plusvalía Anual"
  const iconName = isRenta ? "payments" : "show_chart"
  const bgColor = isRenta ? "bg-blue-50" : "bg-red-50"
  const iconColor = isRenta ? "text-blue-700" : "text-red-700"
  const noteColor = isRenta ? "text-blue-800" : "text-red-800"
  const noteBorder = isRenta ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"

  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon name={iconName} className={iconColor} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            {title}
          </p>
          <h4 className="text-2xl font-black">{trendPct === 0 ? "Sin datos" : formatPercent(trendPct)}</h4>
        </div>
      </div>
      <div className={`${noteBorder} border p-3 rounded-lg`}>
        <p className={`text-[10px] font-medium ${noteColor} leading-tight`}>
          <span className="font-bold">{isRenta ? "Nota:" : "Nota de Riesgo:"}</span> {riskNote}
        </p>
      </div>
    </div>
  )
}
