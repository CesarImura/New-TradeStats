import { cn } from "@/lib/utils"

/** Admin / Page header (549:89): Display title, Body/M subtitle, Actions slot. Stacks on narrow screens. */
export function AdminPageHeader({ title, subtitle, actions, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="t-title-l md:t-display text-a-text [overflow-wrap:anywhere]">{title}</h1>
        {subtitle && <p className="t-body-m max-w-[60ch] text-a-text-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
