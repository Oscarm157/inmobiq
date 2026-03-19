import { PORTFOLIO_PRESETS } from "@/lib/mock-data"
import type { PortfolioPreset } from "@/types/database"

/**
 * Returns the three standard portfolio presets (conservador, balanceado, agresivo).
 * These are business-logic constants — no DB backing needed until user-specific
 * presets are introduced (covered by auth/portfolio features).
 */
export function getPortfolioPresets(): PortfolioPreset[] {
  return PORTFOLIO_PRESETS
}
