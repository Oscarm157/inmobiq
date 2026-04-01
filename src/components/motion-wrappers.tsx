"use client"

import { motion, AnimatePresence } from "motion/react"
import type { ReactNode } from "react"

const staggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
}

export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FadeInUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={delay > 0 ? { delay } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SpringCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
