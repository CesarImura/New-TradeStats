"use client"

import { GripVertical } from "@/components/icons"
import { cn } from "@/lib/utils"

/** Admin / Sortable row (Figma 'Admin · Cards & lists'): radius 8, padding 8/10, gap 10, a drag handle, titles, a trailing slot. States: hover, active (accent edge), dragging, disabled. */
export function SortableRow({ title, description, trailing, active, dragging, dragHandleProps, className, ...props }: Omit<React.ComponentProps<"div">, "title"> & { title: React.ReactNode; description?: React.ReactNode; trailing?: React.ReactNode; active?: boolean; dragging?: boolean; dragHandleProps?: React.ComponentProps<"span"> }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-a-md border px-2.5 py-2 transition-colors duration-300", active ? "border-a-border-active bg-a-muted" : "border-transparent hover:bg-a-hover", dragging && "border-a-border-active bg-a-selected", className)} {...props}>
      <span aria-hidden className="grid size-4 shrink-0 cursor-grab place-items-center text-a-text-3" {...dragHandleProps}><GripVertical className="size-3.5" /></span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate t-body-m text-a-text">{title}</span>
        {description && <span className="truncate t-caption text-a-text-2">{description}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
    </div>
  )
}
