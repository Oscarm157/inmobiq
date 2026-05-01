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
}

export function FeatureBlock({
  eyebrow,
  title,
  body,
  bullets,
  image,
  reverse,
  tone = "light",
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
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 py-16 md:py-24">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
            className="relative"
          >
            <div
              className="relative rounded-[20px] overflow-hidden"
              style={{
                border: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid var(--m-gray-4)",
                background: isDark
                  ? "rgba(255,255,255,0.02)"
                  : "var(--m-canvas)",
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
            <div
              className="absolute -inset-4 -z-10 rounded-[28px] opacity-50 blur-3xl pointer-events-none"
              style={{
                background: isDark
                  ? "rgba(59, 130, 246, 0.18)"
                  : "rgba(16, 185, 129, 0.12)",
              }}
              aria-hidden
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
