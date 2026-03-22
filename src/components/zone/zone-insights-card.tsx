import { Icon } from "@/components/icon"
import type { ZoneInsights } from "@/lib/data/zone-insights"

interface ZoneInsightsCardProps {
  insights: ZoneInsights
}

function getBarColor(score: number): string {
  if (score >= 75) return "#10b981"
  if (score >= 50) return "#3b82f6"
  if (score >= 25) return "#f59e0b"
  return "#ef4444"
}

export function ZoneInsightsCard({ insights }: ZoneInsightsCardProps) {
  const indicators = [
    {
      icon: "account_balance_wallet",
      label: "Asequibilidad",
      score: insights.affordability_index,
      description: insights.affordability_label,
      tooltip: "Precio relativo al nivel socioeconómico de la zona",
    },
    {
      icon: "trending_up",
      label: "Presión de demanda",
      score: insights.demand_pressure,
      description: insights.demand_label,
      tooltip: "Hogares vs inventario × actividad económica",
    },
    {
      icon: "diamond",
      label: "Potencial de valorización",
      score: insights.appreciation_potential,
      description: insights.appreciation_label,
      tooltip: "Fundamentos demográficos + estabilidad de precios",
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Indicadores Cruzados
        </h4>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400">
          INEGI × Mercado
        </span>
      </div>

      <div className="space-y-4">
        {indicators.map((ind) => (
          <div key={ind.label}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={ind.icon} className="text-sm text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {ind.label}
              </span>
              <span className="ml-auto text-xs font-black text-slate-800 dark:text-slate-200">
                {ind.score}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${ind.score}%`,
                  backgroundColor: getBarColor(ind.score),
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{ind.description}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        Combina datos demográficos INEGI con métricas de mercado en tiempo real
      </p>
    </div>
  )
}
