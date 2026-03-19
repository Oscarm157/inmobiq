# Inmobiq Scraper

Extrae listings de 4 portales inmobiliarios para Tijuana, normaliza los datos y los almacena en Supabase.

## Requisitos previos

1. Ejecutar migraciones en Supabase (en orden):
   ```
   001_base_schema.sql
   002_listings.sql
   003_snapshots.sql
   004_rls_policies.sql
   005_views_rpcs.sql
   006_scraper_metadata.sql
   ```

2. Variables de entorno en `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

## Uso

```bash
# Scrape todos los portales, 5 páginas cada uno
npm run scrape

# Dry run (no guarda en DB)
npm run scrape:dry

# Portal específico
npx tsx scripts/scrape.ts --portal=inmuebles24

# Más páginas
npx tsx scripts/scrape.ts --portal=all --pages=10

# Solo ventas de casas
npx tsx scripts/scrape.ts --portal=all --pages=5 --listing-type=venta --property-type=casa

# Sin calcular snapshots
npx tsx scripts/scrape.ts --no-snapshots
```

## Opciones CLI

| Opción | Valores | Default |
|--------|---------|---------|
| `--portal` | `all`, `inmuebles24`, `lamudi`, `vivanuncios`, `mercadolibre` | `all` |
| `--pages` | número entero | `5` |
| `--listing-type` | `venta`, `renta`, `all` | `all` |
| `--property-type` | `casa`, `departamento`, `terreno`, `local`, `oficina` | `all` |
| `--no-snapshots` | flag | omitido |
| `--dry-run` | flag | omitido |

## Arquitectura

```
src/scraper/
├── types.ts              # Interfaces: RawListing, ScraperAdapter, ScraperConfig
├── http.ts               # HTTP client, rate limiting, retry con backoff exponencial
├── zone-assigner.ts      # Asignación de zona: bounding box → nearest → keyword
├── db.ts                 # Upsert a Supabase, scraper_runs, dedup
├── snapshots.ts          # Cálculo de snapshots semanales
└── adapters/
    ├── inmuebles24.ts    # HTML scraping con cheerio
    ├── lamudi.ts         # JSON-LD + HTML fallback
    ├── vivanuncios.ts    # HTML scraping (OLX platform)
    └── mercadolibre.ts   # __PRELOADED_STATE__ JSON + HTML fallback

scripts/
└── scrape.ts             # CLI entry point
```

## Portales y estrategia

| Portal | Estrategia | Rate limit |
|--------|-----------|------------|
| Inmuebles24 | HTML + CSS selectors | 2–3 seg |
| Lamudi | JSON-LD → HTML fallback | 2–3 seg |
| Vivanuncios | HTML selectors (OLX) | 1.5–2.5 seg |
| MercadoLibre | `__PRELOADED_STATE__` → HTML fallback | 3.5–5.5 seg |

## Deduplicación

- **Primary**: `UPSERT ON CONFLICT (source_portal, external_id)` — mismo listing del mismo portal nunca se duplica
- **Stale detection**: listings no vistos en 2+ días se marcan `is_active = false`

## Asignación de zona

1. **Bounding box**: coordenadas dentro de un polígono aproximado de la zona → asignación directa
2. **Nearest zone**: coordenadas disponibles pero fuera de todos los bboxes → zona más cercana (máx 8km)
3. **Keyword matching**: sin coordenadas → busca colonias conocidas en título/dirección

Target: ≥80% de listings asignados a una zona.

## Scheduling

Ejecutar 1 vez al día, de noche (cronjob):

```bash
# crontab
0 2 * * * cd /path/to/inmobiq && npm run scrape >> logs/scraper.log 2>&1
```

## Logs y monitoreo

- Cada run queda registrado en `scraper_runs` con stats: found, new, updated, errors
- Errores individuales en `scraper_errors` con portal, URL y tipo de error
- Si >50% de requests fallan, el scraper lo reporta en los logs
- Run completo (~4,000 listings) toma ~15–30 min dependiendo de anti-bot
