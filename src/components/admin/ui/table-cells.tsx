import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AdminProgress } from "./progress-line"

/** Admin / Cell stack (Figma 'Admin · Tables'): a title over an optional subtitle; the title is Regular or Medium. */
export function CellStack({ title, subtitle, weight = "regular", className }: { title: React.ReactNode; subtitle?: React.ReactNode; weight?: "regular" | "medium"; className?: string }) {
  return (
    <div className={cn("grid min-w-0 gap-0.5", className)}>
      <span className={cn("truncate text-a-text", weight === "medium" ? "t-body-m-medium" : "t-body-m")}>{title}</span>
      {subtitle && <span className="truncate t-caption text-a-text-2">{subtitle}</span>}
    </div>
  )
}

/** Admin / Cell person: an avatar and a stack (name, then e-mail or tier). */
export function CellPerson({ initials, name, subtitle, className }: { initials: string; name: React.ReactNode; subtitle?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar className="size-8 shrink-0"><AvatarFallback>{initials}</AvatarFallback></Avatar>
      <CellStack title={name} subtitle={subtitle} weight="medium" />
    </div>
  )
}

/** Admin / Cell progress: a 4px bar and the value. */
export function CellProgress({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className={cn("flex w-32 items-center gap-2", className)}>
      <AdminProgress label={label} tone="accent" value={value} className="flex-1" />
      <span className="w-8 text-right t-caption text-a-text-2 tabular-nums">{Math.round(value)}%</span>
    </div>
  )
}

const DOT = { neutral: "bg-a-text-3", warning: "bg-a-warning-fill", danger: "bg-a-danger-fill", success: "bg-a-success-fill" } as const
/** Admin / Cell dot (Figma 662:30140): a 7px status dot and its words in Caption, 6px apart. Tone never carries the meaning alone. */
export function CellDot({ label, tone = "neutral", className }: { label: React.ReactNode; tone?: keyof typeof DOT; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 t-caption text-a-text-2", className)}>
      <span aria-hidden className={cn("size-[7px] shrink-0 rounded-full", DOT[tone])} />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  )
}
