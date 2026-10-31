"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronRight, GripVertical } from "@/components/icons"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { WidgetView } from "@/components/widgets/page-renderer"
import { DataModeProvider } from "@/components/widgets/parts/shared"
import { getWidget, lookOf, pageWidth, widthsFor, type WidgetDef } from "@/components/widgets/registry"
import { themeToCss } from "@/lib/theme/css"
import { widgetSetOf } from "@/lib/theme/types"
import type { Detail, WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { useDesign } from "../fields/design-fields"
import { EASE } from "../states"
import { TILE_IDLE, TILE_ON } from "./option-art"

/*
 * Widget thumbnails: the gallery, "On this page", a widget's details and the layouts in the inspector all draw the
 * same picture. It is the real widget (WidgetView, the path the live page uses), in the coach's DRAFT design (colours,
 * light or dark, every All widgets setting) and with the widget's own changes (its style, emphasis, header, content),
 * so it changes with every edit, for every widget there is or will be. Rules, checked by eye on every widget:
 * - laid out at its width on the desktop page and its own height, then scaled down until all of it fits a 2:1 tile:
 *   nothing is cut, no empty card, the same picture in one column and in two;
 * - a new widget (the gallery) shows Compact and no description line, so it reads at a glance; THUMBS adjusts the few
 *   that need it, and gives long widgets a height (they drop rows until they fit, as a cell on the page makes them);
 * - nothing behind it but the tile; drawn only once the tile scrolls into view;
 * - the draft's variables come from ThumbStyles (mounted once by the workspace), its choices from CoachContext.
 */

/** One column of the desktop page, the width a thumbnail's widget is laid out at (as on the page, so it never reflows oddly). */
const COL_PX = 340
/** The gap between columns on the desktop page, for widgets wider than one column. */
const GAP_PX = 24
/** The class every thumbnail carries: the draft theme's variables are set on it (ThumbScope), and the admin's styles leave it alone. */
const SCOPE = "hb-thumb"

/**
 * How a new widget is shown in the gallery, when its first layout or Compact is not its clearest picture: the detail
 * that says best what it is, and a height for the long ones. Each was checked by eye; a widget not listed needs nothing.
 */
const THUMBS: Partial<Record<string, { variant?: string; detail?: Detail; h?: number; props?: Record<string, string | boolean> }>> = {
  // A gauge alone leaves half the card empty: Standard puts its list beside it.
  "rules-followed": { detail: "standard" },
  drawdown: { detail: "standard" },
  // Long by nature: a height that keeps a few rows, the widget drops the rest.
  "trading-streak": { h: 250 },
  "recent-trades": { h: 230 },
  "open-positions": { h: 210 },
  leaderboard: { h: 220 },
  "partner-links": { h: 210 },
  upgrade: { h: 230 },
  shelf: { h: 240 },
  "welcome-video": { h: 240 },
  links: { h: 200 },
  faq: { h: 200 },
  "latest-downloads": { h: 200 },
  "community-feed": { h: 210 },
  "coach-feedback": { h: 210 },
  "first-week": { h: 210 },
}

/** A new widget as the gallery shows it: its clearest layout, Compact (or THUMBS's detail), no description line. */
export function galleryWidget(def: WidgetDef, variant?: string, detail?: Detail, props?: Record<string, string | boolean>): WidgetInstance {
  const spec = THUMBS[def.type] ?? {}
  const v = lookOf(def, variant ?? spec.variant).value
  return { id: `thumb-${def.type}`, type: def.type, variant: v, detail: detail ?? spec.detail ?? "compact", header: { description: false }, props: props ?? spec.props, x: 0, y: 0, w: widthsFor(def, v)[0], h: 1 }
}

/** The draft theme's variables on `.hb-thumb`, for every thumbnail in the editor: one style tag, mounted once by the workspace. */
export function ThumbStyles() {
  const { theme } = useDesign()
  return <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, `.${SCOPE}`) }} />
}

/** True once the element has come near the viewport (and stays true): thumbnails further down are drawn only when needed. */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "300px" })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return [ref, seen] as const
}

/** A widget's thumbnail: `w` as it would be on the page (see the rules above), fitted into a 2:1 tile. */
export function WidgetThumb({ w }: { w: WidgetInstance }) {
  const def = getWidget(w.type)
  // The widgets' own code (chart style, names, numbers…) reads the coach from CoachContext: give it the draft, or a
  // thumbnail would mix the draft's colours (ThumbStyles) with the published design's choices.
  const ctx = useCoach()
  const { coach, theme } = useDesign()
  const [tile, seen] = useSeen<HTMLDivElement>()
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, th: 0, h: 0 })
  useEffect(() => {
    const t = tile.current
    const i = inner.current
    if (!t || !i) return
    const ro = new ResizeObserver(() => setSize({ w: t.clientWidth, th: t.clientHeight, h: i.offsetHeight }))
    ro.observe(t)
    ro.observe(i)
    return () => ro.disconnect()
  }, [seen, tile])
  if (!def) return <div className="aspect-[2/1] w-full" />
  const cols = Math.min(3, pageWidth(w.w) / 4)
  const width = cols * COL_PX + (cols - 1) * GAP_PX
  const h = THUMBS[w.type]?.h
  // The same proportions at any size: a tile in one column and in two is the same picture, larger or smaller.
  const pad = size.w * 0.06
  const scale = size.h && size.w ? Math.min(1, (size.w - pad * 2) / width, (size.th - pad * 2) / size.h) : 0
  return (
    <div ref={tile} data-thumb-type={w.type} className="grid aspect-[2/1] w-full place-items-center overflow-hidden" aria-hidden inert>
      {seen && (
        <div className="relative" style={{ width: width * scale, height: size.h * scale, opacity: scale ? 1 : 0 }}>
          <CoachContext.Provider value={{ ...ctx, coach, theme, base: `/c/${coach.slug}` }}>
          <DataModeProvider value="sample">
            <div
              ref={inner}
              data-coach-scope
              className={cn(SCOPE, theme.mode === "dark" ? "dark" : "light", "pointer-events-none absolute top-0 left-0 origin-top-left bg-transparent font-sans text-foreground select-none")}
              style={{ width, transform: `scale(${scale || 1})`, containerType: "inline-size" }}
            >
              {/* The page's own wrappers, so its widget set applies as on the page (Open draws no box). The Grid finish is left out: it is the page behind the widgets, not a widget. */}
              <div className="g-page" data-set={widgetSetOf(theme)} data-finish="none" style={{ "--gap": `${GAP_PX}px` } as React.CSSProperties}>
                <div className={cn("g-item flex flex-col", def.core && "g-core g-plain", w.type === "page-header" && "g-plain")} style={{ height: h }}>
                  <WidgetView w={w} fixed={!!h} />
                </div>
              </div>
            </div>
          </DataModeProvider>
          </CoachContext.Provider>
        </div>
      )}
    </div>
  )
}

/**
 * The picture that follows the pointer while a widget is dragged onto the page: its thumbnail, lifted (a shadow, a
 * slight tilt) with its name, instead of the browser's faded copy of the whole card. The browser takes a snapshot of
 * it at once, so it is removed on the next frame. The thumbnail keeps its `.hb-thumb` class, so the copy keeps its colours.
 */
export function dragGhost(e: React.DragEvent, name: string) {
  const src = (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-thumb]") ?? (e.currentTarget as HTMLElement)
  const r = src.getBoundingClientRect()
  const ghost = document.createElement("div")
  ghost.style.cssText = `position:fixed;top:-1000px;left:-1000px;width:${Math.round(r.width)}px;padding:6px;border-radius:14px;background:#18181b;box-shadow:0 18px 40px -8px rgb(0 0 0/.55);transform:rotate(-2deg);font:500 12px/1.4 var(--ff-geist,system-ui);color:#fff;pointer-events:none`
  const pic = src.cloneNode(true) as HTMLElement
  pic.style.borderRadius = "9px"
  pic.style.overflow = "hidden"
  const label = document.createElement("div")
  label.textContent = `${name} · drop on the page`
  label.style.cssText = "padding:6px 4px 2px"
  ghost.append(pic, label)
  document.body.append(ghost)
  e.dataTransfer.setDragImage(ghost, Math.min(r.width / 2, e.clientX - r.left), 24)
  requestAnimationFrame(() => ghost.remove())
}

/**
 * The card around a thumbnail, wherever one is picked (the gallery, On this page, layouts): the same tile as the
 * option pictures (option-art), the thumbnail, its name and a short line. A div, not a button: the thumbnail holds
 * the widget's own buttons.
 */
export function ThumbCard({
  thumb,
  title,
  meta,
  sub,
  chevron,
  selected,
  off,
  className,
  dragHint,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { thumb: React.ReactNode; title: string; meta?: React.ReactNode; sub?: string; chevron?: boolean; selected?: boolean; off?: boolean; /** It can be dragged onto the page: a grip and "Drag to page" show on hover. */ dragHint?: boolean }) {
  return (
    <div
      {...rest}
      className={cn(
        "group/card grid gap-1.5 rounded-xl border p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] active:scale-[0.985] motion-reduce:active:scale-100",
        EASE,
        off ? "border-transparent opacity-55 active:scale-100" : cn("cursor-pointer", selected ? TILE_ON : TILE_IDLE),
        className,
      )}
    >
      <div data-thumb className="relative overflow-hidden rounded-lg">
        {thumb}
        {dragHint && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/75 py-0.5 pr-2 pl-1 text-[0.7rem] font-medium text-white opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-150 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
          >
            <GripVertical className="size-3.5" /> Drag to page
          </span>
        )}
      </div>
      <div className="grid gap-0.5 px-1.5 pb-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium">{title}</span>
          {meta && <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">{meta}</span>}
          {chevron && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover/card:translate-x-0.5" />}
        </span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}
