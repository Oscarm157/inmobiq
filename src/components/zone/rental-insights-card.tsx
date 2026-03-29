import { Icon } from "@/components/icon"
import type { RentalInsights } from "@/lib/data/zone-insights"

interface RentalInsightsCardProps {
  insights: RentalInsights
}

function getBarColor(score: number): string {
  if (score >= 75) return "#10b981"
  if (score >= 50) return "#3b82f6"
  if (score >= 25) return "#f59e0b"
  return "#ef4444"
}

function velocityIcon(velocity: RentalInsights["rental_velocity"]): { icon: string; color: string; label: string } {
  switch (velocity) {
    case "alta":
      return { icon: "bolt", color: "text-emerald-600", label: "Renta rápido" }
    case "media":
      return { icon: "schedule", color: "text-amber-600", label: "Velocidad normal" }
    case "baja":
      return { icon: "hourglass_top", color: "text-red-500", label: "Renta lento" }
  }
}

export function RentalInsightsCard({ insights }: RentalInsightsCardProps) {
  const vel = velocityIcon(insights.rental_velocity)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Insights de Renta
        </h4>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400">
          Mercado Rental
        </span>
      </div>

      {/* Demand score bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon name="groups" className="text-sm text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Demanda de Renta
          </span>
          <span className="ml-auto text-xs font-black text-slate-800 dark:text-slate-200">
            {insights.rental_demand_score}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${insights.rental_demand_score}%`,
              backgroundColor: getBarColor(insights.rental_demand_score),
            }}
          />
        </div>
        <p className="text-[10px] text-slate-400">{insights.rental_demand_label}</p>
      </div>

      {/* Velocity */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Icon name={vel.icon} className={`text-sm ${vel.color}`} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Velocidad de Renta</span>
          <span className={`ml-auto text-xs font-bold ${vel.color}`}>{vel.label}</span>
        </div>
        {insights.avg_listing_duration_days !== null && (
          <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
            ~{insights.avg_listing_duration_days} días promedio en mercado
          </p>
        )}
      </div>

      {/* Furnished premium */}
      {insights.furnished_premium_pct !== null && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Icon name="chair" className="text-sm text-violet-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Premium Amueblado</span>
            <span className={`ml-auto text-xs font-black ${insights.furnished_premium_pct > 0 ? "text-violet-600" : "text-slate-500"}`}>
              {insights.furnished_premium_pct > 0 ? "+" : ""}{insights.furnished_premium_pct.toFixed(0)}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
            Diferencia de precio/m² entre amueblado y sin amuebles
          </p>
        </div>
      )}

      {/* USD market */}
      {insights.usd_market_share_pct > 0 && (
        <div>
          <div className="flex items-center gap-2">
            <Icon name="attach_money" className="text-sm text-blue-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mercado USD</span>
            <span className="ml-auto text-xs font-black text-blue-600">
              {insights.usd_market_share_pct}% de listings
            </span>
          </div>
          <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
            Proporción de rentas publicadas en dólares
          </p>
        </div>
      )}
    </div>
  )
}
