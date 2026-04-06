import { Breadcrumb } from "@/components/breadcrumb"
import { HeroHeader, HeroStat } from "@/components/hero-header"
import { Icon } from "@/components/icon"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"

export const metadata = {
  title: "Planes — Inmobiq",
  description: "Planes y precios de Inmobiq. Inteligencia inmobiliaria para Tijuana.",
}

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  price: string
  period: string
  description: string
  accent: string
  features: PlanFeature[]
  cta: string
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    name: "Explorador",
    price: "Gratis",
    period: "",
    description: "Explora el mercado inmobiliario de Tijuana con datos actualizados.",
    accent: "bg-slate-100 dark:bg-slate-800",
    cta: "Empezar gratis",
    features: [
      { text: "Dashboard de mercado completo", included: true },
      { text: "30 zonas con métricas de precio", included: true },
      { text: "Comparador de zonas (hasta 4)", included: true },
      { text: "Mapa interactivo", included: true },
      { text: "1 valuación Brújula / mes", included: true },
      { text: "Exportar reportes PDF/Excel", included: false },
      { text: "Análisis de riesgo", included: false },
      { text: "Portafolio avanzado", included: false },
    ],
  },
  {
    name: "Inversionista",
    price: "$499",
    period: "/mes",
    description: "Para inversionistas que necesitan datos profundos y herramientas de análisis.",
    accent: "bg-blue-50 dark:bg-blue-950/30",
    cta: "Próximamente",
    popular: true,
    features: [
      { text: "Todo lo de Explorador", included: true },
      { text: "Valuaciones Brújula ilimitadas", included: true },
      { text: "Exportar reportes PDF/Excel", included: true },
      { text: "Análisis de riesgo por zona", included: true },
      { text: "Portafolio con filtros avanzados", included: true },
      { text: "Datos demográficos INEGI", included: true },
      { text: "Indicadores cruzados (INEGI x Mercado)", included: true },
      { text: "Soporte prioritario", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$1,499",
    period: "/mes",
    description: "Para brokers, desarrolladores y equipos que necesitan acceso completo.",
    accent: "bg-violet-50 dark:bg-violet-950/30",
    cta: "Próximamente",
    features: [
      { text: "Todo lo de Inversionista", included: true },
      { text: "Pipeline de desarrollos", included: true },
      { text: "Alertas de precio por email", included: true },
      { text: "API de datos (próximamente)", included: true },
      { text: "Reportes automatizados", included: true },
      { text: "Multi-usuario (hasta 5)", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Onboarding personalizado", included: true },
    ],
  },
]

export default function PreciosPage() {
  return (
    <StaggerContainer className="space-y-10">
      <FadeInUp>
        <Breadcrumb items={[{ label: "Planes" }]} />
      </FadeInUp>

      <FadeInUp>
        <HeroHeader
          badge="Planes y precios"
          badgeIcon="sell"
          title={<>Elige tu<br /><span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Plan</span></>}
          subtitle="Accede a inteligencia inmobiliaria profesional. Datos de mercado actualizados semanalmente, métricas por zona, y herramientas de valuación."
          accent="blue"
        >
          <HeroStat icon="location_on" label="Zonas cubiertas" value="30" color="blue" />
          <HeroStat icon="update" label="Actualización" value="Semanal" color="emerald" />
          <HeroStat icon="apartment" label="Propiedades rastreadas" value="5,000+" color="violet" />
        </HeroHeader>
      </FadeInUp>

      {/* Plans grid */}
      <FadeInUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${plan.popular ? "border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-500/10" : "border-border/50"} ${plan.accent} p-6 flex flex-col`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground font-medium">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat.text} className="flex items-start gap-2 text-sm">
                    <Icon
                      name={feat.included ? "check_circle" : "cancel"}
                      className={`text-base mt-0.5 ${feat.included ? "text-green-500 dark:text-green-400" : "text-slate-300 dark:text-slate-600"}`}
                    />
                    <span className={feat.included ? "text-foreground" : "text-muted-foreground/50"}>
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.cta === "Próximamente"}
                className={`w-full py-2.5 rounded-full text-sm font-bold transition-all ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed"
                    : plan.price === "Gratis"
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-surface-inset text-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </FadeInUp>

      {/* FAQ section */}
      <FadeInUp>
        <div className="bg-surface rounded-xl p-6 card-shadow max-w-2xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Preguntas Frecuentes</h3>
          <div className="space-y-4">
            {[
              { q: "De dónde vienen los datos?", a: "Rastreamos propiedades activas en inmuebles24, lamudi, vivanuncios y mercadolibre. Los datos se actualizan semanalmente y se normalizan con validaciones de precio por zona y tipo." },
              { q: "Puedo cancelar en cualquier momento?", a: "Sí. Sin contratos ni permanencia mínima. Cancela desde tu perfil y mantén acceso hasta el fin del periodo pagado." },
              { q: "Qué zonas cubren?", a: "30 zonas canónicas de Tijuana definidas por AGEBs de INEGI. Desde Playas de Tijuana hasta La Presa Este, cubriendo toda el área metropolitana." },
              { q: "Cómo funciona Brújula?", a: "Sube screenshots de una propiedad o ingresa los datos manualmente. Brújula compara el precio contra el mercado de la zona y genera un dictamen con IA." },
            ].map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-foreground hover:text-muted-foreground transition-colors">
                  <Icon name="expand_more" className="text-base transition-transform group-open:rotate-180" />
                  {q}
                </summary>
                <p className="mt-2 ml-6 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </FadeInUp>
    </StaggerContainer>
  )
}
