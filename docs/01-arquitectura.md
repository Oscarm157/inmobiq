# Inmobiq — Arquitectura y Stack Técnico

## Qué es Inmobiq

Dashboard de inteligencia inmobiliaria para Tijuana, B.C. Consolida datos de mercado (precios por m², tendencias, inventario, riesgo) en una interfaz ejecutiva para desarrolladores, inversionistas y brokers.

**URL de producción**: Se ejecuta con `npm run dev` en localhost:3000.

---

## Stack Técnico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 15.3+ | Framework (App Router, SSG) |
| React | 19.0 | UI rendering |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | 4.0 | Estilos utility-first |
| Recharts | 2.15 | Gráficos (Area, Bar, Scatter) |
| shadcn/ui | 4.0 | Componentes base (Card, Badge, Button, Chart) |
| clsx + tailwind-merge | — | Manejo dinámico de clases CSS |
| tw-animate-css | 1.4 | Animaciones CSS |
| Supabase JS | 2.49 | **Preparado pero no conectado** (futuro backend) |

### Tipografía e Iconos
- **Font**: Plus Jakarta Sans (Google Fonts) — pesos 300-800
- **Iconos**: Material Symbols Outlined (Google Fonts, variable weight/fill)
- Componente wrapper: `src/components/icon.tsx`

---

## Estructura de Carpetas

```
inmobiq/
├── docs/                          # Documentación del proyecto
├── public/                        # Assets estáticos
├── src/
│   ├── app/                       # Rutas (App Router)
│   │   ├── layout.tsx             # Root layout (SidebarProvider + SidebarShell)
│   │   ├── globals.css            # Variables CSS, tema, utilidades
│   │   ├── page.tsx               # / — Market Overview
│   │   ├── riesgo/page.tsx        # /riesgo — Investment Risk
│   │   ├── portafolio/page.tsx    # /portafolio — Portfolio Explorer
│   │   ├── pipeline/page.tsx      # /pipeline — Development Pipeline
│   │   └── zona/[slug]/page.tsx   # /zona/:slug — Zone Analytics (SSG)
│   ├── components/                # Componentes React (22 archivos)
│   │   ├── ui/                    # Componentes shadcn (badge, button, card, chart)
│   │   ├── sidebar.tsx            # Sidebar de navegación (colapsable)
│   │   ├── sidebar-provider.tsx   # Context para estado del sidebar
│   │   ├── sidebar-shell.tsx      # Wrapper de layout (sidebar + header + main)
│   │   ├── top-header.tsx         # Header fijo superior
│   │   ├── bottom-nav.tsx         # Navegación mobile
│   │   ├── icon.tsx               # Wrapper de Material Symbols
│   │   ├── kpi-precio.tsx         # KPI card: precio por m²
│   │   ├── kpi-inventario.tsx     # KPI card: inventario
│   │   ├── kpi-plusvalia.tsx      # KPI card: plusvalía
│   │   ├── price-chart.tsx        # Gráfico de tendencia (AreaChart)
│   │   ├── zones-bar-chart.tsx    # Comparación de zonas (BarChart)
│   │   ├── zone-card.tsx          # Card resumen de zona
│   │   ├── heatmap-card.tsx       # Visualización de mapa de calor
│   │   ├── comparison-table.tsx   # Tabla zona vs ciudad
│   │   ├── editorial-card.tsx     # Card editorial con drop cap
│   │   ├── pipeline-card.tsx      # Card de proyecto de pipeline
│   │   ├── risk-matrix.tsx        # Scatter chart riesgo vs retorno
│   │   └── risk-zone-card.tsx     # Card de riesgo por zona
│   ├── lib/
│   │   ├── mock-data.ts           # Todos los datos mock
│   │   └── utils.ts               # Utilidades (formatCurrency, cn, etc.)
│   └── types/
│       └── database.ts            # Todas las interfaces TypeScript
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Sistema de Layout

El layout usa un patrón de **Context Provider** para coordinar el sidebar colapsable con el header y el contenido principal.

```
RootLayout (layout.tsx)
└── SidebarProvider (context: collapsed, toggle)
    └── SidebarShell (lee collapsed del context)
        ├── Sidebar (w-64 expanded | w-16 collapsed, fixed left)
        ├── TopHeader (fixed top, offset dinámico según sidebar)
        ├── <main> (ml-64 | ml-16 según sidebar, pt-24 para header)
        └── BottomNav (mobile only, fixed bottom)
```

### Offsets y dimensiones
- Sidebar expandido: `w-64` (256px)
- Sidebar colapsado: `w-16` (64px)
- Header: `h-16` (64px), top fijo
- Content padding-top: `pt-24` (96px = header 64px + spacing)
- Transiciones: `transition-all duration-300` en sidebar, header y main
- Mobile: sidebar oculto (`hidden md:flex`), bottom nav visible (`md:hidden`)

---

## Routing

| Ruta | Archivo | Rendering | Descripción |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Static | Market Overview |
| `/zona/[slug]` | `src/app/zona/[slug]/page.tsx` | SSG | Zone Analytics (8 zonas) |
| `/riesgo` | `src/app/riesgo/page.tsx` | Static | Investment Risk |
| `/portafolio` | `src/app/portafolio/page.tsx` | Client | Portfolio Explorer (interactivo) |
| `/pipeline` | `src/app/pipeline/page.tsx` | Static | Development Pipeline |

- **SSG**: `/zona/[slug]` usa `generateStaticParams()` para pre-generar las 8 zonas
- **Client Components**: `/portafolio` tiene `"use client"` por el useState para selección de preset

---

## CSS y Theming

Archivo: `src/app/globals.css`

- Importa: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`
- Variables CSS en `:root` para colores: `--primary: #1d4ed8`, `--background: #f8fafc`, etc.
- Bloque `@theme inline` para mapear variables a Tailwind
- Clase utilitaria: `.card-shadow` → `box-shadow: 0 12px 32px -4px rgba(24,28,31,0.06)`
- **No hay dark mode** implementado (solo tema light, variables preparadas para futuro swap)

---

## Utilidades (`src/lib/utils.ts`)

```typescript
cn(...inputs)           // clsx + tailwind-merge para clases condicionales
formatCurrency(number)  // → "$32,500" (Intl.NumberFormat es-MX, MXN, 0 decimales)
formatNumber(number)    // → "1,603" (Intl.NumberFormat es-MX)
formatPercent(number)   // → "+4.2%" (signo + 1 decimal)
```

---

## Comandos

```bash
npm run dev     # Desarrollo (localhost:3000)
npm run build   # Build de producción
npm run start   # Servidor de producción
npm run lint    # ESLint
```

---

## Variables de Entorno

Archivo `.env.local` (no committeado):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
**Actualmente no se usan** — todo funciona con mock data. Preparado para cuando se conecte Supabase.
