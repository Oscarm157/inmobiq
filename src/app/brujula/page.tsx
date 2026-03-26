"use client"

import { useState } from "react"
import { Icon } from "@/components/icon"
import { ScreenshotUploader } from "@/components/brujula/screenshot-uploader"
import { ManualForm, type ManualFormResult } from "@/components/brujula/manual-form"
import { ExtractionReview, type ReviewResult } from "@/components/brujula/extraction-review"
import { ValuationReport } from "@/components/brujula/valuation-report"
import { ValuationHistory } from "@/components/brujula/valuation-history"
import type { ExtractedPropertyData, ValuationResult, PropertyType, ListingType } from "@/types/database"

type Step = "input" | "review" | "result"
type InputMode = "screenshots" | "manual"

interface PropertyData {
  property_type: PropertyType
  listing_type: ListingType
  price_mxn: number
  area_m2: number
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  address: string | null
}

export default function BrujulaPage() {
  const [step, setStep] = useState<Step>("input")
  const [mode, setMode] = useState<InputMode>("manual")

  // Screenshot flow
  const [valuationId, setValuationId] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedPropertyData | null>(null)

  // Result
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [narrative, setNarrative] = useState("")
  const [property, setProperty] = useState<PropertyData | null>(null)

  const handleExtracted = (vId: string, data: Record<string, unknown>) => {
    setValuationId(vId)
    setExtracted(data as unknown as ExtractedPropertyData)
    setStep("review")
  }

  const handleManualResult = (data: ManualFormResult) => {
    setValuationId(data.valuationId)
    setResult(data.result)
    setNarrative(data.narrative)
    setProperty(data.property)
    setStep("result")
  }

  const handleReviewResult = (data: ReviewResult) => {
    setValuationId(data.valuationId)
    setResult(data.result)
    setNarrative(data.narrative)
    setProperty(data.property)
    setStep("result")
  }

  const reset = () => {
    setStep("input")
    setValuationId(null)
    setExtracted(null)
    setResult(null)
    setNarrative("")
    setProperty(null)
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold rounded-full tracking-widest uppercase">
            Brújula
          </span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight">
          Brújula Inmobiliaria
        </h2>
        <p className="text-slate-500 max-w-xl font-medium">
          Sube una propiedad y descubre si está a buen precio comparada con el mercado de su zona.
        </p>
      </div>

      {step === "input" && (
        <>
          {/* Mode tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                mode === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon name="edit" className="text-base" />
              Datos manuales
            </button>
            <button
              onClick={() => setMode("screenshots")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                mode === "screenshots"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon name="add_photo_alternate" className="text-base" />
              Screenshots
            </button>
          </div>

          {/* Input form */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800 max-w-2xl">
            {mode === "screenshots" ? (
              <ScreenshotUploader onExtracted={handleExtracted} />
            ) : (
              <ManualForm onResult={handleManualResult} />
            )}
          </div>

          {/* History */}
          <ValuationHistory />
        </>
      )}

      {step === "review" && extracted && valuationId && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 card-shadow border border-slate-100 dark:border-slate-800 max-w-2xl">
          <ExtractionReview
            valuationId={valuationId}
            extracted={extracted}
            onResult={handleReviewResult}
            onBack={reset}
          />
        </div>
      )}

      {step === "result" && result && property && (
        <div className="space-y-6">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            <Icon name="arrow_back" className="text-base" />
            Nueva valuación
          </button>
          <ValuationReport
            result={result}
            narrative={narrative}
            property={property}
          />
        </div>
      )}
    </div>
  )
}
