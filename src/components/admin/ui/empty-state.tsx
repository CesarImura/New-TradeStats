import { cn } from "@/lib/utils"

/** Admin / Empty state (Figma): dashed 4/4 border, radius 12, padding 48/24, gap 10, accent icon box, Heading S title, Body/M text, Actions. */
export function EmptyState({ icon: Icon, title, text, action, className }: { icon?: React.ComponentType<{ className?: string }>; title: React.ReactNode; text?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 rounded-a-lg border border-dashed border-a-border-strong px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="grid size-9 place-items-center rounded-a-md bg-a-accent-soft text-a-text-accent">
          <Icon className="size-4" />
        </span>
      )}
      <p className="t-heading-s text-a-text">{title}</p>
      {text && <p className="t-body-m max-w-sm text-a-text-2">{text}</p>}
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
