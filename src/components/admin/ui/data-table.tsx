import { cn } from "@/lib/utils"

/**
 * Admin / Table (Figma 662:30058): a panel with a clipping radius, a subtle head row, rows with a hairline above, and an optional footer.
 * Columns are fixed: give each `AdminTh` its width (the cell plus the 16px gap to the next one); the first column takes what is left.
 * Rows are 61px with a 36px content line, the head is 32px, and the table scrolls sideways under `minWidth` instead of squeezing.
 */
export function AdminTable({ children, footer, minWidth = 1100, className, scrollLabel }: { children: React.ReactNode; footer?: React.ReactNode; minWidth?: number; className?: string; /** For a table with nothing to focus in it: lets the keyboard reach it to scroll sideways, and names it. */ scrollLabel?: string }) {
  return (
    <div data-slot="admin-table" className={cn("overflow-hidden rounded-a-lg border border-a-border bg-a-panel", className)}>
      <div className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-a-border-focus" {...(scrollLabel ? { tabIndex: 0, role: "region", "aria-label": scrollLabel } : {})}>
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth }}>
          {children}
        </table>
      </div>
      {footer}
    </div>
  )
}

/** Admin / Table head: put `AdminTh` cells inside. */
export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-a-subtle">
      <tr>{children}</tr>
    </thead>
  )
}

/** Admin / Table head cell: mono caption, 12px line. `width` is the whole column (cell + gap), in px. */
export function AdminTh({ children, width, align = "start", className }: { children?: React.ReactNode; width?: number; align?: "start" | "end"; className?: string }) {
  return (
    <th scope="col" style={width ? { width } : undefined} className={cn("relative h-8 py-0 pr-4 font-normal t-mono-label-s text-a-text-2 first:pl-5 last:pr-5", align === "end" && "text-right", className)}>
      {children ?? <span className="sr-only">Actions</span>}
    </th>
  )
}

/** Admin / Table row: hairline above, hover fill, `selected` for the chosen state. Pass `onClick` to make the whole row a target. */
export function AdminTr({ selected, className, ...props }: React.ComponentProps<"tr"> & { selected?: boolean }) {
  return <tr data-state={selected ? "selected" : undefined} className={cn("group/row border-t border-a-border transition-colors duration-300 hover:bg-a-hover data-[state=selected]:bg-a-selected", props.onClick && "cursor-pointer", className)} {...props} />
}

/** Admin / Table cell: 12px above and below, 16px to the next cell, aligned to the start or the end (numbers, dates). */
export function AdminTd({ align = "start", className, ...props }: Omit<React.ComponentProps<"td">, "align"> & { align?: "start" | "end" }) {
  return <td className={cn("py-3 pr-4 align-middle t-body-m text-a-text-2 first:pl-5 last:pr-5", align === "end" && "text-right tabular-nums", className)} {...props} />
}

/** Admin / Table footer: a hairline above and a 12px line of text (a count, selection actions). */
export function AdminTableFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-[37px] flex-wrap items-center gap-2 border-t border-a-border px-5 py-2.5 t-caption text-a-text-2", className)}>{children}</div>
}
