import { Icon } from "@/components/icon"
import { InfoTooltip } from "@/components/info-tooltip"

interface MarketQualityData {
  avgPhotos: number
  pctWithGPS: number
  pctPremium: number
  avgPropertyAge: number | null
  totalListings: number
}

interface MarketQualityCardProps {
  data: MarketQualityData
}

export function MarketQualityCard({ data }: MarketQualityCardProps) {
  // Quality score: composite of photo count, GPS, premium
  const photoScore = Math.min(10, data.avgPhotos / 3) // 30 photos = 10
  const gpsScore = data.pctWithGPS / 10 // 100% = 10
  const premiumScore = data.pctPremium / 10 // 100% = 10
  const qualityScore = Math.round(((photoScore + gpsScore + premiumScore) / 3) * 10)

  const qualityLabel =
    qualityScore >= 70 ? "Alto" : qualityScore >= 40 ? "Medio" : "Bajo"
  const qualityColor =
    qualityScore >= 70
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400"
      : qualityScore >= 40
        ? "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
        : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"

  const metrics = [
    {
      icon: "photo_camera",
      label: "Fotos promedio",
      value: `${Math.round(data.avgPhotos)}`,
      sub: data.avgPhotos >= 15 ? "Buen detalle" : "Pocas fotos",
    },
    {
      icon: "location_on",
      label: "Con ubicación GPS",
      value: `${data.pctWithGPS}%`,
      sub: data.pctWithGPS >= 80 ? "Alta precisión" : "Ubicación parcial",
    },
    {
      icon: "verified",
      label: "Listings premium",
      value: `${data.pctPremium}%`,
      sub: data.pctPremium >= 30 ? "Mercado activo" : "Baja inversión",
    },
  ]

  if (data.avgPropertyAge !== null) {
    metrics.push({
      icon: "calendar_month",
      label: "Antigüedad prom.",
      value: `${Math.round(data.avgPropertyAge)} años`,
      sub: data.avgPropertyAge <= 5 ? "Inventario nuevo" : "Inventario maduro",
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Calidad del Mercado
          </h4>
          <InfoTooltip content="Score compuesto basado en: cantidad de fotos por listing (detalle), % con ubicación GPS (precisión) y % de listings premium (inversión del vendedor). Score alto = datos más confiables." />
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${qualityColor}`}>
          {qualityLabel} · {qualityScore}/100
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
        Basado en muestra de mercado activa
      </p>
    </div>
  )
}
