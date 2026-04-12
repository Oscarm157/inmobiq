"use client"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { PriceAlert, ConditionType } from "@/types/database"

export interface CreateAlertInput {
  zone_id: string | null
  property_type: string | null
  listing_type: string | null
  condition_type: ConditionType
  threshold_value: number
}

type LegacyDirection = "above" | "below"

interface LegacyPriceAlertRow {
  id: string
  user_id: string
  zone_id: string | null
  threshold_price_m2: number | string
  direction: LegacyDirection
  active: boolean
  triggered_at: string | null
  created_at: string
}

type AlertRow = Partial<PriceAlert> & Partial<LegacyPriceAlertRow>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const alertsTable = () => (createSupabaseBrowserClient() as any).from("price_alerts")

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isSchemaMismatch(error: unknown): boolean {
  const lower = getErrorMessage(error).toLowerCase()
  return (
    lower.includes("condition_type")
    || lower.includes("threshold_value")
    || lower.includes("last_triggered_at")
    || lower.includes("is_active")
    || lower.includes("property_type")
    || lower.includes("listing_type")
  )
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function mapAlertRow(row: AlertRow): PriceAlert {
  if ("condition_type" in row && row.condition_type) {
    return {
      id: String(row.id ?? ""),
      user_id: String(row.user_id ?? ""),
      zone_id: row.zone_id ?? null,
      property_type: row.property_type ?? null,
      listing_type: row.listing_type ?? null,
      condition_type: row.condition_type as ConditionType,
      threshold_value: toNumber(row.threshold_value),
      is_active: Boolean(row.is_active),
      last_triggered_at: row.last_triggered_at ?? null,
      created_at: String(row.created_at ?? ""),
    }
  }

  return {
    id: String(row.id ?? ""),
    user_id: String(row.user_id ?? ""),
    zone_id: row.zone_id ?? null,
    property_type: null,
    listing_type: null,
    condition_type: "price_below",
    threshold_value: toNumber((row as LegacyPriceAlertRow).threshold_price_m2),
    is_active: Boolean((row as LegacyPriceAlertRow).active),
    last_triggered_at: (row as LegacyPriceAlertRow).triggered_at ?? null,
    created_at: String(row.created_at ?? ""),
  }
}

function assertLegacyCompatible(input: CreateAlertInput) {
  const supportsLegacyShape =
    input.condition_type === "price_below"
    && !input.property_type
    && !input.listing_type

  if (!supportsLegacyShape) {
    throw new Error("legacy_alerts_limited")
  }
}

export async function getAlerts(userId: string): Promise<PriceAlert[]> {
  const { data, error } = await alertsTable()
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return ((data ?? []) as AlertRow[]).map(mapAlertRow)
}

export async function createAlert(
  userId: string,
  input: CreateAlertInput
): Promise<PriceAlert> {
  const { data, error } = await alertsTable()
    .insert({ user_id: userId, ...input, is_active: true })
    .select()
    .single()

  if (!error && data) {
    return mapAlertRow(data as AlertRow)
  }

  if (!isSchemaMismatch(error)) {
    throw error
  }

  assertLegacyCompatible(input)

  const legacyInsert = {
    user_id: userId,
    zone_id: input.zone_id,
    threshold_price_m2: input.threshold_value,
    direction: "below" as LegacyDirection,
    active: true,
  }

  const retry = await alertsTable()
    .insert(legacyInsert)
    .select("*")
    .single()

  if (retry.error || !retry.data) {
    throw retry.error ?? new Error("No se pudo crear la alerta legacy.")
  }

  return mapAlertRow(retry.data as AlertRow)
}

export async function toggleAlert(alertId: string, isActive: boolean): Promise<void> {
  const { error } = await alertsTable()
    .update({ is_active: isActive })
    .eq("id", alertId)

  if (!error) return
  if (!isSchemaMismatch(error)) throw error

  const retry = await alertsTable()
    .update({ active: isActive })
    .eq("id", alertId)

  if (retry.error) throw retry.error
}

export async function deleteAlert(alertId: string): Promise<void> {
  const { error } = await alertsTable()
    .delete()
    .eq("id", alertId)

  if (error) throw error
}

export async function getActiveAlertCount(userId: string): Promise<number> {
  const primary = await alertsTable()
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true)

  if (!primary.error) {
    return (primary.count as number) ?? 0
  }

  if (!isSchemaMismatch(primary.error)) {
    return 0
  }

  const legacy = await alertsTable()
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true)

  if (legacy.error) return 0
  return (legacy.count as number) ?? 0
}
