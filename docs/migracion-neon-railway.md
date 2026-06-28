# Migración Inmobiq: Supabase+Vercel → Neon+Railway

**Análisis completo + plan de ejecución. Documento de cálculo, no se ejecuta nada todavía.**

Fuente: 8 agentes de exploración sobre `/root/inmobiq` (2026-05-30) + `RUNBOOK-migracion-neon-railway.md` + `STACK-hosting-dns.md`. Inmobiq es el proyecto más pesado de la migración de 8 apps; los pilotos ya hechos fueron entre-brokers y alfresco.

## Índice
1. Veredicto
2. Contexto y decisiones tomadas
3. Inventario detallado (el análisis crudo)
4. Riesgos clasificados
5. Estrategia por fases
6. Estimación de esfuerzo
7. Decisiones pendientes
8. Archivos clave a tocar
9. Verificación
10. Correcciones a notas previas

---

## 1. Veredicto

Migración **grande pero no rara**: el método del runbook aplica, lo que escala es el volumen. Estimación **~12 a 15 días de trabajo asistido** (vs ~1-2 de entre-brokers, factor 6-8x). El riesgo se concentra en **auth** y en **NUMERIC→string**, no en la infraestructura.

**Qué la hace pesada:**
- Scraper con Playwright/Chromium para 3 de 4 portales.
- Brújula (IA): Claude Vision + narrativa, 3 endpoints de 60s, único punto de Storage.
- ~107 llamadas `.from()` en 17 tablas/vistas + el scraper.
- Auth rico: Google OAuth + email/password + reset + metadata custom; 13 consumidores.
- Escrituras a DB desde el navegador (`alerts.ts`), hoy protegidas solo por RLS.

**Qué juega a favor (confirmado):**
- Acoplamiento a Vercel casi nulo: cero `@vercel/*`, cero `revalidate`/ISR/edge/`waitUntil`.
- 0 server actions (no aplica el bug `next-action` del runbook) y 0 realtime.
- 16 tablas reales (no 32), sin extensiones (PostGIS, pg_trgm, etc.).
- Solo 1 vista y 1 función se usan; el resto es DDL muerto.
- Mock data completo como red de pruebas sin DB.

---

## 2. Contexto y decisiones tomadas

Plan global aprobado 2026-05-28: sacar 8 apps de Vercel+Supabase a Railway+Neon por costo. Método: una app a la vez, la vieja viva hasta verificar la nueva, cutover de dominio al final, reversible.

**Decisiones tomadas para inmobiq:**
- **Auth → Neon Auth (Better Auth)**: salida total de Supabase, como el piloto.
- **Framework → quedarse en Next 15**: se adapta el patrón del runbook de `src/proxy.ts` a `middleware.ts`. (Riesgo a verificar temprano con un spike: que `@neondatabase/auth` funcione en Next 15. Better Auth soporta App Router 13+, riesgo bajo-medio.)
- **Scraper en Railway → 2 servicios**: web liviano (Nixpacks, sin Chromium) + worker cron con Dockerfile que instala Chromium.

Stack destino (del runbook): Railway (hosting), Neon (Postgres serverless + Neon Auth = Better Auth), Drizzle ORM + `@neondatabase/serverless`, Cloudflare R2 (storage), Cloudflare (DNS).

---

## 3. Inventario detallado (el análisis crudo)

### 3.1 Base de datos: 16 tablas, 5 enums

**Datos de mercado (lectura pública):** `zones`, `listings`, `snapshots`, `city_snapshots`, `rental_snapshots`, `property_clusters`, `scraper_runs`, `scraper_errors`, `pipeline_projects`.

**Usuario / auth:** `user_profiles`, `portfolio_presets`, `price_alerts`, `valuations`, `scrape_jobs`, `data_reports`, `analytics_events`, `rate_limits`.

**Detalles que importan:**
- `listings` es la tabla central: precio (`price_mxn`, `price_usd` NUMERIC), áreas, `bedrooms/bathrooms/parking`, geo (`lat/lng`), `images JSONB`, `amenities TEXT[]`, atributos de renta, dedup (`fingerprint_struct/geo`, `cluster_id`), `is_active`. UNIQUE `(source_portal, external_id)`.
- **Columnas generadas:** `listings.area_m2` y `valuations.area_m2` son `GENERATED ALWAYS AS (COALESCE(area_construccion_m2, area_terreno_m2)) STORED`. En Drizzle: `generatedAlwaysAs()` y **OMITIR del insert/upsert** (incluirlas lanza error de Postgres).
- **Enums (5):** `property_type` (casa/departamento/terreno/local/oficina), `listing_type` (venta/renta), `source_portal` (inmuebles24/lamudi/vivanuncios/mercadolibre/otro), `scraper_status`, `condition_type`.
- IDs `uuid` con `gen_random_uuid()` (nativo, sin extensión). `analytics_events`/`rate_limits` usan `bigint identity`.

**Vistas (5, solo 1 se usa):**
- `v_deduplicated_listings` → **SÍ se usa** (scraper `snapshots.ts:62`). Recrear en Neon. DDL en `supabase/migrations/009_dedup.sql:37`.
- `v_zone_metrics`, `v_city_metrics`, `v_zone_risk`, `admin_user_stats` → **DDL muerto** (grep exhaustivo en 254 archivos: 0 usos). La lógica vive en TS (`lib/data/zones.ts`, `risk.ts`). Ignorar.

**Funciones (solo 1 se usa):**
- `fn_search_listings` → **SÍ** (`buscar/page.tsx:101` vía `.rpc()`, solo 2 de 11 params). Ya tiene fallback `ilike` en el mismo archivo. Portar a Drizzle.
- `fn_zone_price_history`, `fn_portfolio_summary` → 0 usos, ignorar.
- `handle_new_user` (trigger), `update_updated_at` x2 (triggers), `cleanup_rate_limits` → ver abajo.

**Triggers:**
- `updated_at` en `listings` y `valuations` → manejar en código (Drizzle `$onUpdate` o set explícito).
- `on_auth_user_created` → `handle_new_user()` crea el `user_profiles` tras signup. **Desaparece**: se reimplementa como creación explícita server-side tras el signup de Better Auth.

### 3.2 RLS (se reimplementa en código)

13 tablas con RLS. Clasificación:
- **Lectura pública** (`USING true`): `zones`, `snapshots`, `city_snapshots`, `pipeline_projects`; `listings` con `is_active=true`.
- **Por usuario** (`auth.uid() = user_id`): `user_profiles`, `portfolio_presets`, `price_alerts`, `valuations`.
- **Por rol admin** (`EXISTS ... role='admin'`): `scrape_jobs`, `data_reports`, `analytics_events` (insert público / select admin).

Drizzle corre como owner y se salta RLS, así que el control va en código. **Lo bueno:** el código ya filtra explícito por `user_id` en casi todo (ver 3.4 y 3.5). Hay que auditar cada query de tabla de usuario para no abrir fugas.

### 3.3 Auth (lo que más cambia)

**Flujos:** Google OAuth (PKCE) + email/password + reset password. No hay magic link/OTP. Metadata custom en signup: `phone`, `referral_source`.

**`src/contexts/auth-context.tsx`** expone el contrato:
`{ user, session, loading, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }`.
Inicializa con `getSession()` + `onAuthStateChange()`; calcula `isAdmin` con un SELECT a `user_profiles.role`. Persistencia de sesión la maneja el SDK (cookies vía middleware). **Conservar este contrato** al migrar evita tocar los consumidores.

**13 consumidores de `useAuth()`:** `admin/analytics`, `admin/scraper`, `admin/usuarios` (clients), `alertas-client`, `login/page`, `perfil/page`, `zones-grid-client`, `auth-banner`, `auth-gate`, `auth-modal`, `brujula/valuation-history`, `guided-tour`, `sidebar`, `top-header`.

**UI de auth:** `src/app/login/page.tsx` (3 modos: login/register/reset) y `src/components/auth-modal.tsx` (mismos campos: email, password, phone, referral_source). `onboarding-modal.tsx` es post-signup (captura `perfil`, setea cookies, PATCH a `/api/perfil`).

**Server-side auth:** `supabase.auth.getUser()` en 12 sitios (middleware, auth-gates, admin-auth, user-plan, varias rutas brújula/perfil/analytics).

**Callback:** `src/app/auth/callback/route.ts` con `exchangeCodeForSession(code)` + `?next`. Se reemplaza por el del nuevo proveedor.

**Middleware (`middleware.ts`):** hace hasta 2 queries a `user_profiles` por request (refresh sesión, role/is_active, seed de cookies de preferencia). Protege `/perfil`, `/exportar`, `/admin`. Redirige login→/app, admin sin rol→/app, cuenta inactiva→/login.

### 3.4 Capa de datos cliente ↔ servidor

**Clientes Supabase (a eliminar):** `supabase-server.ts` (SSR), `supabase.ts` (legacy), `supabase-browser.ts`, `supabase-admin.ts` (service-role) + clientes inline en `middleware.ts` y `auth/callback`, + service-role en `scraper/db.ts` y `scraper/snapshots.ts`, + 6 scripts.

**107 call sites de `.from()`** en 17 tablas/vistas. Top archivos: `lib/data/zones.ts` (9), `scraper/db.ts` (8), `scraper/snapshots.ts` (7), `scripts/consolidate-zones.ts` (7), `scraper/dedup.ts` (6), `lib/data/risk.ts` (4), `lib/data/listings.ts` (4).

**Operadores PostgREST a traducir:** `.or("price_mxn.gt.0,price_usd.gt.0")`, `.or("bedrooms.gte.4,bedrooms.in.(...)")`, `.or("name.ilike.%q%,slug.ilike.%q%")`, joins implícitos `zones!inner(name, slug)` (3 sitios), `.rpc("fn_search_listings")` (1).

**Lo que el navegador hace contra Supabase (CRÍTICO, hay que volverlo server):**
- `src/lib/data/alerts.ts` (`"use client"`): **DML directo** sobre `price_alerts`: `createAlert` (INSERT), `toggleAlert` (UPDATE), `deleteAlert` (DELETE) + 2 SELECT. Hoy lo protege RLS. → 3 API routes nuevas (`POST/PATCH/DELETE /api/alertas`) con validación de dueño (`user_id` desde la sesión, nunca del body). Consumidor: `alertas-client.tsx`.
- `src/lib/data/comparator.ts` (`"use client"`): SELECT a `zones` y `snapshots`. → `GET /api/comparar/snapshots`.
- `src/app/perfil/page.tsx` (`"use client"`): 2 SELECT a `user_profiles`. → server action o `GET /api/perfil`. (Los PATCH ya van por API, OK.)

**Mapa de `src/lib/data/` y dificultad de portar:**
- DIFÍCIL: `zones.ts` (5 queries paralelas, merge snapshot+listings, medianas ponderadas), `listings.ts` (join `zones!inner`, filtros de precio post-fetch por conversión USD→MXN, medianas en TS), `risk.ts` (stddev/volatilidad/cap rate en TS).
- MEDIO: `comparator.ts` (N queries paralelas), `trend-data.ts` (gap-fill con PRNG).
- FÁCIL: `snapshots.ts`, `pipeline.ts`, `alerts.ts`, y los puros (`normalize.ts`, `rental-*`, `zone-insights.ts`, `demographics.ts`, `mock-data.ts`).

**Medianas:** se calculan en TS (`median()` en `listings.ts`, `zones.ts`, `scraper/snapshots.ts`), NO en SQL. No hay que reimplementar `PERCENTILE_CONT`. Pero los inputs deben ser numbers reales (ver riesgo NUMERIC→string).

### 3.5 API: 20 rutas, 0 server actions

Rutas bajo `src/app/api/**` + `auth/callback`. Todas Node runtime (sin edge). Resumen de las que tocan algo no trivial:

| Ruta | Auth | Externos | maxDuration | Nota de migración |
|---|---|---|---|---|
| `brujula/extract` | sesión + plan | Anthropic Vision + **Storage** | 60 | Único punto de Storage → R2. El más expuesto al timeout |
| `brujula/confirm` | sesión | Anthropic (Haiku) | 60 | 5 `.from()` → Drizzle |
| `brujula/manual` | sesión + plan | Anthropic (Haiku) | 60 | admin client + queries de zona |
| `brujula/report` | sesión | jsPDF | - | PDF en memoria, OK en Railway |
| `brujula/history` | sesión | - | - | `.eq(user_id)` explícito, seguro |
| `admin/scrape` | admin | fetchPage (HTTP) | 60 | scrape on-demand de una URL |
| `admin/audit` | admin | - | 30 | **SELECT de TODOS los listings sin LIMIT** (riesgo OOM) |
| `admin/users` | admin | - | - | GET lista + PATCH toggle rol/activo |
| `admin/analytics`, `admin/scrape/*` | admin | - | - | service-role + verifyAdmin |
| `export/listings` | sesión + plan | xlsx | - | hasta 5000 filas + join zones |
| `export/{risk,zone}-report` | sesión + plan | jsPDF | - | consumen lib/data |
| `analytics` | pública | - | - | insert con user_id de la sesión |
| `data-reports`, `perfil`, `search`, `health` | varía | - | - | queries simples |

**Rate limiting** (`src/lib/rate-limit.ts`): cuenta filas en tabla `rate_limits` (service-role), sliding window, sin TTL (crece sola). Límites por endpoint (ej. brújula 3/mes free, exports 3/mes free, perfil 50/h, analytics 120/min por IP). Reescribir a Drizzle (o Redis/Upstash).

**Exports PDF/Excel:** `jspdf`/`xlsx`, puro Node en memoria, devuelven blob. Funcionan igual en Railway. Límite por plan vía `rate_limits`.

**Endpoints pesados vs timeout del LB de Railway (~30-60s):** `brujula/extract` (uploads Storage + Vision, 20-50s, ALTO), `admin/scrape` (fetch a portales externos lentos, 10-35s, MEDIO-ALTO), `brujula/confirm`/`manual` (Haiku + queries, 8-20s), `admin/audit` (descarga listings, riesgo memoria).

### 3.6 Storage: 1 bucket

`valuation-screenshots`, único call site `brujula/extract/route.ts:91`. Sube hasta 5 imágenes, guarda el path en `valuations.screenshot_paths`. No hay download/getPublicUrl. → migrar a Cloudflare R2 (S3 API).

### 3.7 Scraper (corazón de los datos)

**Mapa `src/scraper/`:** `adapters/` (inmuebles24 vía Apify; lamudi/vivanuncios/mercadolibre vía Playwright), `apify-client.ts`, `browser.ts` (singleton Chromium con flags de contenedor), `db.ts` (service-role: `upsertListings`, `deactivateStaleListings`, runs/errors), `dedup.ts`, `snapshots.ts`, `zone-assigner.ts` (colonia→title→polygon→nearest), `types.ts`, `universal/` (extractor IA de URLs arbitrarias).

**Apify vs Playwright:**
- inmuebles24 → 100% Apify (actor `ecomscrape/inmuebles24-property-listings-scraper`, `APIFY_API_TOKEN`). No toca Chromium.
- lamudi, vivanuncios, mercadolibre → 100% Playwright directo. **Sin Chromium no funcionan.**
- Apify no cambia con la migración (es externo, independiente de plataforma).

**`upsertListings()`** (`db.ts`): chunks de 500, `ON CONFLICT (source_portal, external_id)`. Asigna zona, computa fingerprints. Port a Drizzle con `onConflictDoUpdate`: cuidar `area_m2` generada (omitir) y no pisar `first_seen_at` en updates (hoy lo pisa, bug menor preexistente; no "arreglar de más" salvo que se pida).

**`dedup.ts`:** fingerprints struct (MD5 de zona|tipo|área|precio redondeados) y geo (lat/lng 4 dec). Agrupa en TS, escribe `property_clusters` + `cluster_id`. Todo TS, port directo (`inArray` para los updates por lote).

**`snapshots.ts`:** lee `v_deduplicated_listings` (la vista que SÍ hay que recrear), calcula medianas/avg en TS, upsert a `snapshots`/`city_snapshots`/`rental_snapshots`.

**Correr en Railway (decisión: 2 servicios):**
- Web (Next.js): Nixpacks estándar, sin Chromium, ~256-512MB. `npm run start`, puerto 8080.
- Worker scraper: **Dockerfile** con `npx playwright install chromium` + libs del sistema; Railway Cron `0 3 */2 * *`; `npx tsx scripts/scrape.ts --pages=5`; ~1-2GB; mismo repo (comparte `scraper/db.ts`, schema, `geo-data.ts`). Si el scraper truena, la web sigue.

**Scripts de mantenimiento:** `scrape.ts`, `import-apify*.ts`, `audit-data.ts`, `backfill-rental-attributes.ts`, `consolidate-zones.ts`, `reclassify-zones.ts`, `zone-health.ts`, polígonos (`fetch/fix/generate/rebuild-polygons.ts`), `import-inegi.ts`, `fix-data-cleanup.sql` (pendiente de ejecutar). Todos usan el cliente Supabase (no `pg` directo, aunque `pg` está en devDeps); se re-apuntan a Neon/Drizzle.

### 3.8 Runtime, deploy y dependencias

- **Next 15.3** / React 19 / Tailwind v4 / sin Turbopack. Middleware en `middleware.ts` (raíz).
- **Deps notables:** `@anthropic-ai/sdk` (Brújula), `apify-client`, `playwright`, `mapbox-gl` (cliente, `NEXT_PUBLIC_MAPBOX_TOKEN`), `recharts`, `jspdf`, `xlsx` (0.18.5, fork community), `motion`, `@base-ui/react`, `@turf/turf`+`shapefile`+`cheerio`+`axios`+`pg` (devDeps de scripts).
- **Env vars (8):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `APIFY_API_TOKEN`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_USE_MOCK_DATA`, `NEXT_PUBLIC_DEV_DRILLDOWN`. En Railway: quitar las 3 de Supabase, agregar `DATABASE_URL` + `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET` + credenciales R2.
- **next.config.ts:** `images.remotePatterns` solo `lh3.googleusercontent.com`. **CSP hardcodea `*.supabase.co` (img-src, connect-src, wss) y dominios de Vercel** → actualizar a Neon/Railway o bloquea conexiones. Sin rewrites/redirects, sin `output:standalone` (evaluar agregarlo para Railway), sin experimental.
- **Sin `vercel.json`, sin cron de Vercel, sin edge runtime.** Acoplamiento a Vercel: solo `@vercel/analytics` en layout (quitar) y la CSP.

### 3.9 Build, tests, observabilidad, git

- **Tests:** 4 archivos en `src/__tests__/`, ~116 casos, **solo pure functions** (`normalize`, `zone-insights`, `rental-attributes`, `market-filters`). Solo `market-filters` mockea Supabase. **Cero cobertura de `lib/data/` con queries** (justo lo que se reescribe). Red de seguridad débil donde más se necesita.
- **next.config / tsconfig:** sin `ignoreBuildErrors` ni `ignoreDuringBuilds` (build honesto). `strict: true`, alias `@/*`. `scripts` y `src/scraper` excluidos del typecheck principal.
- **Observabilidad:** sin Sentry, sin logging estructurado, 44 `console.*`. Existen `error.tsx`, `not-found.tsx`, `loading.tsx` (no `global-error.tsx`). Healthcheck `/api/health` (pega a `zones`). En prod Railway la visibilidad sería casi nula sin Sentry.
- **Git:** working tree **sucio** (submodule `pitch` con commits + 5 imágenes sueltas en la raíz). Remoto `github.com/Oscarm157/inmobiq`, branch `main`, último commit `e6b0867`. Limpiar antes de ramificar.
- **Tamaño:** 254 archivos `.ts/.tsx`, ~50k líneas. Más grandes: `geo-data.ts` (10.4k, autogenerado, no se toca), `demographics.ts` (1.1k, autogenerado), `mock-data.ts` (841), `brujula/[id]/client.tsx` (825), `zona/[slug]/page.tsx` (752), `scraper/universal/extractor.ts` (679), `lib/data/listings.ts` (621).
- **Docs del proyecto:** `docs/01-arquitectura` … `08-metricas`, `deuda-tecnica.md`, `scraper.md`, + `CLAUDE.md`. Deuda técnica ya reconoce: Sentry, UptimeRobot, E2E ausentes.

---

## 4. Riesgos clasificados

| # | Riesgo | Sev. | Dónde | Mitigación |
|---|---|---|---|---|
| 1 | **NUMERIC→string silencioso**. Drizzle devuelve `numeric` como string; `reduce((s,l)=>s+l.price,0)` concatena y `area>=min` siempre falla. Rompe medianas y precio/m² SIN lanzar error | **Alto** | `lib/data/listings.ts` (314, 481, 95-98), `scraper/snapshots.ts` (103-104, 143) | `Number()` en TODO punto de lectura. `zones.ts`/`risk.ts` ya están a salvo. Test de paridad contra Supabase con el mismo set |
| 2 | **Auth completo nuevo** (13 consumidores, OAuth+email+metadata+middleware+callback+trigger) | **Alto** | `auth-context.tsx`, `login/page.tsx`, `auth-modal.tsx`, `middleware.ts` | Conservar el contrato de `auth-context`. Spike: `@neondatabase/auth` en Next 15. Persistir `phone`/`referral_source` en `user_profiles` al signup |
| 3 | **Playwright sin Chromium** → deploy del scraper falla con Nixpacks | **Alto** | `scraper/browser.ts` + 3 adapters | Worker aparte con Dockerfile (`playwright install chromium` + libs). Web sin Chromium |
| 4 | **DML cliente de alertas** sin RLS: deja de funcionar o queda inseguro | **Alto** | `lib/data/alerts.ts` → `alertas-client.tsx` | 3 API routes con sesión + ownership |
| 5 | **Timeout del LB de Railway** en `brujula/extract` (Storage+Vision) | Medio | `api/brujula/extract` | Uploads paralelos a R2 + ajustar timeout del proxy |
| 6 | **`admin/audit` SELECT sin LIMIT** → OOM si crece la tabla | Medio | `api/admin/audit` | Paginar o agregado en SQL |
| 7 | **CSP hardcodeada** con dominios Supabase bloquea conexiones | Medio | `next.config.ts` | Actualizar `img-src`/`connect-src` a Neon/Railway |
| 8 | **RLS → control en código** sin fugas | Medio | queries de tablas de usuario | El código ya filtra explícito; auditar `valuations`/`price_alerts`/`user_profiles`/`portfolio_presets` |
| 9 | **pg_dump**: en alfresco no se consiguió la connection string de Postgres de Supabase | Medio | datos | Intentar pg_dump (preserva enums y columnas generadas). Plan B: REST/CSV (miles de filas, manejable) |
| 10 | **Cero observabilidad** (sin Sentry) en el proyecto más pesado | Bajo | global | Instalar Sentry antes del cutover |
| 11 | **Working tree sucio** | Bajo | repo | Limpiar antes de ramificar |

---

## 5. Estrategia por fases (la vieja viva hasta verificar la nueva)

**Fase 0 — Pre-requisitos (~0.5 día).** Contar usuarios reales email/password. Limpiar git. Decidir `fix-data-cleanup.sql` antes del dump. Crear proyecto Neon + Enable Neon Auth + connection string + cookie secret. Conseguir (o no) la connection string de Postgres de Supabase.

**Fase 1 — Schema + datos en Neon (~1 día).** `schema.ts` Drizzle (16 tablas, enums, `generatedAlwaysAs` para `area_m2`, arrays). Recrear `v_deduplicated_listings`. `drizzle-kit push`. pg_dump/restore de datos de mercado (o REST). `user_profiles` se llena vía auth.

**Fase 2 — Capa de datos (~2-3 días).** `db.ts` perezoso (runbook 4.2). Reescribir `src/lib/data/` a Drizzle, empezando por `zones.ts`, `listings.ts`, `risk.ts`. **Auditar NUMERIC→string en todos.** Portar `fn_search_listings`. Mover `comparator.ts` y SELECTs de `perfil` a server. Probar con paridad contra Supabase.

**Fase 3 — Auth Neon (~2-3 días, el bloque más arriesgado).** `auth/{server,client}.ts` + `api/auth/[...path]` perezosos (runbook 4.3-4.5). Reescribir `auth-context.tsx` **manteniendo el contrato**. Replumbing de `login/page.tsx` y `auth-modal.tsx` (incluida persistencia de `phone`/`referral_source`). Reemplazar callback. Reescribir `middleware.ts` (Next 15) con protección + seed de cookies de preferencia vía Drizzle. Crear perfil tras signup (sustituye `handle_new_user`). `verifyAdmin()` y `getUserPlan()` a Drizzle.

**Fase 4 — API routes + storage (~2 días).** Reescribir las 20 rutas (`.from()`→Drizzle, `getUser`→`getSessionUser`). Crear 3 rutas de alertas. `rate-limit.ts` a Drizzle. Migrar bucket a R2 en `brujula/extract`. Actualizar `/api/health`.

**Fase 5 — Scraper + Dockerfile (~1.5 días).** `scraper/db.ts` a Drizzle (`upsertListings` con `onConflictDoUpdate`, `area_m2` generada, `first_seen_at`). Adaptar scripts. Dockerfile del worker con Chromium.

**Fase 6 — Config + limpieza (~0.5 día).** `next.config.ts` (CSP, evaluar `output:standalone`). Quitar `@supabase/*` y `src/lib/supabase-*.ts`. Env vars. Decidir `@vercel/analytics`.

**Fase 7 — Verificación local (~1-1.5 días).** Build SIN `.env.local` (prueba de perezoso). `vitest` (116 casos verdes). E2E Playwright por localhost: auth (Google+email+reset+logout), Brújula con R2, alertas CRUD, exports, zonas/mapa/comparador con datos de Neon, 0 errores de consola. Scraper dry-run contra Neon.

**Fase 8 — Deploy Railway (~1 día).** Servicio web (Nixpacks) + worker cron (Dockerfile). Variables en ambos. Generate Domain, puerto 8080. Neon Trusted domains += URL Railway. E2E contra HTTPS.

**Fase 9 — Cutover (~0.5 día).** DNS a Cloudflare → Railway. Trusted domains += dominio real. Apagar Vercel + Supabase de inmobiq. Reversible hasta aquí.

---

## 6. Estimación de esfuerzo

| Fase | Días |
|---|---|
| 0 Pre-requisitos | 0.5 |
| 1 Schema + datos | 1 |
| 2 Capa de datos | 2-3 |
| 3 Auth | 2-3 |
| 4 API + storage | 2 |
| 5 Scraper + Dockerfile | 1.5 |
| 6 Config + limpieza | 0.5 |
| 7 Verificación local | 1-1.5 |
| 8 Deploy Railway | 1 |
| 9 Cutover | 0.5 |
| **Total** | **~12-15 días asistidos** |

Incertidumbre concentrada en Fase 3 (auth) y Fase 5 (scraper/Dockerfile). Días de trabajo asistido con Claude Code, no horas-reloj; cada fase se verifica antes de seguir y la app vieja sigue viva.

---

## 7. Decisiones pendientes (antes de ejecutar)

1. **¿Cuántos usuarios reales con email/password hay?** OAuth migra limpio; email/password requieren reset una vez. Define la fricción.
2. **Storage:** confirmar R2 (recomendado) para el único bucket.
3. **`fix-data-cleanup.sql`:** ejecutarlo contra Supabase antes del dump (recomendado) o después.
4. **Scraper:** cron automático en Railway desde el día 1, o manual al inicio.
5. **Datos:** intentar pg_dump (mejor) o ir por export REST/CSV.

---

## 8. Archivos clave a tocar

- **Eliminar:** `src/lib/supabase-server.ts`, `supabase.ts`, `supabase-browser.ts`, `supabase-admin.ts`.
- **Nuevos (patrón runbook):** `src/lib/db.ts`, `src/lib/schema.ts`, `src/lib/auth/{server,client}.ts`, `src/app/api/auth/[...path]/route.ts`, `Dockerfile` (worker).
- **Capa de datos:** `src/lib/data/*` (críticos: `zones.ts`, `listings.ts`, `risk.ts`, `comparator.ts`).
- **Auth:** `src/contexts/auth-context.tsx`, `src/app/login/page.tsx`, `src/components/auth-modal.tsx`, `middleware.ts`, `src/app/auth/callback/route.ts`, `src/lib/admin-auth.ts`, `src/lib/user-plan.ts`.
- **API:** las 20 rutas + 3 nuevas de alertas + `rate-limit.ts`.
- **Scraper:** `src/scraper/db.ts` (lo más complejo) + scripts.
- **Config:** `next.config.ts`, `package.json` (quitar `@supabase/*`), env.

---

## 9. Verificación

- **Build sin variables:** `mv .env.local .env.local.bak && npm run build` debe pasar (db/auth perezosos), luego restaurar.
- **Tests:** `vitest run` (116 casos de pure functions intactos).
- **Paridad de datos:** correr `src/lib/data/` contra Neon y comparar KPIs (precio/m², medianas, riesgo) con la prod de Supabase usando el mismo set. Aquí se cazan los bugs NUMERIC→string.
- **E2E Playwright (localhost):** auth completo, Brújula end-to-end con R2, alertas CRUD, exports, zonas/mapa/comparador, 0 errores de consola.
- **Scraper:** `npm run scrape:dry` contra Neon; validar `snapshots`/`city_snapshots`/`rental_snapshots`.
- **Producción Railway:** repetir el E2E contra la URL HTTPS antes del cutover.

---

## 10. Correcciones a notas previas

- La memoria decía **32 tablas**: el conteo real es **16** `CREATE TABLE` (las migraciones repiten cada tabla). Más complejas que los pilotos, pero son 16.
- La memoria decía que inmobiq **no usa Storage**: sí usa **1 bucket** (`valuation-screenshots`).
- `pg` está en devDeps pero **ningún script lo usa directo**; todos pasan por el cliente Supabase.
