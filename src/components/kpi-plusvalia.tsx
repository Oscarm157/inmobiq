import { Icon } from "@/components/icon"

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

const TYPE_COLORS: Record<string, string> = {
  casa: "bg-blue-500",
  departamento: "bg-indigo-500",
  terreno: "bg-amber-500",
  local: "bg-emerald-500",
  oficina: "bg-rose-500",
}

export function KPIComposicion({ composition, totalListings }: KPIComposicionProps) {
  const top3 = [...composition].sort((a, b) => b.count - a.count).slice(0, 3)

  return (
    <div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <Icon name="donut_small" className="text-emerald-600" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Composición
          </p>
          <h4 className="text-2xl font-black">
            {totalListings > 0 ? `${totalListings} props` : "Sin datos"}
          </h4>
        </div>
      </div>

      {/* Mini bar */}
      {totalListings > 0 && (
        <div className="space-y-2">
          <div className="flex h-2.5 w-full rounded-full overflow-hidden">
            {composition.map((item) => (
              <div
                key={item.type}
                className={`${TYPE_COLORS[item.type] ?? "bg-slate-300"}`}
                style={{ width: `${item.pct}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {top3.map((item) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[item.type] ?? "bg-slate-300"}`} />
                <span className="text-[10px] font-bold text-slate-600">
                  {TYPE_LABELS[item.type] ?? item.type} {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
