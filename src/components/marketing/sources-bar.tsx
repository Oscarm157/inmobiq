const sources = [
  "INEGI Censo 2020",
  "Inmuebles24",
  "Lamudi",
  "Vivanuncios",
  "Mercado Libre",
]

export function SourcesBar() {
  return (
    <section className="border-y border-[var(--m-gray-4)] bg-[var(--m-canvas-soft)]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <p className="m-eyebrow shrink-0 md:max-w-[28ch]">
            Datos de mercado y demografía pública
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
            {sources.map((s) => (
              <span
                key={s}
                className="text-[14px] text-[var(--m-ink-soft)]"
                style={{ letterSpacing: "-0.005em" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
