import { Icon } from "@/components/icon"
import type { ZoneMetrics } from "@/types/database"

interface InvestmentProfileProps {
  zone: ZoneMetrics
  cityAvg: number
  yieldPct: number | null
  capRate: number | null
  investmentScore: number
  nseLabel: string | null
}

function classifyZone(zone: ZoneMetrics, cityAvg: number, yieldPct: number | null): {
  profile: string
  icon: string
  color: string
  narrative: string
  forWho: string
} {
  const premiumRatio = zone.avg_price_per_m2 / cityAvg
  const trend = zone.price_trend_pct

  if (premiumRatio > 1.2) {
    return {
      profile: "Zona Premium",
      icon: "diamond",
      color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
      narrative: `${zone.zone_name} se posiciona como una zona de alto valor con precios ${Math.round((premiumRatio - 1) * 100)}% por encima del promedio de Tijuana. Las propiedades aquí tienden a preservar su valor y apreciarse de forma estable. ${trend > 2 ? "La tendencia alcista actual refuerza su atractivo como reserva de valor." : "Los precios se mantienen estables, lo que indica un mercado maduro y consolidado."}`,
      forWho: "Ideal para: preservación de capital, inversionistas conservadores, vivienda de alto nivel.",
    }
  }

  if (yieldPct !== null && yieldPct > 6) {
    return {
      profile: "Alto Rendimiento",
      icon: "trending_up",
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950",
      narrative: `${zone.zone_name} ofrece rendimientos atractivos con un yield del ${yieldPct.toFixed(1)}% bruto anual. La demanda de renta es activa, lo que se traduce en flujo de efectivo constante para el inversionista. ${zone.total_listings > 50 ? "El alto inventario permite encontrar buenas oportunidades de negociación." : "El inventario moderado indica un mercado equilibrado entre oferta y demanda."}`,
      forWho: "Ideal para: inversionistas de renta, flujo de efectivo mensual, portafolios de ingreso.",
    }
  }

  if (premiumRatio < 0.85 && trend > 0) {
    return {
      profile: "Zona Emergente",
      icon: "rocket_launch",
      color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
      narrative: `${zone.zone_name} opera con precios ${Math.round((1 - premiumRatio) * 100)}% por debajo del promedio de la ciudad y muestra señales de crecimiento. ${trend > 3 ? "La tendencia alcista sostenida sugiere potencial de plusvalía significativo a mediano plazo." : "El movimiento gradual de precios apunta a un mercado en fase de maduración."} Es una zona donde el metro cuadrado todavía es accesible.`,
      forWho: "Ideal para: compra-venta con plusvalía, primer inversión, desarrolladores.",
    }
  }

  return {
    profile: "Zona Equilibrada",
    icon: "balance",
    color: "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800",
    narrative: `${zone.zone_name} mantiene precios alineados al promedio de Tijuana con un mercado estable. ${yieldPct !== null ? `El yield del ${yieldPct.toFixed(1)}% ofrece un retorno moderado y predecible.` : "La oferta de renta es limitada pero consistente."} Es una zona versátil que funciona tanto para compra-venta como para renta.`,
    forWho: "Ideal para: inversión diversificada, balance entre plusvalía y renta, perfiles moderados.",
  }
}

export function InvestmentProfile({ zone, cityAvg, yieldPct, capRate, investmentScore, nseLabel }: InvestmentProfileProps) {
  const { profile, icon, color, narrative, forWho } = classifyZone(zone, cityAvg, yieldPct)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon name={icon} className="text-xl" />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Perfil de Inversión
          </h4>
          <p className="text-xs font-bold text-slate-500">{profile}{nseLabel ? ` · NSE ${nseLabel}` : ""}</p>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {narrative}
      </p>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-2.5">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {forWho}
        </p>
      </div>
    </div>
  )
}
