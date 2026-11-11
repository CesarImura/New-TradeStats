import { cn } from "@/lib/utils"

/**
 * Admin / Table for screens written as <Table><TableHeader>… (Figma 662:30058 and its parts, section "Admin · Tables").
 * Same look as `AdminTable` + `AdminTh/Tr/Td`: a panel with a clipping radius, a 32px subtle head row with mono 10px labels,
 * 61px rows with a hairline above and a hover fill, and sideways scroll instead of squeezing. The shell is part of `Table`: do not wrap it in another border.
 */
export function Table({ className, bare, scrollLabel, ...props }: React.ComponentProps<"table"> & { /** A table with nothing to focus in it: lets the keyboard reach it to scroll sideways, and names it. */ scrollLabel?: string; /** The parent already is the panel (border, radius, fill): draw only the table and its sideways scroll. */ bare?: boolean }) {
  const t = (
    <div className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-a-border-focus" {...(scrollLabel ? { tabIndex: 0, role: "region", "aria-label": scrollLabel } : {})}>
      <table className={cn("w-full border-collapse text-left", className)} {...props} />
    </div>
  )
  return bare ? t : <div data-slot="admin-table" className="overflow-hidden rounded-a-lg border border-a-border bg-a-panel">{t}</div>
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-a-subtle", className)} {...props} />
}

export function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody {...props} />
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("border-t border-a-border transition-colors duration-300 hover:bg-a-hover data-[state=selected]:bg-a-selected [thead_&]:border-t-0 [thead_&]:hover:bg-transparent", className)} {...props} />
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th scope="col" className={cn("relative h-8 py-0 pr-4 text-left align-middle font-normal whitespace-nowrap t-mono-label-s text-a-text-2 first:pl-5 last:pr-5", className)} {...props} />
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("h-[61px] py-3 pr-4 align-middle t-body-m text-a-text first:pl-5 last:pr-5", className)} {...props} />
}
