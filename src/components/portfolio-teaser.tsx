import { Icon } from "@/components/icon"
import type { PortfolioPreset } from "@/types/database"
import Link from "next/link"

interface PortfolioTeaserProps {
  presets: PortfolioPreset[]
}

const presetIcons: Record<string, string> = {
  conservador: "savings",
  balanceado: "balance",
  agresivo: "rocket_launch",
}

const presetColors: Record<string, { bg: string; text: string; border: string }> = {
  conservador: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  balanceado: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  agresivo: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
}

export function PortfolioTeaser({ presets }: PortfolioTeaserProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {presets.map((preset) => {
        const colors = presetColors[preset.risk_level] ?? presetColors.balanceado
        const icon = presetIcons[preset.risk_level] ?? "analytics"

        return (
          <Link
            key={preset.id}
            href="/portafolio"
            className={`${colors.bg} border ${colors.border} rounded-xl p-5 hover:scale-[1.02] transition-all`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${colors.text} bg-white/60 dark:bg-white/10 flex items-center justify-center`}>
                <Icon name={icon} className="text-lg" />
              </div>
              <div>
                <p className="text-sm font-bold">{preset.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{preset.allocations.length} zonas</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{preset.description}</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Retorno</p>
                <p className={`text-lg font-black ${colors.text}`}>+{preset.expected_return_pct}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Riesgo</p>
                <p className="text-lg font-black text-slate-600 dark:text-slate-300">{preset.risk_score}<span className="text-xs text-slate-400">/100</span></p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
