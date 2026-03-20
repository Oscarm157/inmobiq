import { Icon } from "@/components/icon"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { Listing } from "@/types/database"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Depto",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
}

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  casa: "home",
  departamento: "apartment",
  terreno: "landscape",
  local: "store",
  oficina: "business",
}

const ZONE_NAMES: Record<string, string> = {
  "1": "Zona Río",
  "2": "Playas de Tijuana",
  "3": "Otay",
  "4": "Chapultepec",
  "5": "Hipódromo",
  "6": "Centro",
  "7": "Residencial del Bosque",
  "8": "La Mesa",
}

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const isRenta = listing.listing_type === "renta"
  const typeLabel = PROPERTY_TYPE_LABELS[listing.property_type] ?? listing.property_type
  const typeIcon = PROPERTY_TYPE_ICONS[listing.property_type] ?? "home"
  const zoneName = ZONE_NAMES[listing.zone_id] ?? "Tijuana"

  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-0.5 transition-transform duration-200 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Icon name={typeIcon} className="text-blue-700 text-sm" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{typeLabel}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
          isRenta ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
        }`}>
          {isRenta ? "Renta" : "Venta"}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold leading-tight line-clamp-2">{listing.title}</h4>

      {/* Price */}
      <div>
        <p className="text-xl font-black text-blue-700">
          {formatCurrency(listing.price)}
          {isRenta && <span className="text-sm font-medium text-slate-500">/mes</span>}
        </p>
        {!isRenta && (
          <p className="text-xs text-slate-500 font-medium">
            {formatCurrency(listing.price_per_m2)}/m²
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <Icon name="straighten" className="text-slate-400 text-xs" />
          {formatNumber(listing.area_m2)} m²
        </span>
        {listing.bedrooms != null && (
          <span className="flex items-center gap-1">
            <Icon name="bed" className="text-slate-400 text-xs" />
            {listing.bedrooms} rec
          </span>
        )}
        {listing.bathrooms != null && (
          <span className="flex items-center gap-1">
            <Icon name="bathtub" className="text-slate-400 text-xs" />
            {listing.bathrooms} baños
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Icon name="location_on" className="text-slate-400 text-xs" />
          {zoneName}
        </span>
      </div>
    </div>
  )
}
