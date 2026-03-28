import Link from "next/link"
import { Icon } from "@/components/icon"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium mb-4">
      <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
        Inicio
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <Icon name="chevron_right" className="text-[10px]" />
          {item.href ? (
            <Link href={item.href} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
