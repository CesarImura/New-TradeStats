import { cn } from "@/lib/utils"

/**
 * Where a dragged row will land, for every list sorted by drag: a thin line in the accent, drawn in the gap
 * before or after the row. It is never an edge of the row itself, so a rounded card doesn't look broken.
 * The row gets `relative`; the line is its ::before, so the row keeps ::after free. `axis="x"` is the vertical line for a grid of cards.
 */
export const dropLine = (edge?: "before" | "after" | false | null, axis: "y" | "x" = "y") =>
  edge &&
  cn(
    "relative before:pointer-events-none before:absolute before:z-10 before:rounded-full before:bg-primary",
    // "x": a vertical line for items laid out in a row or a grid, drawn in the gap beside the item.
    axis === "x" ? "before:inset-y-0 before:w-0.5" : "before:inset-x-0 before:h-0.5",
    axis === "x" ? (edge === "before" ? "before:-left-2" : "before:-right-2") : edge === "before" ? "before:-top-1" : "before:-bottom-1",
  )
