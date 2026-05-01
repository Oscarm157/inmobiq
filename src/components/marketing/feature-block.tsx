"use client"

import Image from "next/image"
import { motion } from "motion/react"
import type { ReactNode } from "react"

type Tone = "light" | "soft" | "dark"

interface FeatureBlockProps {
  eyebrow: string
  title: ReactNode
  body: string
  bullets?: string[]
  image: { src: string; alt: string }
  reverse?: boolean
  tone?: Tone
  extraVisual?: ReactNode
}

export function FeatureBlock({
  eyebrow,
  title,
  body,
  bullets,
  image,
  reverse,
  tone = "light",
  extraVisual,
}: FeatureBlockProps) {
  const isDark = tone === "dark"
  const bg =
    tone === "dark"
      ? "linear-gradient(180deg, #0b1326 0%, #0f172a 100%)"
      : tone === "soft"
      ? "var(--m-canvas-soft)"
      : "var(--m-canvas)"

  return (
    <section
      className="relative overflow-hidden"
      style={{ scrollMarginTop: "72px", background: bg }}
    >
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 45% 60% at 85% 20%, rgba(16,185,129,0.13) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 10% 80%, rgba(59,130,246,0.13) 0%, transparent 60%)",
          }}
        />
      )}
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p
              className="m-eyebrow"
              style={isDark ? { color: "#94a3b8" } : undefined}
            >
              {eyebrow}
            </p>
            <h2
              className="m-h2 mt-4"
              style={{ color: isDark ? "#f1f5f9" : "var(--m-ink)" }}
            >
              {title}
            </h2>
            <p
              className="m-body-lg mt-5 max-w-[48ch]"
              style={isDark ? { color: "#94a3b8" } : undefined}
            >
              {body}
            </p>
            {bullets && (
              <ul className="mt-6 flex flex-col gap-3">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-[15px]"
                    style={{
                      letterSpacing: "-0.005em",
                      color: isDark ? "#cbd5e1" : "var(--m-ink-soft)",
                    }}
                  >
                    <span
                      className="mt-[9px] w-1 h-1 rounded-full shrink-0"
                      style={{ background: "var(--m-accent)" }}
                      aria-hidden
                    />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {extraVisual}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
            className="relative"
          >
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: isDark ? "20px" : "28px",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid var(--m-gray-3)",
                background: isDark
                  ? "rgba(255,255,255,0.02)"
                  : "var(--m-canvas)",
                boxShadow: isDark
                  ? "none"
                  : "0 30px 80px -30px rgba(15, 23, 42, 0.18), 0 8px 24px -8px rgba(15, 23, 42, 0.06)",
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={1200}
                height={780}
                className="w-full h-auto block"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
            </div>
            {!isDark && (
              <>
                <div
                  className="absolute -inset-6 -z-10 rounded-[40px] blur-3xl pointer-events-none"
                  style={{ background: "rgba(16, 185, 129, 0.18)", opacity: 0.7 }}
                  aria-hidden
                />
                <div
                  className="absolute -inset-2 -bottom-8 -left-8 -z-10 w-2/3 h-2/3 rounded-full blur-3xl pointer-events-none"
                  style={{ background: "rgba(59, 130, 246, 0.14)" }}
                  aria-hidden
                />
              </>
            )}
            {isDark && (
              <div
                className="absolute -inset-4 -z-10 rounded-[28px] blur-3xl pointer-events-none"
                style={{ background: "rgba(59, 130, 246, 0.18)", opacity: 0.5 }}
                aria-hidden
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
