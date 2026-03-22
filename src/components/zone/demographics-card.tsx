import { Icon } from "@/components/icon"
import { getZoneDemographics, getNseColor } from "@/lib/data/demographics"

interface DemographicsCardProps {
  slug: string
}

export function DemographicsCard({ slug }: DemographicsCardProps) {
  const data = getZoneDemographics(slug)
  if (!data || data.ageb_count === 0) return null

  const nseColor = getNseColor(data.nse_label)

  const populationMetrics = [
    {
      icon: "groups",
      label: "Población",
      value: data.population.toLocaleString("es-MX"),
      sub: `${data.ageb_count} AGEBs`,
    },
    {
      icon: "person",
      label: "Edad mediana",
      value: `${data.median_age} años`,
      sub: data.median_age >= 35 ? "Zona madura" : data.median_age >= 28 ? "Zona joven-adulta" : "Zona joven",
    },
    {
      icon: "work",
      label: "Participación económica",
      value: `${data.economic_participation}%`,
      sub: data.economic_participation >= 55 ? "Alta actividad" : "Actividad moderada",
    },
  ]

  const nseMetrics = [
    {
      icon: "home",
      label: "Viviendas habitadas",
      value: data.occupied_dwellings.toLocaleString("es-MX"),
      sub: `${data.avg_occupants} hab/viv`,
    },
    {
      icon: "health_and_safety",
      label: "Seguridad social",
      value: `${data.pct_social_security}%`,
      sub: data.pct_social_security >= 70 ? "Buena cobertura" : "Cobertura parcial",
    },
  ]

  const serviceMetrics = [
    {
      icon: "wifi",
      label: "Internet",
      value: `${data.pct_internet}%`,
      sub: data.pct_internet >= 80 ? "Alta conectividad" : data.pct_internet >= 60 ? "Conectividad media" : "Baja conectividad",
    },
    {
      icon: "directions_car",
      label: "Automóvil",
      value: `${data.pct_car}%`,
      sub: data.pct_car >= 75 ? "Alta motorización" : data.pct_car >= 55 ? "Motorización media" : "Baja motorización",
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      {/* Header with NSE badge */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Perfil Demográfico
        </h4>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${nseColor.bg} ${nseColor.text}`}>
            NSE {data.nse_label}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400">
            Censo 2020
          </span>
        </div>
      </div>

      {/* NSE Score Bar */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Nivel Socioeconómico
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
            {data.nse_score}/100
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${data.nse_score}%`,
              background: data.nse_score >= 80 ? "#10b981" : data.nse_score >= 65 ? "#3b82f6" : data.nse_score >= 50 ? "#0ea5e9" : "#f59e0b",
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400">D/E</span>
          <span className="text-[9px] text-slate-400">A/B</span>
        </div>
      </div>

      {/* Section: Población */}
      <MetricSection title="Población" metrics={populationMetrics} />

      {/* Section: Vivienda */}
      <MetricSection title="Vivienda y cobertura" metrics={nseMetrics} />

      {/* Section: Servicios */}
      <MetricSection title="Servicios" metrics={serviceMetrics} />

      <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        Fuente: INEGI Censo 2020 · Intercensal 2025 disponible sep. 2026
      </p>
    </div>
  )
}

function MetricSection({ title, metrics }: { title: string; metrics: { icon: string; label: string; value: string; sub: string }[] }) {
  return (
    <div className="mb-3">
      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="space-y-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex-shrink-0">
              <Icon name={m.icon} className="text-sm text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{m.value}</p>
            </div>
            <span className="text-[10px] text-slate-400 flex-shrink-0">{m.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
