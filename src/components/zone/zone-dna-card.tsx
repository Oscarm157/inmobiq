import { Icon } from "@/components/icon"
import { formatCurrency } from "@/lib/utils"
import type { PropertyType } from "@/types/database"

const PROPERTY_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local Comercial",
  oficina: "Oficina",
}

const PROPERTY_ICONS: Record<PropertyType, string> = {
  casa: "house",
  departamento: "apartment",
  terreno: "landscape",
  local: "storefront",
  oficina: "business_center",
}

interface ZoneDNACardProps {
  dominantType: PropertyType
  dominantPct: number
  avgTicket: number
  avgArea: number
  avgBedrooms: number | null
  avgBathrooms: number | null
  avgPricePerM2: number
  totalListings: number
}

export function ZoneDNACard({
  dominantType,
  dominantPct,
  avgTicket,
  avgArea,
  avgBedrooms,
  avgBathrooms,
  avgPricePerM2,
  totalListings,
}: ZoneDNACardProps) {
  const metrics = [
    {
      icon: "straighten",
      label: "Superficie prom.",
      value: avgArea > 0 ? `${Math.round(avgArea)} m²` : "—",
    },
    {
      icon: "bed",
      label: "Recámaras prom.",
      value: avgBedrooms ? avgBedrooms.toFixed(1) : "—",
    },
    {
      icon: "bathtub",
      label: "Baños prom.",
      value: avgBathrooms ? avgBathrooms.toFixed(1) : "—",
    },
    {
      icon: "price_change",
      label: "Precio / m²",
      value: formatCurrency(avgPricePerM2),
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6 shadow-[0_0_60px_-15px_rgba(59,130,246,0.25)]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
            ADN de la Zona
          </p>
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Icon name={PROPERTY_ICONS[dominantType]} className="text-lg text-blue-300" />
          </div>
        </div>

        {/* Dominant type */}
        <div className="mb-5">
          <p className="text-2xl font-black">{PROPERTY_LABELS[dominantType]}</p>
          <p className="text-sm text-blue-200/80 font-medium mt-0.5">
            {dominantPct}% del inventario · Tipo dominante
          </p>
        </div>

        {/* Avg ticket */}
        <div className="mb-5 pb-5 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Precio promedio</p>
          <p className="text-3xl font-black tracking-tight">{formatCurrency(avgTicket)}</p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Icon name={m.icon} className="text-xs text-blue-300/70" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-500 mt-5">
          Basado en {totalListings} propiedades activas · Actualizado hoy
        </p>
      </div>
    </div>
  )
}
