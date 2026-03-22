import Link from "next/link"
import { Icon } from "@/components/icon"
import type { MarketInsight } from "@/lib/data/demographics"

interface MarketIntelligenceProps {
  insights: MarketInsight[]
}

export function MarketIntelligence({ insights }: MarketIntelligenceProps) {
  if (insights.length === 0) return null

  return (
    <section>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-2xl font-black tracking-tight">Inteligencia de Mercado</h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold rounded-full tracking-widest uppercase">
            Cruce Censo × Mercado
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Insights generados al cruzar datos del Censo 2020 con el mercado inmobiliario activo
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight) => (
          <Link
            key={insight.id}
            href={`/zona/${insight.zone_slug}`}
            className={`group bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800 border-l-4 ${insight.accent} hover:scale-[1.01] transition-transform`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Icon name={insight.icon} className="text-base text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {insight.title}
              </span>
            </div>

            <p className="text-lg font-black text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {insight.zone_name}
            </p>

            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
              {insight.metric_value}
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {insight.explanation}
            </p>

            <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
              Ver zona <Icon name="arrow_forward" className="text-[10px]" />
            </div>
          </Link>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        Demografía: INEGI Censo 2020 · Mercado: portales inmobiliarios · Riesgo: análisis de volatilidad semanal
      </p>
    </section>
  )
}
