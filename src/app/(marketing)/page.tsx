import { MarketingNav } from "@/components/marketing/marketing-nav"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { Hero } from "@/components/marketing/hero"
import { SourcesBar } from "@/components/marketing/sources-bar"
import { FeatureBlock } from "@/components/marketing/feature-block"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { PricingCards } from "@/components/marketing/pricing-cards"
import { FAQ } from "@/components/marketing/faq"
import { FinalCTA } from "@/components/marketing/final-cta"

export const metadata = {
  title: "Inmobiq · Inteligencia inmobiliaria por zona en Tijuana",
  description:
    "Precios por m², tendencias, riesgo y demografía INEGI cruzados con listings reales. Para brokers, desarrolladores e inversionistas en Tijuana.",
}

export default function LandingPage() {
  return (
    <div className="m-page min-h-screen">
      <MarketingNav />
      <main>
        <Hero />
        <SourcesBar />

        <div id="producto" style={{ scrollMarginTop: "72px" }}>
          <FeatureBlock
            eyebrow="Precios y tendencias"
            title={
              <>
                Precio por m², por zona, por semana.
              </>
            }
            body="Mira el precio promedio y mediano por metro cuadrado en cada zona, su tendencia de los últimos 90 días y su comparación contra la mediana de la ciudad. Filtra por venta o renta, residencial o comercial."
            bullets={[
              "Tabla de precio por zona con tendencia de 90 días",
              "Distribución de precios por rango y composición de inventario",
              "Snapshots semanales para detectar movimientos sostenidos",
            ]}
            image={{ src: "/marketing/dashboard-overview.png", alt: "Dashboard de precios por zona en Tijuana" }}
          />

          <FeatureBlock
            eyebrow="Riesgo y oportunidad"
            title={<>Riesgo cruzado con demografía del Censo INEGI 2020.</>}
            body="No solo es precio. Cada zona se evalúa con su perfil socioeconómico (NSE), participación económica, acceso a internet, hogares con auto y seguridad social. El score de oportunidad combina mercado y demografía en una sola lectura."
            bullets={[
              "Score de riesgo por zona con factor demográfico",
              "Índice de oportunidad multi-variable",
              "Volatilidad, cap rate y liquidez por zona",
            ]}
            image={{ src: "/marketing/dashboard-detail.png", alt: "Riesgo y demografía por zona" }}
            reverse
            tone="dark"
          />

          <FeatureBlock
            eyebrow="Comparador y pipeline"
            title={<>Compara zonas lado a lado. Ve qué se está construyendo.</>}
            body="Pon dos o tres zonas en paralelo y ve sus métricas de mercado, demografía y riesgo en una sola vista. Suma a eso el pipeline de desarrollos para anticipar oferta nueva."
            bullets={[
              "Comparador de zonas con radar demográfico",
              "Pipeline de desarrollos en construcción y planeación",
              "Brújula AI para valuar propiedades específicas",
            ]}
            image={{ src: "/marketing/dashboard-comparator.png", alt: "Comparador de zonas y pipeline" }}
          />
        </div>

        <HowItWorks />
        <PricingCards />
        <FAQ />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  )
}
