# Inmobiq — Páginas y Componentes

---

## Páginas (5 rutas)

### 1. `/` — Market Overview
**Archivo**: `src/app/page.tsx`
**Rendering**: Static (Server Component)
**Datos**: `TIJUANA_CITY_METRICS`, `TIJUANA_ZONES`

Secciones:
1. **Page header** — Título "Mercado Inmobiliario: Tijuana", badges (Market Overview, Live Data), botones Filtros + Exportar
2. **KPIs ciudad** (grid 3 cols) — `KPIPrecio` (precio/m² + tendencia + sparkline), `KPIInventario` (listings + barra de absorción 76%), `KPIPlusvalia` (tendencia + nota de riesgo)
3. **Charts** (grid 2 cols) — `PriceChart` (AreaChart 12 meses) + `ZonesBarChart` (BarChart horizontal por zona)
4. **Zonas Monitoreadas** (grid 4 cols) — 8 `ZoneCard` con link a `/zona/[slug]`

### 2. `/zona/[slug]` — Zone Analytics
**Archivo**: `src/app/zona/[slug]/page.tsx`
**Rendering**: SSG con `generateStaticParams()` (8 slugs)
**Datos**: `TIJUANA_ZONES`, `TIJUANA_CITY_METRICS`

Secciones:
1. **Page header** — Nombre de zona + badge dinámico (Premium District, High Demand, Price Correction, High Volume)
2. **Editorial card** — `EditorialCard` con texto dinámico basado en posición de precio de la zona vs ciudad
3. **KPIs zona** (grid 3 cols) — Mismos 3 KPIs pero con datos de la zona específica
4. **Content grid** — `HeatmapCard` (toggle VENTA/RENTA) + `ComparisonTable` (zona vs ciudad)
5. **Pipeline section** — Cards de proyectos en la zona usando `PipelineCard`

Lógica dinámica:
- `badge` se asigna según: precio > promedio + tendencia > 5% → "Premium District", etc.
- `absorptionRate` se calcula a partir de `price_trend_pct`
- `riskNote` varía según clasificación de tendencia (alta demanda, corrección, estable)

### 3. `/riesgo` — Investment Risk
**Archivo**: `src/app/riesgo/page.tsx`
**Rendering**: Static (Server Component, con `RiskMatrix` como Client Component)
**Datos**: `ZONE_RISK_DATA`, `TIJUANA_ZONES`

Secciones:
1. **Page header** — "Análisis de Riesgo de Inversión", badges, botones Parámetros + Exportar
2. **KPIs resumen** (grid 3 cols) — Risk Score promedio, Cap Rate promedio, Vacancia promedio (calculados con `.reduce()`)
3. **Risk Matrix** — `RiskMatrix` component: Recharts `ScatterChart` con ejes Risk Score (X) vs Retorno % (Y), puntos coloreados por riesgo (verde/ámbar/rojo)
4. **Zone Risk Cards** (grid 4 cols) — 8 `RiskZoneCard` ordenadas por risk_score ascendente
5. **Nota Metodológica** — Bloque editorial con drop cap, quote, y info del modelo de riesgo

### 4. `/portafolio` — Portfolio Explorer
**Archivo**: `src/app/portafolio/page.tsx`
**Rendering**: Client Component (`"use client"`, usa `useState`)
**Datos**: `PORTFOLIO_PRESETS`, `TIJUANA_ZONES`, `ZONE_RISK_DATA`

Secciones:
1. **Page header** — "Explorador de Portafolios", badge, botón Exportar
2. **Preset Cards** (grid 3 cols) — 3 cards seleccionables (Conservador/Balanceado/Agresivo), estado con `useState("balanceado")`, highlight con border-blue-600 + ring
3. **Detail grid** (12 cols):
   - **Allocation Table** (8 cols) — Zonas del preset seleccionado con precio/m², tendencia, barra de asignación %
   - **Summary Card** (4 cols) — Retorno ponderado (calculado con `reduce()`), riesgo ponderado, count de zonas, barra de diversificación
4. **Recommendation box** — Texto contextual según `risk_level` del preset seleccionado

Cálculos en tiempo real:
```typescript
weightedReturn = allocations.reduce(alloc => zone.price_trend_pct * alloc.allocation_pct / 100)
weightedRisk = allocations.reduce(alloc => risk.risk_score * alloc.allocation_pct / 100)
```

### 5. `/pipeline` — Development Pipeline
**Archivo**: `src/app/pipeline/page.tsx`
**Rendering**: Static (Server Component)
**Datos**: `PIPELINE_PROJECTS_EXTENDED`

Secciones:
1. **Page header** — "Pipeline de Desarrollo", badges (count de proyectos), botones Filtrar + Nuevo Proyecto
2. **KPIs resumen** (grid 3 cols) — Total proyectos, Total unidades, Absorción global (% vendido)
3. **Kanban** (grid 3 cols) — 3 columnas: Planificación, Pre-Venta, Construcción. Cada proyecto tiene imagen, badge status, zona, descripción, progress bar (units_sold/units_total), fecha de entrega, label de inversores
4. **Zone Distribution** — Barras horizontales mostrando proyectos por zona

---

## Componentes (22 archivos)

### Layout Components

| Componente | Archivo | Props | Descripción |
|---|---|---|---|
| `Sidebar` | `sidebar.tsx` | — | Nav lateral colapsable. Lee `collapsed`/`toggle` del context. 5 nav items. |
| `SidebarProvider` | `sidebar-provider.tsx` | `children` | Context provider: `{ collapsed: boolean, toggle: () => void }` |
| `SidebarShell` | `sidebar-shell.tsx` | `children` | Wrapper: Sidebar + TopHeader + main + BottomNav. Offsets dinámicos. |
| `TopHeader` | `top-header.tsx` | — | Header fijo con search bar, notificaciones, settings, avatar. Offset `md:left-64/16`. |
| `BottomNav` | `bottom-nav.tsx` | — | Nav mobile (5 items). Usa `usePathname()` para highlight. |
| `Icon` | `icon.tsx` | `name, className?, filled?` | Wrapper de Material Symbols Outlined. |

### KPI Cards

| Componente | Archivo | Props |
|---|---|---|
| `KPIPrecio` | `kpi-precio.tsx` | `pricePerM2: number, trendPct: number` |
| `KPIInventario` | `kpi-inventario.tsx` | `totalListings: number, absorptionPct: number` |
| `KPIPlusvalia` | `kpi-plusvalia.tsx` | `trendPct: number, riskNote: string` |

Cada KPI card tiene: icono, label, valor grande, indicador de tendencia o barra.

### Data Visualization

| Componente | Archivo | Props | Chart Type |
|---|---|---|---|
| `PriceChart` | `price-chart.tsx` | — | Recharts `AreaChart` (usa `PRICE_TREND_DATA`) |
| `ZonesBarChart` | `zones-bar-chart.tsx` | — | Recharts `BarChart` horizontal (usa `TIJUANA_ZONES`) |
| `RiskMatrix` | `risk-matrix.tsx` | — | Recharts `ScatterChart` (usa `ZONE_RISK_DATA` + `TIJUANA_ZONES`) |
| `HeatmapCard` | `heatmap-card.tsx` | — | Visualización estática de mapa con toggle VENTA/RENTA |

### Content Cards

| Componente | Archivo | Props |
|---|---|---|
| `ZoneCard` | `zone-card.tsx` | `zone: ZoneMetrics` |
| `RiskZoneCard` | `risk-zone-card.tsx` | `risk: ZoneRiskMetrics` |
| `EditorialCard` | `editorial-card.tsx` | `title, body, quote?, author?` |
| `PipelineCard` | `pipeline-card.tsx` | `project: { img, name, badge, badgeColor, sub, investors, investorLabel }` |
| `ComparisonTable` | `comparison-table.tsx` | `zone: ZoneMetrics, city: CityMetrics` |

### shadcn/ui Components

| Componente | Archivo |
|---|---|
| `Badge` | `ui/badge.tsx` |
| `Button` | `ui/button.tsx` |
| `Card` | `ui/card.tsx` |
| `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` | `ui/chart.tsx` |

Estos son componentes base de shadcn que wrappean Recharts y proveen estilos consistentes.

---

## Patrones de UI Comunes

### Card Pattern
```tsx
<div className="bg-white rounded-xl p-5 card-shadow hover:-translate-y-1 transition-all">
  {/* Header con ícono + badge */}
  {/* Contenido */}
</div>
```

### Badge Pattern
```tsx
<span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full tracking-widest uppercase">
  Label
</span>
```

### Progress Bar Pattern
```tsx
<div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
</div>
```

### Page Header Pattern
```tsx
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div className="space-y-1">
    {/* Badges */}
    <h2 className="text-4xl font-extrabold tracking-tight">Título</h2>
    <p className="text-slate-500 max-w-xl font-medium">Descripción</p>
  </div>
  <div className="flex gap-3">{/* Botones de acción */}</div>
</div>
```

### Responsive Grid Pattern
- Mobile: `grid-cols-1`
- Tablet: `sm:grid-cols-2`
- Desktop: `lg:grid-cols-3` o `lg:grid-cols-4`
- Gap: `gap-4` o `gap-6`
