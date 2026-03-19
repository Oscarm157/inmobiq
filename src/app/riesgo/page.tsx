import { Icon } from "@/components/icon"
import { RiskMatrix } from "@/components/risk-matrix"
import { RiskZoneCard } from "@/components/risk-zone-card"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { getZoneMetrics } from "@/lib/data/zones"

export const metadata = {
  title: "Investment Risk — Inmobiq",
  description: "Análisis de riesgo de inversión inmobiliaria en Tijuana.",
}

export default async function RiesgoPage() {
  const [riskData, zones] = await Promise.all([getZoneRiskMetrics(), getZoneMetrics()])
  const sortedByRisk = [...riskData].sort((a, b) => a.risk_score - b.risk_score)
  const avgRisk = Math.round(riskData.reduce((s, r) => s + r.risk_score, 0) / riskData.length)
  const avgCap = (riskData.reduce((s, r) => s + r.cap_rate, 0) / riskData.length).toFixed(1)
  const avgVacancy = (riskData.reduce((s, r) => s + r.vacancy_rate, 0) / riskData.length).toFixed(1)

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
              Risk Analysis
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
              {riskData.length} Zonas
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Análisis de Riesgo de Inversión
          </h2>
          <p className="text-slate-500 max-w-xl font-medium">
            Evaluación de riesgo, volatilidad, y rendimiento esperado para cada zona de Tijuana.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Icon name="tune" className="text-sm" />
            Parámetros
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Icon name="ios_share" className="text-sm" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon name="shield" className="text-blue-700" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Risk Score Promedio
              </p>
              <h4 className="text-2xl font-black">{avgRisk}<span className="text-sm font-medium text-slate-500">/100</span></h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Icon name="percent" className="text-green-700" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Cap Rate Promedio
              </p>
              <h4 className="text-2xl font-black">{avgCap}%</h4>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Icon name="home_work" className="text-amber-700" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Vacancia Promedio
              </p>
              <h4 className="text-2xl font-black">{avgVacancy}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Matrix */}
      <RiskMatrix riskData={riskData} zones={zones} />

      {/* Zone Risk Cards */}
      <section>
        <h3 className="text-2xl font-black tracking-tight mb-6">
          Perfil de Riesgo por Zona
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedByRisk.map((risk) => (
            <RiskZoneCard key={risk.zone_slug} risk={risk} />
          ))}
        </div>
      </section>

      {/* Risk Note */}
      <div className="bg-slate-50 rounded-xl p-8 border border-slate-200/60">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 mb-6">
          Nota Metodológica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <p className="text-slate-800 leading-relaxed font-medium" style={{ textAlign: "justify" }}>
            <span style={{ float: "left", fontSize: "4rem", lineHeight: 0.8, paddingTop: 4, paddingRight: 8, fontWeight: 800, color: "#1d4ed8" }}>
              E
            </span>
            l índice de riesgo Inmobiq combina múltiples factores: volatilidad histórica de precios, tasa de capitalización, vacancia, liquidez de mercado (velocidad de venta), y madurez del mercado local. Las zonas con puntajes más bajos representan inversiones más estables con retornos predecibles, mientras que puntajes altos indican mayor potencial pero con volatilidad significativa.
          </p>
          <div className="space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed italic border-l-2 border-blue-300 pl-4">
              &ldquo;En mercados fronterizos como Tijuana, la diversificación geográfica dentro de la misma ciudad puede reducir el riesgo de portafolio hasta un 30% sin sacrificar retorno.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon name="analytics" className="text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-bold">Modelo de Riesgo Inmobiq</p>
                <p className="text-[10px] text-slate-500">v2.1 · Actualizado Septiembre 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
