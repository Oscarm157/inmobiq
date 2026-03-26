"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { ZONES, PROPERTY_TYPES } from "@/lib/filter-utils"
import type { PropertyType, ListingType, ExtractedPropertyData, ValuationResult } from "@/types/database"

export interface ReviewResult {
  valuationId: string
  result: ValuationResult
  narrative: string
  property: {
    property_type: PropertyType
    listing_type: ListingType
    price_mxn: number
    area_m2: number
    area_construccion_m2?: number | null
    area_terreno_m2?: number | null
    bedrooms: number | null
    bathrooms: number | null
    parking: number | null
    address: string | null
  }
}

interface Props {
  valuationId: string
  extracted: ExtractedPropertyData
  onResult: (data: ReviewResult) => void
  onBack: () => void
}

export function ExtractionReview({ valuationId, extracted, onResult, onBack }: Props) {
  const [listingType, setListingType] = useState<ListingType>(extracted.listing_type ?? "venta")
  const [propertyType, setPropertyType] = useState<PropertyType>(extracted.property_type ?? "casa")
  const [priceMxn, setPriceMxn] = useState(
    extracted.price
      ? String(extracted.currency === "USD" ? Math.round(extracted.price * 17.5) : extracted.price)
      : "",
  )
  const [areaM2, setAreaM2] = useState(extracted.area_construccion_m2 ? String(extracted.area_construccion_m2) : extracted.area_m2 ? String(extracted.area_m2) : "")
  const [areaTerrenoM2, setAreaTerrenoM2] = useState(extracted.area_terreno_m2 ? String(extracted.area_terreno_m2) : "")
  const [bedrooms, setBedrooms] = useState(extracted.bedrooms ? String(extracted.bedrooms) : "")
  const [bathrooms, setBathrooms] = useState(extracted.bathrooms ? String(extracted.bathrooms) : "")
  const [parking, setParking] = useState(extracted.parking ? String(extracted.parking) : "")
  const [address, setAddress] = useState(extracted.address ?? "")
  const [zoneSlug, setZoneSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showBedrooms = propertyType === "casa" || propertyType === "departamento"
  const showBathrooms = propertyType !== "terreno"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!priceMxn || !areaM2) {
      setError("Precio y superficie son obligatorios")
      return
    }
    if (Number(priceMxn) <= 0) {
      setError("El precio debe ser mayor a 0")
      return
    }
    if (Number(areaM2) <= 0) {
      setError("La superficie debe ser mayor a 0")
      return
    }
    if (!zoneSlug && !address) {
      setError("Selecciona una zona o proporciona una dirección")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/brujula/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valuationId,
          property_type: propertyType,
          listing_type: listingType,
          price_mxn: Number(priceMxn),
          area_m2: Number(areaM2),
          area_construccion_m2: propertyType !== "terreno" ? Number(areaM2) : null,
          area_terreno_m2: propertyType === "casa" && areaTerrenoM2 ? Number(areaTerrenoM2) : propertyType === "terreno" ? Number(areaM2) : null,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          parking: parking ? Number(parking) : null,
          address: address || null,
          zone_slug: zoneSlug || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error procesando valuación")
        return
      }

      onResult({
        valuationId: data.valuationId,
        result: data.result,
        narrative: data.narrative,
        property: {
          property_type: propertyType,
          listing_type: listingType,
          price_mxn: Number(priceMxn),
          area_m2: Number(areaM2),
          area_construccion_m2: propertyType !== "terreno" ? Number(areaM2) : null,
          area_terreno_m2: propertyType === "casa" && areaTerrenoM2 ? Number(areaTerrenoM2) : propertyType === "terreno" ? Number(areaM2) : null,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          parking: parking ? Number(parking) : null,
          address: address || null,
        },
      })
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Icon name="arrow_back" className="text-slate-500" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Revisa los datos extraídos
          </h3>
          <p className="text-xs text-slate-500">
            Corrige cualquier dato que la IA no haya leído correctamente
          </p>
        </div>
      </div>

      {/* Confidence notes */}
      {extracted.confidence_notes.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Notas de extracción:</p>
          <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-0.5">
            {extracted.confidence_notes.map((note, i) => (
              <li key={i}>- {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Features */}
      {extracted.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {extracted.features.map((f, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Operación */}
        <div className="flex gap-2">
          {(["venta", "renta"] as ListingType[]).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setListingType(op)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                listingType === op
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {op === "venta" ? "Venta" : "Renta"}
            </button>
          ))}
        </div>

        {/* Tipo */}
        <div className="flex gap-2 flex-wrap">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => setPropertyType(pt.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                propertyType === pt.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Icon name={pt.icon} className="text-sm" />
              {pt.label}
            </button>
          ))}
        </div>

        {/* Price + Area */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Precio (MXN) *</label>
            <input
              type="number"
              value={priceMxn}
              onChange={(e) => setPriceMxn(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              {propertyType === "casa" ? "Construcción (m²) *" : propertyType === "terreno" ? "Terreno (m²) *" : "Superficie (m²) *"}
            </label>
            <input
              type="number"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        {/* Terreno area for casas */}
        {propertyType === "casa" && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Terreno (m²)</label>
            <input
              type="number"
              value={areaTerrenoM2}
              onChange={(e) => setAreaTerrenoM2(e.target.value)}
              placeholder="200"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Opcional — superficie del lote/terreno</p>
          </div>
        )}

        {/* Bedrooms, Bathrooms, Parking */}
        <div className="grid grid-cols-3 gap-4">
          {showBedrooms && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Recámaras</label>
              <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
          )}
          {showBathrooms && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Baños</label>
              <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Estacionamiento</label>
            <input type="number" value={parking} onChange={(e) => setParking(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Colonia, calle..."
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Zone */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            Zona {!address && "*"}
          </label>
          <select
            value={zoneSlug}
            onChange={(e) => setZoneSlug(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">{address ? "Auto-detectar por dirección" : "Selecciona una zona"}</option>
            {ZONES.filter((z) => z.slug !== "otros").map((z) => (
              <option key={z.slug} value={z.slug}>{z.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Icon name="hourglass_empty" className="text-base animate-spin" />
              Generando valuación...
            </>
          ) : (
            <>
              <Icon name="explore" className="text-base" />
              Confirmar y valuar
            </>
          )}
        </button>
      </form>
    </div>
  )
}
