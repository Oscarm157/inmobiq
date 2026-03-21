interface Project {
  img: string
  name: string
  badge: string
  badgeColor: string
  sub: string
  investors: number
  investorLabel: string
}

export const PIPELINE_PROJECTS: Project[] = [
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcMvkGK2-c11oeRRT27nAuPCjwm12rEej1HNK4UFnpRUTWmJrA6DIIowr_mlFnzxYynfC0CQPtOJSSAYLjf-7NLbxQGd74blgo-94zbKEiQehwynoP_CyxSmdcmBVfHUpdcpswRbvNOW4jNSg8ZaVWbBGUv6euGbVwOXb7kgWWSqydwdmWgnBzBGupKS29TKrbLOIE4Uv0K5Ov6gqzPh5q6WqLxaz5a2RACwGMfHmo3SO2PAjPWx2AHx2MluOJgJDQlisGZwjF2INP",
    name: "Torre Sayan Rio",
    badge: "85% VENDIDO",
    badgeColor: "bg-green-100 text-green-700",
    sub: "Residencial de lujo · Entrega Q3 2025",
    investors: 3,
    investorLabel: "12 Inversores activos",
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVY0onfjFdi7i2rOIIq99lJStUlitHgNl5nnTcte3my2Kxh3PweiUrfuDuS9XMHab8SIAUYfchcw5yyRd74cKU4Km2ox9bIKrtPiWh_GbivLDOPk0LB81dG_c9VYpKSqDJ-IZV2XjfDy2e6wRFxZV2-bfFgj0mIuzU-gIVIwPEhw2qbwAPnmu4ZnyZYOenj8OqVSdHdC0BoKrauiUAuPRnoN8wMRfEDDPvZiTx295lOBfShy4cqsUtc0NJHJfcoq_uVO6uyJ8d4CD7",
    name: "Paseo Global II",
    badge: "PRE-VENTA",
    badgeColor: "bg-slate-100 text-slate-800",
    sub: "Corporativo Clase A · 12,000 m² GLA",
    investors: 2,
    investorLabel: "8 Inversores activos",
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGavQbkoMgc-ZKnHyiazUbTRDiZh7xHoxjZpKstSdZylYchL1S6rkiJvByLlFuX-Ty_Kx-Z2ivNmF0XWms8FS3z6FSlQv335Ps2FhDyuZV2yijSjqpya5NaaqWrL5MCMhPBVnET19Ma1C0Y9livnsv4fuSHx4CWOGaH_O40MHZ1jiCqr0FFRti7qEcXANDArATvfmW1zYvPlHCI2W7ODoJ-GOOqKttwF4B7teWlPaLH9UN8OTn2yQgSCgk8j24ooKiKPQq8NR8Mmpq",
    name: "The Icon District",
    badge: "PLANIFICACIÓN",
    badgeColor: "bg-orange-100 text-orange-700",
    sub: "Uso Mixto · Regeneración Urbana",
    investors: 1,
    investorLabel: "Iniciativa Privada",
  },
]

interface PipelineCardProps {
  project: Project
}

export function PipelineCard({ project }: PipelineCardProps) {
  const shades = ["bg-slate-200", "bg-slate-300", "bg-slate-400"]

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100">
      <div className="aspect-video w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.img}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h5 className="font-bold text-lg">{project.name}</h5>
          <span
            className={`px-2 py-0.5 ${project.badgeColor} text-[10px] font-black rounded-full`}
          >
            {project.badge}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium mb-4">
          {project.sub}
        </p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex -space-x-2">
            {shades.slice(0, project.investors).map((shade, i) => (
              <div
                key={i}
                className={`h-6 w-6 rounded-full border-2 border-white ${shade}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-800">
            {project.investorLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
