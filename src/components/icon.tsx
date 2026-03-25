interface IconProps {
  name: string
  filled?: boolean
  className?: string
  "aria-label"?: string
  "aria-hidden"?: boolean
}

export function Icon({ name, filled = false, className = "", ...rest }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : {}}
      aria-hidden={rest["aria-label"] ? undefined : true}
      aria-label={rest["aria-label"]}
      role={rest["aria-label"] ? "img" : undefined}
    >
      {name}
    </span>
  )
}
