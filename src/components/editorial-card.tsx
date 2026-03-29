import { Icon } from "@/components/icon"

interface EditorialCardProps {
  zoneName: string
  mainText: string
  quote: string
}

export function EditorialCard({ zoneName, mainText, quote }: EditorialCardProps) {
  return (
    <div className="bg-slate-50 rounded-xl p-8 border border-slate-200/60">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-6">
        Análisis de Zona
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p
            className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium"
            style={{ textAlign: "justify" }}
          >
            <span
              className="text-blue-700 dark:text-blue-400"
              style={{
                float: "left",
                fontSize: "4rem",
                lineHeight: 0.8,
                paddingTop: 4,
                paddingRight: 8,
                fontWeight: 800,
              }}
            >
              {mainText.charAt(0)}
            </span>
            {mainText.slice(1)}
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed italic border-l-2 border-blue-300 pl-4">
            &ldquo;{quote}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Icon name="analytics" className="text-slate-800" />
            </div>
            <div>
              <p className="text-xs font-bold">Análisis de Mercado AI</p>
              <p className="text-[10px] text-slate-500">
                Inmobiq Intelligence Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
