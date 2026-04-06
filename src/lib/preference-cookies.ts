/**
 * Persistent user preference cookies for category and operation type.
 *
 * Client-side setters (use in "use client" components).
 * Server-side reading is done directly via cookies() in server components.
 */

import type { PerfilType } from "@/lib/profiles"

export const COOKIE_CATEGORIA = "inmobiq_categoria"
export const COOKIE_OPERACION = "inmobiq_operacion"
export const COOKIE_PERFIL = "inmobiq_perfil"

const MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const VALID_CATEGORIAS = new Set(["residencial", "comercial", "terreno"])
const VALID_OPERACIONES = new Set(["venta", "renta"])
const VALID_PERFILES = new Set(["comprador", "vendedor", "arrendador", "broker"])

/** Parse a raw cookie value into a valid categoria (or default) */
export function parseCategoria(raw: string | undefined | null): "residencial" | "comercial" | "terreno" {
  if (raw && VALID_CATEGORIAS.has(raw)) return raw as "residencial" | "comercial" | "terreno"
  return "residencial"
}

/** Parse a raw cookie value into a valid operacion (or default) */
export function parseOperacion(raw: string | undefined | null): "venta" | "renta" {
  if (raw && VALID_OPERACIONES.has(raw)) return raw as "venta" | "renta"
  return "venta"
}

/** Client-side: persist categoria preference as session cookie (resets on browser close) */
export function setPreferredCategoria(value: string) {
  if (!VALID_CATEGORIAS.has(value)) return
  document.cookie = `${COOKIE_CATEGORIA}=${value};path=/;samesite=lax`
}

/** Client-side: persist operacion preference as session cookie (resets on browser close) */
export function setPreferredOperacion(value: string) {
  if (!VALID_OPERACIONES.has(value)) return
  document.cookie = `${COOKIE_OPERACION}=${value};path=/;samesite=lax`
}

/** Parse a raw cookie value into a valid perfil (or null for first-time users) */
export function parsePerfil(raw: string | undefined | null): PerfilType | null {
  if (raw && VALID_PERFILES.has(raw)) return raw as PerfilType
  return null
}

/** Client-side: persist perfil preference (validates before writing) */
export function setPreferredPerfil(value: string) {
  if (!VALID_PERFILES.has(value)) return
  document.cookie = `${COOKIE_PERFIL}=${value};path=/;max-age=${MAX_AGE};samesite=lax`
}
