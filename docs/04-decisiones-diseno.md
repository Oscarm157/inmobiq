# Inmobiq — Decisiones de Diseño y UX

---

## Identidad Visual

### Paleta de colores
- **Primary**: Blue-700 (`#1d4ed8`) — acciones, links activos, sidebar active state
- **Background**: Slate-50 (`#f8fafc`) — fondo principal
- **Cards**: White con `.card-shadow` sutil
- **Text**: Slate-900 (principal), Slate-500 (secundario), Slate-400 (terciario)
- **Semánticos**: Green-600 (positivo/bajo riesgo), Amber-500 (neutral/medio), Red-500 (negativo/alto)
- **Badges**: Fondo tenue + texto oscuro del mismo color (ej. `bg-blue-100 text-blue-700`)

### Tipografía
- **Font**: Plus Jakarta Sans — moderna, geométrica, excelente para dashboards
- **Pesos usados**: 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold/black)
- **Tamaños clave**:
  - `text-[10px] font-black uppercase tracking-widest` → labels/meta
  - `text-sm font-semibold` → body content
  - `text-2xl font-black` → KPI values
  - `text-4xl font-extrabold tracking-tight` → page titles

### Iconografía
- **Material Symbols Outlined** (variable font)
- Wrapper component `<Icon name="dashboard" filled? className? />`
- Se usa `filled` para nav activa en mobile

---

## Layout

### Por qué sidebar fijo + header fijo
- Patrón estándar de dashboards ejecutivos (Stripe, Linear, Vercel)
- El usuario siempre ve la navegación y puede cambiar de módulo sin scroll
- Header con búsqueda siempre accesible

### Sidebar colapsable
- **Decisión**: Usar React Context (`SidebarProvider`) en vez de prop drilling
  - El sidebar, header y main content necesitan reaccionar al estado collapsed
  - Están en componentes hermanos (no parent-child), context es la solución natural
- **Estado default**: Expandido (w-64). El usuario decide cuándo colapsar.
- **Transición**: 300ms `transition-all` en sidebar, header y main para que se muevan sincronizados
- **Colapsado**: Solo iconos (w-16) con `title` tooltip en hover

### Responsive
- **Desktop (md+)**: Sidebar izquierdo + header top + contenido con offset
- **Mobile (<md)**: Sidebar oculto, bottom nav con 5 tabs, header full width
- Breakpoints: `md:` (768px) para sidebar/bottom nav toggle, `lg:` (1024px) para grids de 3-4 cols, `sm:` (640px) para grids de 2 cols

---

## Datos Mock

### Por qué datos realistas
- Las 8 zonas son zonas **reales** de Tijuana con nombres y precios verosímiles
- Los precios están en el rango real del mercado (2025): $15,200-$38,200 MXN/m²
- Permite validar la UI con datos que tienen sentido financiero
- Los agentes autónomos pueden contextualizar cambios sin preguntarse si los datos son coherentes

### Por qué mock en vez de API desde el inicio
- Permite iterar UI rápidamente sin depender de backend
- El usuario puede ver el producto completo antes de invertir en scraping/DB
- Los tipos TypeScript ya están definidos para Supabase → la migración será mecánica

---

## Modelo de Riesgo (simplificado)

El risk_score no es un cálculo real — es un valor asignado que simula lo que produciría un modelo:

- **Risk Score (1-100)**: Combina volatilidad, vacancia, y liquidez inversamente
- **Cap Rate**: Renta anual / Precio × 100. Zonas baratas tienen mayor cap rate (Centro: 9.1%)
- **Vacancy Rate**: Menor en zonas industriales/residenciales consolidadas
- **Liquidity Score**: Basado en total_listings (proxy de actividad). Zona Río: 88, Bosque: 42
- **Risk Labels**: Bajo (<40), Medio (40-55), Alto (>55) — umbrales arbitrarios pero consistentes

---

## Portfolio Explorer

### Por qué 3 presets fijos en vez de builder libre
- Un portfolio builder completo requiere backend, estado persistente, y validación
- Los presets dan valor inmediato mostrando estrategias concretas con métricas calculadas
- Cada preset tiene allocations que suman exactamente 100%
- Los cálculos de retorno/riesgo ponderado se hacen client-side con `reduce()`

### Cálculos
```
Retorno ponderado = Σ (zone.price_trend_pct × allocation_pct / 100)
Riesgo ponderado = Σ (zone.risk_score × allocation_pct / 100)
```
Estos se recalculan en cada render al cambiar el preset seleccionado.

---

## Pipeline Kanban

### Decisión de 3 columnas
- **Planificación**: Proyectos en diseño, sin ventas (units_sold = 0)
- **Pre-Venta**: En comercialización, algunas unidades vendidas
- **Construcción**: En obra, progreso significativo de ventas
- No incluimos "Entregado" como columna visible (es un status futuro en el tipo, no hay proyectos con ese status)

### Progress bars
- `width = (units_sold / units_total) × 100%`
- Planificación siempre muestra 0%
- Visualmente comunica qué tan avanzada está la absorción

---

## Convenciones de Código

### Rutas en español
- `/riesgo`, `/portafolio`, `/pipeline` — producto para mercado mexicano
- Excepto `/pipeline` que es un término técnico universal

### UI bilingüe
- **Badges y labels técnicos**: En inglés ("Market Overview", "Risk Analysis", "Live Data")
- **Contenido y descripciones**: En español ("Análisis de Riesgo de Inversión", "Zonas Monitoreadas")
- **Razón**: El público objetivo (inversores/brokers) está familiarizado con terminología financiera en inglés

### SSG vs Client Components
- **Server Components por default** (páginas estáticas, sin interactividad)
- **"use client"** solo cuando es necesario:
  - `sidebar.tsx` → usa `usePathname()` y context
  - `sidebar-provider.tsx` → usa `useState`/`createContext`
  - `sidebar-shell.tsx` → lee context
  - `top-header.tsx` → lee context
  - `bottom-nav.tsx` → usa `usePathname()`
  - `portafolio/page.tsx` → usa `useState` para selección de preset
  - `risk-matrix.tsx` → Recharts requiere client
  - `price-chart.tsx`, `zones-bar-chart.tsx` → Recharts requiere client

### Estilo de componentes
- Sin CSS modules ni styled-components — todo Tailwind inline
- `cn()` para clases condicionales: `cn("base-class", active && "active-class")`
- `card-shadow` como clase utilitaria global en globals.css
- Hover effects: `-translate-y-1` o `scale-[1.02]` con `transition-all`
