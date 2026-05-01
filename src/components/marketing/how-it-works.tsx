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

export function HowItWorks() {
  return (
    <section
      id="datos"
      className="bg-[var(--m-canvas)]"
      style={{ scrollMarginTop: "72px" }}
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-[60ch]">
          <p className="m-eyebrow">Cómo funciona la data</p>
          <h2 className="m-h2 mt-4">
            Listings públicos, validación por zona, cruce con censo.
          </h2>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--m-gray-4)] rounded-[20px] overflow-hidden">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.08 }}
              className="bg-[var(--m-canvas)] p-8 md:p-10"
            >
              <p className="text-[var(--m-gray-2)]" style={{ fontSize: "13px", letterSpacing: "0.08em" }}>
                {s.n}
              </p>
              <h3 className="m-h3 mt-6 text-[var(--m-ink)]">{s.title}</h3>
              <p className="m-body mt-3" style={{ fontSize: "15px" }}>
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
          className="mt-12 md:mt-16 m-card-asym grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10"
        >
          <div>
            <p
              className="text-[var(--m-canvas)]"
              style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.03em" }}
            >
              30
            </p>
            <p className="text-[var(--m-gray-3)] mt-2 text-[14px]">zonas canónicas en Tijuana</p>
          </div>
          <div>
            <p
              className="text-[var(--m-canvas)]"
              style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.03em" }}
            >
              500+
            </p>
            <p className="text-[var(--m-gray-3)] mt-2 text-[14px]">variables INEGI por AGEB</p>
          </div>
          <div>
            <p
              className="text-[var(--m-canvas)]"
              style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", lineHeight: "1", letterSpacing: "-0.03em" }}
            >
              Semanal
            </p>
            <p className="text-[var(--m-gray-3)] mt-2 text-[14px]">snapshots de tendencias por zona</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
