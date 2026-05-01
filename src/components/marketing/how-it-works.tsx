"use client"

import { motion } from "motion/react"

const steps = [
  {
    n: "01",
    title: "Listings de portales públicos",
    body: "Capturamos precios, áreas y tipos desde Inmuebles24, Lamudi, Vivanuncios y Mercado Libre.",
  },
  {
    n: "02",
    title: "Validación local",
    body: "Cada listing se valida contra rangos por categoría y zona. Los outliers se filtran con IQR 2.0.",
  },
  {
    n: "03",
    title: "Cruce con demografía INEGI",
    body: "Censo 2020 por AGEB: ingreso, internet, auto, seguridad social. 30 zonas canónicas mapeadas.",
  },
]

const stats = [
  { value: "30", label: "zonas canónicas en Tijuana" },
  { value: "500+", label: "variables INEGI por AGEB" },
  { value: "Semanal", label: "snapshots de tendencias por zona" },
]

export function HowItWorks() {
  return (
    <section
      id="datos"
      className="relative overflow-hidden"
      style={{
        scrollMarginTop: "72px",
        background:
          "linear-gradient(180deg, #0b1326 0%, #0f172a 60%, #0b1326 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 10%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 15% 30%, rgba(59,130,246,0.16) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 60% 90%, rgba(99,102,241,0.10) 0%, transparent 65%)",
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="max-w-[60ch]">
          <p className="m-eyebrow" style={{ color: "#94a3b8" }}>
            Cómo funciona la data
          </p>
          <h2
            className="m-h2 mt-4"
            style={{ color: "#f1f5f9" }}
          >
            Listings públicos, validación por zona, cruce con censo.
          </h2>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.08 }}
              className="rounded-[20px] p-7 md:p-8 backdrop-blur"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  color: "rgba(16, 185, 129, 0.85)",
                  fontWeight: 500,
                }}
              >
                {s.n}
              </p>
              <h3
                className="m-h3 mt-5"
                style={{ color: "#f1f5f9" }}
              >
                {s.title}
              </h3>
              <p
                className="mt-3"
                style={{
                  fontSize: "15px",
                  lineHeight: "1.55",
                  color: "#94a3b8",
                  letterSpacing: "-0.005em",
                }}
              >
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 pt-10 border-t"
          style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <p
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.25rem)",
                  lineHeight: "1",
                  letterSpacing: "-0.03em",
                  color: "#f1f5f9",
                }}
              >
                {s.value}
              </p>
              <p
                className="mt-2"
                style={{ color: "#94a3b8", fontSize: "14px" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
