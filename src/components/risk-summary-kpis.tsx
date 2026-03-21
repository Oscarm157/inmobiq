import { Icon } from "@/components/icon"
import type { ZoneRiskMetrics } from "@/types/database"

interface RiskSummaryKPIsProps {
  riskData: ZoneRiskMetrics[]
}

export function RiskSummaryKPIs({ riskData }: RiskSummaryKPIsProps) {
  const avgRisk = Math.round(riskData.reduce((s, r) => s + r.risk_score, 0) / riskData.length)
  const avgCap = (riskData.reduce((s, r) => s + r.cap_rate, 0) / riskData.length).toFixed(1)
  const avgVacancy = (riskData.reduce((s, r) => s + r.vacancy_rate, 0) / riskData.length).toFixed(1)

  const riskColor = avgRisk < 34 ? "text-green-600" : avgRisk < 67 ? "text-amber-600" : "text-red-600"
  const riskBg = avgRisk < 34 ? "bg-green-100 dark:bg-green-900/30" : avgRisk < 67 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"

  const kpis = [
    {
      label: "Risk Score Promedio",
      value: `${avgRisk}/100`,
      icon: "shield",
      color: riskColor,
      bg: riskBg,
      detail: avgRisk < 34 ? "Bajo" : avgRisk < 67 ? "Medio" : "Alto",
    },
    {
      label: "Cap Rate Promedio",
      value: `${avgCap}%`,
      icon: "account_balance",
      color: "text-slate-700",
      bg: "bg-slate-100 dark:bg-blue-900/30",
      detail: "Rendimiento anual estimado",
    },
    {
      label: "Vacancy Rate Promedio",
      value: `${avgVacancy}%`,
      icon: "domain_disabled",
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      detail: "Tasa de desocupación",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
              <Icon name={kpi.icon} className="text-lg" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
          </div>
          <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">{kpi.detail}</p>
        </div>
      ))}
    </div>
  )
}
