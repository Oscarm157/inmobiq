"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { getAllDemographics, getNseColor } from "@/lib/data/demographics"
import type { ZoneMetrics } from "@/types/database"

interface DemographicComparisonProps {
  zones: ZoneMetrics[]
  colors: string[]
}

export function DemographicComparison({ zones, colors }: DemographicComparisonProps) {
  const allDemo = getAllDemographics()
  const zoneDemo = zones
    .map((z) => ({
      zone: z,
      demo: allDemo.find((d) => d.zone_slug === z.zone_slug),
    }))
    .filter((z) => z.demo && z.demo.ageb_count > 0)

  if (zoneDemo.length === 0) return null

  // Radar chart dimensions (all normalized 0-100)
  const dimensions = ["NSE", "Internet", "Auto", "Seg. Social", "Part. Económica", "Edad"]

  const data = dimensions.map((dim) => {
    const point: Record<string, string | number> = { dimension: dim }
    zoneDemo.forEach(({ zone, demo }) => {
      if (!demo) return
      switch (dim) {
        case "NSE":
          point[zone.zone_slug] = demo.nse_score
          break
        case "Internet":
          point[zone.zone_slug] = Math.round(demo.pct_internet)
          break
        case "Auto":
          point[zone.zone_slug] = Math.round(demo.pct_car)
          break
        case "Seg. Social":
          point[zone.zone_slug] = Math.round(demo.pct_social_security)
          break
        case "Part. Económica":
          point[zone.zone_slug] = Math.round(demo.economic_participation)
          break
        case "Edad":
          // Normalize: 20 = young (score 100), 45 = old (score 0)
          point[zone.zone_slug] = Math.round(Math.max(0, Math.min(100, (45 - demo.median_age) / 25 * 100)))
          break
      }
    })
    return point
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
          Perfil Demográfico Comparado
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          6 dimensiones del Censo 2020 normalizadas (0-100) para comparar perfiles socioeconómicos
        </p>
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(100,116,139,0.2)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-slate-600 dark:text-slate-400"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "currentColor" }}
            className="text-slate-400"
          />
          {zoneDemo.map(({ zone }, i) => (
            <Radar
              key={zone.zone_slug}
              name={zone.zone_name}
              dataKey={zone.zone_slug}
              stroke={colors[i]}
              fill={colors[i]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: "12px" }} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Indicador
              </th>
              {zoneDemo.map(({ zone }, i) => (
                <th
                  key={zone.zone_slug}
                  className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: colors[i] }}
                >
                  {zone.zone_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <DemoTableRow
              label="NSE"
              values={zoneDemo.map(({ demo }) => {
                const c = getNseColor(demo!.nse_label)
                return `${demo!.nse_label} (${demo!.nse_score})`
              })}
              highlight={zoneDemo.map(({ demo }) => demo!.nse_score)}
              higherIsBetter
            />
            <DemoTableRow
              label="Población"
              values={zoneDemo.map(({ demo }) => demo!.population.toLocaleString("es-MX"))}
              highlight={zoneDemo.map(({ demo }) => demo!.population)}
              higherIsBetter
            />
            <DemoTableRow
              label="Edad mediana"
              values={zoneDemo.map(({ demo }) => `${demo!.median_age} años`)}
              highlight={zoneDemo.map(({ demo }) => demo!.median_age)}
            />
            <DemoTableRow
              label="Internet"
              values={zoneDemo.map(({ demo }) => `${demo!.pct_internet}%`)}
              highlight={zoneDemo.map(({ demo }) => demo!.pct_internet)}
              higherIsBetter
            />
            <DemoTableRow
              label="Automóvil"
              values={zoneDemo.map(({ demo }) => `${demo!.pct_car}%`)}
              highlight={zoneDemo.map(({ demo }) => demo!.pct_car)}
              higherIsBetter
            />
            <DemoTableRow
              label="Seg. Social"
              values={zoneDemo.map(({ demo }) => `${demo!.pct_social_security}%`)}
              highlight={zoneDemo.map(({ demo }) => demo!.pct_social_security)}
              higherIsBetter
            />
            <DemoTableRow
              label="Part. Económica"
              values={zoneDemo.map(({ demo }) => `${demo!.economic_participation}%`)}
              highlight={zoneDemo.map(({ demo }) => demo!.economic_participation)}
              higherIsBetter
            />
            <DemoTableRow
              label="Hogares"
              values={zoneDemo.map(({ demo }) => demo!.households.toLocaleString("es-MX"))}
              highlight={zoneDemo.map(({ demo }) => demo!.households)}
              higherIsBetter
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DemoTableRow({
  label,
  values,
  highlight,
  higherIsBetter = false,
}: {
  label: string
  values: string[]
  highlight: number[]
  higherIsBetter?: boolean
}) {
  const best = higherIsBetter ? Math.max(...highlight) : Math.min(...highlight)

  return (
    <tr>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{label}</td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`px-4 py-3 text-right font-semibold ${
            highlight[i] === best
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {val}
          {highlight[i] === best && <span className="ml-1 text-xs">★</span>}
        </td>
      ))}
    </tr>
  )
}
