"use client"

import { useEffect, useRef, useState } from "react"
import type { ZoneMetrics } from "@/types/database"
import type { ListingFilters } from "@/lib/data/listings"
import {
  TIJUANA_ZONE_GEO,
  TIJUANA_CENTER,
  TIJUANA_BOUNDS,
  getPriceColor,
  getPriceLabel,
} from "@/lib/geo-data"
import { useCurrency } from "@/contexts/currency-context"

interface Listing {
  id: string
  title: string
  price: number
  area_m2: number
  price_per_m2: number
  property_type: string
  listing_type: string
  lat?: number
  lng?: number
  zone_slug?: string
  photo_url?: string
  bedrooms?: number | null
}

type LayerMode = "zones" | "listings" | "heatmap"

interface InteractiveMapProps {
  zones: ZoneMetrics[]
  listings?: Listing[]
  activeFilters?: ListingFilters
  focusZoneSlug?: string   // zoom into a specific zone on mount
  height?: string
  showLayerToggle?: boolean
  onZoneClick?: (slug: string) => void
}

export function InteractiveMap({
  zones,
  listings = [],
  activeFilters,
  focusZoneSlug,
  height = "500px",
  showLayerToggle = true,
  onZoneClick,
}: InteractiveMapProps) {
  const { formatPrice } = useCurrency()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const layersRef = useRef<{ zones: unknown[]; markers: unknown; heatmap: unknown }>({
    zones: [],
    markers: null,
    heatmap: null,
  })
  const [activeLayer, setActiveLayer] = useState<LayerMode>("zones")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return

    // Dynamically import leaflet on client only
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Fix default marker icons
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        center: TIJUANA_CENTER,
        zoom: 12,
        minZoom: 10,
        maxZoom: 18,
        maxBounds: TIJUANA_BOUNDS,
        maxBoundsViscosity: 0.8,
        zoomControl: false,
      })

      L.control.zoom({ position: "topright" }).addTo(map)

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      // Draw zone polygons
      renderZoneLayers(L, map, zones)

      // If focusZoneSlug, zoom to that zone
      if (focusZoneSlug) {
        const geo = TIJUANA_ZONE_GEO.find((z) => z.slug === focusZoneSlug)
        if (geo) {
          map.setView([geo.lat, geo.lng], 14)
        }
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Update listings markers when listings/layer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current as ReturnType<typeof L.map>
      updateListingMarkers(L, map, listings, activeLayer)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, activeLayer])

  function renderZoneLayers(
    L: typeof import("leaflet"),
    map: ReturnType<typeof L.map>,
    zonesData: ZoneMetrics[]
  ) {
    // Remove existing zone layers
    layersRef.current.zones.forEach((layer) =>
      map.removeLayer(layer as Parameters<typeof map.removeLayer>[0])
    )
    layersRef.current.zones = []

    TIJUANA_ZONE_GEO.forEach((geo) => {
      const metrics = zonesData.find((z) => z.zone_slug === geo.slug)
      const color = metrics ? getPriceColor(metrics.avg_price_per_m2) : "#94a3b8"
      const priceLabel = metrics ? getPriceLabel(metrics.avg_price_per_m2) : "Sin datos"

      const polygon = L.polygon(geo.polygon as [number, number][], {
        color: "#1e40af",
        weight: 2,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.5,
      })

      const popupContent = metrics
        ? `<div style="font-family:sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${geo.name}</div>
            <div style="color:#64748b;font-size:11px;margin-bottom:6px">${priceLabel}</div>
            <div style="font-size:12px"><strong>${formatPrice(metrics.avg_price_per_m2)}/m²</strong></div>
            <div style="font-size:11px;color:#475569">${metrics.total_listings} propiedades</div>
            <div style="font-size:11px;color:${metrics.price_trend_pct >= 0 ? "#16a34a" : "#dc2626"}">
              ${metrics.price_trend_pct >= 0 ? "▲" : "▼"} ${Math.abs(metrics.price_trend_pct).toFixed(1)}% vs semana anterior
            </div>
            <a href="/zona/${geo.slug}" style="display:inline-block;margin-top:8px;font-size:11px;color:#1d4ed8;font-weight:600">Ver análisis →</a>
          </div>`
        : `<div style="font-family:sans-serif"><strong>${geo.name}</strong><br/><span style="color:#94a3b8">Sin datos disponibles</span></div>`

      polygon.bindPopup(popupContent)

      polygon.on("click", () => {
        if (onZoneClick) onZoneClick(geo.slug)
        map.setView([geo.lat, geo.lng], 14)
      })

      polygon.on("mouseover", () => {
        polygon.setStyle({ fillOpacity: 0.75, weight: 3 })
      })
      polygon.on("mouseout", () => {
        polygon.setStyle({ fillOpacity: 0.5, weight: 2 })
      })

      polygon.addTo(map)
      layersRef.current.zones.push(polygon)

      // Zone label
      const label = L.divIcon({
        html: `<div style="font-size:10px;font-weight:700;color:#1e3a5f;text-shadow:0 0 3px #fff,0 0 3px #fff;white-space:nowrap">${geo.name}</div>`,
        className: "",
        iconAnchor: [40, 8],
      })
      const labelMarker = L.marker([geo.lat, geo.lng], { icon: label, interactive: false })
      labelMarker.addTo(map)
      layersRef.current.zones.push(labelMarker)
    })
  }

  function updateListingMarkers(
    L: typeof import("leaflet"),
    map: ReturnType<typeof L.map>,
    listingsData: Listing[],
    layer: LayerMode
  ) {
    // Remove old markers
    if (layersRef.current.markers) {
      map.removeLayer(layersRef.current.markers as Parameters<typeof map.removeLayer>[0])
      layersRef.current.markers = null
    }
    if (layersRef.current.heatmap) {
      map.removeLayer(layersRef.current.heatmap as Parameters<typeof map.removeLayer>[0])
      layersRef.current.heatmap = null
    }

    if (layer === "listings" || layer === "heatmap") {
      const geoListings = listingsData.filter((l) => l.lat && l.lng)
      const fallbackListings = listingsData.filter((l) => !l.lat || !l.lng)

      // For listings without coordinates, use zone centroid with slight random offset
      const allWithCoords = [
        ...geoListings,
        ...fallbackListings.map((l) => {
          const geo = TIJUANA_ZONE_GEO.find((z) => z.slug === l.zone_slug)
          if (!geo) return null
          return {
            ...l,
            lat: geo.lat + (Math.random() - 0.5) * 0.008,
            lng: geo.lng + (Math.random() - 0.5) * 0.010,
          }
        }).filter(Boolean) as Listing[],
      ]

      if (layer === "listings") {
        const markerGroup = L.featureGroup()

        allWithCoords.forEach((listing) => {
          if (!listing.lat || !listing.lng) return
          const propTypeColors: Record<string, string> = {
            casa: "#1d4ed8",
            departamento: "#7c3aed",
            terreno: "#b45309",
            local: "#0f766e",
            oficina: "#c2410c",
          }
          const color = propTypeColors[listing.property_type] || "#64748b"

          const icon = L.divIcon({
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
            className: "",
            iconAnchor: [5, 5],
          })

          const marker = L.marker([listing.lat!, listing.lng!], { icon })
          marker.bindPopup(
            `<div style="font-family:sans-serif;min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${listing.title}</div>
              <div style="font-size:12px;color:#1d4ed8;font-weight:600">${formatPrice(listing.price)}</div>
              <div style="font-size:11px;color:#64748b">${listing.area_m2} m² · ${formatPrice(listing.price_per_m2)}/m²</div>
              <div style="font-size:11px;margin-top:4px">
                <span style="padding:2px 6px;background:#f1f5f9;border-radius:4px;text-transform:capitalize">${listing.property_type}</span>
                <span style="padding:2px 6px;background:#f1f5f9;border-radius:4px;margin-left:4px;text-transform:capitalize">${listing.listing_type}</span>
              </div>
              ${listing.bedrooms ? `<div style="font-size:11px;color:#475569;margin-top:4px">${listing.bedrooms} rec.</div>` : ""}
            </div>`
          )
          markerGroup.addLayer(marker)
        })

        markerGroup.addTo(map)
        layersRef.current.markers = markerGroup
      } else if (layer === "heatmap") {
        // Simple visual heatmap using circle markers with opacity
        const heatGroup = L.featureGroup()
        allWithCoords.forEach((listing) => {
          if (!listing.lat || !listing.lng) return
          const circle = L.circleMarker([listing.lat!, listing.lng!], {
            radius: 8,
            color: "transparent",
            fillColor: getPriceColor(listing.price_per_m2),
            fillOpacity: 0.4,
          })
          heatGroup.addLayer(circle)
        })
        heatGroup.addTo(map)
        layersRef.current.heatmap = heatGroup
      }
    }
  }

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="bg-slate-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-slate-400 text-sm font-medium">Cargando mapa…</div>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      {/* Map container */}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Layer toggle */}
      {showLayerToggle && (
        <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-white/95 rounded-lg shadow-md border border-slate-200 p-1">
          {(["zones", "listings", "heatmap"] as LayerMode[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                activeLayer === layer
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {layer === "zones" ? "Zonas" : layer === "listings" ? "Listings" : "Heatmap"}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-white/95 rounded-lg shadow-md border border-slate-200 p-3">
        <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Precio/m²</p>
        {[
          { color: "#1e40af", label: "≥ $40k Premium" },
          { color: "#3b82f6", label: "$32k–$40k Alto" },
          { color: "#60a5fa", label: "$26k–$32k Med-Alto" },
          { color: "#93c5fd", label: "$20k–$26k Medio" },
          { color: "#bfdbfe", label: "< $20k Accesible" },
        ].map(({ color, label }) => (
          <div key={color} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
