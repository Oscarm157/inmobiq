import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface InsightCardProps {
  title: string
  content: string
}

export function InsightCard({ title, content }: InsightCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold">{title}</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
