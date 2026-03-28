import { Icon } from "@/components/icon"

interface UpdatedAtProps {
  date: string | null
  className?: string
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffMs = now - then

  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`

  const days = Math.floor(hours / 24)
  if (days === 1) return "ayer"
  if (days < 7) return `hace ${days} días`

  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

export function UpdatedAt({ date, className = "" }: UpdatedAtProps) {
  if (!date) return null

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 ${className}`}>
      <Icon name="update" className="text-[11px]" />
      {formatRelative(date)}
    </span>
  )
}
