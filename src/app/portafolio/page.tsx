import { Icon } from "@/components/icon"
import { getPortfolioPresets } from "@/lib/data/portfolio"
import { getZoneMetrics } from "@/lib/data/zones"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { PortafolioClient } from "./portafolio-client"

export const metadata = {
  title: "Portfolio Explorer — Inmobiq",
  description: "Explora estrategias de inversión predefinidas para Tijuana.",
}

export default async function PortafolioPage() {
  const [presets, zones, riskData] = await Promise.all([
    Promise.resolve(getPortfolioPresets()),
    getZoneMetrics(),
    getZoneRiskMetrics(),
  ])

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
              Portfolio Explorer
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Explorador de Portafolios
          </h2>
          <p className="text-slate-500 max-w-xl font-medium">
            Explora estrategias de inversión predefinidas y analiza la composición óptima para tu perfil de riesgo.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Icon name="ios_share" className="text-sm" />
          Exportar Análisis
        </button>
      </div>

      <PortafolioClient presets={presets} zones={zones} riskData={riskData} />
    </div>
  )
}
