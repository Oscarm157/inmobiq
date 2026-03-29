/**
 * Rental expense model — computes operating expenses for rental properties
 * to derive net yield, true cap rate, and realistic payback periods.
 *
 * Based on Tijuana market data (2025-2026):
 * - Predial: ~0.15% of property value annually
 * - Insurance: ~0.4% annually
 * - Management: 8-12% of gross rent
 * - Vacancy: 5-15% depending on zone demand
 * - Maintenance: from extracted data or defaults by property type
 */

import type { PropertyType } from "@/types/database"
import type { RentalAttributeStats } from "./rental-attributes"

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface RentalExpenseModel {
  /** Estimated vacancy loss as % of gross annual rent (5-15%) */
  vacancy_pct: number
  /** Monthly maintenance/HOA fee in MXN */
  maintenance_monthly: number
  /** Annual property tax as % of property value */
  predial_pct: number
  /** Annual insurance as % of property value */
  insurance_pct: number
  /** Property management fee as % of gross rent */
  management_pct: number
  /** Total annual expenses in MXN */
  total_annual_expenses: number
  /** Total expenses as % of gross annual rent */
  expense_ratio_pct: number
  /** Net Operating Income (annual) */
  noi: number
  /** Net yield: NOI / property value × 100 */
  net_yield_pct: number
  /** True cap rate: NOI / property value × 100 (same as net yield when computed from market data) */
  cap_rate_pct: number
  /** Payback period in years: property value / NOI */
  payback_years: number
}

export interface ExpenseBreakdown {
  label: string
  amount: number
  pct_of_rent: number
  color: string
}

/* ------------------------------------------------------------------ */
/*  Default expense assumptions by property type                       */
/* ------------------------------------------------------------------ */

const DEFAULT_MAINTENANCE: Record<string, number> = {
  departamento: 2_500,
  casa: 1_000,
  local: 3_500,
  oficina: 3_000,
  terreno: 0,
}

const DEFAULT_VACANCY_PCT = 8      // 8% vacancy for Tijuana average
const PREDIAL_PCT = 0.15           // Tijuana property tax rate
const INSURANCE_PCT = 0.4          // Standard property insurance
const DEFAULT_MANAGEMENT_PCT = 10  // Standard management fee

/* ------------------------------------------------------------------ */
/*  Vacancy estimation from listing duration                           */
/* ------------------------------------------------------------------ */

/**
 * Estimate vacancy rate from average listing duration.
 * Shorter listings = higher demand = lower vacancy.
 */
export function estimateVacancyPct(avgListingDurationDays: number | null): number {
  if (avgListingDurationDays === null) return DEFAULT_VACANCY_PCT

  // < 14 days: very high demand → 5% vacancy
  // 14-30 days: normal → 8%
  // 30-60 days: slow → 12%
  // > 60 days: very slow → 15%
  if (avgListingDurationDays < 14) return 5
  if (avgListingDurationDays < 30) return 8
  if (avgListingDurationDays < 60) return 12
  return 15
}

/* ------------------------------------------------------------------ */
/*  Main computation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Compute the full expense model for a rental investment.
 *
 * @param avgMonthlyRent - Average monthly rent in MXN
 * @param avgSalePrice - Average purchase price in MXN
 * @param propertyType - Predominant property type in the zone
 * @param rentalStats - Optional stats from rental attribute extraction (for real maintenance data)
 * @param avgListingDurationDays - Average days a rental listing stays active (proxy for vacancy)
 */
export function computeExpenseModel(
  avgMonthlyRent: number,
  avgSalePrice: number,
  propertyType: PropertyType,
  rentalStats?: RentalAttributeStats | null,
  avgListingDurationDays?: number | null,
): RentalExpenseModel | null {
  if (avgMonthlyRent <= 0 || avgSalePrice <= 0) return null

  const grossAnnualRent = avgMonthlyRent * 12

  // Vacancy
  const vacancyPct = estimateVacancyPct(avgListingDurationDays ?? null)
  const vacancyLoss = grossAnnualRent * (vacancyPct / 100)

  // Maintenance: use real data from extraction if available, else defaults
  const maintenanceMonthly = rentalStats?.medianMaintenanceFee ?? DEFAULT_MAINTENANCE[propertyType] ?? 1_500
  const maintenanceAnnual = maintenanceMonthly * 12

  // Property tax (predial)
  const predialAnnual = avgSalePrice * (PREDIAL_PCT / 100)

  // Insurance
  const insuranceAnnual = avgSalePrice * (INSURANCE_PCT / 100)

  // Management fee
  const managementAnnual = grossAnnualRent * (DEFAULT_MANAGEMENT_PCT / 100)

  // Total expenses
  const totalAnnualExpenses = vacancyLoss + maintenanceAnnual + predialAnnual + insuranceAnnual + managementAnnual

  // Net Operating Income
  const noi = grossAnnualRent - totalAnnualExpenses

  // Derived metrics
  const expenseRatio = (totalAnnualExpenses / grossAnnualRent) * 100
  const netYield = (noi / avgSalePrice) * 100
  const capRate = netYield // same when computed from market averages
  const paybackYears = noi > 0 ? avgSalePrice / noi : Infinity

  return {
    vacancy_pct: vacancyPct,
    maintenance_monthly: maintenanceMonthly,
    predial_pct: PREDIAL_PCT,
    insurance_pct: INSURANCE_PCT,
    management_pct: DEFAULT_MANAGEMENT_PCT,
    total_annual_expenses: Math.round(totalAnnualExpenses),
    expense_ratio_pct: Math.round(expenseRatio * 10) / 10,
    noi: Math.round(noi),
    net_yield_pct: Math.round(netYield * 100) / 100,
    cap_rate_pct: Math.round(capRate * 100) / 100,
    payback_years: paybackYears === Infinity ? Infinity : Math.round(paybackYears * 10) / 10,
  }
}

/**
 * Generate an expense breakdown for visualization (chart data).
 */
export function getExpenseBreakdown(model: RentalExpenseModel, avgMonthlyRent: number): ExpenseBreakdown[] {
  const grossAnnual = avgMonthlyRent * 12
  if (grossAnnual <= 0) return []

  const items: ExpenseBreakdown[] = [
    {
      label: "Vacancia",
      amount: Math.round(grossAnnual * (model.vacancy_pct / 100)),
      pct_of_rent: model.vacancy_pct,
      color: "#ef4444", // red-500
    },
    {
      label: "Mantenimiento",
      amount: model.maintenance_monthly * 12,
      pct_of_rent: Math.round((model.maintenance_monthly * 12 / grossAnnual) * 1000) / 10,
      color: "#f59e0b", // amber-500
    },
    {
      label: "Predial",
      amount: Math.round(model.total_annual_expenses * (model.predial_pct / (model.predial_pct + model.insurance_pct + model.management_pct + model.vacancy_pct + (model.maintenance_monthly * 12 / grossAnnual * 100)))),
      pct_of_rent: Math.round((model.predial_pct * (model.noi + model.total_annual_expenses) / grossAnnual) * 10) / 10,
      color: "#8b5cf6", // violet-500
    },
    {
      label: "Seguro",
      amount: Math.round((model.noi + model.total_annual_expenses) * (model.insurance_pct / 100) / (model.insurance_pct / 100 + 1) * 0), // placeholder
      pct_of_rent: 0,
      color: "#06b6d4", // cyan-500
    },
    {
      label: "Administración",
      amount: Math.round(grossAnnual * (model.management_pct / 100)),
      pct_of_rent: model.management_pct,
      color: "#64748b", // slate-500
    },
  ]

  // Recalculate properly
  const vacancyAmt = Math.round(grossAnnual * (model.vacancy_pct / 100))
  const maintenanceAmt = model.maintenance_monthly * 12
  const adminAmt = Math.round(grossAnnual * (model.management_pct / 100))
  // predial and insurance are % of property value, but we only have gross rent
  const remainingExpenses = model.total_annual_expenses - vacancyAmt - maintenanceAmt - adminAmt
  const predialAmt = Math.round(remainingExpenses * 0.27) // predial is ~27% of predial+insurance (0.15/(0.15+0.4))
  const insuranceAmt = remainingExpenses - predialAmt

  return [
    {
      label: "Vacancia",
      amount: vacancyAmt,
      pct_of_rent: Math.round((vacancyAmt / grossAnnual) * 1000) / 10,
      color: "#ef4444",
    },
    {
      label: "Mantenimiento",
      amount: maintenanceAmt,
      pct_of_rent: Math.round((maintenanceAmt / grossAnnual) * 1000) / 10,
      color: "#f59e0b",
    },
    {
      label: "Predial",
      amount: predialAmt,
      pct_of_rent: Math.round((predialAmt / grossAnnual) * 1000) / 10,
      color: "#8b5cf6",
    },
    {
      label: "Seguro",
      amount: insuranceAmt,
      pct_of_rent: Math.round((insuranceAmt / grossAnnual) * 1000) / 10,
      color: "#06b6d4",
    },
    {
      label: "Administración",
      amount: adminAmt,
      pct_of_rent: Math.round((adminAmt / grossAnnual) * 1000) / 10,
      color: "#64748b",
    },
    {
      label: "Ingreso Neto",
      amount: model.noi,
      pct_of_rent: Math.round((model.noi / grossAnnual) * 1000) / 10,
      color: "#10b981", // emerald-500
    },
  ]
}
