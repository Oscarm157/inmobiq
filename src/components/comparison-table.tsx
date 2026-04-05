interface ComparisonRow {
  label: string
  zona: string
  ciudad: string
}

interface ComparisonTableProps {
  zoneName: string
  rows: ComparisonRow[]
}

export function ComparisonTable({ zoneName, rows }: ComparisonTableProps) {
  return (
    <div className="bg-surface rounded-xl card-shadow p-6">
      <h4 className="text-sm font-black uppercase mb-4 tracking-tighter">
        Rendimiento vs Crecimiento
      </h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-semibold text-slate-500">Métrica</span>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {zoneName}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Ciudad
            </span>
          </div>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs font-bold">{row.label}</span>
            <div className="flex gap-10">
              <span className="text-xs font-bold text-slate-800">
                {row.zona}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {row.ciudad}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
