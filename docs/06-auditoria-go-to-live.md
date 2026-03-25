# Auditoría Go-to-Live — Inmobiq

**Fecha**: 25 de marzo de 2026
**Lanzamiento objetivo**: 27 de abril de 2026
**Score Go-to-Live**: ~60%

---

## Resumen Ejecutivo

Inmobiq es una plataforma funcionalmente completa con 14 páginas, pipeline de datos robusto, autenticación, y exportaciones. Sin embargo, hay gaps críticos en seguridad, legal, monitoreo, y polish de UX que deben resolverse antes del lanzamiento.

### Lo que ya funciona bien
- Las 14 páginas principales renderizan correctamente
- Dashboard, análisis de zona, comparador, riesgo, portafolio, pipeline, mapa
- Dark mode, responsive, filtros, exports, auth con Google OAuth + email
- TypeScript strict sin errores de build
- Pipeline de datos con validación, dedup, y zone assignment
- RLS habilitado en todas las tablas de Supabase

### Lo que falta (organizado por prioridad)
1. **Seguridad** — Rotar API keys, security headers, rate limiting
2. **Legal** — Privacy policy, términos de servicio (requerido por LFPDPPP)
3. **Monitoreo** — Sentry, analytics, uptime monitoring
4. **SEO** — robots.txt, sitemap, favicon, OG images
5. **UX Polish** — Error boundaries, skeleton loaders, accesibilidad
6. **Backend** — Alertas funcionales, email service, CI/CD

---

## 1. Frontend — Páginas y Rutas

### Inventario completo de páginas

| Ruta | Estado | Notas |
|------|--------|-------|
| `/` | COMPLETO | Dashboard con KPIs, charts, grid de zonas, filtros, currency switcher |
| `/login` | COMPLETO | Google OAuth + email/password, manejo de errores, redirects |
| `/zona/[slug]` | COMPLETO | 15+ visualizaciones, demografía, insights, pipeline, export. Metadata dinámica |
| `/comparar` | COMPLETO | Hasta 4 zonas, radar demográfico, scatter precio vs m², tablas por tipo |
| `/mapa` | COMPLETO | Mapbox interactivo con zonas coloreadas por precio/m² |
| `/riesgo` | COMPLETO | Matriz de riesgo, KPIs, cards por zona, metodología documentada |
| `/portafolio` | COMPLETO | Presets, filtros, grid de listings, vista mapa, empty state |
| `/pipeline` | COMPLETO | Kanban por status, cards de proyectos, distribución por zona |
| `/buscar` | COMPLETO | Búsqueda global, min 3 chars, resultados de zonas y propiedades |
| `/perfil` | COMPLETO | Profile con auth check, badge Google/email, sign out |
| `/alertas` | PARCIAL | Página existe pero el backend de alertas no está implementado |
| `/admin/scraper` | COMPLETO | UI de scraping manual, historial, guardado de resultados |

### Protección de rutas
- `/perfil`, `/alertas`, `/admin` — requieren autenticación (redirect a `/login`)
- `/admin/*` — requiere `role = "admin"` en `user_profiles`
- Middleware en `middleware.ts` refresca sesión en cada request

---

## 2. Frontend — UI/UX Polish

### Loading States
| Componente | Estado | Detalle |
|-----------|--------|---------|
| Home filters | Tiene Suspense | Fallback mínimo (solo icon) |
| Zone filters | Tiene Suspense | Fallback vacío (`<div className="h-10">`) |
| Mapa | Tiene Suspense | "Cargando mapa..." |
| Búsqueda | Tiene spinner | "Buscando..." |
| Login | Tiene Suspense | "Cargando..." |

**Pendiente**: No hay skeleton components reutilizables. Los fallbacks de Suspense son mínimos o vacíos.

### Error States
- Login maneja errores de URL params y form submission
- Zone page usa `notFound()` si slug no existe
- Export button tiene try-catch pero solo logea a console
- **FALTA**: No hay `error.tsx` global (error boundary de Next.js)
- **FALTA**: No hay página 500 personalizada

### Empty States
- Portfolio: "Sin resultados" con emoji y mensaje
- Búsqueda: Icon + "Sin resultados"
- **FALTA**: Comparador no muestra empty state con 0 zonas seleccionadas

### Responsive / Mobile
- Tailwind breakpoints en todo el proyecto (`flex-col md:flex-row`, grid responsive)
- Bottom nav en mobile, sidebar collapsa a iconos
- **FALTA**: No hay optimizaciones táctiles explícitas

### Accesibilidad (A11y)
| Issue | Severidad | Ubicación |
|-------|-----------|-----------|
| Icons sin ARIA labels | ALTA | `src/components/icon.tsx` |
| Forms sin `<label>` | ALTA | Todos los filtros (market-filters, listings-filters, zone-filters) |
| Algunas imágenes sin `alt` | MEDIA | `heatmap-card.tsx` |
| Sidebar sin role ARIA | BAJA | `src/components/sidebar.tsx` |

---

## 3. SEO y Meta Tags

| Recurso | Estado | Acción |
|---------|--------|--------|
| `robots.txt` | NO EXISTE | Crear en `/public/robots.txt` |
| `sitemap.xml` | NO EXISTE | Crear en `/public/sitemap.xml` |
| `favicon.ico` | NO EXISTE | Agregar en `/public/` |
| Open Graph tags | NO EXISTE | Agregar `og:image`, `og:title`, `og:description` |
| Twitter Cards | NO EXISTE | Agregar meta tags |
| `lang="es"` | EXISTE | Root layout correcto |
| Meta title/description | PARCIAL | Existe en root y páginas principales, falta en `/perfil`, `/alertas` |
| `generateMetadata()` dinámico | EXISTE | En `/zona/[slug]` y `/buscar` |

---

## 4. Autenticación y Flujo de Usuario

### Flujo completo
1. **Login** → Google OAuth o email/password
2. **Middleware** → Refresca sesión, verifica auth, checa role admin
3. **Auth Context** → Provider en root layout, hook `useAuth()` con `user`, `session`, `isAdmin`
4. **Callback** → `/auth/callback` intercambia code por session, redirect a `?next=`
5. **Logout** → Inmediato vía `signOut()`

### Gaps en auth
| Issue | Severidad | Detalle |
|-------|-----------|---------|
| Sin flujo de "olvidé contraseña" | ALTA | No hay UI para reset de password |
| Sin reenvío de verificación email | MEDIA | Solo dice "Revisa tu correo", sin opción de reenviar |
| Sin MFA/2FA | BAJA | No crítico para MVP |
| `user_profiles` depende de trigger | MEDIA | Se crea automáticamente pero verificar que el trigger existe en prod |

---

## 5. Backend — API Endpoints

### Inventario de endpoints

| Endpoint | Método | Auth | Validación | Estado |
|----------|--------|------|------------|--------|
| `/api/search` | GET | Ninguna | Min 3 chars | COMPLETO |
| `/api/data-reports` | POST | User | Valida chart_type enum | COMPLETO |
| `/api/admin/scrape` | POST | Admin | Valida URL format | COMPLETO |
| `/api/admin/scrape/save` | POST | Admin | Valida portal, property_type | COMPLETO |
| `/api/admin/scrape/history` | GET | Admin | Page param | COMPLETO |
| `/api/admin/audit` | GET | Admin | Ninguna | COMPLETO |
| `/api/export/listings` | POST | **NINGUNA** | Format enum | **FALTA AUTH** |
| `/api/export/zone-report` | POST | User | zone_slug required | COMPLETO |
| `/api/export/risk-report` | POST | User | Ninguna | COMPLETO |

**Issue crítico**: `POST /api/export/listings` no requiere autenticación — cualquiera puede exportar todos los listings activos.

---

## 6. Base de Datos

### Tablas principales

| Tabla | Registros | RLS | Indexes | Estado |
|-------|-----------|-----|---------|--------|
| `zones` | 30 zonas | Public SELECT | UNIQUE(slug) | OK |
| `listings` | Variable | Public SELECT (is_active) | 8 indexes | OK |
| `snapshots` | Semanal | Public SELECT | 3 indexes | OK |
| `city_snapshots` | Semanal | Public SELECT | — | OK |
| `user_profiles` | Por usuario | Private (own) | Sin index en email | FALTA INDEX |
| `portfolio_presets` | Por usuario | Private (own) | — | OK |
| `price_alerts` | Por usuario | Private (own) | 3 indexes | OK |
| `property_clusters` | Dedup | — | 2 indexes | OK |
| `scrape_jobs` | Admin | Admin only | 2 indexes | OK |
| `data_reports` | Dev feature | User/Admin | 3 indexes | OK |
| `scraper_runs` | Tracking | — | — | OK |

### Issues de base de datos
| Issue | Severidad | Detalle |
|-------|-----------|---------|
| Sin index geográfico | MEDIA | `listings(lat, lng)` no tiene index — queries geográficas lentas |
| Sin index en `created_at` | BAJA | Paginación por recencia será lenta con volumen |
| Sin index en `user_profiles.email` | BAJA | Auth lookup podría ser lento |
| Migraciones pendientes | ALTA | `PENDING_run_in_sql_editor.sql` no aplicado |

---

## 7. Pipeline de Datos / Scraping

### Arquitectura
1. **Adapters** (4): inmuebles24, lamudi, vivanuncios, mercadolibre → Apify actors
2. **Extractor universal** (4 capas): JSON-LD → OpenGraph → Heuristic → AI (Claude fallback)
3. **Normalización**: Bounds de precio por tipo, conversión USD/MXN (tasa fija 17.5)
4. **Zone assignment** (4 pasos): Colonia fuzzy match → Título match → Point-in-polygon → Nearest 3km
5. **Dedup**: Fingerprints estructural + geográfico, clustering, vista canonical
6. **Snapshots**: Agregados semanales por zona

### Validación de datos
- Precio absoluto por tipo (ej: residencial venta $300K-$50M)
- Precio/m² por tipo (ej: residencial venta $3K-$200K/m²)
- Outlier removal IQR con multiplicador 2.0 (solo para gráficas)
- Script de auditoría: `npm run audit`

### Issues del pipeline
| Issue | Severidad | Detalle |
|-------|-----------|---------|
| Sin timeout en AI extraction | MEDIA | Llamada a Claude puede colgar todo el scrape |
| Dedup post-upsert | BAJA | Duplicados visibles por horas hasta que corre dedup |
| Tasa USD/MXN fija (17.5) | BAJA | Debería ser dinámica o configurable |
| Zone assignment ~80% success | MEDIA | 20% cae en "Otros" |

---

## 8. Seguridad

### Issues Críticos

#### A. API Keys en `.env.local` (CRÍTICO)
Las keys están en el archivo `.env.local` que SÍ está en `.gitignore`, pero verificar que nunca se subieron al historial de git:
- `SUPABASE_SERVICE_ROLE_KEY` — acceso completo a BD
- `ANTHROPIC_API_KEY` — API de Claude
- `APIFY_API_TOKEN` — scrapers

**Acción**: Verificar historial de git. Si están expuestas, rotar inmediatamente.

#### B. Sin Rate Limiting (ALTO)
- Ningún endpoint tiene rate limiting
- Admin scrape puede causar DoS
- Export de PDFs es CPU-heavy sin límite

**Acción**: Implementar rate limiting (`@upstash/ratelimit` o similar)

#### C. Sin Security Headers (ALTO)
Missing en `next.config.ts`:
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy

#### D. Export sin auth (ALTO)
`POST /api/export/listings` no requiere autenticación.

#### E. Error messages filtran info (MEDIO)
API retorna errores específicos ("source_portal inválido") que revelan estructura interna.

#### F. Sin audit logging (MEDIO)
No hay registro de quién exportó datos, quién triggeó scrapes, etc.

---

## 9. Infraestructura y Deploy

### Vercel
- **Proyecto**: inmobiq (linked y configurado)
- **Branch de producción**: main
- **Build**: Exitoso, 53 páginas pre-rendered, 13.7s
- **First Load JS**: ~264 kB (home)

### CI/CD
- **NO EXISTE** — sin GitHub Actions, sin checks en PR
- **Acción**: Crear `.github/workflows/build.yml` con TypeScript check, ESLint, tests

### Dominio
- **NO CONFIGURADO** — solo `inmobiq.vercel.app`
- **Acción**: Registrar dominio custom y configurar DNS

### Monitoreo
| Servicio | Estado | Acción |
|----------|--------|--------|
| Sentry (error tracking) | NO EXISTE | Instalar `@sentry/nextjs` |
| Analytics (GA/Plausible) | NO EXISTE | Instalar Vercel Analytics o Plausible |
| Uptime monitoring | NO EXISTE | Configurar UptimeRobot |
| Health check endpoint | NO EXISTE | Crear `/api/health` |

### Backups
- Supabase tiene backups automáticos (14 días en plan standard)
- No hay scripts de backup/restore propios
- No hay plan de disaster recovery documentado

---

## 10. Legal

### Páginas faltantes (CRÍTICO para México — LFPDPPP)

| Página | Estado | Requerida por |
|--------|--------|--------------|
| Política de Privacidad | NO EXISTE | LFPDPPP (México), GDPR |
| Términos y Condiciones | NO EXISTE | Best practice legal |
| Aviso de Cookies | NO EXISTE | Best practice, GDPR si hay usuarios EU |

**Acción**: Crear estas páginas ANTES del lanzamiento. La LFPDPPP requiere aviso de privacidad para cualquier tratamiento de datos personales en México.

---

## 11. Notificaciones / Alertas

| Componente | Estado | Detalle |
|-----------|--------|---------|
| Tabla `price_alerts` | EXISTE | Schema completo con conditions y thresholds |
| UI de alertas (`/alertas`) | PARCIAL | Página existe, funcionalidad limitada |
| Servicio de email | NO EXISTE | Sin Sendgrid/Resend/SES |
| Cron de evaluación | NO EXISTE | Alertas se guardan pero nunca se disparan |
| `alert_triggers` table | NO EXISTE | Sin tracking de envíos |

**Acción**: Para MVP, al menos implementar notificaciones in-app. Email puede ser post-launch.

---

## 12. Performance

### Bundle sizes
| Ruta | Size | First Load JS |
|------|------|--------------|
| `/` | 36 kB | 264 kB |
| `/zona/[slug]` | 15.2 kB | 230 kB |
| `/comparar` | 15.5 kB | 295 kB (más grande) |
| `/portafolio` | 8.8 kB | 119 kB |
| `/admin/scraper` | 5.7 kB | 171 kB |

### Issues de performance
| Issue | Severidad | Detalle |
|-------|-----------|---------|
| `force-dynamic` en zona | MEDIA | Cada request a `/zona/[slug]` golpea la BD |
| `<img>` sin `next/image` | MEDIA | top-header, pipeline-card, heatmap-card |
| `geo-data.ts` 10,400 líneas | BAJA | Solo se importa en componentes de mapa (dynamic import) |
| Comparar 295 kB | BAJA | Podría lazy-load tablas de comparación |

---

## 13. Testing

| Tipo | Estado | Detalle |
|------|--------|---------|
| Vitest (unit tests) | CONFIGURADO | Solo 1 archivo de test: `market-filters.test.ts` |
| E2E tests | NO EXISTE | Sin Playwright/Cypress tests |
| CI integration | NO EXISTE | Tests no corren automáticamente |

**Acción**: Al menos agregar smoke tests para auth flow, pages principales, y exports.

---

## 14. Dependencias

### Todas actualizadas
| Paquete | Versión | Estado |
|---------|---------|--------|
| next | ^15.3.0 | Actual |
| react | ^19.0.0 | Actual |
| typescript | ^5.7.0 | Actual |
| tailwindcss | ^4.2.2 | Actual |
| @supabase/supabase-js | ^2.49.0 | Actual |
| mapbox-gl | ^3.20.0 | Actual |
| recharts | ^2.15.4 | Actual |
| playwright | ^1.58.2 | Actual |

- 22 ESLint disable comments encontrados — investigar causas
- No se encontraron vulnerabilidades críticas en deps

---

## 15. Plan de Trabajo — 4 Semanas al Lanzamiento

### Semana 1 (Mar 26 – Abr 1): Seguridad y Legal

- [ ] Verificar que API keys no están en historial de git; rotar si es necesario
- [ ] Agregar security headers en `next.config.ts` (CSP, HSTS, X-Frame-Options)
- [ ] Agregar auth a `POST /api/export/listings`
- [ ] Implementar rate limiting en endpoints críticos
- [ ] Crear página de Política de Privacidad (`/politica-privacidad`)
- [ ] Crear página de Términos y Condiciones (`/terminos`)
- [ ] Agregar links en footer del layout

### Semana 2 (Abr 2 – 8): Monitoreo, SEO y Email

- [ ] Instalar y configurar Sentry (`@sentry/nextjs`)
- [ ] Agregar Vercel Analytics o Plausible
- [ ] Crear `robots.txt` y `sitemap.xml` en `/public/`
- [ ] Agregar favicon
- [ ] Agregar Open Graph meta tags (og:image, og:title, og:description)
- [ ] Crear `/api/health` endpoint
- [ ] Configurar UptimeRobot
- [ ] Aplicar migraciones pendientes (`PENDING_run_in_sql_editor.sql`)
- [ ] Agregar index geográfico a listings

### Semana 3 (Abr 9 – 15): Polish y Testing

- [ ] Crear `error.tsx` global (error boundary)
- [ ] Crear skeleton components para Suspense fallbacks
- [ ] Agregar ARIA labels a icons y forms
- [ ] Convertir `<img>` a `next/image` donde aplique
- [ ] Agregar flujo "Olvidé contraseña"
- [ ] Crear GitHub Actions workflow (build + lint + test)
- [ ] Escribir smoke tests E2E para páginas principales
- [ ] Agregar audit logging para operaciones sensibles

### Semana 4 (Abr 16 – 22): QA y Launch Prep

- [ ] Configurar dominio custom en Vercel
- [ ] Run Lighthouse audit (target: Accessibility 90+, Performance 85+)
- [ ] Test completo en mobile (iOS Safari, Android Chrome)
- [ ] Test completo de auth flow (signup, login, logout, protected routes)
- [ ] Test de exports (PDF, Excel, CSV)
- [ ] Verificar scraping automático funciona en producción
- [ ] Documentar procedimiento de deploy y rollback
- [ ] UAT final

### Buffer (Abr 23 – 26): Fixes finales
- [ ] Fix bugs encontrados en QA
- [ ] Performance tuning final
- [ ] Preparar comunicación de lanzamiento

---

## 16. Servicios Externos — Dependencias

| Servicio | Uso | Criticidad | Fallback |
|----------|-----|-----------|----------|
| Supabase | BD, Auth, RLS | CRÍTICO | No hay — servicio core |
| Mapbox | Mapas interactivos | ALTA | Fallback text "Cargando mapa..." |
| Anthropic API | Insights AI, extractor fallback | MEDIA | Se pueden mostrar insights estáticos |
| Apify | Scraping de portales | MEDIA | Fallback a Playwright directo |
| Google OAuth | Login con Google | MEDIA | Fallback a email/password |
| Vercel | Hosting, CDN, SSL | CRÍTICO | No hay — servicio core |

---

## 17. Código y Calidad

- **150 archivos TypeScript/TSX**
- **TypeScript strict mode activado**
- **Sin errores de build**
- **Sin TODOs o console.logs en código de producción** (solo 1 console.error en export-button)
- **ESLint configurado** con reglas de Next.js
- **22 ESLint disables** — ninguno crítico
- **Tailwind v4** con CSS variables, theming consistente
- **App Router** de Next.js 15 (arquitectura moderna)

---

*Documento generado el 25 de marzo de 2026 por Claude Code*
*Scope: Auditoría completa de frontend, backend, infraestructura, seguridad, y UX*
