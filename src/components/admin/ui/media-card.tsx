import { cn } from "@/lib/utils"

/**
 * Admin / Media card (Figma 736:2101, md): radius 12, panel fill, hairline. A 170px cover (status tag top left, menu top right, an
 * alert strip at the bottom), a body (title 16, subtitle 13, meta 12) and a stats row. Hover (mouse only): the card rises 2px, the fill and border lift a step and a soft shadow fades in (opacity only, on its own layer). The global `data-interactive` lift is not used here. Pass `onClick` to make the whole card a target.
 */
export function MediaCard({ cover, title, subtitle, meta, stats, className, ...props }: Omit<React.ComponentProps<"div">, "title"> & { cover: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; meta?: React.ReactNode; stats?: readonly (readonly [string, string])[] }) {
  return (
    <div data-slot="media-card" className={cn("group relative isolate flex flex-col rounded-a-lg border border-a-border bg-a-panel transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-colors", props.onClick && "cursor-pointer active:scale-[0.99] motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-a-border-strong [@media(hover:hover)_and_(pointer:fine)]:hover:bg-a-raised motion-reduce:[@media(hover:hover)_and_(pointer:fine)]:hover:translate-y-0", className)} {...props}>
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 shadow-[0_16px_36px_rgb(0_0_0/0.45)] transition-opacity duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100" />
      <div className="relative h-[170px] shrink-0 overflow-hidden rounded-t-[calc(var(--admin-radius-lg)-1px)] border-b border-a-border bg-a-sunk">{cover}</div>
      <div className="flex flex-col gap-1.5 px-5 pt-4 pb-3">
        <span className="truncate t-heading-s text-a-text">{title}</span>
        <span className="min-h-[18px] truncate t-body-m text-a-text-2">{subtitle}</span>
        {meta && <div className="flex items-center gap-2 t-caption">{meta}</div>}
      </div>
      {stats && (
        <dl className="flex gap-7 border-t border-a-border px-5 pt-3 pb-4">
          {stats.map(([v, l]) => (
            <div key={l} className="flex flex-col gap-0.5">
              <dd className="t-data-s tabular-nums text-a-text">{v}</dd>
              <dt className="t-caption text-a-text-2">{l}</dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

/** The strip at the foot of a media card's cover (Figma 'Status'): a dot, a line, and an action or a figure on the right. */
export function MediaCardStatus({ tone = "warning", text, trailing, className }: { tone?: "warning" | "danger" | "muted"; text: React.ReactNode; trailing?: React.ReactNode; className?: string }) {
  const dot = { warning: "bg-a-warning-fill", danger: "bg-a-danger-fill", muted: "bg-a-text-3" }[tone]
  return (
    <span className={cn("absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-a-md bg-a-page px-2.5 py-2 t-caption text-a-text", className)}>
      <span aria-hidden className={cn("size-[7px] shrink-0 rounded-full", dot)} />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </span>
  )
}
