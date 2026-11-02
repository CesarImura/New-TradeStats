"use client"

import { Copy, EyeOff, Lock, Trash2 } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { WidgetView, widthOf } from "@/components/widgets/page-renderer"
import { getWidget, widthsFor } from "@/components/widgets/registry"
import { useGroups } from "@/lib/data/access"
import type { WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { PHASE_LABEL, WIDTH } from "../panels/builder-panels"

/** The editor's own chips on the canvas (a widget's name, its quick bar): near-black with white text and a fine light edge, the same on every theme. */
// --ui-zoom undoes the canvas's scale, so the editor's chips keep their real size (24px buttons) however small the page is drawn.
const EDITOR_CHIP = "[zoom:var(--ui-zoom,1)] bg-[#141416] text-white shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_6px_16px_-6px_rgb(0_0_0/0.7)]"
/** One button of the quick bar: 24px tall, a lighter fill on hover, the orange ring on keyboard focus. */
const QUICK = "grid h-6 min-w-6 place-items-center rounded-md outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--ts-interactive)] active:scale-[0.94]"

/** One widget on the builder grid: the real widget, plus its name and selection outline. */
export function GridWidget({ w, fixed = false, selected, available, onRemove, onDuplicate, onWidth }: { w: WidgetInstance; /** The cell gives the card its height (the desktop grid). */ fixed?: boolean; selected: boolean; available: boolean; onRemove: () => void; onDuplicate: () => void; onWidth?: (cols: number) => void }) {
  const def = getWidget(w.type)
  const { coach } = useCoach()
  const groups = useGroups(coach)
  if (!def) return null
  const widths = !def.core && w.type !== "page-header" ? widthsFor(def, w.variant) : []
  // Widgets with a visibility rule stay on the canvas, tagged with who sees them.
  const rule = [w.show?.phase && PHASE_LABEL[w.show.phase], w.show?.group && (groups.find((g) => g.id === w.show?.group)?.name ?? "A group")].filter(Boolean).join(" · ")
  return (
    <div
      className={cn(
        // The editor's selection colour (white, --ts-interactive in the workspace), never a coach's: a selected widget always reads as selected.
        "group/w relative flex cursor-grab flex-col h-full rounded-[calc(var(--radius)+2px)] outline-[calc(1.5px*var(--ui-zoom,1))] outline-offset-2 outline-transparent hover:outline-[var(--ts-interactive)]/35 active:cursor-grabbing",
        selected && "outline-[var(--ts-interactive)]",
      )}
    >
      {/* Name, rule and quick actions sit on the card's top edge, half above it, so they never cover its header. .no-drag keeps
          clicks on the actions from starting a drag; the actions also show while one of them has keyboard focus. */}
      <div className="pointer-events-none absolute inset-x-2 top-0 z-20 flex -translate-y-[60%] items-center gap-1 font-[family-name:var(--ff-geist)]">
        <span
          // Its name on hover; once selected the inspector names it, and the quick bar takes the edge.
          className={cn("min-w-0 truncate rounded-md px-1.5 py-0.5 text-[0.6875rem] opacity-0 group-hover/w:opacity-100 data-[on=true]:hidden", EDITOR_CHIP)}
          data-on={selected}
          title={def.name}
        >
          {def.core && <Lock className="mr-1 inline size-2.5 align-[-1px]" />}
          {def.core ? `${def.name} · main part of the page` : def.name}
          {w.header && Object.keys(w.header).length > 0 && " · own header"}
          {w.style && Object.values(w.style).some((v) => v !== undefined) && " · own style"}
          {w.emphasis === "star" && " · Star"} · {WIDTH.find((o) => o.value === widthOf(w))?.label.toLowerCase()}
        </span>
        <span className="ml-auto" />
        {rule && <span className="max-w-[45%] shrink-0 truncate rounded-[3px] bg-[var(--ts-interactive)] px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none font-medium tracking-[0.04em] text-black uppercase">{rule}</span>}
        {/* The quick bar: the width in one click (selected only), duplicate and remove. On the card's own top edge, so it never
            covers the widget below; in the editor's colours, not the coach's, so it reads the same on every theme. */}
        <div
          role="toolbar"
          aria-label={`${def.name} quick actions`}
          className={cn("no-drag pointer-events-auto flex h-7 shrink-0 items-center gap-0.5 rounded-lg p-0.5 opacity-0 transition-opacity duration-150 group-hover/w:opacity-100 focus-within:opacity-100 data-[on=true]:opacity-100", EDITOR_CHIP)}
          data-on={selected}
          onClick={(e) => e.stopPropagation()}
        >
          {w.hideOnPhone && (
            <span className="flex items-center gap-1 px-1.5 text-white/60" title="Hidden on phones" aria-label="Hidden on phones">
              <EyeOff className="size-3.5" />
            </span>
          )}
          {selected && onWidth && widths.length > 1 && (
            <>
              <span role="radiogroup" aria-label="Width" className="flex items-center gap-0.5">
                {WIDTH.filter((o) => widths.includes(o.value)).map((o) => {
                  const on = widthOf(w) === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={o.label}
                      title={o.label}
                      onClick={() => onWidth(o.value)}
                      className={cn(QUICK, "w-8", on ? "bg-white text-black hover:bg-white hover:text-black" : "text-white/75")}
                    >
                      <span aria-hidden className="grid h-2.5 w-5 grid-cols-3 gap-px">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className={cn("rounded-[1px] bg-current", i >= o.value / 4 && "opacity-30")} />
                        ))}
                      </span>
                    </button>
                  )
                })}
              </span>
              <span aria-hidden className="mx-0.5 h-4 w-px bg-white/15" />
            </>
          )}
          {def.core ? (
            <span className="flex items-center gap-1 px-1.5 text-[0.6875rem] text-white/75">
              <Lock className="size-3" /> Always on this page
            </span>
          ) : (
            <>
              <button type="button" aria-label={`Duplicate ${def.name}`} title="Duplicate" className={cn(QUICK, "text-white/75")} onClick={onDuplicate}>
                <Copy className="size-3.5" />
              </button>
              <button type="button" aria-label={`Remove ${def.name}`} title="Remove (⌫)" className={cn(QUICK, "text-white/75 hover:text-[#ff6b6b]")} onClick={onRemove}>
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className={cn("pointer-events-none flex flex-col select-none", fixed && "min-h-0 flex-1")}>
        {available ? (
          <WidgetView w={w} fixed={fixed} />
        ) : (
          <div className="grid place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its page is switched off in the Menu step.
          </div>
        )}
      </div>
    </div>
  )
}
