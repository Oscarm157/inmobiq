# Métricas de Inmobiq — Guía de Referencia

Documento para auditar que cada número mostrado tenga sentido.
Última actualización: 2026-03-29.

---

## 1. Perfiles y defaults

Cada perfil configura qué ve primero el usuario al entrar.

| Perfil | Operación | Categoría | Tab | Prominente | Atenuado |
|--------|-----------|-----------|-----|-----------|---------|
| **Comprador** | venta | residencial | general | editorial, distribución precios, DNA zona, zona vs ciudad, demographics | inversión, yield, gastos, rental |
| **Vendedor** | venta | residencial | precios | percentil, distribución, scatter, zona vs ciudad, tendencia | inversión, yield, gastos, rental |
| **Arrendador** | renta | residencial | inversión | KPIs inversión, yield, gastos, rental market, rental insights | (ninguno) |
| **Broker** | venta | residencial | general | (todo igual) | (nada atenuado) |

Los defaults solo se aplican al crear perfil (onboarding). Después, el usuario puede cambiar operación/categoría y se persiste en cookies.

---

## 2. Filtros

### Cadena de resolución (zona page)
```
URL params (?operacion=renta&categoria=comercial)
  → Cookie (inmobiq_operacion, inmobiq_categoria)
    → Default del perfil (al crear perfil se setean cookies)
      → Hardcoded: venta, residencial
```

### Categorías y tipos

| Categoría | Tipos incluidos |
|-----------|----------------|
| residencial | casa, departamento |
| comercial | local, oficina |
| terreno | terreno |

### Validación de precios (MXN)

| Operación | Categoría | Precio mín | Precio máx | $/m² mín | $/m² máx |
|-----------|-----------|-----------|-----------|---------|---------|
| **Venta** | residencial | $300K | $50M | $3,000 | $200,000 |
| **Venta** | comercial | $200K | $100M | $5,000 | $300,000 |
| **Venta** | terreno | $100K | $80M | $1,000 | $100,000 |
| **Renta** | residencial | $3,000 | $150,000 | $30 | $2,000 |
| **Renta** | comercial | $3,000 | $500,000 | $30 | $5,000 |
| **Renta** | terreno | $1,000 | $200,000 | $5 | $1,000 |

Cualquier listing fuera de estos rangos se descarta como dato inválido.

---

## 3. Métricas de Zona (ZoneMetrics)

Fuente: `src/lib/data/zones.ts` → `getZoneMetrics(filters)`

| Métrica | Cálculo | Fuente primaria | Fallback | Filtra por op+cat |
|---------|---------|----------------|----------|-------------------|
| `avg_price_per_m2` | **Mediana** de `price / area_m2` por listing | listings individuales validados | Promedio ponderado de snapshots | **SÍ** |
| `avg_ticket` | **Mediana** de `price` por listing | listings individuales validados | Promedio ponderado de snapshots | **SÍ** |
| `price_trend_pct` | `(avg_m2_semana_actual - avg_m2_semana_anterior) / avg_m2_semana_anterior × 100` | snapshots (2 semanas) | 0 si no hay historial | **SÍ** |
| `total_listings` | Suma de `count_active` en snapshots | snapshots | 0 | **SÍ** |
| `listings_by_type` | Conteo por tipo de propiedad | snapshots (respeta operación, **ignora categoría**) | — | **Solo operación** |
| `avg_ticket_by_type` | Mediana de precio por tipo | listings / snapshots | — | **SÍ** |

### Cómo se calcula la mediana de zona

```
1. Query: SELECT zone_id, price_mxn, price_usd, area_m2, property_type, listing_type
   FROM listings WHERE is_active = true
   + filtros de operación, categoría (→ property_type), área, recámaras

2. Por cada listing: effectivePrice = price_mxn > 0 ? price_mxn : price_usd × tipo_cambio
   Validar con isValidListing() → descartar si fuera de rangos

3. Agrupar por zone_id:
   - price_per_m2[] = listing.price / listing.area_m2
   - ticket[] = listing.price

4. medianPriceByZone[zone_id] = median(price_per_m2[])
   medianTicketByZone[zone_id] = median(ticket[])

5. Si no hay listings validados → fallback a snapshots:
   snapshotAvg = Σ(snapshot.avg_price_per_m2 × count_active) / Σ(count_active)
```

---

## 4. Métricas de Ciudad (CityMetrics)

Fuente: `src/lib/data/zones.ts` → `getCityMetrics(filters)`

**Decisión de path:**
- Si hay filtros (operación, categoría, etc.) → agrega desde zonas filtradas
- Si no hay filtros → usa tabla `city_snapshots` (más rápido)

### Path con filtros (el más común)

| Métrica | Cálculo | Método |
|---------|---------|--------|
| `avg_price_per_m2` | Expandir cada zona: `Array(min(total_listings, 100)).fill(zona.avg_price_per_m2)`, luego mediana del array combinado | **Mediana ponderada** (cap 100 por zona) |
| `avg_ticket` | Mismo método: expandir cada zona por su inventario (cap 100), tomar mediana | **Mediana ponderada** (cap 100 por zona) |
| `price_trend_pct` | `Σ(zona.price_trend_pct) / num_zonas` | **Promedio simple** de tendencias zonales |
| `total_listings` | `Σ(zona.total_listings)` | Suma |

**Cap de 100**: evita que una zona con 500 listings domine la mediana. Cada zona contribuye máximo 100 "votos" al cálculo de la mediana.

### Path sin filtros (city_snapshots)
- `avg_price_per_m2` viene directo de la tabla `city_snapshots`
- `avg_ticket` se calcula con la misma mediana ponderada de zonas (NO viene de city_snapshots)
- **Posible incoherencia**: $/m² y ticket pueden usar fuentes diferentes en este path

---

## 5. Zona vs Ciudad (comparison card)

Componente: `src/components/zone/zone-comparison-enhanced.tsx`

| Fila | Valor Zona | Valor Ciudad | Coherencia |
|------|-----------|-------------|------------|
| **Precio/m²** | `zone.avg_price_per_m2` (mediana listings) | `city.avg_price_per_m2` (mediana de medianas zonales) | Mismo tipo de cálculo (medianas) |
| **Ticket** | `zone.avg_ticket` (mediana listings) | `city.avg_ticket` (mediana de medianas zonales) | Mismo tipo de cálculo (medianas) |
| **Inventario** | `zone.total_listings` → label cualitativo | `city.total_listings` → label cualitativo | OK |
| **Tendencia** | `zone.price_trend_pct` (week-over-week) | `city.price_trend_pct` (promedio de zonas) | Metodología diferente: zona es WoW exacto, ciudad es promedio de WoW de todas las zonas |

### Cuándo $/m² y ticket pueden apuntar en direcciones opuestas

Zona con $/m² > Ciudad pero ticket < Ciudad = propiedades más pequeñas en la zona.

**Ejemplo real (renta residencial):**
- Zona: $405/m² × 69m² promedio = $28,000/mes
- Ciudad: $260/m² × 192m² promedio = $49,839/mes

Esto pasa cuando la ciudad tiene zonas con casas grandes de renta (400m²+) que suben el ticket de ciudad sin subir mucho el $/m² (la mediana protege contra extremos en $/m², pero no tanto en ticket si hay muchas zonas con casas grandes).

**Cómo validar que es real y no bug:**
- Dividir ticket/precio_m2 = superficie promedio implícita
- Si la superficie es razonable (50-300m²), es dato real
- Si es absurda (>500m² o <10m²), hay un bug de filtrado

---

## 6. Riesgo (ZoneRiskMetrics)

Fuente: `src/lib/data/risk.ts` → `getZoneRiskMetrics()`

**NO filtra por categoría ni operación** — calcula sobre todo el mercado de la zona.

| Métrica | Fórmula | Fuente |
|---------|---------|--------|
| **volatility** | `(std_dev(precios_4_semanas) / promedio(precios_4_semanas)) × 100` | snapshots (4 semanas) |
| **vacancy_rate** | `max(0, 10 - price_trend) × 1.5` | Proxy derivado de tendencia |
| **liquidity_score** | `min(100, round(total_listings × 0.3 + 30))` | Conteo de listings activos |
| **cap_rate** | `max(3, min(12, 8 - price_trend × 0.3))` | Proxy derivado de tendencia |
| **risk_score** | `min(100, round(volatility × 3 + vacancy_proxy + demo_risk_factor + 15))` | Compuesto |
| **demo_risk_factor** | `min(20, round(max(0, (70 - NSE) × 0.2) + unemployment_rate × 0.5))` | INEGI demographics |
| **risk_label** | `<40 → "Bajo"`, `40-65 → "Medio"`, `>65 → "Alto"` | Derivado de risk_score |

**Nota**: volatility y cap_rate son proxies porque no tenemos datos reales de transacciones cerradas. Usamos variación de precios listados como estimador.

---

## 7. Insights cruzados (INEGI × Mercado)

Fuente: `src/lib/data/zone-insights.ts`

| Insight | Fórmula | Pesos | Filtra |
|---------|---------|-------|--------|
| **Affordability** (0-100) | `clamp((NSE_score/100) / max(zona_precio/mediana_ciudad_precio, 0.3) × 80)` | NSE vs precio relativo | **Parcial**: usa zona.avg_price_per_m2 que sí filtra |
| **Demand Pressure** (0-100) | `(hogares/listings normalizado) × 50% + participación_económica × 30% + internet × 20%` | 50/30/20 | **NO** (demographics son estáticos) |
| **Appreciation** (0-100) | `fundamentals - volatility_penalty` donde fundamentals = `NSE×35% + internet×25% + PEA×25% + auto×15%` | 35/25/25/15 | **NO** |

---

## 8. Inversión y Yield

### Yield bruto
```
yieldPct = (promedio_renta_mensual × 12 / promedio_precio_venta) × 100
```
- Requiere ≥2 listings de renta Y ≥2 de venta del mismo tipo
- Se calcula por tipo (casa, depto, local, oficina) y general
- **No respeta el filtro actual** — siempre busca ambos modos (renta+venta)

### Investment Score (0-100)
```
investment_score = clamp(
  appreciation_potential × 30% +
  (100 - risk_score)    × 20% +
  min(yield × 10, 100)  × 30% +
  liquidity_score        × 20%
)
```
Si faltan datos, cada componente usa 50 como fallback.

### Modelo de Gastos (Expense Model)
```
Renta anual bruta = renta_mensual × 12
Vacancia = renta_anual × vacancy_pct (5-15% según duración promedio de listing)
Mantenimiento = tipo_default × 12 (depto: $2,500/mes, casa: $1,000/mes, etc.)
Predial = precio_venta × 0.15%
Seguro = precio_venta × 0.4%
Administración = renta_anual × 10%

NOI = renta_anual - todos_los_gastos
Yield neto = NOI / precio_venta × 100
Payback = precio_venta / NOI (años)
```

### Absorption Rate (heurístico)
```
absorptionPct = min(95, round(50 + price_trend × 5 + (listings > 200 ? 10 : 0)))
```

---

## 9. Dashboard (página principal)

Fuente: `src/app/page.tsx`

| Componente | Métrica | Fuente | Filtrado |
|-----------|---------|--------|---------|
| KPI Precio | `city.avg_price_per_m2` + tendencia | getCityMetrics(filters) | **SÍ** |
| KPI Inventario | `analytics.medianPrice`, `analytics.avgPrice` | getListingsAnalytics(filters) | **SÍ** |
| KPI Composición | Desglose por tipo | analytics.compositionByType | **SÍ** |
| Bar chart zonas | $/m² por zona | analytics.pricePerM2ByZone | **SÍ** |
| Price Range chart | Distribución de precios | analytics.priceDistribution | **SÍ** |
| Trend chart | 10 semanas de $/m² | getPriceTrendData() | **NO** (trend es global) |
| Top zones | 8 más caras + 8 más accesibles | zones sorted by avg_price_per_m2 | **SÍ** |
| Zone cards | precio, tendencia, actividad, tipos | ZoneMetrics[] | **SÍ** |

---

## 10. Incoherencias conocidas y mitigaciones

### 10.1 $/m² vs Ticket apuntan en direcciones opuestas
- **Causa**: Diferencia de tamaño promedio de propiedades entre zona y ciudad
- **Fix aplicado**: Ambos usan mediana (commit c6f3e19)
- **Mejora pendiente**: Mostrar "Superficie promedio implícita" para contexto

### 10.2 Risk/Yield no filtran por categoría
- **Causa**: Se calculan sobre todo el mercado de la zona
- **Impacto**: Un usuario en "residencial" ve riesgo influenciado por comercial
- **Mitigación**: Riesgo global es aceptable como proxy; separar por categoría requeriría más data

### 10.3 Tendencia ciudad vs zona usan métodos diferentes
- **Zona**: Week-over-week exacto desde snapshots
- **Ciudad**: Promedio simple de tendencias de todas las zonas
- **Impacto**: Bajo — ambos dan direccionalidad correcta

### 10.4 Path sin filtros usa fuentes mixtas
- **`avg_price_per_m2`**: viene de `city_snapshots` (tabla separada)
- **`avg_ticket`**: viene de mediana de zonas
- **Cuándo ocurre**: Solo si operación="todas" Y categoría="todas"
- **Impacto**: Raro en práctica, pero si ocurre puede causar incoherencia

### 10.5 Zonas con poca data
- **Umbral actual**: `<10 listings` → "Muestra insuficiente" para ticket
- **Label de actividad**: `<5` → "Actividad muy baja"
- **Problema**: Medianas con 2-3 listings no son confiables
- **Mejora pendiente**: Badge más visible "Datos limitados"

---

## 11. Flujo de datos

```
Scrapers (Apify: inmuebles24, lamudi, vivanuncios, mercadolibre)
  ↓
listings table (propiedad individual: precio, m², tipo, operación, zona)
  ↓
isValidListing() → descarta precios fuera de rango
  ↓
snapshots table (agregados semanales: zona × tipo × operación → count, avg_price, avg_price_m2)
  ↓
getZoneMetrics(filters) → mediana de listings + fallback snapshots → ZoneMetrics
  ↓
getCityMetrics(filters) → mediana ponderada de zonas → CityMetrics
  ↓
UI Components (KPI strip, Zona vs Ciudad, charts, etc.)
```

---

## 12. Glosario

| Término | Definición |
|---------|-----------|
| **Ticket** | Precio total de una propiedad (no por m²) |
| **Precio/m²** | Precio dividido entre superficie (construcción cuando disponible, terreno para terrenos) |
| **Cap Rate** | Tasa de capitalización: rendimiento anual neto / precio de compra |
| **Yield Bruto** | Rendimiento bruto: (renta mensual × 12) / precio venta × 100 |
| **Yield Neto** | Rendimiento después de gastos: NOI / precio venta × 100 |
| **NOI** | Net Operating Income: renta anual menos gastos operativos |
| **Volatility** | Desviación estándar de precios/m² como % del promedio (4 semanas) |
| **Liquidity** | Score 0-100 basado en cantidad de listings activos |
| **NSE** | Nivel Socioeconómico: score 0-100 derivado de datos INEGI (internet, auto, seguro social, PEA) |
| **IQR** | Rango Intercuartílico: Q3-Q1, usado para remover outliers en charts (multiplicador 2.0) |
| **Mediana** | Valor central al ordenar datos; más robusta que promedio contra outliers |
| **Snapshot** | Foto semanal del mercado por zona+tipo+operación |
