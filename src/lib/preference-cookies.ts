/**
 * Persistent user preference cookies for category and operation type.
 *
 * Client-side setters (use in "use client" components).
 * Server-side reading is done directly via cookies() in server components.
 */

export const COOKIE_CATEGORIA = "inmobiq_categoria"
export const COOKIE_OPERACION = "inmobiq_operacion"

const MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const VALID_CATEGORIAS = new Set(["residencial", "comercial", "terreno"])
const VALID_OPERACIONES = new Set(["venta", "renta"])

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

/** Client-side: persist categoria preference (validates before writing) */
export function setPreferredCategoria(value: string) {
  if (!VALID_CATEGORIAS.has(value)) return
  document.cookie = `${COOKIE_CATEGORIA}=${value};path=/;max-age=${MAX_AGE};samesite=lax`
}

/** Client-side: persist operacion preference (validates before writing) */
export function setPreferredOperacion(value: string) {
  if (!VALID_OPERACIONES.has(value)) return
  document.cookie = `${COOKIE_OPERACION}=${value};path=/;max-age=${MAX_AGE};samesite=lax`
}

// ── Client-side readers (parse from document.cookie) ──

/** Client-side: read current categoria from cookie */
export function readCookieCategoria(): "residencial" | "comercial" | "terreno" {
  const match = document.cookie.match(new RegExp(`${COOKIE_CATEGORIA}=(\\w+)`))
  return parseCategoria(match?.[1])
}

/** Client-side: read current operacion from cookie */
export function readCookieOperacion(): "venta" | "renta" {
  const match = document.cookie.match(new RegExp(`${COOKIE_OPERACION}=(\\w+)`))
  return parseOperacion(match?.[1])
}
