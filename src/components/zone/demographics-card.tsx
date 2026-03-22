import { Icon } from "@/components/icon"
import {
  getZoneDemographics,
  getCityDemographicAverages,
  classifySocioeconomicProfile,
  getProfileColor,
  generateBuyerPersona,
  computeOpportunityScore,
} from "@/lib/data/demographics"
import type { ZoneMetrics } from "@/types/database"

interface DemographicsCardProps {
  slug: string
  zone: ZoneMetrics
  allZones: ZoneMetrics[]
}

interface BarMetric {
  label: string
  icon: string
  value: number
  cityAvg: number
  unit: string
  maxScale: number // for bar width calculation
}

export function DemographicsCard({ slug, zone, allZones }: DemographicsCardProps) {
  const data = getZoneDemographics(slug)
  if (!data || data.ageb_count === 0) return null

  const cityAvgs = getCityDemographicAverages()
  const profile = classifySocioeconomicProfile(data)
  const profileColor = getProfileColor(profile)
  const persona = generateBuyerPersona(data, zone)
  const opportunity = computeOpportunityScore(data, zone, allZones)

  const peaRatio = data.population > 0
    ? Math.round((data.economically_active / data.population) * 100)
    : 0

  const bars: BarMetric[] = [
    { label: "Internet", icon: "wifi", value: data.pct_internet, cityAvg: cityAvgs.avg_pct_internet, unit: "%", maxScale: 100 },
    { label: "Automóvil", icon: "directions_car", value: data.pct_car, cityAvg: cityAvgs.avg_pct_car, unit: "%", maxScale: 100 },
    { label: "Seg. Social", icon: "health_and_safety", value: data.pct_social_security, cityAvg: cityAvgs.avg_pct_social_security, unit: "%", maxScale: 100 },
    { label: "Edad Med.", icon: "person", value: data.median_age, cityAvg: cityAvgs.avg_median_age, unit: " años", maxScale: 50 },
    { label: "Hab/Vivienda", icon: "family_restroom", value: data.avg_occupants, cityAvg: cityAvgs.avg_occupants, unit: "", maxScale: 5 },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Radiografía Socioeconómica
        </h4>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profileColor}`}>
            {profile}
          </span>
        </div>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-lg font-black text-slate-800 dark:text-white">{data.population.toLocaleString("es-MX")}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Poblacion</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-lg font-black text-slate-800 dark:text-white">{data.households.toLocaleString("es-MX")}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Hogares</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-lg font-black text-slate-800 dark:text-white">{peaRatio}%</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">PEA</p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-2.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Zona vs Promedio Ciudad
        </p>
        {bars.map((bar) => {
          const zonePct = (bar.value / bar.maxScale) * 100
          const cityPct = (bar.cityAvg / bar.maxScale) * 100
          const diff = bar.value - bar.cityAvg
          const isAbove = diff > 0.5
          const isBelow = diff < -0.5
          const barColor = isAbove
            ? "bg-emerald-500"
            : isBelow
              ? "bg-amber-500"
              : "bg-slate-400"

          return (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon name={bar.icon} className="text-xs text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {bar.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {bar.value}{bar.unit}
                  </span>
                  {(isAbove || isBelow) && (
                    <span className={`text-[9px] font-bold ${isAbove ? "text-emerald-600" : "text-amber-600"}`}>
                      {isAbove ? "+" : ""}{Math.round(diff * 10) / 10}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-visible">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, zonePct)}%` }}
                />
                {/* City average marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-slate-500 dark:bg-slate-400"
                  style={{ left: `${Math.min(100, cityPct)}%` }}
                  title={`Promedio ciudad: ${bar.cityAvg}${bar.unit}`}
                />
              </div>
            </div>
          )
        })}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-slate-500" />
            <span className="text-[9px] text-slate-400">Promedio ciudad</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-emerald-500" />
            <span className="text-[9px] text-slate-400">Arriba</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-amber-500" />
            <span className="text-[9px] text-slate-400">Abajo</span>
          </div>
        </div>
      </div>

      {/* Opportunity Score */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white ${opportunity.total >= 65 ? "bg-emerald-500" : opportunity.total >= 40 ? "bg-yellow-500" : "bg-orange-500"}`}>
            {opportunity.total}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Indice de Oportunidad</p>
          <p className="text-[10px] text-slate-400">
            Precio {opportunity.price_score.toFixed(0)}/25 · Densidad {opportunity.density_score.toFixed(0)}/25 · Digital {opportunity.digital_score.toFixed(0)}/25 · Economia {opportunity.economic_score.toFixed(0)}/25
          </p>
        </div>
      </div>

      {/* Buyer Persona */}
      {persona.text && persona.tags.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 mb-2">
            <Icon name="psychology" className="text-sm text-slate-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quien Vive Aqui
            </p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
            {persona.text}
          </p>
          <div className="flex flex-wrap gap-1">
            {persona.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        Fuente: INEGI Censo 2020 · Intercensal 2025 disponible sep. 2026
      </p>
    </div>
  )
}
