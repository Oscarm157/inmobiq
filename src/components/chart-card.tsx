import type { ReactNode } from "react"

interface ChartCardProps {
  /** Chart title */
  title?: string
  /** Small subtitle below title */
  subtitle?: string
  /** Optional slot for info tooltip or action buttons (right-aligned) */
  headerAction?: ReactNode
  /** The chart content */
  children: ReactNode
  /** Additional classes for the outer container */
  className?: string
}

export function ChartCard({ title, subtitle, headerAction, children, className = "" }: ChartCardProps) {
  return (
    <div className={`bg-surface rounded-xl card-shadow overflow-hidden ${className}`}>
      {(title || headerAction) && (
        <div className="flex items-start justify-between px-5 pt-5 pb-2">
          <div>
            {title && (
              <h4 className="text-sm font-bold text-foreground">{title}</h4>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </div>
  )
}
