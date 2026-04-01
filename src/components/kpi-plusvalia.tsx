import { Icon } from "@/components/icon"
import { SpringCard } from "@/components/motion-wrappers"

interface CompositionItem {
  type: string
  count: number
  pct: number
}

interface KPIComposicionProps {
  composition: CompositionItem[]
  totalListings: number
}

const TYPE_LABELS: Record<string, string> = {
  casa: "Casas",
  departamento: "Deptos",
  terreno: "Terrenos",
  local: "Locales",
  oficina: "Oficinas",
}

const TYPE_COLORS: Record<string, { bar: string; dot: string }> = {
  casa: { bar: "bg-blue-700", dot: "bg-blue-700" },
  departamento: { bar: "bg-rose-600", dot: "bg-rose-600" },
  terreno: { bar: "bg-emerald-600", dot: "bg-emerald-600" },
  local: { bar: "bg-amber-500", dot: "bg-amber-500" },
  oficina: { bar: "bg-violet-600", dot: "bg-violet-600" },
}

export function KPIComposicion({ composition, totalListings }: KPIComposicionProps) {
  const sorted = [...composition].sort((a, b) => b.pct - a.pct)
  const top = sorted[0]

  return (
    <SpringCard>
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 card-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <Icon name="donut_small" className="text-emerald-600" />
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase text-slate-500 tracking-widest">
            Composición
          </p>
          <h4 className="text-2xl font-black">
            {top ? `${TYPE_LABELS[top.type] ?? top.type} ${top.pct}%` : "Sin datos"}
          </h4>
        </div>
      </div>

      {totalListings > 0 && (
        <div className="space-y-2.5">
          {sorted.filter(s => s.pct > 0).map((item) => {
            const colors = TYPE_COLORS[item.type] ?? { bar: "bg-slate-300", dot: "bg-slate-300" }
            return (
              <div key={item.type} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                <span className="text-xs font-bold text-slate-600 w-16 shrink-0">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bar}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-700 w-10 text-right">
                  {item.pct}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </SpringCard>
  )
}
