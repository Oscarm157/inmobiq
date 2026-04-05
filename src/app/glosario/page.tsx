import { Breadcrumb } from "@/components/breadcrumb"
import { Icon } from "@/components/icon"

export const metadata = {
  title: "Glosario — Inmobiq",
  description: "Glosario de términos inmobiliarios y métricas usadas en Inmobiq.",
}

interface Term {
  id: string
  term: string
  definition: string
  icon: string
}

const TERMS: Term[] = [
  { id: "precio-m2", term: "Precio / m²", icon: "payments", definition: "Precio promedio por metro cuadrado de construcción. Se calcula dividiendo el precio total de cada propiedad entre su superficie y tomando la mediana de todas las propiedades activas en la zona." },
  { id: "ticket-promedio", term: "Ticket Promedio", icon: "sell", definition: "Precio promedio de una propiedad completa (no por m²). Es la mediana de los precios de todas las propiedades activas, filtrada por tipo y operación." },
  { id: "tendencia", term: "Tendencia (%)", icon: "trending_up", definition: "Cambio porcentual del precio promedio por m² comparado con el periodo anterior (snapshots semanales). Positivo indica que los precios están subiendo." },
  { id: "inventario", term: "Inventario Activo", icon: "inventory_2", definition: "Nivel cualitativo de actividad basado en la cantidad de propiedades activas en el mercado. Se expresa como nivel (bajo, moderado, alto) en vez de número exacto." },
  { id: "cap-rate", term: "Cap Rate", icon: "percent", definition: "Tasa de capitalización. Relación entre la renta anual y el precio de compra de una propiedad. Un cap rate del 6% significa que la renta anual equivale al 6% del valor de la propiedad." },
  { id: "yield", term: "Yield Anual", icon: "savings", definition: "Rendimiento bruto anualizado de una propiedad en renta. Se calcula como (renta mensual × 12) / precio de venta × 100. No incluye gastos de mantenimiento ni vacancia." },
  { id: "nse", term: "NSE (Nivel Socioeconómico)", icon: "groups", definition: "Indicador socioeconómico calculado a partir de datos censales INEGI (Censo 2020). Combina acceso a internet, vehículo, seguridad social y participación económica. Escala: A (más alto) a E (más bajo)." },
  { id: "absorcion", term: "Absorción", icon: "speed", definition: "Porcentaje estimado de propiedades que se venden o rentan en un periodo dado. Una absorción alta indica que las propiedades se mueven rápido en esa zona." },
  { id: "volatilidad", term: "Volatilidad", icon: "show_chart", definition: "Desviación estándar de los precios por m² en las últimas semanas. Mide qué tan estables o inestables son los precios en una zona. Alta volatilidad = mayor riesgo pero posible oportunidad." },
  { id: "vacancia", term: "Tasa de Vacancia", icon: "home_work", definition: "Porcentaje estimado de propiedades que no se rentan o venden. Se calcula como proxy a partir de la proporción de listings removidos vs activos." },
  { id: "liquidez", term: "Liquidez", icon: "water_drop", definition: "Qué tan fácil es vender una propiedad en la zona. Se mide por la velocidad de rotación del inventario. Alta liquidez = propiedades se venden rápido." },
  { id: "iqr", term: "IQR (Rango Intercuartil)", icon: "filter_alt", definition: "Método estadístico para filtrar outliers (datos extremos). Se calcula el rango entre el percentil 25 y 75, y se descartan valores fuera de Q1 - 2×IQR y Q3 + 2×IQR. Usado en gráficas para evitar distorsiones." },
  { id: "concentracion", term: "Índice de Concentración", icon: "donut_small", definition: "Mide qué tan dominante es cada tipo de propiedad en la zona vs el promedio de la ciudad. Escala 0-10: valores altos indican que ese tipo está sobre-representado en la zona." },
  { id: "vs-ciudad", term: "vs Ciudad", icon: "compare_arrows", definition: "Diferencia porcentual del precio/m² de una zona respecto al promedio de toda Tijuana. Positivo = zona más cara que el promedio, negativo = más barata." },
  { id: "risk-score", term: "Risk Score", icon: "shield", definition: "Índice de riesgo 0-100 que combina volatilidad histórica, cap rate, vacancia, liquidez y madurez del mercado. Puntaje bajo = inversión más estable. Puntaje alto = mayor riesgo con posible mayor retorno." },
  { id: "snapshot", term: "Snapshot Semanal", icon: "photo_camera", definition: "Fotografía de los datos del mercado tomada cada semana. Se agregan métricas por zona, tipo de propiedad y operación. Permite calcular tendencias y variaciones históricas." },
  { id: "ageb", term: "AGEB", icon: "map", definition: "Área Geoestadística Básica. Unidad territorial definida por INEGI para el censo poblacional. Las zonas de Inmobiq se construyen como uniones de AGEBs para incorporar datos demográficos." },
]

export default function GlosarioPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <Breadcrumb items={[{ label: "Glosario" }]} />
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-badge-neutral-bg text-badge-neutral-text text-[10px] font-bold rounded-full tracking-widest uppercase">
            Referencia
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Glosario</h2>
        <p className="text-muted-foreground font-medium">
          Términos y métricas usadas en la plataforma.
        </p>
      </div>

      <div className="space-y-4">
        {TERMS.map((t) => (
          <div
            key={t.id}
            id={t.id}
            className="bg-surface rounded-xl p-5 card-shadow border border-border/50 scroll-mt-20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-inset rounded-lg flex-shrink-0">
                <Icon name={t.icon} className="text-lg text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{t.term}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{t.definition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
