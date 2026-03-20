/**
 * 40 Mini Test Cases — Market Overview Filters
 *
 * Covers: URL parsing, state building, data filtering, edge cases, security
 */

import { describe, it, expect, vi } from "vitest"

// Mock Next.js server modules that listings.ts imports
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}))
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [] })),
}))

import {
  parseMarketParams,
  buildMarketParams,
  type MarketFilterState,
} from "@/lib/filter-utils"
import { applyMockFilters } from "@/lib/data/listings"

// ═══════════════════════════════════════════════════════════════════
// GROUP 1: URL → FilterState parsing (parseMarketParams)
// ═══════════════════════════════════════════════════════════════════

describe("parseMarketParams — URL to state", () => {
  it("1. URL vacía → estado vacío (sin filtros activos)", () => {
    const sp = new URLSearchParams()
    const state = parseMarketParams(sp)
    expect(state.tipos).toEqual([])
    expect(state.zonas).toEqual([])
    expect(state.listing_type).toBe("")
    expect(state.precio_min).toBe("")
    expect(state.precio_max).toBe("")
    expect(state.area_min).toBe("")
    expect(state.area_max).toBe("")
    expect(state.recamaras).toEqual([])
  })

  it("2. ?operacion=venta → listing_type='venta'", () => {
    const sp = new URLSearchParams("operacion=venta")
    expect(parseMarketParams(sp).listing_type).toBe("venta")
  })

  it("3. ?operacion=renta → listing_type='renta'", () => {
    const sp = new URLSearchParams("operacion=renta")
    expect(parseMarketParams(sp).listing_type).toBe("renta")
  })

  it("4. ?operacion=invalido → listing_type='' (sanitizado)", () => {
    const sp = new URLSearchParams("operacion=invalido")
    expect(parseMarketParams(sp).listing_type).toBe("")
  })

  it("5. ?tipo=casa → tipos=['casa']", () => {
    const sp = new URLSearchParams("tipo=casa")
    expect(parseMarketParams(sp).tipos).toEqual(["casa"])
  })

  it("6. ?tipo=casa,departamento → tipos=['casa','departamento']", () => {
    const sp = new URLSearchParams("tipo=casa,departamento")
    expect(parseMarketParams(sp).tipos).toEqual(["casa", "departamento"])
  })

  it("7. ?tipo=invalido,casa → filtra solo tipos válidos ['casa']", () => {
    const sp = new URLSearchParams("tipo=invalido,casa")
    expect(parseMarketParams(sp).tipos).toEqual(["casa"])
  })

  it("8. ?zona=zona-rio,playas-de-tijuana → zonas correctas", () => {
    const sp = new URLSearchParams("zona=zona-rio,playas-de-tijuana")
    expect(parseMarketParams(sp).zonas).toEqual(["zona-rio", "playas-de-tijuana"])
  })

  it("9. ?zona=zona-invalida → filtra zona desconocida", () => {
    const sp = new URLSearchParams("zona=zona-invalida")
    expect(parseMarketParams(sp).zonas).toEqual([])
  })

  it("10. ?precio_min=1000000 → precio_min='1000000'", () => {
    const sp = new URLSearchParams("precio_min=1000000")
    expect(parseMarketParams(sp).precio_min).toBe("1000000")
  })

  it("11. ?precio_min=abc → precio_min='' (NaN sanitizado)", () => {
    const sp = new URLSearchParams("precio_min=abc")
    expect(parseMarketParams(sp).precio_min).toBe("")
  })

  it("12. ?precio_min=-500 → precio_min='' (negativo rechazado)", () => {
    const sp = new URLSearchParams("precio_min=-500")
    expect(parseMarketParams(sp).precio_min).toBe("")
  })

  it("13. ?rec=1,2,3 → recamaras=[1,2,3]", () => {
    const sp = new URLSearchParams("rec=1,2,3")
    expect(parseMarketParams(sp).recamaras).toEqual([1, 2, 3])
  })

  it("14. ?rec=abc,2,99 → recamaras=[2] (sanitiza NaN y fuera de rango)", () => {
    const sp = new URLSearchParams("rec=abc,2,99")
    expect(parseMarketParams(sp).recamaras).toEqual([2])
  })

  it("15. ?rec=0,-1,5 → recamaras=[] (todos fuera de rango 1-4)", () => {
    const sp = new URLSearchParams("rec=0,-1,5")
    expect(parseMarketParams(sp).recamaras).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════
// GROUP 2: FilterState → URL params (buildMarketParams)
// ═══════════════════════════════════════════════════════════════════

describe("buildMarketParams — State to URL", () => {
  const empty: MarketFilterState = {
    tipos: [], zonas: [], listing_type: "",
    precio_min: "", precio_max: "",
    area_min: "", area_max: "",
    recamaras: [],
  }

  it("16. Estado vacío → URL sin params", () => {
    expect(buildMarketParams(empty).toString()).toBe("")
  })

  it("17. Solo operacion=venta → ?operacion=venta", () => {
    const state = { ...empty, listing_type: "venta" as const }
    expect(buildMarketParams(state).get("operacion")).toBe("venta")
  })

  it("18. tipos=[casa,terreno] → ?tipo=casa,terreno", () => {
    const state = { ...empty, tipos: ["casa" as const, "terreno" as const] }
    expect(buildMarketParams(state).get("tipo")).toBe("casa,terreno")
  })

  it("19. precio_min y max → ambos params en URL", () => {
    const state = { ...empty, precio_min: "1000000", precio_max: "5000000" }
    const params = buildMarketParams(state)
    expect(params.get("precio_min")).toBe("1000000")
    expect(params.get("precio_max")).toBe("5000000")
  })

  it("20. Solo precio_min sin max → solo precio_min en URL", () => {
    const state = { ...empty, precio_min: "1000000" }
    const params = buildMarketParams(state)
    expect(params.get("precio_min")).toBe("1000000")
    expect(params.get("precio_max")).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════
// GROUP 3: Roundtrip (parse → build → parse)
// ═══════════════════════════════════════════════════════════════════

describe("Roundtrip: URL → State → URL", () => {
  it("21. URL completa sobrevive roundtrip", () => {
    const url = "operacion=venta&tipo=casa,departamento&zona=zona-rio&precio_min=1000000&precio_max=5000000&area_min=50&area_max=200&rec=2,3"
    const state = parseMarketParams(new URLSearchParams(url))
    const rebuilt = buildMarketParams(state).toString()
    const reparsed = parseMarketParams(new URLSearchParams(rebuilt))
    expect(reparsed).toEqual(state)
  })

  it("22. URL vacía sobrevive roundtrip", () => {
    const state = parseMarketParams(new URLSearchParams())
    const rebuilt = buildMarketParams(state).toString()
    expect(rebuilt).toBe("")
  })

  it("23. Filtro de una sola zona sobrevive roundtrip", () => {
    const state = parseMarketParams(new URLSearchParams("zona=otay"))
    const rebuilt = buildMarketParams(state)
    expect(rebuilt.get("zona")).toBe("otay")
  })
})

// ═══════════════════════════════════════════════════════════════════
// GROUP 4: Mock data filtering (applyMockFilters)
// ═══════════════════════════════════════════════════════════════════

describe("applyMockFilters — data layer", () => {
  it("24. Sin filtros → devuelve todos los mock listings", () => {
    const { listings, total } = applyMockFilters({})
    expect(total).toBeGreaterThan(0)
    expect(listings.length).toBe(total)
  })

  it("25. tipo=casa → solo casas en resultado", () => {
    const { listings } = applyMockFilters({ tipos: ["casa"] })
    expect(listings.length).toBeGreaterThan(0)
    expect(listings.every((l) => l.property_type === "casa")).toBe(true)
  })

  it("26. tipo=casa,departamento → solo casas y deptos", () => {
    const { listings } = applyMockFilters({ tipos: ["casa", "departamento"] })
    expect(listings.every((l) => ["casa", "departamento"].includes(l.property_type))).toBe(true)
  })

  it("27. listing_type=venta → solo ventas", () => {
    const { listings } = applyMockFilters({ listing_type: "venta" })
    expect(listings.every((l) => l.listing_type === "venta")).toBe(true)
  })

  it("28. listing_type=renta → solo rentas", () => {
    const { listings } = applyMockFilters({ listing_type: "renta" })
    expect(listings.every((l) => l.listing_type === "renta")).toBe(true)
  })

  it("29. precio_min=3000000 → todas las propiedades >= 3M", () => {
    const { listings } = applyMockFilters({ precio_min: 3000000 })
    expect(listings.every((l) => l.price >= 3000000)).toBe(true)
  })

  it("30. precio_max=2000000 → todas las propiedades <= 2M", () => {
    const { listings } = applyMockFilters({ precio_max: 2000000 })
    expect(listings.every((l) => l.price <= 2000000)).toBe(true)
  })

  it("31. precio_min > precio_max → 0 resultados", () => {
    const { listings } = applyMockFilters({ precio_min: 5000000, precio_max: 1000000 })
    expect(listings.length).toBe(0)
  })

  it("32. area_min=100 → todas >= 100 m²", () => {
    const { listings } = applyMockFilters({ area_min: 100 })
    expect(listings.every((l) => l.area_m2 >= 100)).toBe(true)
  })

  it("33. area_max=80 → todas <= 80 m²", () => {
    const { listings } = applyMockFilters({ area_max: 80 })
    expect(listings.every((l) => l.area_m2 <= 80)).toBe(true)
  })

  it("34. recamaras=[2] → solo 2 recámaras", () => {
    const { listings } = applyMockFilters({ recamaras: [2] })
    expect(listings.every((l) => l.bedrooms === 2)).toBe(true)
  })

  it("35. recamaras=[4] → 4 o más recámaras", () => {
    const { listings } = applyMockFilters({ recamaras: [4] })
    expect(listings.every((l) => l.bedrooms != null && l.bedrooms >= 4)).toBe(true)
  })

  it("36. recamaras=[1,4] → 1 recámara O 4+ recámaras", () => {
    const { listings } = applyMockFilters({ recamaras: [1, 4] })
    expect(
      listings.every((l) => l.bedrooms === 1 || (l.bedrooms != null && l.bedrooms >= 4))
    ).toBe(true)
  })

  it("37. zona=zona-rio → solo propiedades de Zona Río", () => {
    const { listings } = applyMockFilters({ zonas: ["zona-rio"] })
    expect(listings.length).toBeGreaterThan(0)
    expect(listings.every((l) => l.zone_id === "1")).toBe(true) // mock zone_id for zona-rio
  })

  it("38. Filtros combinados: venta + casa + zona-rio", () => {
    const { listings } = applyMockFilters({
      listing_type: "venta",
      tipos: ["casa"],
      zonas: ["zona-rio"],
    })
    expect(listings.every((l) =>
      l.listing_type === "venta" &&
      l.property_type === "casa" &&
      l.zone_id === "1"
    )).toBe(true)
  })

  it("39. Filtros muy restrictivos → 0 resultados (no crash)", () => {
    const { listings, total } = applyMockFilters({
      tipos: ["oficina"],
      listing_type: "renta",
      precio_min: 50000000,
      recamaras: [4],
    })
    expect(total).toBe(0)
    expect(listings).toEqual([])
  })

  it("40. Propiedades sin recámaras (null) excluidas al filtrar por rec", () => {
    const { listings } = applyMockFilters({ recamaras: [2] })
    expect(listings.every((l) => l.bedrooms != null)).toBe(true)
  })
})
