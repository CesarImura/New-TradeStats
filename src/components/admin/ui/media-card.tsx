import { cn } from "@/lib/utils"

/**
 * Admin / Media card (Figma 'Admin · Cards & lists'): radius 12, panel fill, hairline; a cover on a sunk fill (status tag top left, an
 * alert strip at the bottom), a body (title, subtitle, meta), a stats row. The card itself is one link; put overlays in `cover`.
 */
export function MediaCard({ cover, title, subtitle, meta, stats, className, ...props }: Omit<React.ComponentProps<"div">, "title"> & { cover: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; meta?: React.ReactNode; stats?: readonly (readonly [string, string])[] }) {
  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-a-lg border border-a-border bg-a-panel transition-colors duration-300 hover:border-a-border-strong", className)} {...props}>
      <div className="relative border-b border-a-border-subtle bg-a-sunk">{cover}</div>
      <div className="grid gap-3 px-5 pt-4">
        <div className="grid gap-1">
          <span className="t-heading-s text-a-text">{title}</span>
          <span className="line-clamp-1 min-h-4 t-body-m text-a-text-2">{subtitle}</span>
        </div>
        {meta && <div className="flex items-center gap-2 t-caption">{meta}</div>}
      </div>
      {stats && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-a-border-subtle px-5 py-4">
          {stats.map(([v, l]) => (
            <div key={l} className="grid gap-0.5">
              <dd className="t-heading-s tabular-nums text-a-text">{v}</dd>
              <dt className="t-caption text-a-text-2">{l}</dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
