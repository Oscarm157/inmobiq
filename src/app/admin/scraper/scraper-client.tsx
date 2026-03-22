"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Icon } from "@/components/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyType, ListingType, SourcePortal, ScrapeJob } from "@/types/database";

interface ListingDraft {
  source_portal: SourcePortal;
  external_id: string;
  external_url: string;
  title: string;
  description: string;
  property_type: PropertyType | "";
  listing_type: ListingType | "";
  price_mxn: number | "";
  price_usd: number | "";
  area_m2: number | "";
  bedrooms: number | "";
  bathrooms: number | "";
  parking: number | "";
  lat: number | "";
  lng: number | "";
  address: string;
  images: string[];
}

interface ExtractionMeta {
  layers: { jsonLd: boolean; openGraph: boolean; heuristic: boolean; ai: boolean };
  confidence: "high" | "medium" | "low";
}

type Status = "idle" | "scraping" | "preview" | "saving" | "saved" | "error";

const EMPTY_DRAFT: ListingDraft = {
  source_portal: "otro",
  external_id: "",
  external_url: "",
  title: "",
  description: "",
  property_type: "",
  listing_type: "",
  price_mxn: "",
  price_usd: "",
  area_m2: "",
  bedrooms: "",
  bathrooms: "",
  parking: "",
  lat: "",
  lng: "",
  address: "",
  images: [],
};

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "terreno", label: "Terreno" },
  { value: "local", label: "Local Comercial" },
  { value: "oficina", label: "Oficina" },
];

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "renta", label: "Renta" },
];

const PORTALS: { value: SourcePortal; label: string }[] = [
  { value: "inmuebles24", label: "Inmuebles24" },
  { value: "lamudi", label: "Lamudi" },
  { value: "vivanuncios", label: "Vivanuncios" },
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "otro", label: "Otro" },
];

const CONFIDENCE_COLORS = {
  high: "bg-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-red-500/20 text-red-400",
};

const CONFIDENCE_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function ScraperClient() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT);
  const [extraction, setExtraction] = useState<ExtractionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScrapeJob[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Redirect non-admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, router]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/scrape/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.jobs ?? []);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadHistory();
  }, [isAdmin, loadHistory]);

  // Scrape URL
  const handleScrape = async () => {
    if (!url.trim()) return;

    setStatus("scraping");
    setError(null);
    setExtraction(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Error en scraping");
      }

      setJobId(data.jobId);
      setExtraction(data.extraction);

      // Map API response to draft
      const l = data.listing;
      setDraft({
        source_portal: l.source_portal ?? "otro",
        external_id: l.external_id ?? "",
        external_url: l.external_url ?? url,
        title: l.title ?? "",
        description: l.description ?? "",
        property_type: l.property_type ?? "",
        listing_type: l.listing_type ?? "",
        price_mxn: l.price_mxn ?? "",
        price_usd: l.price_usd ?? "",
        area_m2: l.area_m2 ?? "",
        bedrooms: l.bedrooms ?? "",
        bathrooms: l.bathrooms ?? "",
        parking: l.parking ?? "",
        lat: l.lat ?? "",
        lng: l.lng ?? "",
        address: l.address ?? "",
        images: l.images ?? [],
      });

      setStatus("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  };

  // Save listing
  const handleSave = async () => {
    if (!draft.property_type || !draft.listing_type) {
      setError("Selecciona tipo de propiedad y tipo de listado antes de guardar");
      return;
    }

    setStatus("saving");
    setError(null);

    try {
      const payload = {
        jobId,
        listing: {
          ...draft,
          price_mxn: draft.price_mxn === "" ? null : Number(draft.price_mxn),
          price_usd: draft.price_usd === "" ? null : Number(draft.price_usd),
          area_m2: draft.area_m2 === "" ? null : Number(draft.area_m2),
          bedrooms: draft.bedrooms === "" ? null : Number(draft.bedrooms),
          bathrooms: draft.bathrooms === "" ? null : Number(draft.bathrooms),
          parking: draft.parking === "" ? null : Number(draft.parking),
          lat: draft.lat === "" ? null : Number(draft.lat),
          lng: draft.lng === "" ? null : Number(draft.lng),
        },
      };

      const res = await fetch("/api/admin/scrape/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Error guardando");
      }

      setStatus("saved");
      setSaveMessage(
        `Guardado: ${data.stats.new > 0 ? "nuevo" : "actualizado"}, zona asignada: ${data.stats.zoneAssigned > 0 ? "sí" : "no"}`
      );
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  };

  // Reset
  const handleDiscard = () => {
    setStatus("idle");
    setDraft(EMPTY_DRAFT);
    setExtraction(null);
    setError(null);
    setJobId(null);
    setSaveMessage(null);
  };

  // Update draft field
  const updateField = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-500 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const canSave = !!draft.property_type && !!draft.listing_type && (status === "preview" || status === "saving");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Scraper Manual
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pega la URL de una propiedad individual para extraer sus datos
        </p>
        <div className="mt-3 text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p>
            <span className="text-emerald-500 font-medium">Funcionan:</span>{" "}
            Propiedades.com, Century21
          </p>
          <p>
            <span className="text-red-400 font-medium">Bloqueados:</span>{" "}
            Inmuebles24, Vivanuncios, Segundamano, MercadoLibre (requieren Playwright vía terminal)
          </p>
        </div>
      </div>

      {/* URL Input */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.inmuebles24.com/propiedades/..."
              disabled={status === "scraping" || status === "saving"}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleScrape();
              }}
              className="flex-1 min-w-0 px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleScrape}
              disabled={!url.trim() || status === "scraping" || status === "saving"}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 justify-center min-w-[140px]"
            >
              {status === "scraping" ? (
                <>
                  <span className="animate-spin">
                    <Icon name="progress_activity" className="text-lg" />
                  </span>
                  Scrapeando...
                </>
              ) : (
                <>
                  <Icon name="travel_explore" className="text-lg" />
                  Scrapear
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 flex items-start gap-2">
          <Icon name="error" className="text-lg flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Save success */}
      {saveMessage && status === "saved" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-400 flex items-start gap-2">
          <Icon name="check_circle" className="text-lg flex-shrink-0 mt-0.5" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Extraction Meta */}
      {extraction && status !== "idle" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capas:</span>
          {extraction.layers.jsonLd && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">JSON-LD</span>
          )}
          {extraction.layers.openGraph && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">OpenGraph</span>
          )}
          {extraction.layers.heuristic && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">CSS</span>
          )}
          {extraction.layers.ai && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">IA</span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_COLORS[extraction.confidence]}`}>
            Confianza: {CONFIDENCE_LABELS[extraction.confidence]}
          </span>
        </div>
      )}

      {/* Preview/Edit Form */}
      {(status === "preview" || status === "saving" || status === "saved") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="edit_note" className="text-lg" />
              Datos extraídos — revisa y edita antes de guardar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Portal */}
              <FormSelect
                label="Portal"
                value={draft.source_portal}
                onChange={(v) => updateField("source_portal", v as SourcePortal)}
                options={PORTALS.map((p) => ({ value: p.value, label: p.label }))}
              />

              {/* External ID */}
              <FormInput
                label="ID Externo"
                value={draft.external_id}
                onChange={(v) => updateField("external_id", v)}
              />

              {/* Property Type */}
              <FormSelect
                label="Tipo de propiedad *"
                value={draft.property_type}
                onChange={(v) => updateField("property_type", v as PropertyType | "")}
                options={[
                  { value: "", label: "— Seleccionar —" },
                  ...PROPERTY_TYPES.map((p) => ({ value: p.value, label: p.label })),
                ]}
                required
                missing={!draft.property_type}
              />

              {/* Listing Type */}
              <FormSelect
                label="Tipo de listado *"
                value={draft.listing_type}
                onChange={(v) => updateField("listing_type", v as ListingType | "")}
                options={[
                  { value: "", label: "— Seleccionar —" },
                  ...LISTING_TYPES.map((p) => ({ value: p.value, label: p.label })),
                ]}
                required
                missing={!draft.listing_type}
              />

              {/* Title (full width) */}
              <div className="md:col-span-2">
                <FormInput
                  label="Título"
                  value={draft.title}
                  onChange={(v) => updateField("title", v)}
                />
              </div>

              {/* Prices */}
              <FormNumber
                label="Precio MXN"
                value={draft.price_mxn}
                onChange={(v) => updateField("price_mxn", v)}
              />
              <FormNumber
                label="Precio USD"
                value={draft.price_usd}
                onChange={(v) => updateField("price_usd", v)}
              />

              {/* Area */}
              <FormNumber
                label="Área m²"
                value={draft.area_m2}
                onChange={(v) => updateField("area_m2", v)}
              />

              {/* Bedrooms */}
              <FormNumber
                label="Recámaras"
                value={draft.bedrooms}
                onChange={(v) => updateField("bedrooms", v)}
              />

              {/* Bathrooms */}
              <FormNumber
                label="Baños"
                value={draft.bathrooms}
                onChange={(v) => updateField("bathrooms", v)}
              />

              {/* Parking */}
              <FormNumber
                label="Estacionamientos"
                value={draft.parking}
                onChange={(v) => updateField("parking", v)}
              />

              {/* Address (full width) */}
              <div className="md:col-span-2">
                <FormInput
                  label="Dirección"
                  value={draft.address}
                  onChange={(v) => updateField("address", v)}
                />
              </div>

              {/* Lat / Lng */}
              <FormNumber
                label="Latitud"
                value={draft.lat}
                onChange={(v) => updateField("lat", v)}
                step="0.0001"
              />
              <FormNumber
                label="Longitud"
                value={draft.lng}
                onChange={(v) => updateField("lng", v)}
                step="0.0001"
              />

              {/* Description (full width) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Descripción
                </label>
                <textarea
                  value={draft.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>

              {/* Images */}
              {draft.images.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Imágenes ({draft.images.length})
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {draft.images.slice(0, 8).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Imagen ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ))}
                    {draft.images.length > 8 && (
                      <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                        +{draft.images.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleSave}
                disabled={!canSave || status !== "preview"}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 justify-center"
              >
                {status === "saving" ? (
                  <>
                    <span className="animate-spin">
                      <Icon name="progress_activity" className="text-lg" />
                    </span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Icon name="save" className="text-lg" />
                    Guardar en base de datos
                  </>
                )}
              </button>
              <button
                onClick={handleDiscard}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 justify-center"
              >
                <Icon name="close" className="text-lg" />
                Descartar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="history" className="text-lg" />
              Historial de scrapes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">
                    {job.url}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <span className="text-xs text-slate-400">
                      {new Date(job.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form field components
// ---------------------------------------------------------------------------

function FormInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function FormNumber({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? "" : Number(v));
        }}
        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
  missing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  missing?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
          missing && required
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    saved: "bg-emerald-500/20 text-emerald-400",
    failed: "bg-red-500/20 text-red-400",
    preview: "bg-blue-500/20 text-blue-400",
    scraping: "bg-amber-500/20 text-amber-400",
    extracting: "bg-purple-500/20 text-purple-400",
    pending: "bg-slate-500/20 text-slate-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
