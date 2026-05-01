const items = [
  {
    q: "¿Qué ciudades cubre Inmobiq?",
    a: "Hoy Tijuana, B.C., con 30 zonas activas mapeadas a AGEBs del Censo INEGI 2020. Guadalajara y Cancún están en plan para los próximos 18 meses.",
  },
  {
    q: "¿Con qué frecuencia se actualizan los datos?",
    a: "Los listings activos se actualizan a diario. Los snapshots agregados de tendencias por zona se generan cada semana.",
  },
  {
    q: "¿De dónde vienen los precios?",
    a: "Datos públicos del mercado validados localmente. Cada precio pasa por rangos por categoría y zona; los outliers se filtran con IQR 2.0 antes de entrar a las métricas. La demografía sale del Censo INEGI 2020.",
  },
  {
    q: "¿Qué incluye la demografía INEGI?",
    a: "Datos del Censo 2020 por AGEB: población, hogares, viviendas, internet, auto, seguridad social, participación económica, educación. De ahí sale el NSE por zona y los indicadores cruzados de oportunidad y riesgo.",
  },
  {
    q: "¿Puedo exportar reportes?",
    a: "Sí. El plan Pro tiene exportaciones ilimitadas. El plan Empresarial agrega reportes automatizados y API de consulta.",
  },
  {
    q: "¿Cómo cancelo?",
    a: "Desde tu perfil. Mensual sin contratos largos. Empresarial tiene opción anual con descuento si lo prefieres.",
  },
]

export function FAQ() {
  return (
    <section
      id="faq"
      className="bg-[var(--m-canvas)]"
      style={{ scrollMarginTop: "72px" }}
    >
      <div className="max-w-[920px] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-[40ch]">
          <p className="m-eyebrow">Preguntas frecuentes</p>
          <h2 className="m-h2 mt-4">Lo que la gente pregunta antes de empezar.</h2>
        </div>

        <div className="mt-10 md:mt-12">
          {items.map((it) => (
            <details key={it.q} className="m-faq-item">
              <summary>{it.q}</summary>
              <p>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
