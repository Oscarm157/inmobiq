"use client"

import { formatNumber } from "@/lib/utils"
import { useCurrency } from "@/contexts/currency-context"
import { InfoTooltip } from "@/components/info-tooltip"

interface TypeComparisonData {
  type: string
  median_price: number
  median_area: number
  median_price_m2: number
  count: number
}

interface TypeComparisonProps {
  data: TypeComparisonData[]
  zoneName: string
  categoria?: string
}

const CATEGORY_CONFIG: Record<string, {
  types: [string, string]
  labels: Record<string, string>
  colors: Record<string, string>
  title: string
  question: string
}> = {
  residencial: {
    types: ["casa", "departamento"],
    labels: { casa: "Casa", departamento: "Depto" },
    colors: { casa: "#2563eb", departamento: "#7c3aed" },
    title: "Casa vs Departamento",
    question: "Qué conviene más",
  },
  comercial: {
    types: ["local", "oficina"],
    labels: { local: "Local", oficina: "Oficina" },
    colors: { local: "#059669", oficina: "#d97706" },
    title: "Local vs Oficina",
    question: "Qué domina",
  },
}

function buildExample(
  a: TypeComparisonData | undefined,
  b: TypeComparisonData | undefined,
  labels: Record<string, string>,
): string {
  if (a && b && a.count > 0 && b.count > 0) {
    if (a.median_price_m2 > b.median_price_m2) {
      const diff = Math.round(((a.median_price_m2 - b.median_price_m2) / b.median_price_m2) * 100)
      return ` El m² de ${labels[a.type]?.toLowerCase() ?? a.type} cuesta ${diff}% más que el de ${labels[b.type]?.toLowerCase() ?? b.type}.`
    } else if (b.median_price_m2 > a.median_price_m2) {
      const diff = Math.round(((b.median_price_m2 - a.median_price_m2) / a.median_price_m2) * 100)
      return ` El m² de ${labels[b.type]?.toLowerCase() ?? b.type} cuesta ${diff}% más que el de ${labels[a.type]?.toLowerCase() ?? a.type}.`
    }
  }
  return ""
}

export function TypeComparison({ data, zoneName, categoria = "residencial" }: TypeComparisonProps) {
  const { formatPrice } = useCurrency()
  if (!data.length) return null

  const config = CATEGORY_CONFIG[categoria] ?? CATEGORY_CONFIG.residencial
  const [typeA, typeB] = config.types

  const a = data.find((d) => d.type === typeA)
  const b = data.find((d) => d.type === typeB)

  const hasA = a != null && a.count > 0
  const hasB = b != null && b.count > 0

  // Only one type available
  if (hasA && !hasB) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
          {config.title}
        </h4>
        <p className="text-xs text-slate-500 italic">Solo hay {config.labels[typeA]?.toLowerCase() ?? typeA} en esta zona</p>
      </div>
    )
  }
  if (!hasA && hasB) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
          {config.title}
        </h4>
        <p className="text-xs text-slate-500 italic">Solo hay {config.labels[typeB]?.toLowerCase() ?? typeB} en esta zona</p>
      </div>
    )
  }
  if (!hasA && !hasB) return null

  const total = a!.count + b!.count
  const pctA = Math.round((a!.count / total) * 100)
  const pctB = Math.round((b!.count / total) * 100)

  const example = buildExample(a, b, config.labels)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {config.title}
          </h4>
          <InfoTooltip content="Comparación de los dos sub-tipos de propiedad en esta zona. Precio mediano, área mediana y precio por m² calculados con listings activos. La barra superior muestra la proporción de inventario." />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          ¿{config.question} en {zoneName}?{example}
        </p>
      </div>

      {/* Proportion bar */}
      <div className="mb-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div
            className="transition-all duration-500"
            style={{ width: `${pctA}%`, backgroundColor: config.colors[typeA] }}
          />
          <div
            className="transition-all duration-500"
            style={{ width: `${pctB}%`, backgroundColor: config.colors[typeB] }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-bold" style={{ color: config.colors[typeA] }}>
            {config.labels[typeA]} {pctA}%
          </span>
          <span className="text-[10px] font-bold" style={{ color: config.colors[typeB] }}>
            {config.labels[typeB]} {pctB}%
          </span>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-3">
        <ComparisonRow
          label="Precio mediano"
          valueA={formatPrice(a!.median_price)}
          valueB={formatPrice(b!.median_price)}
          colorA={config.colors[typeA]}
          colorB={config.colors[typeB]}
        />
        <ComparisonRow
          label="Área mediana"
          valueA={`${formatNumber(Math.round(a!.median_area))} m²`}
          valueB={`${formatNumber(Math.round(b!.median_area))} m²`}
          colorA={config.colors[typeA]}
          colorB={config.colors[typeB]}
        />
        <ComparisonRow
          label="Precio por m²"
          valueA={`${formatPrice(a!.median_price_m2)}/m²`}
          valueB={`${formatPrice(b!.median_price_m2)}/m²`}
          colorA={config.colors[typeA]}
          colorB={config.colors[typeB]}
        />
        <ComparisonRow
          label="Presencia"
          valueA={pctA >= 50 ? "Dominante" : "Secundario"}
          valueB={pctB >= 50 ? "Dominante" : "Secundario"}
          colorA={config.colors[typeA]}
          colorB={config.colors[typeB]}
        />
      </div>
    </div>
  )
}

function ComparisonRow({
  label,
  valueA,
  valueB,
  colorA,
  colorB,
}: {
  label: string
  valueA: string
  valueB: string
  colorA: string
  colorB: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: colorA }}>{valueA}</span>
        <span className="text-[10px] text-slate-300">vs</span>
        <span className="text-xs font-bold" style={{ color: colorB }}>{valueB}</span>
      </div>
    </div>
  )
}
