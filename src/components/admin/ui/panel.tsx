import { cn } from "@/lib/utils"

/** Admin / Panel (548:95): bg panel, 1px border, radius lg, padding 20, gap 16. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="admin-panel" className={cn("flex min-w-0 flex-col gap-4 rounded-a-lg border border-a-border bg-a-panel p-5", className)} {...props} />
}

/** Admin / Panel header: title (Heading M) with an optional description and an Actions slot. */
export function PanelHeader({ title, description, actions, className }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="t-heading-m truncate text-a-text">{title}</h2>
        {description && <p className="t-body-m text-a-text-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
