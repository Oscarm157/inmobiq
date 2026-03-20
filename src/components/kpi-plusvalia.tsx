import { Icon } from "@/components/icon"
import { formatPercent } from "@/lib/utils"

interface KPIPlusvaliaProps {
  trendPct: number
  riskNote: string
}

export function KPIPlusvalia({ trendPct, riskNote }: KPIPlusvaliaProps) {
  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-red-50 rounded-lg">
          <Icon name="show_chart" className="text-red-700" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Plusvalía Anual
          </p>
          <h4 className="text-2xl font-black">{trendPct === 0 ? "Sin datos" : formatPercent(trendPct)}</h4>
        </div>
      </div>
      <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
        <p className="text-[10px] font-medium text-red-800 leading-tight">
          <span className="font-bold">Nota de Riesgo:</span> {riskNote}
        </p>
      </div>
    </div>
  )
}
