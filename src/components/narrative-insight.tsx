import { Icon } from "@/components/icon"

interface NarrativeInsightProps {
  title: string
  body: string
  highlight?: string
  icon?: string
}

export function NarrativeInsight({ title, body, highlight, icon = "insights" }: NarrativeInsightProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-blue-900/50">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center flex-shrink-0">
          <Icon name={icon} className="text-xl" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
          {highlight && (
            <p className="text-sm font-semibold text-slate-800 dark:text-blue-400 mt-3 flex items-center gap-1.5">
              <Icon name="trending_up" className="text-sm" />
              {highlight}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
