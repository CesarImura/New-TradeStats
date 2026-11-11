import { cn } from "@/lib/utils"

/** Admin / Empty state (Figma 'Admin · Layout'): radius 12, dashed strong hairline, padding 48/24, an accent-soft icon box, title, description, actions. */
export function EmptyState({ icon: Icon, title, description, actions, compact, className }: { icon?: React.ComponentType<{ className?: string }>; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; compact?: boolean; className?: string }) {
  if (compact) return <p className={cn("rounded-a-md border border-dashed border-a-border-strong px-4 py-6 text-center t-body-m text-a-text-2", className)}>{title}</p>
  return (
    <div className={cn("grid place-items-center gap-2.5 rounded-a-lg border border-dashed border-a-border-strong px-6 py-12 text-center", className)}>
      {Icon && <span className="grid size-9 place-items-center rounded-a-md bg-a-accent-soft text-a-text-accent"><Icon className="size-4" aria-hidden /></span>}
      <h2 className="t-heading-s text-a-text">{title}</h2>
      {description && <p className="max-w-[360px] t-body-m text-a-text-2">{description}</p>}
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
