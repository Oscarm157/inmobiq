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
- **Snapshots**: agregados semanales por zona (count, avg/median/min/max price, price/m²)
- **ZoneMetrics**: avg_price_per_m2, price_trend_pct, avg_ticket, total_listings, listings_by_type
- **ZoneRiskMetrics**: risk_score (incluye factor demográfico), volatility, cap_rate, vacancy_rate, liquidity_score

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
| `src/components/zone/demographics-card.tsx` | UI: perfil demográfico con NSE |
| `src/components/zone/zone-insights-card.tsx` | UI: indicadores cruzados |
| `src/components/comparar/demographic-comparison.tsx` | UI: radar + tabla demográfica en comparador |

## Convenciones
- Componentes server por defecto; "use client" solo cuando necesario
- Datos mock en `src/lib/mock-data.ts` para cuando Supabase no está disponible
- Precios siempre en MXN internamente; conversión USD en frontend via `useCurrency()`
- Activity labels cualitativos en vez de conteos exactos de listings
- Los archivos generados (demographics.ts, geo-data.ts) NO se editan manualmente
