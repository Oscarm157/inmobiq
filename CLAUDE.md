# Inmobiq — Plataforma de inteligencia inmobiliaria para Tijuana

## Stack
- **Framework**: Next.js 15 (App Router, Server Components)
- **UI**: Tailwind CSS, Recharts (charts), Mapbox GL JS (maps)
- **DB**: Supabase (PostgreSQL) — zones, listings, snapshots, city_snapshots
- **Scrapers**: Apify actors → inmuebles24, lamudi, vivanuncios, mercadolibre
- **Language**: TypeScript strict

## Arquitectura clave

### Datos INEGI (Censo 2020)
- **Shapefile source**: SEDATU GeoServer — AGEB Urbana SCINCE 2020 (Baja California)
- **Import script**: `scripts/import-inegi.ts` — lee shapefiles, asigna AGEBs a 30 zonas canónicas, genera:
  - `src/lib/geo-data.ts` — GeoJSON polygons (unión de AGEBs por zona, ~222KB)
  - `src/lib/data/demographics.ts` — datos censales + indicadores derivados por zona
- **Variables importadas**: POB_TOT, TOTHOG, TVIVHAB, PROM_OCUP, VPH_INTER, VPH_AUTOM, TVPH_CC, PDER_SS, PEA, EMPOBTOT + variables extendidas (educación, empleo, tech, etc.)
- **Indicadores derivados**: NSE score/label, dependency ratio, unemployment rate, economic participation, pop density
- **NSE (Nivel Socioeconómico)**: calculado con fórmula reducida (internet 30%, auto 25%, seg.social 25%, participación económica 20%) hasta re-import con variables SCINCE completas
- **Encuesta Intercensal 2025**: disponible septiembre 2026

### Zonas
- 30 zonas canónicas en Tijuana (+ "Otros" catchall)
- Definidas como uniones de AGEBs de INEGI
- Zone assignment: colonia text match → bounding box → nearest (3km) → "Otros"
- Archivos: `src/scraper/zone-assigner.ts`, `src/lib/filter-utils.ts` (28 zones con slug/name)

### Datos de mercado
- **Listings**: precio, area_m2, price_per_m2, recámaras, baños, tipo (casa/depto/terreno/local/oficina)
- **Snapshots**: agregados semanales por zona+property_type+listing_type (count, avg/median/min/max price, price/m²)
- **ZoneMetrics**: avg_price_per_m2, price_trend_pct, avg_ticket, total_listings, listings_by_type
- **ZoneRiskMetrics**: risk_score (incluye factor demográfico), volatility, cap_rate, vacancy_rate, liquidity_score

### Normalización de datos (`src/lib/data/normalize.ts`)

#### Categorías de propiedad
| Categoría | Tipos | Caso de uso |
|-----------|-------|-------------|
| `residencial` | casa, departamento | Inversión habitacional — el default para inversionistas |
| `comercial` | local, oficina | Inversión comercial — KPIs y métricas diferentes |
| `terreno` | terreno | Desarrollo — sin recámaras/baños, solo m² y precio |

#### Reglas de precio absoluto (MXN)
Cualquier listing fuera de estos rangos se descarta como dato inválido:

| Operación | Categoría | Mínimo | Máximo | Lógica |
|-----------|-----------|--------|--------|--------|
| **Venta** | Residencial | $300,000 | $50,000,000 | No hay casas <$300K en Tijuana 2025 |
| **Venta** | Comercial | $200,000 | $100,000,000 | |
| **Venta** | Terreno | $100,000 | $80,000,000 | |
| **Renta** | Residencial | $3,000 | $150,000 | Renta mensual |
| **Renta** | Comercial | $3,000 | $500,000 | Bodegas/locales grandes |
| **Renta** | Terreno | $1,000 | $200,000 | |

#### Reglas de precio/m² (MXN/m²)
Se valida adicionalmente contra rango de precio por metro cuadrado:

| Operación | Categoría | Min/m² | Max/m² |
|-----------|-----------|--------|--------|
| **Venta** | Residencial | $3,000 | $200,000 |
| **Venta** | Comercial | $5,000 | $300,000 |
| **Venta** | Terreno | $1,000 | $100,000 |
| **Renta** | Residencial | $30 | $2,000 |
| **Renta** | Comercial | $30 | $5,000 |
| **Renta** | Terreno | $5 | $1,000 |

#### Remoción de outliers (IQR)
Para gráficas (scatter, distribución), se usa el método IQR con multiplicador 2.0:
- Q1 = percentil 25, Q3 = percentil 75, IQR = Q3 - Q1
- Rango válido: [Q1 - 2×IQR, Q3 + 2×IQR]
- Solo para visualización — KPIs usan datos completos filtrados
- Multiplicador 2.0 (no 1.5) porque precios inmobiliarios son naturalmente sesgados a la derecha
- Función: `removeOutliers(items, getValue, multiplier)`

#### Flujo de normalización
```
Listing scrapeado → isValidListing() → filterNormalizedListings()
  ↓ pasa validación?
  SÍ → entra a métricas de zona, snapshots, gráficas
  NO → descartado (reason: price_too_low | price_too_high | price_per_m2_out_of_range | missing_data)
```

### Filtros de zona (`/zona/[slug]`)
- **Defaults**: `operacion=venta` + `categoria=residencial` (perfil inversionista)
- **URL params**: `?operacion=renta&categoria=comercial` cambia la vista
- **Componente**: `src/components/zone/zone-filters.tsx` — toggles Operación + Categoría
- Los filtros se pasan a: `getZoneBySlug`, `getListings`, `getZoneListingsAnalytics`, `getCityMetrics`
- Todas las gráficas, KPIs y cards reciben datos ya filtrados

### Indicadores cruzados (INEGI × Mercado)
- `src/lib/data/zone-insights.ts` — affordability_index, demand_pressure, appreciation_potential
- Combinan ZoneDemographics + ZoneMetrics + ZoneRiskMetrics
- Se muestran en `src/components/zone/zone-insights-card.tsx`

## Archivos importantes
| Archivo | Propósito |
|---------|-----------|
| `scripts/import-inegi.ts` | Pipeline INEGI → geo-data.ts + demographics.ts |
| `src/lib/data/demographics.ts` | Datos censales + NSE por zona (auto-generado) |
| `src/lib/data/zone-insights.ts` | Indicadores cruzados INEGI × mercado |
| `src/lib/geo-data.ts` | GeoJSON polygons de zonas (auto-generado) |
| `src/lib/data/zones.ts` | Métricas de mercado por zona |
| `src/lib/data/risk.ts` | Métricas de riesgo (con factor demográfico) |
| `src/lib/data/comparator.ts` | Comparación entre zonas |
| `src/scraper/zone-assigner.ts` | Asignación de propiedades a zonas |
| `src/lib/data/normalize.ts` | Validación de precios, categorías, remoción de outliers |
| `src/lib/filter-utils.ts` | URL ↔ filtros (tipos, zonas, operación, categoría) |
| `src/components/zone/zone-filters.tsx` | UI: toggles Operación + Categoría en zona |
| `src/components/zone/demographics-card.tsx` | UI: perfil demográfico con NSE |
| `src/components/zone/zone-insights-card.tsx` | UI: indicadores cruzados |
| `src/components/comparar/demographic-comparison.tsx` | UI: radar + tabla demográfica en comparador |

## Convenciones
- Componentes server por defecto; "use client" solo cuando necesario
- Datos mock en `src/lib/mock-data.ts` para cuando Supabase no está disponible
- Precios siempre en MXN internamente; conversión USD en frontend via `useCurrency()`
- Activity labels cualitativos en vez de conteos exactos de listings
- Los archivos generados (demographics.ts, geo-data.ts) NO se editan manualmente

## Roadmap

### Próximo: Tooltips informativos en gráficas
- Agregar tooltips sutiles a cada gráfica/card explicando qué muestra y cómo interpretarla
- Ejemplos: scatter ("cada punto = 1 propiedad, abajo-derecha = mejor valor"), distribución de precios, índice de concentración
- Objetivo: que cualquier usuario entienda las gráficas sin conocimiento previo

### Futuro: Perfiles de usuario por nicho
- Quiz/onboarding para determinar perfil del inversionista
- Perfiles: residencial-venta, residencial-renta, comercial, desarrollo (terrenos)
- KPIs y cards especializados por perfil (ej: cap rate solo para renta, yield, ROI)
- Dashboard personalizado según perfil seleccionado
