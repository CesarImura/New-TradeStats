import { cn } from "@/lib/utils"

/**
 * Where a dragged row will land, for every list sorted by drag: a thin line in the accent, drawn in the gap
 * before or after the row. It is never an edge of the row itself, so a rounded card doesn't look broken.
 * The row gets `relative`; the line is its ::before, so the row keeps ::after free.
 */
export const dropLine = (edge?: "before" | "after" | false | null) =>
  edge &&
  cn(
    "relative before:pointer-events-none before:absolute before:inset-x-0 before:z-10 before:h-0.5 before:rounded-full before:bg-primary",
    edge === "before" ? "before:-top-1" : "before:-bottom-1",
  )
