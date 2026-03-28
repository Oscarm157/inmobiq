# Sprints UI/UX — Inmobiq

Documento vivo. Cada sprint tiene criterios de aceptacion y auditoria post-sprint.

---

## Sprint 1: Credibilidad y confianza (Quick wins)
**Objetivo**: Que el producto se sienta profesional y confiable.
**Estimado**: 3-5 tareas

### Tareas
- [ ] 1.1 Mostrar "Ultima actualizacion: hace X" en KPIs de zona y home
  - Usar `last_seen_at` de listings o `created_at` de snapshots
  - Formato relativo: "hace 2 horas", "hace 3 dias"
  - Ubicacion: debajo del titulo de zona y en el header del home
- [ ] 1.2 Ocultar zona "Otros" del producto final
  - No mostrar en filtros, grid de zonas, tabla de precios, comparador
  - Los listings en "Otros" siguen en DB pero no se surfacean
  - Si un usuario llega a `/zona/otros` por URL, redirect a home
- [ ] 1.3 Reducir animacion del logo sidebar
  - De 10 repeticiones a 1 sola al montar el componente
- [ ] 1.4 Empty states unificados
  - Crear componente `EmptyState` reutilizable (icono + titulo + descripcion)
  - Reemplazar los `return null` de charts por card con mensaje
  - Patron: "No hay datos suficientes para esta grafica"
- [ ] 1.5 Ocultar pagina de Riesgo si no hay datos suficientes
  - Si < 4 semanas de snapshots, ocultar del sidebar y bottom nav
  - Mostrar "Proximamente" en vez de pagina vacia

### Auditoria post-sprint
- [ ] Todas las zonas muestran timestamp de actualizacion
- [ ] "Otros" no aparece en ninguna vista publica
- [ ] Logo solo anima 1 vez
- [ ] No hay charts que desaparecen sin aviso
- [ ] Riesgo oculto si no hay datos

---

## Sprint 2: Navegacion y accesibilidad
**Objetivo**: Que el usuario encuentre lo que busca sin fricciones.
**Estimado**: 4-5 tareas

### Tareas
- [ ] 2.1 Sidebar "Zonas" → pagina de listado de zonas
  - Crear `/zonas` con grid de zone cards (reusar componente existente)
  - Ordenar por inventario o precio
  - Incluir mini buscador de zona
  - Sidebar link cambia de `/zona/zona-rio` a `/zonas`
- [ ] 2.2 Agregar Brujula al bottom nav mobile
  - Reemplazar "Riesgo" por "Brujula" en bottom nav (5 items max)
  - Riesgo se accede desde sidebar desktop
- [ ] 2.3 Breadcrumbs en todas las paginas
  - Componente `Breadcrumb` reutilizable
  - Home > Zonas > Zona Rio
  - Home > Brujula > Resultado
  - Home > Comparar
- [ ] 2.4 Indicador de moneda activa visible
  - Mostrar "MXN" o "USD" badge en el header siempre visible (no solo en dropdown)
  - Click en el badge abre el switcher
- [ ] 2.5 Boton "Exportar" con tooltip
  - Tooltip: "Descargar reporte en PDF"
  - Si no esta autenticado: "Inicia sesion para exportar"

### Auditoria post-sprint
- [ ] `/zonas` existe y muestra todas las zonas
- [ ] Bottom nav mobile incluye Brujula
- [ ] Todas las paginas internas tienen breadcrumb
- [ ] Se ve claramente en que moneda estan los precios
- [ ] Exportar tiene tooltip explicativo

---

## Sprint 3: Zona page — reorganizacion
**Objetivo**: La pagina de zona es el corazon del producto. Hacerla digerible.
**Estimado**: 4-5 tareas

### Tareas
- [ ] 3.1 Sistema de tabs en zona page
  - Tab "Precios": KPIs + distribucion + scatter + editorial
  - Tab "Composicion": tipo, recamaras, area, venta vs renta
  - Tab "Zona": mapa + demografia + insights + ADN
  - Tab "Riesgo": risk profile (cuando haya datos)
  - Default: "Precios" (la mas util para inversionistas)
  - Tabs en URL: `/zona/zona-rio?tab=composicion`
- [ ] 3.2 Subtitulos explicativos en charts
  - Cada chart tiene 1 linea de contexto debajo del titulo
  - Ej: "Distribucion de precios" → "Cuantas propiedades hay en cada rango de precio"
  - Ej: "Precio vs Superficie" → "Cada punto es una propiedad. Abajo-derecha = mejor valor por m2"
- [ ] 3.3 Tooltips informativos en KPI ticker
  - Hover sobre cada KPI muestra explicacion
  - "Precio/m2": "Precio promedio por metro cuadrado de construccion"
  - "vs Ciudad": "Comparado con el promedio de todas las zonas de Tijuana"
- [ ] 3.4 CTA contextual "Valuar propiedad en esta zona"
  - Boton en la zona page que abre Brujula con zona pre-seleccionada
  - Link: `/brujula?zone=zona-rio`
- [ ] 3.5 Sidebar derecho colapsable en mobile
  - En mobile, las cards del sidebar van despues del contenido principal
  - Agregar acordeon o "Ver mas detalles" para no abrumar

### Auditoria post-sprint
- [ ] Zona page tiene tabs funcionales
- [ ] Cada chart tiene subtitulo explicativo
- [ ] KPIs tienen tooltips
- [ ] Hay CTA a Brujula desde zona
- [ ] Mobile no es scroll infinito

---

## Sprint 4: Filtros y consistencia
**Objetivo**: Filtros coherentes en todo el producto.
**Estimado**: 3-4 tareas

### Tareas
- [ ] 4.1 Filtros unificados en zona page
  - Agregar filtro de precio y recamaras a la zona page (no solo categoria)
  - Reusar logica de `MarketFilters` simplificada
  - Los charts responden a los filtros
- [ ] 4.2 Filtros en mapa interactivo
  - Agregar toggle operacion (venta/renta) al mapa
  - Agregar toggle categoria (residencial/comercial/terreno)
  - Colores del mapa responden a filtros
- [ ] 4.3 Comparador: presets visibles y limite claro
  - Mover presets arriba del fold
  - Mostrar "4/4 zonas seleccionadas" con indicador visual
  - Deshabilitar boton "agregar" cuando hay 4
- [ ] 4.4 Propagacion de filtros entre paginas
  - Si estoy en home con filtro "renta + comercial", al ir a zona se preserva
  - Si estoy en zona con filtro, al ir a comparar se preserva
  - Revisar que no se pierdan filtros en navegacion

### Auditoria post-sprint
- [ ] Zona page tiene filtros de precio y recamaras
- [ ] Mapa responde a filtros
- [ ] Comparador muestra presets y limite claro
- [ ] Filtros se preservan al navegar entre paginas

---

## Sprint 5: Onboarding y ayuda
**Objetivo**: Un usuario nuevo entiende el producto en 60 segundos.
**Estimado**: 3-4 tareas

### Tareas
- [ ] 5.1 Modal de bienvenida (primera visita)
  - 3 slides: "Explora zonas" → "Compara precios" → "Valua propiedades"
  - Boton "Empezar" al final
  - Se muestra 1 vez (localStorage flag)
  - Skip button visible
- [ ] 5.2 Glosario de terminos
  - Pagina `/glosario` con terminos clave
  - Precio/m2, NSE, Cap Rate, Absorcion, IQR, etc.
  - Cada termino linkeable (anchor)
  - Los tooltips de charts pueden linkar al glosario
- [ ] 5.3 Indicadores de "nueva feature"
  - Badge "Nuevo" en sidebar items recien lanzados
  - Desaparece despues de 2 semanas o primer click
- [ ] 5.4 Help link contextual
  - Icono "?" en el header que lleva a docs/ayuda
  - En Brujula: "Como funciona?" con explicacion corta

### Auditoria post-sprint
- [ ] Primer visita muestra modal de bienvenida
- [ ] Existe pagina de glosario con 15+ terminos
- [ ] Features nuevas tienen badge "Nuevo"
- [ ] Hay ayuda contextual accesible

---

## Sprint 6: Polish y performance
**Objetivo**: Pulir detalles y optimizar rendimiento.
**Estimado**: 4-5 tareas

### Tareas
- [ ] 6.1 Skeleton states mejorados
  - Reemplazar `animate-pulse` genericos por skeletons que imiten la forma real
  - KPI skeleton = 3 rectanulos con titulo + valor + trend
  - Chart skeleton = ejes + barras fantasma
- [ ] 6.2 Toast notifications
  - Crear componente Toast reutilizable
  - Usar en: crear alerta, exportar, valuar propiedad, reportar dato
  - Patron: aparece 3 segundos, desaparece solo
- [ ] 6.3 Lazy loading de charts pesados
  - Los charts debajo del fold cargan con Intersection Observer
  - El scatter plot y el mapa son los mas pesados
- [ ] 6.4 Cache de metricas de zona
  - Implementar ISR o cache headers para paginas de zona
  - Revalidate cada 1 hora (los datos cambian semanalmente)
- [ ] 6.5 Accesibilidad final
  - Pasar paginas principales por axe/lighthouse
  - Agregar aria-labels faltantes
  - Verificar contraste de colores en dark mode
  - Tab navigation funcional en filtros y modales

### Auditoria post-sprint
- [ ] Skeletons se parecen al contenido real
- [ ] Acciones importantes muestran toast de confirmacion
- [ ] Charts debajo del fold cargan lazy
- [ ] Lighthouse accessibility > 90
- [ ] Tab navigation funciona en filtros

---

## Notas

### Proceso por sprint
1. Revisar tareas del sprint
2. Implementar
3. Revisar visualmente (desktop + mobile)
4. Correr auditoria post-sprint (checklist)
5. Si todo pasa → merge + siguiente sprint
6. Si algo no pasa → fix antes de avanzar

### Estado de sprints (actualizado 2026-03-28)
```
Sprint 1 (Credibilidad)     ✅ Completado — 366cb06
Sprint 2 (Navegacion)       ✅ Completado — aff4f3d
Sprint 3 (Zona page)        ✅ Completado — 41d7704
Sprint 4 (Filtros)          ✅ Completado — b9af128
Sprint 5 (Onboarding)       ✅ Completado — a8cd8d7
Sprint 6 (Polish)           ✅ Completado — 4667625
```
