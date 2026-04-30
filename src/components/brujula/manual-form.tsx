"use client"

import { useState } from "react"
import { motion } from "motion/react"
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
  onAuthRequired?: () => void
  disabled?: boolean
}

const INPUT_CLASS =
  "w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors placeholder:text-slate-400"

function IconInput({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon name={icon} className="text-base text-slate-400" />
      </div>
      {children}
    </div>
  )
}

export function ManualForm({ onResult, onAuthRequired, disabled }: Props) {
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

  const formatWithCommas = (val: string) => {
    const digits = val.replace(/\D/g, "")
    return digits ? Number(digits).toLocaleString("en-US") : ""
  }

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
        if (res.status === 401 && onAuthRequired) {
          onAuthRequired()
          return
        }
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
      {/* Form header */}
      <div className="pb-1">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Datos de la propiedad</h3>
        <p className="text-xs text-slate-400 mt-0.5">Campos marcados con * son obligatorios</p>
      </div>

      {/* Operación toggle — pill style */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Operación</p>
        <div className="inline-flex bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 gap-1">
          {(["venta", "renta"] as ListingType[]).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setListingType(op)}
              className={`relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                listingType === op
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {op === "venta" ? "Venta" : "Renta"}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de propiedad — icon cards */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tipo de propiedad</p>
        <div className="grid grid-cols-5 gap-2">
          {PROPERTY_TYPES.map((pt) => (
            <motion.button
              key={pt.value}
              type="button"
              onClick={() => setPropertyType(pt.value)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] font-bold transition-all ${
                propertyType === pt.value
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon name={pt.icon} className="text-xl" />
              {pt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Precio + Área */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Precio (MXN) *
          </label>
          <IconInput icon="payments">
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(priceMxn)}
              onChange={(e) => setPriceMxn(e.target.value.replace(/\D/g, ""))}
              placeholder={listingType === "venta" ? "3,500,000" : "15,000"}
              className={INPUT_CLASS}
              required
            />
          </IconInput>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            {propertyType === "casa" ? "Construcción (m²) *" : propertyType === "terreno" ? "Terreno (m²) *" : "Superficie (m²) *"}
          </label>
          <IconInput icon="square_foot">
            <input
              type="number"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              placeholder={propertyType === "terreno" ? "400" : "120"}
              className={INPUT_CLASS}
              min={0}
              required
            />
          </IconInput>
        </div>
      </div>

      {/* Terreno para casas */}
      {propertyType === "casa" && (
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Terreno (m²)
          </label>
          <IconInput icon="landscape">
            <input
              type="number"
              value={areaTerrenoM2}
              onChange={(e) => setAreaTerrenoM2(e.target.value)}
              placeholder="200"
              className={INPUT_CLASS}
              min={0}
            />
          </IconInput>
          <p className="text-[10px] text-slate-400 mt-1">Opcional: superficie del lote</p>
        </div>
      )}

      {/* Recámaras + Baños + Estacionamiento */}
      <div className={`grid gap-3 ${
        showBedrooms && showBathrooms ? "grid-cols-3" :
        (showBedrooms || showBathrooms) ? "grid-cols-2" :
        "grid-cols-1"
      }`}>
        {showBedrooms && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Recámaras
            </label>
            <IconInput icon="bed">
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
                className={INPUT_CLASS}
                min={0}
              />
            </IconInput>
          </div>
        )}
        {showBathrooms && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Baños
            </label>
            <IconInput icon="shower">
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="2"
                className={INPUT_CLASS}
                min={0}
              />
            </IconInput>
          </div>
        )}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Estacionamiento
          </label>
          <IconInput icon="local_parking">
            <input
              type="number"
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              placeholder="2"
              className={INPUT_CLASS}
              min={0}
            />
          </IconInput>
        </div>
      </div>

      {/* Zona */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Zona *
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name="location_on" className="text-base text-slate-400" />
          </div>
          <select
            value={zoneSlug}
            onChange={(e) => setZoneSlug(e.target.value)}
            className={INPUT_CLASS + " appearance-none"}
            required
          >
            <option value="">Selecciona una zona</option>
            {ZONES.filter((z) => z.slug !== "otros").map((z) => (
              <option key={z.slug} value={z.slug}>
                {z.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name="expand_more" className="text-base text-slate-400" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading || disabled}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      </motion.button>
    </form>
  )
}
