# Sprints — Auditoría 28 de Marzo

Basado en la auditoría UX/UI completa. Cada sprint tiene auditoría post-implementación.

---

## Sprint A: Bugs críticos de credibilidad
**Objetivo**: Eliminar todo lo que hace ver la plataforma poco confiable.
**Prioridad**: URGENTE — hacer antes de mostrar a cualquier usuario.

### Tareas
- [ ] A.1 Corregir bug "vs Ciudad" en zona page (zona y ciudad muestran mismo valor)
- [ ] A.2 Corregir typo "ona Río" en texto IA (falta la "Z" inicial)
- [ ] A.3 Limpiar tildes y capitalización en Brújula resultados ("Analisis" → "Análisis", "Poblacion" → "Población", etc.)
- [ ] A.4 Traducir títulos en inglés a español ("Investment Risk" → "Riesgo de Inversión", "Market Overview" → "Panorama del Mercado", "Live Data" → "Datos en Vivo", "Risk Analysis" → "Análisis de Riesgo")
- [ ] A.5 Badge de filtros activos en cada página ("Mostrando: Venta · Residencial") para explicar por qué los números difieren entre páginas
- [ ] A.6 Sincronizar contador de zonas (24 vs 25 — unificar en todas las páginas)
- [ ] A.7 Mejorar tendencia "0.0% / Sin histórico" — mostrar "Acumulando datos" con un icono que no transmita que algo está roto

### Auditoría post-sprint
- [ ] Los precios tienen badge de filtro activo
- [ ] "vs Ciudad" muestra valores diferentes
- [ ] No hay texto en inglés en la UI
- [ ] No hay typos ni texto sin tildes
- [ ] Tendencia muestra mensaje honesto, no "0.0%"

---

## Sprint B: Páginas rotas y empty states
**Objetivo**: Que ninguna página esté vacía, rota o cargando infinitamente.

### Tareas
- [ ] B.1 Arreglar /perfil — fix del loading infinito
- [ ] B.2 Arreglar /alertas — implementar empty state útil + formulario funcional para crear alertas
- [ ] B.3 Arreglar /buscar — agregar input de búsqueda prominente en el cuerpo de la página con autofocus + sugerencias de zonas populares
- [ ] B.4 Mejorar /riesgo — en vez de solo "Datos insuficientes", mostrar preview de lo que verá el usuario cuando haya datos + "Notificarme cuando esté disponible"
- [ ] B.5 Empty state en comparador — "Selecciona 2 o más zonas para comparar" con visual guía

### Auditoría post-sprint
- [ ] /perfil carga y muestra datos del usuario
- [ ] /alertas tiene formulario funcional o empty state claro
- [ ] /buscar tiene input de búsqueda visible y funcional
- [ ] /riesgo muestra preview anticipatorio
- [ ] /comparar sin zonas tiene empty state guía

---

## Sprint C: Navegación y coherencia
**Objetivo**: Navegación coherente, naming claro, flujos sin fricción.

### Tareas
- [ ] C.1 Brújula → agregar subtítulo "Valuador de propiedades" en sidebar y página
- [ ] C.2 Toggle Compra/Renta — estado activo más visible (pill con color + sombra)
- [ ] C.3 Sincronizar sidebar y bottom nav — mismas rutas disponibles
- [ ] C.4 Mejorar selector de zonas en comparador — combobox con búsqueda en vez de 25 botones planos
- [ ] C.5 Estado "selected" claro en botones de zona del comparador (checkmark, borde de color)

### Auditoría post-sprint
- [ ] Brújula tiene subtítulo visible
- [ ] Toggle venta/renta es obvio cuál está activo
- [ ] Sidebar y bottom nav tienen las mismas rutas
- [ ] Comparador tiene selector con búsqueda
- [ ] Zonas seleccionadas se distinguen claramente

---

## Sprint D: Homepage — reorganización
**Objetivo**: Reducir fatiga de scroll, eliminar redundancia, mejorar jerarquía.

### Tareas
- [ ] D.1 Reordenar KPIs del hero — precio/m² primero, yield segundo, composición último
- [ ] D.2 Eliminar cards "Zonas Monitoreadas" del homepage (ya existe /zonas para eso)
- [ ] D.3 Agrupar gráficas en secciones con títulos claros (ej: "Análisis de Precios", "Composición del Mercado", "Inteligencia de Mercado")
- [ ] D.4 Hacer la tabla de zonas interactiva — hover states claros, columna "Ver análisis →"
- [ ] D.5 Agrupar "Índice de Oportunidad" y "Densidad de Mercado" bajo sección "Inteligencia de Mercado" con encabezado visible

### Auditoría post-sprint
- [ ] Homepage tiene 6-7 secciones bien agrupadas (no 11+)
- [ ] No hay datos duplicados en la misma página
- [ ] Tabla de zonas tiene hover interactivo y CTA visible
- [ ] Cada sección tiene título de contexto

---

## Sprint E: Brújula — pulido
**Objetivo**: La feature más valiosa del producto merece polish premium.

### Tareas
- [ ] E.1 Marcar campos obligatorios con * de forma consistente
- [ ] E.2 Validación inline en formulario (error debajo de cada campo)
- [ ] E.3 Tab Screenshots — tooltip o modal explicativo de cómo funciona
- [ ] E.4 Historial — agregar acciones (eliminar, compartir) + empty state "Valúa tu primera propiedad"
- [ ] E.5 Resultado — agregar CTA al final ("Comparar con otra zona", "Valuar otra propiedad", "Ver zona en el mapa")
- [ ] E.6 Resultado — limpiar textos generados (tildes, capitalización, mezcla colonia/zona)
- [ ] E.7 Gauge visual (slider semáforo rojo→verde) para el veredicto de valuación

### Auditoría post-sprint
- [ ] Campos obligatorios marcados consistentemente
- [ ] Errores se muestran inline
- [ ] Screenshots tiene explicación
- [ ] Historial tiene acciones y empty state
- [ ] Resultado tiene CTAs de siguiente paso
- [ ] Gauge visual funciona

---

## Sprint F: Accesibilidad y mobile
**Objetivo**: Cumplir WCAG AA básico y mejorar experiencia mobile.

### Tareas
- [ ] F.1 Agregar alt a todas las imágenes del scatter plot y gráficas
- [ ] F.2 aria-pressed / aria-selected en botones de tipo de propiedad
- [ ] F.3 Implementar patrón ARIA Tabs correcto en zona tabs
- [ ] F.4 role="combobox" en búsqueda del topbar
- [ ] F.5 Tabla de zonas en homepage — convertir a cards en mobile
- [ ] F.6 Verificar contraste WCAG AA en textos secundarios (grises sobre blanco)
- [ ] F.7 Botones de login: cambiar a <a> o agregar navegación accesible para gestores de contraseñas

### Auditoría post-sprint
- [ ] Lighthouse Accessibility > 90
- [ ] Todas las imágenes tienen alt
- [ ] Tabs y botones tienen ARIA correcto
- [ ] Tabla se convierte en cards en mobile
- [ ] Contraste cumple WCAG AA

---

## Sprint G: Textos y branding
**Objetivo**: Todo en español, sin mezcla de idiomas, textos profesionales.

### Tareas
- [ ] G.1 Auditar todos los badges y títulos — convertir inglés a español
- [ ] G.2 Definir escala de "Actividad" visible — mostrar tooltip con umbrales (ej: Baja <20, Moderada 20-80, Alta 80+)
- [ ] G.3 Botón "Download Report" en sidebar — renombrar a "Descargar reporte" + tooltip de qué descarga
- [ ] G.4 Evaluar link "Narrativa360" — si es producto externo, diferenciarlo visualmente o moverlo al footer
- [ ] G.5 Agregar "Basado en N propiedades activas" en métricas clave de zona

### Auditoría post-sprint
- [ ] Cero texto en inglés en UI pública
- [ ] Escalas de actividad explicadas
- [ ] Todos los botones tienen label claro
- [ ] Métricas muestran tamaño de muestra

---

## Orden de ejecución

```
Sprint A (Credibilidad)       ← URGENTE, hacer primero
Sprint B (Páginas rotas)      ← El usuario no puede ver páginas vacías
Sprint C (Navegación)         ← Coherencia de flujos
Sprint D (Homepage)           ← Reducir fatiga
Sprint E (Brújula polish)     ← La feature estrella
Sprint F (Accesibilidad)      ← Compliance
Sprint G (Textos/branding)    ← Polish final
```

## Proceso por sprint
1. Revisar tareas del sprint
2. Implementar
3. Build + verificar visualmente
4. Correr auditoría post-sprint (checklist)
5. Si todo pasa → push + siguiente sprint
6. Si algo no pasa → fix antes de avanzar
