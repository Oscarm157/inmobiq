"use client"

import { useEffect, useRef, useState } from "react"
import type { ZoneMetrics } from "@/types/database"
import {
  ZONE_GEOJSON,
  TIJUANA_CENTER,
  TIJUANA_BOUNDS,
  getPriceColor,
  getPriceLabel,
  getZoneCentroid,
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

type LayerMode = "zones" | "heatmap"

interface InteractiveMapProps {
  zones: ZoneMetrics[]
  listings?: Listing[]
  focusZoneSlug?: string
  height?: string
  showLayerToggle?: boolean
  onZoneClick?: (slug: string) => void
}

export function InteractiveMap({
  zones,
  listings = [],
  focusZoneSlug,
  height = "500px",
  showLayerToggle = true,
  onZoneClick,
}: InteractiveMapProps) {
  const { formatPrice } = useCurrency()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [activeLayer, setActiveLayer] = useState<LayerMode>("zones")
  const [mounted, setMounted] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return

    import("mapbox-gl").then((mapboxgl) => {
      if (!mapRef.current || mapInstanceRef.current) return

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!token) return

      mapboxgl.default.accessToken = token

      const map = new mapboxgl.default.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: TIJUANA_CENTER,
        zoom: 12,
        minZoom: 10,
        maxZoom: 18,
        maxBounds: TIJUANA_BOUNDS,
      })

      map.addControl(
        new mapboxgl.default.NavigationControl(),
        "top-right"
      )

      mapInstanceRef.current = map

      // Create popup instance
      popupRef.current = new mapboxgl.default.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "240px",
        offset: 15,
      })

      // Build enriched GeoJSON
      const enriched = {
        ...ZONE_GEOJSON,
        features: ZONE_GEOJSON.features.map((f) => {
          const props = f.properties as { slug: string; name: string }
          const metrics = zones.find((z) => z.zone_slug === props.slug)
          const color = metrics
            ? getPriceColor(metrics.avg_price_per_m2)
            : "#94a3b8"
          const priceLabel = metrics
            ? getPriceLabel(metrics.avg_price_per_m2)
            : "Sin datos"
          return {
            ...f,
            properties: {
              ...props,
              color,
              priceLabel,
              avgPrice: metrics?.avg_price_per_m2 ?? 0,
              totalListings: metrics?.total_listings ?? 0,
              priceTrend: metrics?.price_trend_pct ?? 0,
            },
          }
        }),
      }

      // Build heatmap points from listings
      const heatPoints: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: listings
          .map((l) => {
            let lng = l.lng
            let lat = l.lat
            if (!lng || !lat) {
              const centroid = l.zone_slug
                ? getZoneCentroid(l.zone_slug)
                : null
              if (!centroid) return null
              lng = centroid[0] + (Math.random() - 0.5) * 0.01
              lat = centroid[1] + (Math.random() - 0.5) * 0.008
            }
            return {
              type: "Feature" as const,
              properties: { price_per_m2: l.price_per_m2 },
              geometry: { type: "Point" as const, coordinates: [lng, lat] },
            }
          })
          .filter(Boolean) as GeoJSON.Feature[],
      }

      map.on("load", () => {
        // Zone layers
        map.addSource("zones", {
          type: "geojson",
          data: enriched as GeoJSON.FeatureCollection,
          generateId: true,
        })

        map.addLayer({
          id: "zones-fill",
          type: "fill",
          source: "zones",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.75,
              0.5,
            ],
          },
        })

        map.addLayer({
          id: "zones-line",
          type: "line",
          source: "zones",
          paint: {
            "line-color": "#1e40af",
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              3,
              2,
            ],
            "line-opacity": 0.8,
          },
        })

        map.addLayer({
          id: "zones-labels",
          type: "symbol",
          source: "zones",
          layout: {
            "text-field": ["get", "name"],
            "text-size": 11,
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#1e3a5f",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          },
        })

        // Heatmap layers
        map.addSource("heatmap", {
          type: "geojson",
          data: heatPoints,
        })

        map.addLayer({
          id: "heatmap-heat",
          type: "heatmap",
          source: "heatmap",
          layout: {
            visibility: "none",
          },
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "price_per_m2"],
              10000,
              0,
              50000,
              1,
            ],
            "heatmap-intensity": 1,
            "heatmap-radius": 25,
            "heatmap-opacity": 0.7,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(191,219,254,0)",
              0.2,
              "#bfdbfe",
              0.4,
              "#93c5fd",
              0.6,
              "#60a5fa",
              0.8,
              "#3b82f6",
              1,
              "#1e40af",
            ],
          },
        })

        // Hover interaction
        let hoveredId: number | null = null

        map.on("mousemove", "zones-fill", (e) => {
          if (!e.features?.length) return
          map.getCanvas().style.cursor = "pointer"

          const feature = e.features[0]
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "zones", id: hoveredId },
              { hover: false }
            )
          }
          hoveredId = feature.id as number
          map.setFeatureState(
            { source: "zones", id: hoveredId },
            { hover: true }
          )
        })

        map.on("mouseleave", "zones-fill", () => {
          map.getCanvas().style.cursor = ""
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: "zones", id: hoveredId },
              { hover: false }
            )
            hoveredId = null
          }
        })

        // Click interaction
        map.on("click", "zones-fill", (e) => {
          if (!e.features?.length) return
          const props = e.features[0].properties as {
            slug: string
            name: string
            priceLabel: string
            avgPrice: number
            totalListings: number
            priceTrend: number
          }

          if (onZoneClick) onZoneClick(props.slug)

          const centroid = getZoneCentroid(props.slug)
          if (centroid) {
            map.flyTo({ center: centroid, zoom: 14 })
          }

          // Show popup
          const trendColor =
            props.priceTrend >= 0 ? "#16a34a" : "#dc2626"
          const trendIcon = props.priceTrend >= 0 ? "▲" : "▼"

          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:sans-serif;min-width:160px">
                <div style="font-weight:700;font-size:14px;margin-bottom:4px">${props.name}</div>
                <div style="color:#64748b;font-size:11px;margin-bottom:6px">${props.priceLabel}</div>
                <div style="font-size:12px"><strong>${formatPrice(props.avgPrice)}/m²</strong></div>
                <div style="font-size:11px;color:#475569">${props.totalListings} propiedades</div>
                <div style="font-size:11px;color:${trendColor}">
                  ${trendIcon} ${Math.abs(props.priceTrend).toFixed(1)}% vs semana anterior
                </div>
                <a href="/zona/${props.slug}" style="display:inline-block;margin-top:8px;font-size:11px;color:#1d4ed8;font-weight:600">Ver análisis →</a>
              </div>`
            )
            .addTo(map)
        })

        // Focus on specific zone
        if (focusZoneSlug) {
          const centroid = getZoneCentroid(focusZoneSlug)
          if (centroid) {
            map.flyTo({ center: centroid, zoom: 14 })
          }
        }

        setMapLoaded(true)
      })
    })

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Toggle layer visibility
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapLoaded) return

    const zoneLayers = ["zones-fill", "zones-line", "zones-labels"]
    const heatLayers = ["heatmap-heat"]

    if (activeLayer === "zones") {
      zoneLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "visible")
      )
      heatLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "none")
      )
    } else {
      zoneLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "none")
      )
      heatLayers.forEach((l) =>
        map.setLayoutProperty(l, "visibility", "visible")
      )
    }
  }, [activeLayer, mapLoaded])

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="bg-slate-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-slate-400 text-sm font-medium">
          Cargando mapa…
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm"
      style={{ height }}
    >
      {/* Map container */}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Layer toggle */}
      {showLayerToggle && (
        <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-white/95 rounded-lg shadow-md border border-slate-200 p-1">
          {(["zones", "heatmap"] as LayerMode[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                activeLayer === layer
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {layer === "zones" ? "Zonas" : "Heatmap"}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-white/95 rounded-lg shadow-md border border-slate-200 p-3">
        <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
          Precio/m²
        </p>
        {[
          { color: "#1e40af", label: "≥ $40k Premium" },
          { color: "#3b82f6", label: "$32k–$40k Alto" },
          { color: "#60a5fa", label: "$26k–$32k Med-Alto" },
          { color: "#93c5fd", label: "$20k–$26k Medio" },
          { color: "#bfdbfe", label: "< $20k Accesible" },
        ].map(({ color, label }) => (
          <div key={color} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
