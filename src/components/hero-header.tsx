"use client"

import { motion } from "motion/react"
import { Icon } from "@/components/icon"
import type { ReactNode } from "react"

/* ─── Animation Variants ─── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
}

const slideIn = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
}

/* ─── Accent Palette ─── */

type Accent = "blue" | "red" | "emerald" | "violet" | "amber" | "teal"

const palette: Record<
  Accent,
  { orb1: string; orb2: string; orb3: string; badge: string; ring: string }
> = {
  blue: {
    orb1: "bg-blue-500/[0.09]",
    orb2: "bg-cyan-500/[0.06]",
    orb3: "bg-indigo-500/[0.04]",
    badge: "text-blue-300",
    ring: "border-blue-400/[0.07]",
  },
  red: {
    orb1: "bg-red-500/[0.09]",
    orb2: "bg-amber-500/[0.06]",
    orb3: "bg-rose-500/[0.04]",
    badge: "text-red-300",
    ring: "border-red-400/[0.07]",
  },
  emerald: {
    orb1: "bg-emerald-500/[0.09]",
    orb2: "bg-teal-500/[0.06]",
    orb3: "bg-green-500/[0.04]",
    badge: "text-emerald-300",
    ring: "border-emerald-400/[0.07]",
  },
  violet: {
    orb1: "bg-violet-500/[0.09]",
    orb2: "bg-indigo-500/[0.06]",
    orb3: "bg-purple-500/[0.04]",
    badge: "text-violet-300",
    ring: "border-violet-400/[0.07]",
  },
  amber: {
    orb1: "bg-amber-500/[0.09]",
    orb2: "bg-yellow-500/[0.06]",
    orb3: "bg-orange-500/[0.04]",
    badge: "text-amber-300",
    ring: "border-amber-400/[0.07]",
  },
  teal: {
    orb1: "bg-teal-500/[0.09]",
    orb2: "bg-cyan-500/[0.06]",
    orb3: "bg-sky-500/[0.04]",
    badge: "text-teal-300",
    ring: "border-teal-400/[0.07]",
  },
}

/* ─── Types ─── */

export interface HeroHeaderBadge {
  label: string
  variant?: "neutral" | "green" | "red" | "blue" | "amber"
}

export interface HeroHeaderProps {
  /** Primary badge label */
  badge: string
  /** Material Symbol icon inside the badge */
  badgeIcon?: string
  /** Main heading — string or ReactNode for gradient text */
  title: ReactNode
  /** Description text below the title */
  subtitle?: string
  /** Accent color controlling orbs, rings, and badge tint */
  accent?: Accent
  /** Slot for action buttons (right side on desktop, below on mobile) */
  actions?: ReactNode
  /** Inline metadata rendered after the primary badge row */
  meta?: ReactNode
  /** Right column content (feature cards, stats). Enables 2-col layout on lg */
  children?: ReactNode
  /** Additional badges shown as glass pills */
  badges?: HeroHeaderBadge[]
  /** Compact mode — reduced padding, no decorative rings, single column */
  compact?: boolean
}

/* ─── Badge variant colors (glass on dark) ─── */

const badgeVariantClass: Record<string, string> = {
  neutral: "bg-white/[0.07] text-slate-300",
  green: "bg-emerald-400/[0.12] text-emerald-300",
  red: "bg-red-400/[0.12] text-red-300",
  blue: "bg-blue-400/[0.12] text-blue-300",
  amber: "bg-amber-400/[0.12] text-amber-300",
}

/* ─── Component ─── */

export function HeroHeader({
  badge,
  badgeIcon,
  title,
  subtitle,
  accent = "blue",
  actions,
  meta,
  children,
  badges,
  compact = false,
}: HeroHeaderProps) {
  const p = palette[accent]
  const hasRightColumn = !!children && !compact

  return (
    <div
      className={`relative overflow-visible rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${
        compact ? "p-6 md:p-8" : "p-8 md:p-10 lg:p-12"
      }`}
    >
      {/* ── Atmospheric layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
        {/* Gradient orbs — accent-tinted */}
        <div className={`absolute -top-20 -right-20 w-80 h-80 ${p.orb1} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 -left-16 w-64 h-64 ${p.orb2} rounded-full blur-3xl`} />
        <div className={`absolute top-1/2 left-1/3 w-44 h-44 ${p.orb3} rounded-full blur-3xl -translate-y-1/2`} />

        {/* Decorative rings — only in non-compact, hidden on mobile */}
        {!compact && (
          <>
            <div
              className={`absolute top-1/2 right-6 w-[300px] h-[300px] rounded-full border ${p.ring} hidden lg:block`}
              style={{ transform: "translateY(-50%) rotate(12deg)" }}
            />
            <div
              className="absolute top-1/2 right-12 w-[220px] h-[220px] rounded-full border border-dashed border-white/[0.03] hidden lg:block"
              style={{ transform: "translateY(-50%) rotate(-8deg)" }}
            />
          </>
        )}

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className={`relative ${
          hasRightColumn
            ? "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-center"
            : ""
        }`}
      >
        {/* Left column */}
        <div>
          {/* Badge row */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.08] ${p.badge} text-[10px] font-bold rounded-full tracking-widest uppercase backdrop-blur-sm border border-white/[0.06]`}
            >
              {badgeIcon && <Icon name={badgeIcon} className="text-xs" />}
              {badge}
            </span>

            {badges?.map((b) => (
              <span
                key={b.label}
                className={`inline-flex px-2.5 py-1 ${
                  badgeVariantClass[b.variant ?? "neutral"]
                } text-[10px] font-bold rounded-full tracking-widest uppercase backdrop-blur-sm border border-white/[0.04]`}
              >
                {b.label}
              </span>
            ))}

            {meta}
          </motion.div>

          {/* Title */}
          <motion.h2
            variants={fadeUp}
            className={`font-extrabold tracking-tight text-white leading-[1.1] ${
              compact
                ? "text-2xl sm:text-3xl mb-2"
                : "text-3xl sm:text-4xl md:text-[2.75rem] mb-3"
            }`}
          >
            {title}
          </motion.h2>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              variants={fadeUp}
              className={`text-slate-300 font-medium max-w-lg leading-relaxed ${
                compact ? "text-sm mb-4" : "text-[15px] mb-6"
              }`}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Actions */}
          {actions && (
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              {actions}
            </motion.div>
          )}
        </div>

        {/* Right column — only when children provided and not compact */}
        {hasRightColumn && (
          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
            }}
            initial="hidden"
            animate="visible"
            className="hidden lg:flex flex-col gap-3"
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

/* ─── Helper: HeroStat — for right-column metric display ─── */

export function HeroStat({
  icon,
  label,
  value,
  color = "blue",
}: {
  icon: string
  label: string
  value: ReactNode
  color?: "blue" | "emerald" | "amber" | "red" | "violet" | "teal"
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-kpi-icon-blue", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-kpi-icon-green", text: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-kpi-icon-amber", text: "text-amber-600 dark:text-amber-400" },
    red: { bg: "bg-kpi-icon-red", text: "text-red-600 dark:text-red-400" },
    violet: { bg: "bg-kpi-icon-violet", text: "text-violet-600 dark:text-violet-400" },
    teal: { bg: "bg-kpi-icon-green", text: "text-teal-600 dark:text-teal-400" },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <motion.div
      variants={slideIn}
      whileHover={{ x: -4, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      className="flex items-center gap-3.5 bg-white/[0.05] backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/[0.06] cursor-default"
    >
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon name={icon} className={`${c.text} text-lg`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-base font-extrabold text-white leading-tight">{value}</p>
      </div>
    </motion.div>
  )
}

/* ─── Helper: HeroFeature — for right-column feature highlights ─── */

export function HeroFeature({
  icon,
  label,
  desc,
  color = "blue",
}: {
  icon: string
  label: string
  desc: string
  color?: "blue" | "emerald" | "amber" | "red" | "violet" | "teal"
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-kpi-icon-blue", text: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-kpi-icon-green", text: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-kpi-icon-amber", text: "text-amber-600 dark:text-amber-400" },
    red: { bg: "bg-kpi-icon-red", text: "text-red-600 dark:text-red-400" },
    violet: { bg: "bg-kpi-icon-violet", text: "text-violet-600 dark:text-violet-400" },
    teal: { bg: "bg-kpi-icon-green", text: "text-teal-600 dark:text-teal-400" },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <motion.div
      variants={slideIn}
      whileHover={{ x: -4, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      className="flex items-center gap-3.5 bg-white/[0.05] backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/[0.06] cursor-default"
    >
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon name={icon} className={`${c.text} text-lg`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{label}</p>
        <p className="text-xs text-slate-400 leading-snug mt-0.5">{desc}</p>
      </div>
    </motion.div>
  )
}
