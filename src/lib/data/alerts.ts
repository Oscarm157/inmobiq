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

// Helper: typed access to price_alerts (new table not yet in generated Database types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const alertsTable = () => (createSupabaseBrowserClient() as any).from("price_alerts")

export async function getAlerts(userId: string): Promise<PriceAlert[]> {
  const { data, error } = await alertsTable()
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data as PriceAlert[]) ?? []
}

export async function createAlert(
  userId: string,
  input: CreateAlertInput
): Promise<PriceAlert> {
  const { data, error } = await alertsTable()
    .insert({ user_id: userId, ...input, is_active: true })
    .select()
    .single()

  if (error) throw error
  return data as PriceAlert
}

export async function toggleAlert(alertId: string, isActive: boolean): Promise<void> {
  const { error } = await alertsTable()
    .update({ is_active: isActive })
    .eq("id", alertId)

  if (error) throw error
}

export async function deleteAlert(alertId: string): Promise<void> {
  const { error } = await alertsTable()
    .delete()
    .eq("id", alertId)

  if (error) throw error
}

export async function getActiveAlertCount(userId: string): Promise<number> {
  const { count, error } = await alertsTable()
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) return 0
  return (count as number) ?? 0
}
