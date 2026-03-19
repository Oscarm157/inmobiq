# Inmobiq — Modelo de Datos y Mock Data

## Archivo de tipos: `src/types/database.ts`
## Archivo de datos: `src/lib/mock-data.ts`

---

## Tipos Core

### PropertyType
```typescript
type PropertyType = "casa" | "departamento" | "terreno" | "local" | "oficina"
```
5 tipos de propiedad. Se usa en `listings_by_type` y `avg_ticket_by_type` dentro de `ZoneMetrics`.

### ListingType
```typescript
type ListingType = "venta" | "renta"
```

### SourcePortal
```typescript
type SourcePortal = "inmuebles24" | "lamudi" | "vivanuncios" | "mercadolibre"
```
4 portales de donde se scrapearán datos (futuro).

---

## Entidades Base

### Zone
```typescript
interface Zone {
  id: string
  name: string       // "Zona Río"
  city: string       // "Tijuana"
  state: string      // "Baja California"
  slug: string       // "zona-rio"
  lat: number
  lng: number
  created_at: string
}
```

### Listing
```typescript
interface Listing {
  id: string
  zone_id: string
  title: string
  property_type: PropertyType
  listing_type: ListingType
  price: number
  area_m2: number
  price_per_m2: number
  bedrooms: number | null
  bathrooms: number | null
  source: SourcePortal
  source_url: string
  scraped_at: string
  created_at: string
}
```

> **Nota**: `Zone` y `Listing` están definidos como tipos pero **no tienen datos mock**. Están preparados para la futura conexión con Supabase.

---

## Métricas

### ZoneMetrics
```typescript
interface ZoneMetrics {
  zone_id: string
  zone_name: string
  zone_slug: string                          // FK usado para enlazar con otros datasets
  avg_price_per_m2: number                   // Precio promedio por m²
  price_trend_pct: number                    // % cambio vs periodo anterior
  avg_ticket: number                         // Precio promedio de propiedad
  total_listings: number                     // Total de listados activos
  listings_by_type: Record<PropertyType, number>   // Desglose por tipo
  avg_ticket_by_type: Record<PropertyType, number> // Precio promedio por tipo
}
```

### CityMetrics
```typescript
interface CityMetrics {
  city: string
  avg_price_per_m2: number
  price_trend_pct: number
  total_listings: number
  total_zones: number
  top_zones: ZoneMetrics[]      // Top 4 por precio
  hottest_zones: ZoneMetrics[]  // Top 4 por actividad
}
```

---

## Datos de Riesgo

### ZoneRiskMetrics
```typescript
interface ZoneRiskMetrics {
  zone_slug: string                    // FK a ZoneMetrics
  zone_name: string
  risk_score: number                   // 1-100, mayor = más riesgoso
  volatility: number                   // Volatilidad de precios %
  cap_rate: number                     // Tasa de capitalización %
  vacancy_rate: number                 // Tasa de vacancia %
  liquidity_score: number              // 1-100, mayor = más líquido
  market_maturity: "emergente" | "en_desarrollo" | "consolidado" | "maduro"
  avg_rent_per_m2: number              // Renta promedio por m²
  risk_label: "Bajo" | "Medio" | "Alto"
}
```

---

## Datos de Portafolio

### RiskLevel
```typescript
type RiskLevel = "conservador" | "balanceado" | "agresivo"
```

### PortfolioAllocation
```typescript
interface PortfolioAllocation {
  zone_slug: string        // FK a ZoneMetrics
  zone_name: string
  allocation_pct: number   // % del portafolio asignado (suman 100)
}
```

### PortfolioPreset
```typescript
interface PortfolioPreset {
  id: string
  name: string                   // "Conservador", "Balanceado", "Agresivo"
  description: string
  risk_level: RiskLevel
  expected_return_pct: number    // Retorno esperado %
  risk_score: number             // 1-100
  allocations: PortfolioAllocation[]
}
```

---

## Datos de Pipeline

### ProjectStatus
```typescript
type ProjectStatus = "planificacion" | "preventa" | "construccion" | "entregado"
```

### PipelineProject
```typescript
interface PipelineProject {
  id: string
  zone_slug: string            // FK a ZoneMetrics
  zone_name: string
  name: string                 // "Torre Sayan Rio"
  status: ProjectStatus
  status_label: string         // "85% Vendido", "Pre-Venta", etc.
  badge_color: string          // Clases Tailwind: "bg-green-100 text-green-700"
  description: string
  units_total: number
  units_sold: number
  price_range: string          // "$3.2M - $8.5M MXN"
  delivery_date: string        // "Sep 2025"
  img: string                  // URL de imagen
  investors: number
  investor_label: string       // "12 Inversores activos"
}
```

---

## Datasets Mock (exports de `src/lib/mock-data.ts`)

### `TIJUANA_ZONES: ZoneMetrics[]` — 8 zonas

| Zona | Slug | Precio/m² | Tendencia | Listings | Ticket Prom. |
|---|---|---|---|---|---|
| Zona Río | zona-rio | $32,500 | +4.2% | 342 | $4.8M |
| Playas de Tijuana | playas-de-tijuana | $38,200 | +6.8% | 287 | $5.2M |
| Otay | otay | $18,500 | +2.1% | 198 | $2.8M |
| Chapultepec | chapultepec | $28,900 | +3.5% | 156 | $4.1M |
| Hipódromo | hipodromo | $26,800 | -1.2% | 134 | $3.6M |
| Centro | centro | $15,200 | -0.8% | 221 | $1.9M |
| Res. del Bosque | residencial-del-bosque | $22,100 | +5.3% | 89 | $3.2M |
| La Mesa | la-mesa | $16,800 | +1.9% | 176 | $2.4M |

### `TIJUANA_CITY_METRICS: CityMetrics` — Agregado ciudad
- Precio promedio: $24,875/m²
- Tendencia: +3.1%
- Total listings: 1,603
- Zonas: 8

### `PRICE_TREND_DATA` — 12 meses (Oct 2024 – Sep 2025)
Array de `{ month, avg_price_m2, listings }`. Usado para el AreaChart en la home.

### `ZONE_RISK_DATA: ZoneRiskMetrics[]` — 8 zonas

| Zona | Risk Score | Cap Rate | Vacancia | Liquidez | Madurez |
|---|---|---|---|---|---|
| Zona Río | 35 (Bajo) | 7.2% | 6.1% | 88 | Consolidado |
| Playas | 52 (Medio) | 5.8% | 8.4% | 75 | En desarrollo |
| Otay | 28 (Bajo) | 8.5% | 4.8% | 72 | Consolidado |
| Chapultepec | 38 (Bajo) | 6.9% | 7.2% | 68 | Maduro |
| Hipódromo | 58 (Medio) | 6.2% | 11.3% | 55 | Maduro |
| Centro | 65 (Alto) | 9.1% | 14.6% | 82 | Maduro |
| Res. Bosque | 45 (Medio) | 7.8% | 5.5% | 42 | Emergente |
| La Mesa | 32 (Bajo) | 8.2% | 6.8% | 65 | Consolidado |

### `PORTFOLIO_PRESETS: PortfolioPreset[]` — 3 estrategias

**Conservador** (risk 30, return 5.8%): Zona Río 35%, Otay 25%, La Mesa 20%, Chapultepec 20%
**Balanceado** (risk 45, return 8.2%): Zona Río 25%, Playas 20%, Chapultepec 20%, Bosque 15%, Otay 10%, La Mesa 10%
**Agresivo** (risk 62, return 12.5%): Playas 30%, Bosque 25%, Zona Río 20%, Centro 15%, Hipódromo 10%

### `PIPELINE_PROJECTS_EXTENDED: PipelineProject[]` — 8 proyectos

| Proyecto | Zona | Status | Unidades | Vendidas | Entrega |
|---|---|---|---|---|---|
| Torre Sayan Rio | Zona Río | Construcción | 120 | 102 (85%) | Sep 2025 |
| Paseo Global II | Zona Río | Pre-Venta | 85 | 28 (33%) | Mar 2026 |
| The Icon District | Playas | Planificación | 200 | 0 | Dic 2027 |
| Oceana Residences | Playas | Construcción | 96 | 71 (74%) | Jun 2025 |
| Parque Chapultepec Living | Chapultepec | Pre-Venta | 64 | 18 (28%) | Ago 2026 |
| Otay Industrial Park III | Otay | Planificación | 45 | 0 | 2027 |
| Centro Histórico Lofts | Centro | Pre-Venta | 32 | 8 (25%) | Nov 2026 |
| Bosque Sereno Villas | Bosque | Construcción | 48 | 29 (60%) | Dic 2025 |

---

## Relaciones entre Datasets

```
zone_slug es la FK que conecta todo:

TIJUANA_ZONES[].zone_slug
    ├── ZONE_RISK_DATA[].zone_slug
    ├── PORTFOLIO_PRESETS[].allocations[].zone_slug
    └── PIPELINE_PROJECTS_EXTENDED[].zone_slug
```

No hay joins reales (todo es mock), pero los slugs son consistentes y se usan para lookups con `.find()`.

---

## Futura migración a Supabase

La interfaz `Database` ya está definida en `src/types/database.ts` con el formato que Supabase genera:

```typescript
interface Database {
  public: {
    Tables: {
      zones: { Row: Zone; Insert: ...; Update: ... }
      listings: { Row: Listing; Insert: ...; Update: ... }
    }
    Enums: {
      property_type: PropertyType
      listing_type: ListingType
      source_portal: SourcePortal
    }
  }
}
```

Cuando se conecte Supabase, se reemplazarán los arrays mock por queries a las tablas `zones` y `listings`, y las métricas se calcularán con Views/RPCs de Supabase.
