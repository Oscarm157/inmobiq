"use client"

import Image from "next/image"
import { motion } from "motion/react"
import type { ReactNode } from "react"

interface FeatureBlockProps {
  eyebrow: string
  title: ReactNode
  body: string
  bullets?: string[]
  image: { src: string; alt: string }
  reverse?: boolean
  altBg?: boolean
}

export function FeatureBlock({
  eyebrow,
  title,
  body,
  bullets,
  image,
  reverse,
  altBg,
}: FeatureBlockProps) {
  return (
    <section
      className={altBg ? "bg-[var(--m-canvas-soft)]" : "bg-[var(--m-canvas)]"}
      style={{ scrollMarginTop: "72px" }}
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="m-eyebrow">{eyebrow}</p>
            <h2 className="m-h2 mt-4 text-[var(--m-ink)]">{title}</h2>
            <p className="m-body-lg mt-5 max-w-[48ch]">{body}</p>
            {bullets && (
              <ul className="mt-6 flex flex-col gap-3">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-[15px] text-[var(--m-ink-soft)]"
                    style={{ letterSpacing: "-0.005em" }}
                  >
                    <span
                      className="mt-[9px] w-1 h-1 rounded-full bg-[var(--m-accent)] shrink-0"
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
            <div className="relative rounded-[20px] overflow-hidden border border-[var(--m-gray-4)] bg-[var(--m-canvas)]">
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
              style={{ background: "rgba(16, 185, 129, 0.12)" }}
              aria-hidden
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
