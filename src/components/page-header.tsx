import type { ReactNode } from "react"

export interface PageHeaderBadge {
  label: string
  variant?: "neutral" | "green" | "red" | "blue" | "amber"
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  badges?: PageHeaderBadge[]
  /** Slot for action buttons (filters, export, etc.) */
  actions?: ReactNode
  /** Extra content between badges and title (e.g. UpdatedAt) */
  meta?: ReactNode
}

const badgeClasses: Record<string, string> = {
  neutral: "bg-badge-neutral-bg text-badge-neutral-text",
  green: "bg-badge-green-bg text-badge-green-text",
  red: "bg-badge-red-bg text-badge-red-text",
  blue: "bg-badge-blue-bg text-badge-blue-text",
  amber: "bg-badge-amber-bg text-badge-amber-text",
}

export function PageHeader({ title, subtitle, badges, actions, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-1">
        {(badges || meta) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {badges?.map((badge) => (
              <span
                key={badge.label}
                className={`px-3 py-1 text-[10px] font-bold rounded-full tracking-widest uppercase ${badgeClasses[badge.variant ?? "neutral"]}`}
              >
                {badge.label}
              </span>
            ))}
            {meta}
          </div>
        )}
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground max-w-xl font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3 items-start">{actions}</div>}
    </div>
  )
}
