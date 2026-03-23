/** Dev-only feature flags. Controlled by environment variables. */

/** Enable drill-down on charts to inspect individual listings behind each data point. */
export const DEV_DRILLDOWN = process.env.NEXT_PUBLIC_DEV_DRILLDOWN === "true"
