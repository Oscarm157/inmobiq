import { Icon } from "@/components/icon"
import { Breadcrumb } from "@/components/breadcrumb"
import { StaggerContainer, FadeInUp } from "@/components/motion-wrappers"
import { ExportButton } from "@/components/export-button"
import { RiskMatrix } from "@/components/risk-matrix"
import { RiskZoneCard } from "@/components/risk-zone-card"
import { HeroHeader, HeroStat } from "@/components/hero-header"
import { SectionHeading } from "@/components/section-heading"
import { getZoneRiskMetrics } from "@/lib/data/risk"
import { getZoneMetrics } from "@/lib/data/zones"
import { AuthGatedSection } from "@/components/auth-gated-section"

export const metadata = {
  title: "Riesgo de Inversión — Inmobiq",
  description: "Análisis de riesgo de inversión inmobiliaria en Tijuana.",
}

export default async function RiesgoPage() {
  const [{ data: riskData, isMock }, zones] = await Promise.all([getZoneRiskMetrics(), getZoneMetrics()])

  if (isMock) {
    return (
      <div className="space-y-10">
        <Breadcrumb items={[{ label: "Riesgo" }]} />
        <HeroHeader
          badge="Análisis de Riesgo"
          badgeIcon="shield"
          title="Análisis de Riesgo de Inversión"
          accent="red"
          compact
        />
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center space-y-2">
          <Icon name="hourglass_empty" className="text-3xl text-amber-500" />
          <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">Acumulando datos históricos</h3>
          <p className="text-sm text-amber-800 dark:text-amber-300 max-w-md mx-auto">
            Se requieren al menos 4 semanas de snapshots semanales para calcular métricas de riesgo confiables.
          </p>
        </div>

        {/* Preview de lo que verás */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preview — así se verá esta sección:</p>
          <div className="relative rounded-2xl overflow-hidden">
            <div className="blur-[2px] opacity-50 pointer-events-none select-none">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-surface rounded-xl p-5 card-shadow">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Riesgo Promedio</p>
                  <p className="text-2xl font-black text-foreground">42<span className="text-sm font-medium text-muted-foreground">/100</span></p>
                </div>
                <div className="bg-surface rounded-xl p-5 card-shadow">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Cap Rate Promedio</p>
                  <p className="text-2xl font-black text-foreground">5.8%</p>
                </div>
                <div className="bg-surface rounded-xl p-5 card-shadow">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Vacancia Promedio</p>
                  <p className="text-2xl font-black text-foreground">12.3%</p>
                </div>
              </div>
              <div className="mt-6 bg-surface rounded-xl p-5 card-shadow h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Matriz de Riesgo vs Retorno</p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-full shadow-lg">
                Disponible próximamente
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sortedByRisk = [...riskData].sort((a, b) => a.risk_score - b.risk_score)
  const avgRisk = Math.round(riskData.reduce((s, r) => s + r.risk_score, 0) / riskData.length)
  const avgCap = (riskData.reduce((s, r) => s + r.cap_rate, 0) / riskData.length).toFixed(1)
  const avgVacancy = (riskData.reduce((s, r) => s + r.vacancy_rate, 0) / riskData.length).toFixed(1)

  return (
    <StaggerContainer className="space-y-10">
      <FadeInUp><Breadcrumb items={[{ label: "Riesgo" }]} /></FadeInUp>

      {/* Hero Header */}
      <FadeInUp>
        {(() => {
          const safestZone = sortedByRisk[0]
          const riskiestZone = sortedByRisk[sortedByRisk.length - 1]
          const riskLevel = avgRisk < 35 ? "bajo" : avgRisk < 60 ? "moderado" : "elevado"

          return (
            <HeroHeader
              badge={`${riskData.length} zonas analizadas`}
              badgeIcon="verified_user"
              title={<>Riesgo de<br /><span className="bg-gradient-to-r from-red-400 to-amber-300 bg-clip-text text-transparent">Inversión</span></>}
              subtitle={`Riesgo promedio ${riskLevel} (${avgRisk}/100). Zona más segura: ${safestZone.zone_name} (${safestZone.risk_score}). Mayor riesgo: ${riskiestZone.zone_name} (${riskiestZone.risk_score}).`}
              accent="red"
              actions={
                <>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] backdrop-blur-sm text-white rounded-full text-sm font-bold hover:bg-white/[0.14] transition-all border border-white/[0.06]">
                    <Icon name="tune" className="text-sm" />
                    Parámetros
                  </button>
                  <ExportButton formats={["risk-pdf", "listings-excel", "listings-csv"]} />
                </>
              }
            >
              <HeroStat
                icon="shield"
                label={`Riesgo ${riskLevel}`}
                value={<>{avgRisk}<span className="text-sm font-medium text-slate-500">/100</span></>}
                color="red"
              />
              <HeroStat
                icon="percent"
                label="Cap Rate promedio"
                value={`${avgCap}%`}
                color="emerald"
              />
              <HeroStat
                icon="lock"
                label={`Más segura: ${safestZone.zone_name}`}
                value={`${safestZone.risk_score}/100`}
                color="teal"
              />
            </HeroHeader>
          )
        })()}
      </FadeInUp>

      {/* Risk Matrix */}
      <FadeInUp><RiskMatrix riskData={riskData} zones={zones} /></FadeInUp>

      {/* Zone Risk Cards */}
      <FadeInUp><section>
        <AuthGatedSection title={<SectionHeading title="Perfil de Riesgo por Zona" size="lg" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedByRisk.map((risk) => (
            <RiskZoneCard key={risk.zone_slug} risk={risk} />
          ))}
        </div>
        </AuthGatedSection>
      </section></FadeInUp>

      {/* Risk Note */}
      <FadeInUp><AuthGatedSection><div className="bg-surface-muted rounded-xl p-8 border border-border/60">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-6">
          Nota Metodológica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <p className="text-foreground leading-relaxed font-medium" style={{ textAlign: "justify" }}>
            <span style={{ float: "left", fontSize: "4rem", lineHeight: 0.8, paddingTop: 4, paddingRight: 8, fontWeight: 800, color: "#1d4ed8" }}>
              E
            </span>
            l índice de riesgo Inmobiq combina múltiples factores: volatilidad histórica de precios, tasa de capitalización, vacancia, liquidez de mercado (velocidad de venta), y madurez del mercado local. Las zonas con puntajes más bajos representan inversiones más estables con retornos predecibles, mientras que puntajes altos indican mayor potencial pero con volatilidad significativa.
          </p>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed italic border-l-2 border-blue-400 dark:border-blue-500 pl-4">
              &ldquo;En mercados fronterizos como Tijuana, la diversificación geográfica dentro de la misma ciudad puede reducir el riesgo de portafolio hasta un 30% sin sacrificar retorno.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-inset flex items-center justify-center">
                <Icon name="analytics" className="text-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Modelo de Riesgo Inmobiq</p>
                <p className="text-[10px] text-muted-foreground">v2.1 · Actualizado Septiembre 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div></AuthGatedSection></FadeInUp>
    </StaggerContainer>
  )
}
