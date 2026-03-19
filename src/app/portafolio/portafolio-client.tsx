"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { RiskLevel, ZoneMetrics, ZoneRiskMetrics, PortfolioPreset } from "@/types/database"

const riskLevelStyles: Record<RiskLevel, { bg: string; text: string; icon: string }> = {
  conservador: { bg: "bg-green-100", text: "text-green-700", icon: "shield" },
  balanceado: { bg: "bg-blue-100", text: "text-blue-700", icon: "balance" },
  agresivo: { bg: "bg-red-100", text: "text-red-700", icon: "bolt" },
}

interface PortafolioClientProps {
  presets: PortfolioPreset[]
  zones: ZoneMetrics[]
  riskData: ZoneRiskMetrics[]
}

export function PortafolioClient({ presets, zones, riskData }: PortafolioClientProps) {
  const [selectedPreset, setSelectedPreset] = useState("balanceado")
  const preset = presets.find((p) => p.id === selectedPreset)!

  const weightedReturn = preset.allocations.reduce((sum, alloc) => {
    const zone = zones.find((z) => z.zone_slug === alloc.zone_slug)
    return sum + (zone?.price_trend_pct ?? 0) * (alloc.allocation_pct / 100)
  }, 0)

  const weightedRisk = preset.allocations.reduce((sum, alloc) => {
    const risk = riskData.find((r) => r.zone_slug === alloc.zone_slug)
    return sum + (risk?.risk_score ?? 0) * (alloc.allocation_pct / 100)
  }, 0)

  return (
    <div className="space-y-10">
      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {presets.map((p) => {
          const styles = riskLevelStyles[p.risk_level]
          const isSelected = p.id === selectedPreset
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p.id)}
              className={`text-left bg-white rounded-xl p-6 card-shadow transition-all duration-300 border-2 ${
                isSelected
                  ? "border-blue-600 ring-4 ring-blue-100 -translate-y-1"
                  : "border-transparent hover:-translate-y-0.5"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 ${styles.bg} rounded-lg`}>
                  <Icon name={styles.icon} className={styles.text} />
                </div>
                <span className={`px-2.5 py-1 ${styles.bg} ${styles.text} text-[10px] font-black rounded-full`}>
                  {p.risk_level.charAt(0).toUpperCase() + p.risk_level.slice(1)}
                </span>
              </div>
              <h3 className="text-lg font-black mb-1">{p.name}</h3>
              <p className="text-xs text-slate-500 font-medium mb-4">{p.description}</p>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Retorno Esp.</p>
                  <p className="text-sm font-black text-green-600">{formatPercent(p.expected_return_pct)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-semibold">Risk Score</p>
                  <p className="text-sm font-black">{p.risk_score}/100</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Portfolio Detail */}
      <div className="grid grid-cols-12 gap-6">
        {/* Allocation Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h3 className="text-xl font-bold mb-1">Asignación por Zona</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Distribución del portafolio &ldquo;{preset.name}&rdquo;
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100 pb-2">
                <div className="col-span-3">Zona</div>
                <div className="col-span-2 text-right">Precio/m²</div>
                <div className="col-span-2 text-right">Tendencia</div>
                <div className="col-span-5">Asignación</div>
              </div>
              {preset.allocations.map((alloc) => {
                const zone = zones.find((z) => z.zone_slug === alloc.zone_slug)
                return (
                  <div key={alloc.zone_slug} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <p className="text-sm font-bold">{alloc.zone_name}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-sm font-semibold">{zone ? formatCurrency(zone.avg_price_per_m2) : "—"}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`text-sm font-bold ${(zone?.price_trend_pct ?? 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                        {zone ? formatPercent(zone.price_trend_pct) : "—"}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${alloc.allocation_pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-black w-10 text-right">{alloc.allocation_pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl p-6 card-shadow">
            <h4 className="text-sm font-black uppercase mb-4 tracking-tighter">
              Resumen del Portafolio
            </h4>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Retorno Ponderado
                </p>
                <p className="text-3xl font-black text-green-600">{weightedReturn.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Riesgo Ponderado
                </p>
                <p className="text-3xl font-black">{Math.round(weightedRisk)}<span className="text-sm font-medium text-slate-500">/100</span></p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${weightedRisk}%`,
                      backgroundColor: weightedRisk < 35 ? "#22c55e" : weightedRisk < 55 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Zonas en Portafolio
                </p>
                <p className="text-3xl font-black">{preset.allocations.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Diversificación
                </p>
                <div className="flex gap-1 mt-1">
                  {preset.allocations.map((a) => (
                    <div
                      key={a.zone_slug}
                      className="h-6 bg-blue-600 rounded-sm transition-all duration-500"
                      style={{
                        width: `${a.allocation_pct}%`,
                        opacity: 0.4 + (a.allocation_pct / 100) * 0.6,
                      }}
                      title={`${a.zone_name}: ${a.allocation_pct}%`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="lightbulb" className="text-blue-700 text-sm" />
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                Recomendación
              </p>
            </div>
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              {preset.risk_level === "conservador"
                ? "Ideal para preservación de capital con ingresos estables por renta. Zonas de baja volatilidad y alta liquidez."
                : preset.risk_level === "balanceado"
                  ? "Equilibrio entre crecimiento de plusvalía y estabilidad. Adecuado para horizontes de inversión de 3-5 años."
                  : "Máximo potencial de apreciación. Recomendado solo para inversionistas con alta tolerancia al riesgo y horizonte de +5 años."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
