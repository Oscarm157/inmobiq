"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { ZONES, PROPERTY_TYPES } from "@/lib/filter-utils"
import type { PropertyType, ListingType, ValuationResult } from "@/types/database"

export interface ManualFormResult {
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
  onResult: (data: ManualFormResult) => void
  disabled?: boolean
}

export function ManualForm({ onResult, disabled }: Props) {
  const [listingType, setListingType] = useState<ListingType>("venta")
  const [propertyType, setPropertyType] = useState<PropertyType>("casa")
  const [priceMxn, setPriceMxn] = useState("")
  const [areaM2, setAreaM2] = useState("")
  const [areaTerrenoM2, setAreaTerrenoM2] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [bathrooms, setBathrooms] = useState("")
  const [parking, setParking] = useState("")
  const [zoneSlug, setZoneSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showBedrooms = propertyType === "casa" || propertyType === "departamento"
  const showBathrooms = propertyType !== "terreno"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!priceMxn || !areaM2 || !zoneSlug) {
      setError("Completa los campos obligatorios: precio, m² y zona")
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

    setLoading(true)
    try {
      const res = await fetch("/api/brujula/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_type: propertyType,
          listing_type: listingType,
          price_mxn: Number(priceMxn),
          area_m2: Number(areaM2),
          area_construccion_m2: propertyType === "casa" ? Number(areaM2) : propertyType !== "terreno" ? Number(areaM2) : null,
          area_terreno_m2: propertyType === "casa" && areaTerrenoM2 ? Number(areaTerrenoM2) : propertyType === "terreno" ? Number(areaM2) : null,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          parking: parking ? Number(parking) : null,
          zone_slug: zoneSlug,
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
          address: null,
        },
      })
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Operación toggle */}
      <div>
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Operación
        </label>
        <div className="flex gap-2">
          {(["venta", "renta"] as ListingType[]).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setListingType(op)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                listingType === op
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {op === "venta" ? "Venta" : "Renta"}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de propiedad */}
      <div>
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Tipo de propiedad
        </label>
        <div className="flex gap-2 flex-wrap">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => setPropertyType(pt.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                propertyType === pt.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon name={pt.icon} className="text-sm" />
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price + Area */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Precio (MXN) *
          </label>
          <input
            type="number"
            value={priceMxn}
            onChange={(e) => setPriceMxn(e.target.value)}
            placeholder={listingType === "venta" ? "3,500,000" : "15,000"}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            min={0}
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            {propertyType === "casa" ? "Construcción (m²) *" : propertyType === "terreno" ? "Terreno (m²) *" : "Superficie (m²) *"}
          </label>
          <input
            type="number"
            value={areaM2}
            onChange={(e) => setAreaM2(e.target.value)}
            placeholder={propertyType === "terreno" ? "400" : "120"}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            min={0}
            required
          />
        </div>
      </div>

      {/* Terreno area for casas */}
      {propertyType === "casa" && (
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Terreno (m²)
          </label>
          <input
            type="number"
            value={areaTerrenoM2}
            onChange={(e) => setAreaTerrenoM2(e.target.value)}
            placeholder="200"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            min={0}
          />
          <p className="text-[10px] text-slate-400 mt-1">Opcional — superficie del lote/terreno</p>
        </div>
      )}

      {/* Bedrooms + Bathrooms + Parking */}
      <div className={`grid gap-4 ${showBedrooms && showBathrooms ? "grid-cols-3" : showBathrooms ? "grid-cols-2" : "grid-cols-1"}`}>
        {showBedrooms && (
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Recámaras
            </label>
            <input
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="3"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min={0}
            />
          </div>
        )}
        {showBathrooms && (
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Baños
            </label>
            <input
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="2"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min={0}
            />
          </div>
        )}
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Estacionamiento
          </label>
          <input
            type="number"
            value={parking}
            onChange={(e) => setParking(e.target.value)}
            placeholder="2"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            min={0}
          />
        </div>
      </div>

      {/* Zone */}
      <div>
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Zona *
        </label>
        <select
          value={zoneSlug}
          onChange={(e) => setZoneSlug(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        >
          <option value="">Selecciona una zona</option>
          {ZONES.filter((z) => z.slug !== "otros").map((z) => (
            <option key={z.slug} value={z.slug}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Icon name="hourglass_empty" className="text-base animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Icon name="explore" className="text-base" />
            Valuar propiedad
          </>
        )}
      </button>
    </form>
  )
}
