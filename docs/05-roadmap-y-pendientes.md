# Inmobiq — Roadmap, Pendientes y Guía para Agentes

---

## Estado Actual (Marzo 2026)

MVP funcional con:
- 5 módulos de navegación completos
- 22 componentes UI
- Sidebar colapsable
- Responsive (desktop + mobile)
- Datos 100% mock (sin backend)
- Build exitoso con Next.js 15.3

**Lo que NO funciona aún**:
- Barra de búsqueda (decorativa)
- Botones de Filtros/Exportar/Parámetros (decorativos)
- Botón "Download Report" (decorativo)
- Notificaciones/Settings (decorativos)
- No hay autenticación
- No hay base de datos conectada
- No hay scraping real
- El heatmap es una imagen estática

---

## Roadmap Prioritario

### P0 — Infraestructura de Datos
1. **Conectar Supabase**
   - Crear tablas `zones` y `listings` en Supabase
   - Migrar `TIJUANA_ZONES` a tabla `zones`
   - Crear Views/RPCs para calcular `ZoneMetrics` y `CityMetrics` desde `listings`
   - Reemplazar imports de mock-data por queries con `@supabase/supabase-js`
   - La interfaz `Database` en `src/types/database.ts` ya tiene la estructura lista

2. **Pipeline de Scraping**
   - Scraper para 4 portales: inmuebles24, lamudi, vivanuncios, mercadolibre
   - Insertar en tabla `listings` con deduplicación
   - Ejecutar periódicamente (cron o edge function)
   - Tipos `SourcePortal` y `Listing` ya están definidos

### P1 — Funcionalidad Core
3. **Filtros funcionales**
   - Filtrar por: tipo de propiedad, rango de precio, zona, tipo de listado (venta/renta)
   - Afecta: Home (KPIs + charts), Zone Analytics, Risk
   - Sugerencia: URL params para filtros (shareable)

4. **Búsqueda funcional**
   - Search bar en `top-header.tsx` actualmente es decorativa
   - Buscar por: nombre de zona, nombre de proyecto, dirección
   - Dropdown de resultados con navegación

5. **Exportar**
   - PDF: Generar reporte de zona o portafolio (jsPDF o similar)
   - Excel: Exportar datos de tabla (xlsx)
   - Botones ya existen en todas las páginas

### P2 — Mejoras de UX
6. **Mapa interactivo real**
   - Reemplazar `heatmap-card.tsx` con Mapbox GL o Leaflet
   - Mostrar zonas como polígonos coloreados por precio/m²
   - Click en zona → navegar a `/zona/[slug]`

7. **Dark mode**
   - Variables CSS en `globals.css` ya usan custom properties
   - Agregar clase `.dark` al `<html>` y duplicar variables
   - Toggle en header (settings dropdown)

8. **Autenticación**
   - Supabase Auth (email/password + Google)
   - Proteger rutas con middleware
   - Perfil de usuario (avatar en header ya existe como placeholder)

### P3 — Nuevos Módulos
9. **Alertas y Notificaciones**
   - Campana en header → alertas de cambios de precio, nuevos listings
   - Configurar umbrales por zona

10. **Comparador de Zonas**
    - Seleccionar 2-3 zonas y ver side-by-side
    - Reutilizar `ComparisonTable` expandido

---

## Guía para Agentes Autónomos

### Cómo agregar una nueva zona

1. **`src/lib/mock-data.ts`** → Agregar objeto a `TIJUANA_ZONES` con todos los campos de `ZoneMetrics`
2. **`src/lib/mock-data.ts`** → Agregar objeto a `ZONE_RISK_DATA` con el mismo `zone_slug`
3. **`src/app/zona/[slug]/page.tsx`** → La zona se genera automáticamente via `generateStaticParams()` que itera `TIJUANA_ZONES`
4. (Opcional) Agregar proyectos de pipeline en `PIPELINE_PROJECTS_EXTENDED`

### Cómo agregar una nueva página

1. Crear `src/app/[ruta]/page.tsx`
2. Agregar nav item en `src/components/sidebar.tsx` (array `navItems`)
3. Agregar nav item en `src/components/bottom-nav.tsx` (array `mobileNav`)
4. Importar datos de `src/lib/mock-data.ts`
5. Seguir el page header pattern (ver `docs/03-paginas-y-componentes.md`)

### Cómo agregar un componente

1. Crear en `src/components/[nombre].tsx`
2. Usar `cn()` de `src/lib/utils.ts` para clases condicionales
3. Usar `formatCurrency()`, `formatNumber()`, `formatPercent()` para formateo
4. Usar `<Icon name="..." />` para iconos (buscar nombres en [Material Symbols](https://fonts.google.com/icons))
5. Exportar como named export

### Patrones a seguir

| Elemento | Patrón |
|---|---|
| Cards | `bg-white rounded-xl p-5 card-shadow` |
| Labels/meta | `text-[10px] font-black uppercase tracking-widest text-slate-500` |
| KPI values | `text-2xl font-black` o `text-3xl font-black` |
| Page titles | `text-4xl font-extrabold tracking-tight` |
| Buttons primary | `bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30` |
| Buttons secondary | `bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm` |
| Badges | `px-3 py-1 bg-[color]-100 text-[color]-700 text-[10px] font-bold rounded-full` |
| Hover cards | `hover:-translate-y-1 transition-all duration-300` |
| Progress bars | `h-2 bg-slate-100 rounded-full` → inner `h-full bg-blue-600 rounded-full` |
| Grids responsive | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |

### Archivos que NO deberías modificar (salvo que sea necesario)

- `src/app/globals.css` — Variables CSS ya configuradas, cambiar puede romper tema
- `tsconfig.json` — Configuración estándar de Next.js
- `postcss.config.mjs` — Configuración de PostCSS para Tailwind
- `src/components/ui/*` — Componentes de shadcn, se actualizan con `npx shadcn add`

### Archivos que SÍ vas a tocar frecuentemente

- `src/lib/mock-data.ts` — Para agregar/modificar datos
- `src/types/database.ts` — Para agregar tipos nuevos
- `src/components/sidebar.tsx` — Para agregar nav items
- `src/components/bottom-nav.tsx` — Para agregar nav items mobile
- `src/app/*/page.tsx` — Para crear/modificar páginas

---

## Dependencias Clave

```json
{
  "next": "^15.3.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "recharts": "^2.15.4",
  "tailwindcss": "^4.0.0",
  "@supabase/supabase-js": "^2.49.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.5.0",
  "class-variance-authority": "^0.7.1",
  "shadcn": "^4.0.8",
  "tw-animate-css": "^1.4.0",
  "lucide-react": "^0.469.0"
}
```

> **Nota**: `lucide-react` está instalado pero no se usa activamente (se usan Material Symbols). `@supabase/supabase-js` está instalado pero no conectado.

---

## Checklist para Verificar Cambios

```bash
# 1. Build sin errores
npm run build

# 2. Verificar que todas las rutas generan
# Esperar: /, /riesgo, /portafolio, /pipeline, /zona/[8 slugs]

# 3. Dev server
npm run dev
# Navegar a cada ruta y verificar render

# 4. Lint
npm run lint
```
