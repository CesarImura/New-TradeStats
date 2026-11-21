"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * Admin / Menu (Figma 548:175) on the DropdownMenu primitive. The surface (raised fill, strong hairline, radius 12, shadow, padding 6,
 * gap 2, min width 220) and the item metrics (32 px, padding 10, gap 10, radius 6, 13 px) come from the Admin layer in `lib/theme/admin-v2.ts`,
 * so these parts only add what the layer cannot know: the tone, the active item and the group label.
 * Use them instead of hand-sized `h-9 rounded-lg` rows with `!` classes.
 */
export const AdminMenu = DropdownMenu
export const AdminMenuTrigger = DropdownMenuTrigger
export const AdminMenuGroup = DropdownMenuGroup

export function AdminMenuContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuContent>) {
  return <DropdownMenuContent className={cn("w-auto gap-0.5", className)} {...props} />
}

/** Admin / Menu item. `tone="danger"` is the red one; `active` marks the open entry (selected fill, aria-current). */
export function AdminMenuItem({ tone = "default", active, className, ...props }: Omit<React.ComponentProps<typeof DropdownMenuItem>, "variant"> & { tone?: "default" | "danger"; active?: boolean }) {
  return (
    <DropdownMenuItem
      variant={tone === "danger" ? "destructive" : "default"}
      aria-current={active ? "true" : undefined}
      className={cn("t-body-m", tone === "danger" && "text-a-danger", active && "bg-a-selected", className)}
      {...props}
    />
  )
}

/** Group label: Space Mono, capitals, tertiary. Must sit inside an `AdminMenuGroup` (Base UI throws otherwise). */
export function AdminMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel className={cn("px-2.5 pt-1.5 pb-1 t-mono-label text-a-text-3", className)} {...props} />
}

export function AdminMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return <DropdownMenuSeparator className={cn("mx-0 my-1.5", className)} {...props} />
}
