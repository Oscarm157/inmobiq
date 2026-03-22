"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface OpportunityData {
  zone_name: string
  zone_slug: string
  total: number
  price_score: number
  density_score: number
  digital_score: number
  economic_score: number
}

interface OpportunityIndexChartProps {
  data: OpportunityData[]
}

function getScoreColor(score: number): string {
  if (score >= 65) return "#10b981" // emerald-500
  if (score >= 50) return "#22c55e" // green-500
  if (score >= 40) return "#eab308" // yellow-500
  if (score >= 30) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload as OpportunityData
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-black text-slate-800 dark:text-white mb-2">{d.zone_name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Precio (bajo=mejor)</span>
          <span className="font-bold">{d.price_score.toFixed(1)}/25</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Densidad Poblacional</span>
          <span className="font-bold">{d.density_score.toFixed(1)}/25</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Conectividad Digital</span>
          <span className="font-bold">{d.digital_score.toFixed(1)}/25</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Fuerza Económica</span>
          <span className="font-bold">{d.economic_score.toFixed(1)}/25</span>
        </div>
        <div className="flex justify-between gap-6 pt-1 border-t border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-300 font-bold">Total</span>
          <span className="font-black text-emerald-600">{d.total}/100</span>
        </div>
      </div>
    </div>
  )
}

export function OpportunityIndexChart({ data }: OpportunityIndexChartProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
            Índice de Oportunidad
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Score compuesto: precio bajo + densidad poblacional + conectividad + fuerza económica
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          0–100
        </span>
      </div>

      <div style={{ height: Math.max(300, sorted.length * 28 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="zone_name"
              width={140}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={18} label={{ position: "right", fontSize: 11, fontWeight: 700, fill: "#475569" }}>
              {sorted.map((entry, i) => (
                <Cell key={i} fill={getScoreColor(entry.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-[10px] text-slate-400">Alta (&ge;65)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
          <span className="text-[10px] text-slate-400">Media (40–64)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-[10px] text-slate-400">Baja (&lt;40)</span>
        </div>
      </div>
    </div>
  )
}
