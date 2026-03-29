"use client"

import { Icon } from "@/components/icon"
import { InfoTooltip } from "@/components/info-tooltip"
import { useCurrency } from "@/contexts/currency-context"
import type { RentalAttributeStats, ZoneCurrencyMix } from "@/lib/data/rental-attributes"
import type { SegmentData } from "@/lib/data/rental-segmentation"

interface RentalMarketCardProps {
  stats: RentalAttributeStats
  currencyMix: ZoneCurrencyMix
  segments: SegmentData[]
  avgRent: number
  avgRentPerM2: number
  totalListings: number
  rentaCount: number
}

export function RentalMarketCard({
  stats,
  currencyMix,
  segments,
  avgRent,
  avgRentPerM2,
  totalListings,
  rentaCount,
}: RentalMarketCardProps) {
  const { formatPrice } = useCurrency()
  const rentaPct = totalListings > 0 ? Math.round((rentaCount / totalListings) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Mercado de Renta
        </h4>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400">
          {rentaCount} listings · {rentaPct}% del inventario
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Renta Promedio</p>
          <p className="text-base font-black text-slate-800 dark:text-slate-200">{formatPrice(avgRent)}</p>
          <p className="text-[10px] text-slate-400">/mes</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Renta / m²</p>
          <p className="text-base font-black text-slate-800 dark:text-slate-200">{formatPrice(avgRentPerM2)}</p>
          <p className="text-[10px] text-slate-400">/m²/mes</p>
        </div>
      </div>

      {/* Furnished breakdown */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="chair" className="text-sm text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amueblado vs Sin Amuebles</span>
          <InfoTooltip content="Extraído automáticamente de las descripciones y atributos de los listings. 'Sin dato' significa que el listing no especifica." />
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {stats.furnishedCount > 0 && (
            <div
              className="bg-violet-500 transition-all"
              style={{ width: `${(stats.furnishedCount / stats.total) * 100}%` }}
              title={`Amueblado: ${stats.furnishedCount}`}
            />
          )}
          {stats.unfurnishedCount > 0 && (
            <div
              className="bg-slate-400 transition-all"
              style={{ width: `${(stats.unfurnishedCount / stats.total) * 100}%` }}
              title={`Sin amuebles: ${stats.unfurnishedCount}`}
            />
          )}
          {stats.unknownFurnishedCount > 0 && (
            <div
              className="bg-slate-200 dark:bg-slate-700 transition-all"
              style={{ width: `${(stats.unknownFurnishedCount / stats.total) * 100}%` }}
              title={`Sin dato: ${stats.unknownFurnishedCount}`}
            />
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-bold text-violet-500">
            Amueblado {stats.furnishedCount}
            {stats.furnishedPremiumPct !== null && (
              <span className="text-violet-400"> (+{stats.furnishedPremiumPct.toFixed(0)}% premium)</span>
            )}
          </span>
          <span className="text-[10px] font-bold text-slate-400">Sin amuebles {stats.unfurnishedCount}</span>
        </div>
      </div>

      {/* Currency mix */}
      {currencyMix.pctUsd > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="currency_exchange" className="text-sm text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Moneda de Publicación</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-600">MXN {currencyMix.pctMxn}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-600">USD {currencyMix.pctUsd}%</span>
            </div>
            {currencyMix.avgUsdPremiumPct !== null && (
              <span className="text-[10px] text-slate-400 ml-auto">
                Premium USD: +{currencyMix.avgUsdPremiumPct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.medianMaintenanceFee !== null && (
          <div className="text-center">
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
              {formatPrice(stats.medianMaintenanceFee)}
            </p>
            <p className="text-[10px] text-slate-400">Mant. mediana</p>
          </div>
        )}
        {stats.medianDepositMonths !== null && (
          <div className="text-center">
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
              {stats.medianDepositMonths} {stats.medianDepositMonths === 1 ? "mes" : "meses"}
            </p>
            <p className="text-[10px] text-slate-400">Depósito</p>
          </div>
        )}
        {(stats.petsAllowed > 0 || stats.petsDisallowed > 0) && (
          <div className="text-center">
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
              {stats.petsAllowed}/{stats.petsAllowed + stats.petsDisallowed}
            </p>
            <p className="text-[10px] text-slate-400">Pet friendly</p>
          </div>
        )}
      </div>

      {/* Segments */}
      {segments.length > 1 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Segmentos</p>
          <div className="space-y-1.5">
            {segments.map((s) => (
              <div key={s.segment} className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{s.count} listings</span>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    {formatPrice(s.avgRent)}/mes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top amenities */}
      {stats.topAmenities.length > 0 && (
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Amenidades Frecuentes</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.topAmenities.slice(0, 6).map((a) => (
              <span
                key={a.name}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {a.name} ({a.pct}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
