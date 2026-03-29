"use client"

import { useCallback, useEffect, useState } from "react"
import { GuidedTour } from "@/components/guided-tour"

export function GuidedTourWrapper() {
  const [forceOpen, setForceOpen] = useState(false)

  useEffect(() => {
    const handler = () => setForceOpen(true)
    window.addEventListener("inmobiq:replay-tour", handler)
    return () => window.removeEventListener("inmobiq:replay-tour", handler)
  }, [])

  const handleClose = useCallback(() => {
    setForceOpen(false)
  }, [])

  return <GuidedTour forceOpen={forceOpen} onClose={handleClose} />
}
