"use client"

import type { ValuationVerdict } from "@/types/database"
import { Icon } from "@/components/icon"

const VERDICT_CONFIG: Record<ValuationVerdict, { label: string; color: string; bg: string; border: string; icon: string }> = {
  muy_barata: {
    label: "Muy barata",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "trending_down",
  },
  barata: {
    label: "Barata",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-800",
    icon: "thumb_up",
  },
  precio_justo: {
    label: "Precio justo",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: "balance",
  },
  cara: {
    label: "Cara",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    icon: "trending_up",
  },
  muy_cara: {
    label: "Muy cara",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: "warning",
  },
}

interface Props {
  verdict: ValuationVerdict
  score: number
  zoneName: string
}

export function VerdictBanner({ verdict, score, zoneName }: Props) {
  const cfg = VERDICT_CONFIG[verdict]

  return (
    <div className={`rounded-xl p-6 md:p-8 border ${cfg.bg} ${cfg.border}`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Score circle */}
        <div className={`w-24 h-24 rounded-full border-4 ${cfg.border} flex items-center justify-center flex-shrink-0`}>
          <span className={`text-3xl font-black ${cfg.color}`}>{score}</span>
        </div>

        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <Icon name={cfg.icon} className={`text-2xl ${cfg.color}`} />
            <h2 className={`text-2xl font-extrabold ${cfg.color}`}>{cfg.label}</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Score {score}/100 en {zoneName}
          </p>
        </div>
      </div>
    </div>
  )
}
