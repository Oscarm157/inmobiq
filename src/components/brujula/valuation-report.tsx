"use client"

import type { ValuationResult, PropertyType, ListingType } from "@/types/database"
import { VerdictBanner } from "./verdict-banner"
import { ComparisonKpis } from "./comparison-kpis"
import { PricePositionChart } from "./price-position-chart"
import { Icon } from "@/components/icon"

const TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local comercial",
  oficina: "Oficina",
}

function formatMxn(n: number): string {
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
}

interface Props {
  result: ValuationResult
  narrative: string
  property: {
    property_type: PropertyType
    listing_type: ListingType
    price_mxn: number
    area_m2: number
    bedrooms: number | null
    bathrooms: number | null
    parking: number | null
    address: string | null
  }
}

export function ValuationReport({ result, narrative, property }: Props) {
  return (
    <div className="space-y-6">
      {/* 1. Verdict Banner */}
      <VerdictBanner
        verdict={result.verdict}
        score={result.score}
        zoneName={result.zone_name}
      />

      {/* 2. Property Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
          Propiedad analizada
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase">Tipo</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {TYPE_LABELS[property.property_type]} en {property.listing_type}
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase">Precio</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {formatMxn(property.price_mxn)} MXN
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase">Superficie</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {property.area_m2.toLocaleString("es-MX")} m²
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase">Precio/m²</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {formatMxn(result.price_per_m2)}/m²
            </p>
          </div>
          {property.bedrooms !== null && (
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase">Recámaras</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{property.bedrooms}</p>
            </div>
          )}
          {property.bathrooms !== null && (
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase">Baños</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{property.bathrooms}</p>
            </div>
          )}
          {property.parking !== null && (
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase">Estacionamiento</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{property.parking}</p>
            </div>
          )}
          {property.address && (
            <div className="col-span-2">
              <span className="text-slate-400 text-xs font-bold uppercase">Dirección</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{property.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. AI Narrative */}
      {narrative && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="auto_awesome" className="text-blue-500 text-lg" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Análisis
            </h3>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {narrative}
          </div>
        </div>
      )}

      {/* 4. Price Distribution Chart */}
      <PricePositionChart distribution={result.zone_price_distribution} />

      {/* 5. KPIs */}
      <ComparisonKpis result={result} priceMxn={property.price_mxn} />

      {/* 6. Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
          Comparativa
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase">Métrica</th>
              <th className="text-right py-2 text-xs font-bold text-blue-500 uppercase">Tu propiedad</th>
              <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase">Promedio zona</th>
              <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase">Diferencia</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300">
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 font-medium">Precio/m²</td>
              <td className="py-2 text-right font-bold">{formatMxn(result.price_per_m2)}</td>
              <td className="py-2 text-right">{formatMxn(result.zone_avg_price_per_m2)}</td>
              <td className={`py-2 text-right font-bold ${result.price_premium_pct > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {result.price_premium_pct > 0 ? "+" : ""}{result.price_premium_pct.toFixed(1)}%
              </td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 font-medium">Precio total</td>
              <td className="py-2 text-right font-bold">{formatMxn(property.price_mxn)}</td>
              <td className="py-2 text-right">{formatMxn(result.zone_avg_ticket)}</td>
              <td className="py-2 text-right">—</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 font-medium">Superficie</td>
              <td className="py-2 text-right font-bold">{property.area_m2} m²</td>
              <td className="py-2 text-right">—</td>
              <td className={`py-2 text-right font-bold ${result.area_vs_zone_avg_pct > 0 ? "text-emerald-500" : "text-red-500"}`}>
                {result.area_vs_zone_avg_pct > 0 ? "+" : ""}{result.area_vs_zone_avg_pct.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7. Zone Context */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ContextCard label="Riesgo" value={`${result.risk_score ?? 0}/100`} sub={result.risk_label ?? "—"} />
        <ContextCard label="Volatilidad" value={`${(result.volatility ?? 0).toFixed(1)}%`} sub="Variación de precios" />
        {result.cap_rate != null && (
          <ContextCard label="Cap Rate" value={`${result.cap_rate.toFixed(1)}%`} sub="Tasa de capitalización" />
        )}
        <ContextCard label="NSE" value={result.nse_label ?? "—"} sub="Nivel socioeconómico" />
        <ContextCard label="Asequibilidad" value={`${result.affordability_index ?? 0}/100`} sub="Precio vs nivel económico" />
        <ContextCard label="Apreciación" value={`${result.appreciation_potential ?? 0}/100`} sub="Potencial de plusvalía" />
      </div>

      {/* 8. Verdict Reasons */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
          Factores del veredicto
        </h3>
        <ul className="space-y-2">
          {result.verdict_reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Icon name="check_circle" className="text-blue-500 text-base flex-shrink-0 mt-0.5" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ContextCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 card-shadow border border-slate-100 dark:border-slate-800">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  )
}
