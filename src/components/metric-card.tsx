"use client"

import { Icon } from "@/components/icon"
import { SpringCard } from "@/components/motion-wrappers"
import type { ReactNode } from "react"

type IconBgColor = "default" | "blue" | "green" | "amber" | "red" | "indigo" | "violet"

const iconBgClasses: Record<IconBgColor, string> = {
  default: "bg-kpi-icon",
  blue: "bg-kpi-icon-blue",
  green: "bg-kpi-icon-green",
  amber: "bg-kpi-icon-amber",
  red: "bg-kpi-icon-red",
  indigo: "bg-kpi-icon-indigo",
  violet: "bg-kpi-icon-violet",
}

const iconTextClasses: Record<IconBgColor, string> = {
  default: "text-foreground",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  violet: "text-violet-600 dark:text-violet-400",
}

interface MetricCardProps {
  /** Material icon name */
  icon: string
  /** Icon background color variant */
  iconColor?: IconBgColor
  /** Small uppercase label */
  label: string
  /** Main value to display */
  value: ReactNode
  /** Optional subtitle below label */
  subtitle?: string
  /** Optional footer content (trend, timestamp, etc.) */
  footer?: ReactNode
  /** Optional body content below value (sparkline, bars, etc.) */
  children?: ReactNode
}

export function MetricCard({
  icon,
  iconColor = "default",
  label,
  value,
  subtitle,
  footer,
  children,
}: MetricCardProps) {
  return (
    <SpringCard>
      <div className="bg-surface rounded-xl p-5 card-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${iconBgClasses[iconColor]}`}>
            <Icon name={icon} className={iconTextClasses[iconColor]} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              {label}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            <h4 className="text-2xl font-black text-foreground">{value}</h4>
          </div>
        </div>
        {children}
        {footer && (
          <div className="mt-4 flex items-center justify-between text-xs font-bold">
            {footer}
          </div>
        )}
      </div>
    </SpringCard>
  )
}
