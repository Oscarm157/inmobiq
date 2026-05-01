"use client"

import Link from "next/link"
import { motion } from "motion/react"

const tiers = [
  {
    name: "Explorador",
    price: "Gratis",
    suffix: "",
    description: "Para conocer la herramienta antes de comprometerse.",
    features: [
      "3 valuaciones al mes con Brújula",
      "3 exportaciones de reporte al mes",
      "Vista parcial del mercado",
    ],
    cta: { label: "Crear cuenta", href: "/login?mode=register" },
    highlight: false,
  },
  {
    name: "Pro",
    price: "$499",
    suffix: "MXN/mes",
    description: "Brokers individuales que cierran 3 a 8 transacciones por mes.",
    features: [
      "Brújula ilimitado",
      "Exportaciones ilimitadas",
      "Demografía INEGI por zona",
      "Alertas de precio",
      "Análisis de riesgo completo",
    ],
    cta: { label: "Empezar Pro", href: "/login?mode=register&plan=pro" },
    highlight: true,
  },
  {
    name: "Empresarial",
    price: "$1,499",
    suffix: "MXN/mes",
    description: "Inmobiliarias de 5 a 20 agentes con flujo compartido.",
    features: [
      "Todo lo de Pro",
      "Hasta 5 usuarios incluidos",
      "API de consulta",
      "Reportes automatizados",
      "Pipeline de desarrollos visible",
      "Onboarding personalizado",
    ],
    cta: { label: "Hablar con ventas", href: "mailto:oscar.amayoral@gmail.com?subject=Inmobiq%20Empresarial" },
    highlight: false,
  },
]

export function PricingCards() {
  return (
    <section
      id="precios"
      className="bg-[var(--m-canvas-soft)]"
      style={{ scrollMarginTop: "72px" }}
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-[60ch]">
          <p className="m-eyebrow">Precios</p>
          <h2 className="m-h2 mt-4">Tres planes. Sin contratos largos.</h2>
          <p className="m-body-lg mt-5 max-w-[48ch]">
            Empieza gratis con tres valuaciones al mes. Pasa a Pro cuando lo necesites.
            Cancela en cualquier momento.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.08 }}
              className={`relative flex flex-col rounded-[20px] p-8 md:p-9 border overflow-hidden ${
                t.highlight
                  ? "text-[var(--m-canvas)] border-[var(--m-ink)]"
                  : "bg-[var(--m-canvas)] border-[var(--m-gray-4)]"
              }`}
              style={
                t.highlight
                  ? {
                      background:
                        "linear-gradient(165deg, #0f172a 0%, #1e293b 60%, #0b1326 100%)",
                    }
                  : undefined
              }
            >
              {t.highlight && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 50% at 100% 0%, rgba(16,185,129,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(59,130,246,0.14) 0%, transparent 60%)",
                    }}
                  />
                  <span
                    className="absolute -top-3 left-8 inline-flex px-3 py-1 rounded-full bg-[var(--m-accent)] text-[var(--m-ink)]"
                    style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}
                  >
                    Más elegido
                  </span>
                </>
              )}

              <div className="flex items-baseline justify-between">
                <h3 className={`m-h3 ${t.highlight ? "text-[var(--m-canvas)]" : "text-[var(--m-ink)]"}`}>
                  {t.name}
                </h3>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span
                  className={t.highlight ? "text-[var(--m-canvas)]" : "text-[var(--m-ink)]"}
                  style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em" }}
                >
                  {t.price}
                </span>
                {t.suffix && (
                  <span className={`text-[13px] ${t.highlight ? "text-[var(--m-gray-3)]" : "text-[var(--m-gray-1)]"}`}>
                    {t.suffix}
                  </span>
                )}
              </div>

              <p
                className={`mt-4 text-[14px] ${t.highlight ? "text-[var(--m-gray-3)]" : "text-[var(--m-gray-1)]"}`}
                style={{ letterSpacing: "-0.005em", lineHeight: "1.5" }}
              >
                {t.description}
              </p>

              <ul className="mt-6 flex flex-col gap-2.5 flex-1">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 text-[14px] ${
                      t.highlight ? "text-[var(--m-canvas)]" : "text-[var(--m-ink-soft)]"
                    }`}
                    style={{ letterSpacing: "-0.005em", lineHeight: "1.45" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      className="mt-1 shrink-0"
                      aria-hidden
                    >
                      <path
                        d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
                        fill="none"
                        stroke={t.highlight ? "rgb(16,185,129)" : "rgb(16,185,129)"}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={t.cta.href}
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium transition-all ${
                  t.highlight
                    ? "bg-[var(--m-canvas)] text-[var(--m-ink)] hover:translate-y-[-1px]"
                    : "bg-[var(--m-ink)] text-[var(--m-canvas)] hover:translate-y-[-1px]"
                }`}
                style={{ letterSpacing: "-0.005em" }}
              >
                {t.cta.label}
                <span aria-hidden>→</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <p
          className="mt-10 text-center text-[13px] text-[var(--m-gray-2)]"
          style={{ letterSpacing: "-0.005em" }}
        >
          Precios en pesos mexicanos. IVA incluido. Cancela cuando quieras.
        </p>
      </div>
    </section>
  )
}
