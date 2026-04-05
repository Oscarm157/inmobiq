import type { ReactNode } from "react"

interface SectionHeadingProps {
  title: string
  subtitle?: string
  /** Optional right-side content (e.g. "Ver todas" link) */
  action?: ReactNode
  /** Size variant */
  size?: "default" | "lg"
}

export function SectionHeading({ title, subtitle, action, size = "default" }: SectionHeadingProps) {
  return (
    <div className={`flex items-center justify-between ${size === "lg" ? "mb-6" : "mb-4"}`}>
      <div>
        <h3
          className={
            size === "lg"
              ? "text-2xl font-black tracking-tight text-foreground"
              : "text-xl font-black tracking-tight text-foreground"
          }
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
