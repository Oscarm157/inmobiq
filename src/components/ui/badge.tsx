import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-[var(--secondary)] text-[var(--secondary-foreground)]": variant === "default",
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200": variant === "success",
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200": variant === "warning",
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}
