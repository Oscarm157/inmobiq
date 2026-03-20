"use client"

import { formatCurrency, formatNumber } from "@/lib/utils"

interface CasaVsDeptoData {
  type: string
  median_price: number
  median_area: number
  median_price_m2: number
  count: number
}

interface CasaVsDeptoProps {
  data: CasaVsDeptoData[]
  zoneName: string
}

const TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Depto",
}

const TYPE_COLORS: Record<string, string> = {
  casa: "#2563eb",
  departamento: "#7c3aed",
}

function buildExample(casa: CasaVsDeptoData | undefined, depto: CasaVsDeptoData | undefined): string {
  if (casa && depto) {
    if (casa.median_price_m2 > depto.median_price_m2) {
      const diff = Math.round(((casa.median_price_m2 - depto.median_price_m2) / depto.median_price_m2) * 100)
      return ` El m² de casa cuesta ${diff}% más que el de depto.`
    } else if (depto.median_price_m2 > casa.median_price_m2) {
      const diff = Math.round(((depto.median_price_m2 - casa.median_price_m2) / casa.median_price_m2) * 100)
      return ` El m² de depto cuesta ${diff}% más que el de casa.`
    }
  }
  return ""
}

export function CasaVsDepto({ data, zoneName }: CasaVsDeptoProps) {
  if (!data.length) return null

  const casa = data.find((d) => d.type === "casa")
  const depto = data.find((d) => d.type === "departamento")

  const hasCasa = casa != null && casa.count > 0
  const hasDepto = depto != null && depto.count > 0

  // Only one type available
  if (hasCasa && !hasDepto) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
          Casa vs Departamento
        </h4>
        <p className="text-xs text-slate-500 italic">Solo hay casas en esta zona</p>
      </div>
    )
  }
  if (!hasCasa && hasDepto) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
          Casa vs Departamento
        </h4>
        <p className="text-xs text-slate-500 italic">Solo hay departamentos en esta zona</p>
      </div>
    )
  }
  if (!hasCasa && !hasDepto) return null

  const total = casa!.count + depto!.count
  const casaPct = Math.round((casa!.count / total) * 100)
  const deptoPct = Math.round((depto!.count / total) * 100)

  const example = buildExample(casa, depto)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Casa vs Departamento
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          ¿Qué conviene más en {zoneName}?{example}
        </p>
      </div>

      {/* Proportion bar */}
      <div className="mb-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div
            className="transition-all duration-500"
            style={{ width: `${casaPct}%`, backgroundColor: "#2563eb" }}
          />
          <div
            className="transition-all duration-500"
            style={{ width: `${deptoPct}%`, backgroundColor: "#7c3aed" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-bold" style={{ color: "#2563eb" }}>
            Casa {casaPct}% ({casa!.count})
          </span>
          <span className="text-[10px] font-bold" style={{ color: "#7c3aed" }}>
            Depto {deptoPct}% ({depto!.count})
          </span>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-3">
        <ComparisonRow
          label="Precio mediano"
          casaValue={formatCurrency(casa!.median_price)}
          deptoValue={formatCurrency(depto!.median_price)}
        />
        <ComparisonRow
          label="Área mediana"
          casaValue={`${formatNumber(Math.round(casa!.median_area))} m²`}
          deptoValue={`${formatNumber(Math.round(depto!.median_area))} m²`}
        />
        <ComparisonRow
          label="Precio por m²"
          casaValue={`${formatCurrency(casa!.median_price_m2)}/m²`}
          deptoValue={`${formatCurrency(depto!.median_price_m2)}/m²`}
        />
        <ComparisonRow
          label="Listings"
          casaValue={`${formatNumber(casa!.count)}`}
          deptoValue={`${formatNumber(depto!.count)}`}
        />
      </div>
    </div>
  )
}

function ComparisonRow({
  label,
  casaValue,
  deptoValue,
}: {
  label: string
  casaValue: string
  deptoValue: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "#2563eb" }}>{casaValue}</span>
        <span className="text-[10px] text-slate-300">vs</span>
        <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>{deptoValue}</span>
      </div>
    </div>
  )
}
