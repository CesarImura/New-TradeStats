import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const SIZE = { sm: "size-6", md: "size-8", lg: "size-10" } as const
const DOT = { danger: "bg-a-danger-fill", warning: "bg-a-warning-fill" } as const

/** Admin / Avatar: initials in a circle, 32 px by default, with an optional status dot on the corner. One avatar for every list, table and search result. */
export function AdminAvatar({ initials, size = "md", status, className }: { initials: string; size?: keyof typeof SIZE; status?: keyof typeof DOT; className?: string }) {
  return (
    <Avatar className={cn("shrink-0", SIZE[size], status && "overflow-visible", className)}>
      <AvatarFallback className="t-caption">{initials}</AvatarFallback>
      {status && <span aria-hidden className={cn("absolute -top-0.5 -right-0.5 size-2 rounded-full", DOT[status])} />}
    </Avatar>
  )
}
