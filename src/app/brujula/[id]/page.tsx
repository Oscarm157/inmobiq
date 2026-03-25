import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { ValuationDetailClient } from "./client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ValuationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectedFrom=/brujula/${id}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: valuation } = await sb
    .from("valuations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!valuation || valuation.status !== "completed") {
    redirect("/brujula")
  }

  return (
    <ValuationDetailClient
      result={valuation.valuation_result}
      narrative={valuation.narrative ?? ""}
      property={{
        property_type: valuation.property_type ?? "casa",
        listing_type: valuation.listing_type ?? "venta",
        price_mxn: valuation.price_mxn ?? 0,
        area_m2: valuation.area_m2 ?? 0,
        bedrooms: valuation.bedrooms ?? null,
        bathrooms: valuation.bathrooms ?? null,
        parking: valuation.parking ?? null,
        address: valuation.address ?? null,
      }}
    />
  )
}
