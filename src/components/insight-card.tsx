import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface InsightCardProps {
  title: string;
  content: string;
}

export function InsightCard({ title, content }: InsightCardProps) {
  return (
    <Card className="border-l-4 border-l-[var(--accent)] bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--accent)] p-1.5 text-white shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
