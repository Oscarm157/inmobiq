"use client"

import { motion } from "motion/react"

const zones = [
  { name: "Hipódromo", price: "$42,150", trend: "+6.1%", up: true },
  { name: "Zona Río", price: "$38,500", trend: "+3.8%", up: true },
  { name: "Centro", price: "$34,820", trend: "+4.2%", up: true },
  { name: "Playas de Tijuana", price: "$31,950", trend: "−0.5%", up: false },
  { name: "Otay", price: "$26,400", trend: "+2.3%", up: true },
]

export function ZoneListMini() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-8 rounded-[16px] overflow-hidden"
      style={{
        background: "var(--m-canvas)",
        border: "1px solid var(--m-gray-4)",
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: "1px solid var(--m-gray-4)",
          background: "var(--m-canvas-soft)",
        }}
      >
        <span className="m-eyebrow" style={{ fontSize: "10px" }}>
          Top zonas · venta residencial
        </span>
        <span
          style={{ color: "var(--m-gray-2)", fontSize: "10px", letterSpacing: "0.06em" }}
        >
          $/m²
        </span>
      </div>
      <ul>
        {zones.map((z, i) => (
          <li
            key={z.name}
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: i < zones.length - 1 ? "1px solid var(--m-gray-4)" : "none",
            }}
          >
            <span
              className="text-[var(--m-ink)]"
              style={{ fontSize: "14px", letterSpacing: "-0.005em" }}
            >
              {z.name}
            </span>
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontSize: "14px",
                  letterSpacing: "-0.01em",
                  color: "var(--m-ink-soft)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {z.price}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: z.up ? "var(--m-accent-ink)" : "#dc2626",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: "44px",
                  textAlign: "right",
                }}
              >
                {z.trend}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
