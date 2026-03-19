import { Icon } from "@/components/icon"
import type { ZoneRiskMetrics } from "@/types/database"

interface RiskZoneCardProps {
  risk: ZoneRiskMetrics
}

const riskColors = {
  Bajo: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", bar: "bg-green-500" },
  Medio: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500" },
  Alto: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", bar: "bg-red-500" },
}

const maturityLabels = {
  emergente: "Emergente",
  en_desarrollo: "En Desarrollo",
  consolidado: "Consolidado",
  maduro: "Maduro",
}

export function RiskZoneCard({ risk }: RiskZoneCardProps) {
  const colors = riskColors[risk.risk_label]

  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-sm">{risk.zone_name}</h4>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            {maturityLabels[risk.market_maturity]}
          </p>
        </div>
        <span className={`px-2.5 py-1 ${colors.bg} ${colors.text} text-[10px] font-black rounded-full border ${colors.border}`}>
          Riesgo {risk.risk_label}
        </span>
      </div>

      {/* Risk Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span>Risk Score</span>
          <span>{risk.risk_score}/100</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
            style={{ width: `${risk.risk_score}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Icon name="percent" className="text-slate-400 text-sm" />
          <div>
            <p className="text-[10px] text-slate-500 font-semibold">Cap Rate</p>
            <p className="text-sm font-black">{risk.cap_rate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="home_work" className="text-slate-400 text-sm" />
          <div>
            <p className="text-[10px] text-slate-500 font-semibold">Vacancia</p>
            <p className="text-sm font-black">{risk.vacancy_rate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="speed" className="text-slate-400 text-sm" />
          <div>
            <p className="text-[10px] text-slate-500 font-semibold">Liquidez</p>
            <p className="text-sm font-black">{risk.liquidity_score}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="payments" className="text-slate-400 text-sm" />
          <div>
            <p className="text-[10px] text-slate-500 font-semibold">Renta/m²</p>
            <p className="text-sm font-black">${risk.avg_rent_per_m2}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
