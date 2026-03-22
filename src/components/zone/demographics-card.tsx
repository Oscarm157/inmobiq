import { Icon } from "@/components/icon"
import { getZoneDemographics } from "@/lib/data/demographics"

interface DemographicsCardProps {
  slug: string
}

export function DemographicsCard({ slug }: DemographicsCardProps) {
  const data = getZoneDemographics(slug)
  if (!data || data.ageb_count === 0) return null

  const metrics = [
    {
      icon: "groups",
      label: "Población",
      value: data.population.toLocaleString("es-MX"),
      sub: `${data.ageb_count} AGEBs`,
    },
    {
      icon: "home",
      label: "Viviendas habitadas",
      value: data.occupied_dwellings.toLocaleString("es-MX"),
      sub: `${data.avg_occupants} hab/viv`,
    },
    {
      icon: "person",
      label: "Edad mediana",
      value: `${data.median_age} años`,
      sub: data.median_age >= 35 ? "Zona madura" : data.median_age >= 28 ? "Zona joven-adulta" : "Zona joven",
    },
    {
      icon: "wifi",
      label: "Viviendas con internet",
      value: `${data.pct_internet}%`,
      sub: data.pct_internet >= 80 ? "Alta conectividad" : data.pct_internet >= 60 ? "Conectividad media" : "Baja conectividad",
    },
    {
      icon: "directions_car",
      label: "Viviendas con automóvil",
      value: `${data.pct_car}%`,
      sub: data.pct_car >= 75 ? "Alta motorización" : data.pct_car >= 55 ? "Motorización media" : "Baja motorización",
    },
    {
      icon: "health_and_safety",
      label: "Seguridad social",
      value: `${data.pct_social_security}%`,
      sub: data.pct_social_security >= 70 ? "Buena cobertura" : "Cobertura parcial",
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Perfil Demográfico
        </h4>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400">
          Censo 2020
        </span>
      </div>

      <div className="space-y-3">
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

      <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        Fuente: INEGI Censo 2020 · Intercensal 2025 disponible sep. 2026
      </p>
    </div>
  )
}
