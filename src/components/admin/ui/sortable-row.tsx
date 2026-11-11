"use client"

import { GripVertical } from "@/components/icons"
import { cn } from "@/lib/utils"
import { ReorderHandle } from "./reorder"

/**
 * Admin / Sortable row (Figma 748:38223): radius 8, 52 high, padding 8/10, gap 10, a drag handle, titles, a trailing slot.
 * States: default, hover (a faint fill, the handle and menu brighten), active (selected: accent edge), dragging (accent edge, a stronger fill), disabled.
 * With `handle` the grip is a real button: drag it, or focus it and press the arrows (see ui/reorder). Without it, the grip is only decoration.
 */
export function SortableRow({ title, description, trailing, active, dragging, disabled, handle, dragHandleProps, className, ...props }: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  trailing?: React.ReactNode
  active?: boolean
  dragging?: boolean
  disabled?: boolean
  /** Makes the grip a keyboard-and-drag handle: its label, the hint it points to, what the arrows do, and the drag props (draggable, onDragStart, onDragEnd). */
  handle?: { label: string; hintId: string; onMove: (by: -1 | 1) => void } & Omit<React.ComponentProps<"button">, "onKeyDown" | "onClick">
  dragHandleProps?: React.ComponentProps<"span">
}) {
  return (
    <div data-slot="sortable-row" className={cn("group/sortable flex min-h-[52px] items-center gap-2.5 rounded-a-md border px-2.5 py-2 transition-colors duration-300", active ? "border-a-border-active bg-a-muted" : "border-transparent hover:bg-a-hover", dragging && "border-a-border-active bg-a-selected", disabled && "pointer-events-none opacity-40", className)} {...props}>
      {handle ? (
        <ReorderHandle {...handle} className={cn("-ml-1", handle.className)} />
      ) : (
        <span aria-hidden className="grid size-4 shrink-0 cursor-grab place-items-center text-a-text-3 transition-colors duration-150 group-hover/sortable:text-a-text" {...dragHandleProps}>
          <GripVertical className="size-3.5" />
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate t-body-m text-a-text">{title}</span>
        {description && <span className="truncate t-caption text-a-text-2">{description}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
    </div>
  )
}
