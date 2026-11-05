"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaCarouselType } from "embla-carousel"
import { useShouldReduceMotion } from "@animate-ui/react/utils/motion"
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Download, GalleryHorizontal, Lock, Play } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useFrame, useMore } from "../parts/frame"
import { TYPE } from "../parts/tokens"
import { WCard } from "../parts/anatomy"
import { WidgetEmpty, type WidgetProps } from "../parts/shared"
import { SHAPE_OF, autoOf, everyOf, shows, useShelfCards, type MediaItem, type Shape } from "./media-data"
import { Drop, tileDrop } from "../parts/card"
import { Art, FADE_TO, Meter, RATIO, SameTitleSize, Tag, Tile, WIDE, ctaOf } from "./poster"

/**
 * In a cell that sets the height (the desktop grid, see GROW_ROWS in parts/tokens.tsx) the Grid layout fills it instead of
 * going by its own proportions: the column that holds the grid, the grid, a tile and its picture. Where a card is as tall
 * as its content (phones, the library) none of it applies. Whole class names, so Tailwind sees them.
 */
const GRID_COLUMN = "[@container_card_(min-height:0px)]:flex [@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:flex-1 [@container_card_(min-height:0px)]:flex-col"
const GRID_FILL = "[@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:flex-1 [@container_card_(min-height:0px)]:auto-rows-[minmax(0,1fr)]"
const TILE_FILL = "[@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:grid-rows-[minmax(5rem,1fr)_auto]"
const PICTURE_FILL = "[@container_card_(min-height:0px)]:aspect-auto"

/** How wide a poster is in a row, by shape and the card's width: a part of the next one always shows. */
const ROW_BASIS: Record<"tall" | "wide", string> = {
  tall: "basis-[44%] @[28rem]:basis-[30%] @[44rem]:basis-[22.5%] @[60rem]:basis-[17.5%]",
  wide: "basis-[80%] @[28rem]:basis-[46%] @[44rem]:basis-[31%] @[60rem]:basis-[23.5%]",
}

/** A carousel slide's width: three across from two columns, five on a full-width card (three for wide frames). */
const SLIDE_BASIS: Record<"tall" | "wide", string> = {
  tall: "basis-[58%] @[30rem]:basis-[36%] @[48rem]:basis-[26%] @[64rem]:basis-[21%]",
  wide: "basis-[82%] @[30rem]:basis-[62%] @[48rem]:basis-[46%] @[64rem]:basis-[38%]",
}

const fit = (shape: Shape) => (WIDE.has(shape) ? "wide" : "tall")

/** A round arrow button for a row or a carousel. */
export function Arrow({ dir, onClick, disabled, className }: { dir: "prev" | "next"; onClick: () => void; disabled?: boolean; className?: string }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border bg-card text-card-foreground shadow-[var(--card-shadow)] outline-none",
        "transition-[opacity,transform,scale,background-color] duration-150 ease-out hover:bg-muted active:scale-[0.97] disabled:pointer-events-none disabled:opacity-0",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** Automatic play: one step every `every` seconds while nobody is on the widget and the tab is visible. */
function useAutoplay(on: boolean, every: number, step: () => void) {
  const [hold, setHold] = useState(false)
  const still = useShouldReduceMotion()
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  })
  useEffect(() => {
    if (!on || still || hold) return
    const t = setInterval(() => !document.hidden && stepRef.current(), every * 1000)
    return () => clearInterval(t)
  }, [on, still, hold, every])
  const handlers = { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false), onFocusCapture: () => setHold(true), onBlurCapture: () => setHold(false) }
  return { handlers, playing: on && !still && !hold }
}

/** A native scrolling row with snap, a fade at whichever edge has more, and arrows (on hover, or always when manual). */
function Row({ items, shape, over, auto, every }: { items: MediaItem[]; shape: Shape; over: boolean; auto: boolean; every: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const still = useShouldReduceMotion()
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, items.length])
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.86, behavior: still ? "auto" : "smooth" })
  const { handlers } = useAutoplay(auto, every, () => {
    const el = ref.current
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollTo({ left: 0, behavior: "smooth" })
    else page(1)
  })
  const fade = (on: boolean) => (on ? "2.5rem" : "0px")
  return (
    <div className="group/row relative -mx-[calc(1rem*var(--density,1))]" {...handlers}>
      <div
        ref={ref}
        onScroll={measure}
        className="flex snap-x snap-mandatory scroll-px-[calc(1rem*var(--density,1))] gap-3 overflow-x-auto overscroll-x-contain px-[calc(1rem*var(--density,1))] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: `linear-gradient(to right, transparent 0, #000 ${fade(edges.start)}, #000 calc(100% - ${fade(edges.end)}), transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0, #000 ${fade(edges.start)}, #000 calc(100% - ${fade(edges.end)}), transparent 100%)`,
        }}
      >
        {items.map((it) => (
          <Tile key={it.id} item={it} shape={shape} over={over} className={cn("shrink-0 snap-start", ROW_BASIS[fit(shape)])} />
        ))}
      </div>
      {/* Arrows sit over the poster area, centred on the picture: on hover with a mouse, always when the coach chose buttons. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-2 top-0 flex items-center justify-between transition-opacity duration-200",
          auto ? "hidden opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:hover)]:flex" : "opacity-100",
        )}
        style={{ height: over ? "calc(100% - 1.75rem)" : "calc(100% - 2.75rem)" }}
      >
        <Arrow dir="prev" onClick={() => page(-1)} disabled={!edges.start} className="pointer-events-auto" />
        <Arrow dir="next" onClick={() => page(1)} disabled={!edges.end} className="pointer-events-auto" />
      </div>
    </div>
  )
}

/**
 * A grid card: the picture on top at 3:2 (or the shape chosen), then the words on the card itself — label, title,
 * text, tags, progress and the button. The grid fills the width (fewer cards get wider), so no column stands empty.
 */
function GridCard({ item, shape }: { item: MediaItem; shape: Shape }) {
  const more = useMore("standard")
  const progress = item.pct !== undefined && shows(item, "progress")
  return (
    <Link
      href={item.href}
      className={cn(
        FADE_TO,
        "group/card grid min-w-0 content-start overflow-hidden rounded-[min(var(--radius),12px)] outline-none",
        // In a cell that sets the height the picture takes what the words leave (rather than its own ratio), so nothing is cut.
        TILE_FILL,
        "bg-[color-mix(in_oklab,var(--card-foreground)_3%,var(--card))] ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_9%,transparent)] ring-inset",
        "transition-[box-shadow,transform,scale] duration-300 ease-out active:scale-[0.99] motion-reduce:active:scale-100",
        "[@media(hover:hover)]:hover:ring-[color-mix(in_oklab,var(--card-foreground)_20%,transparent)] focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className={cn("@container/tile relative overflow-hidden", RATIO[shape], PICTURE_FILL)}>
        <div className="absolute inset-0 transition-transform duration-[700ms] ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover/card:scale-[1.05] motion-reduce:[@media(hover:hover)]:group-hover/card:scale-100">
          <Art item={item} shape={shape} />
        </div>
        {(item.fresh || item.locked) && (
          <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
            {item.fresh ? <Tag strong>New</Tag> : <span />}
            {item.locked && (
              <Tag>
                <Lock className="size-3" />
                {item.locked}
              </Tag>
            )}
          </div>
        )}
        {progress && item.pct! > 0 && <Meter pct={item.pct!} className="absolute inset-x-0 bottom-0 rounded-none" />}
      </div>
      <div className="grid min-w-0 gap-2 p-[calc(0.875rem*var(--density,1))]">
        {(item.kicker && shows(item, "kicker")) || shows(item, "title") ? (
          <div className="grid min-w-0 gap-0.5">
            {item.kicker && shows(item, "kicker") && <span className={cn(TYPE.label, "truncate")}>{item.kicker}</span>}
            {shows(item, "title") && <h4 className={cn(TYPE.title, "line-clamp-2 text-balance")}>{item.title}</h4>}
          </div>
        ) : null}
        {more && item.sub && shows(item, "text") && <p className={cn(TYPE.small, "line-clamp-2")}>{item.sub}</p>}
        {more && item.tags.length > 0 && shows(item, "tags") && (
          <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden [max-height:1.25rem]">
            {item.tags.slice(0, 3).map((t) => (
              <Tag key={t} plain>
                {t}
              </Tag>
            ))}
          </div>
        )}
        {((progress && item.status) || shows(item, "button")) && (
          // A narrow card puts the button under the progress instead of cutting either.
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pt-0.5">
            {progress ? (
              <span className="flex min-w-0 items-center gap-2">
                <Meter pct={item.pct!} className="w-10 shrink-0" />
                <span className={cn(TYPE.small, "whitespace-nowrap tabular-nums")}>{item.status}</span>
              </span>
            ) : (
              <span className={cn(TYPE.small, "truncate tabular-nums")}>{shows(item, "progress") ? item.status : ""}</span>
            )}
            {shows(item, "button") && (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs leading-4 font-medium text-card-foreground">
                <span className="max-w-[10rem] truncate">{ctaOf(item)}</span>
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/card:translate-x-0.5" />
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/** A wrapping grid of cards that always fills the row; on a narrow card each one lies down as a line. */
function Grid({ items, shape }: { items: MediaItem[]; shape: Shape }) {
  // Tall posters in a grid waste height: the grid draws them at 4:5 at most.
  const gridShape: Shape = shape === "portrait" ? "classic" : shape
  return (
    <>
      <div className={cn("hidden gap-3 @[26rem]:grid", GRID_FILL)} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${WIDE.has(gridShape) ? 13 : 11}rem), 1fr))` }}>
        {items.map((it, i) =>
          // In a cell that sets the height, a tile that no longer fits whole gives way, the last one first; the first never does
          // (a card whose every tile gave way would be empty, and one tile that is a little cut is better than none).
          i === 0 ? (
            <GridCard key={it.id} item={it} shape={gridShape} />
          ) : (
            <Drop key={it.id} level={tileDrop(i)}>
              <GridCard item={it} shape={gridShape} />
            </Drop>
          ),
        )}
      </div>
      <ul className="grid gap-2 @[26rem]:hidden">
        {items.map((it, i) => (
          // The same rule as the tiles: in a cell that sets the height a line that no longer fits whole gives way, the last first; the first stays.
          <li key={it.id} data-drop={i === 0 ? undefined : tileDrop(i)}>
            <Link href={it.href} className="group/line flex min-w-0 items-center gap-3 rounded-[min(var(--radius),8px)] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-[min(var(--radius),6px)]">
                <span className="absolute inset-0 transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover/line:scale-[1.08]">
                  <Art item={it} shape="classic" />
                </span>
              </span>
              <span className="grid min-w-0 flex-1 gap-1">
                <span className={cn(TYPE.title, "truncate")}>{it.title}</span>
                {it.pct !== undefined && shows(it, "progress") ? <Meter pct={it.pct} className="w-full max-w-32" /> : null}
                <span className={cn(TYPE.small, "truncate tabular-nums")}>{it.locked ? `Needs ${it.locked}` : shows(it, "progress") ? it.status : it.tags[0]}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/line:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

/** The card's width, for the one layout that changes its parts with it (the carousel turns into a row when narrow). */
function useWidth<T extends HTMLElement>() {
  const [w, setW] = useState(0)
  // A callback ref, so it starts measuring whenever the element appears (a Shelf can mount empty and get cards later).
  const ref = useCallback((el: T | null) => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** How much a slide shrinks and fades per snap away from the centre. */
const SCALE_STEP = 0.14
const MIN_SCALE = 0.72
const MIN_OPACITY = 0.45

/**
 * Carousel (Embla): the centred poster at full size, its neighbours smaller and dimmer, worked out from the scroll on
 * every frame so the shrink follows a drag. Loops; dots, a counter or arrows only under it; automatic or by the buttons.
 */
function Carousel({ items: posters, shape, over, nav, auto, every }: { items: MediaItem[]; shape: Shape; over: boolean; nav: string; auto: boolean; every: number }) {
  const still = useShouldReduceMotion()
  // A loop needs a poster more than it shows on each side: with fewer, the posters repeat (the dots still count the real ones).
  const n = posters.length
  const loop = n >= 3
  const copies = loop ? Math.max(1, Math.ceil(8 / n)) : 1
  const items = Array.from({ length: copies }, (_, c) => posters.map((it) => ({ ...it, id: c ? `${it.id}~${c}` : it.id }))).flat()
  const [ref, api] = useEmblaCarousel({ loop, align: "center", containScroll: false, duration: 30, skipSnaps: false })
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const [index, setIndex] = useState(0)
  const [can, setCan] = useState({ prev: false, next: false })

  const tween = useCallback(
    (e: EmblaCarouselType, kind?: string) => {
      const engine = e.internalEngine()
      const progress = e.scrollProgress()
      const inView = e.slidesInView()
      const snaps = e.scrollSnapList()
      const step = SCALE_STEP * snaps.length
      snaps.forEach((snap, si) => {
        let diff = snap - progress
        engine.slideRegistry[si].forEach((i) => {
          if (kind === "scroll" && !inView.includes(i)) return
          if (engine.options.loop)
            engine.slideLooper.loopPoints.forEach((lp) => {
              const target = lp.target()
              if (i === lp.index && target !== 0) diff = Math.sign(target) === -1 ? snap - (1 + progress) : snap + (1 - progress)
            })
          const d = Math.abs(diff)
          const node = slides.current[i]
          if (!node) return
          node.style.transform = still ? "" : `scale(${Math.max(MIN_SCALE, 1 - d * step)})`
          node.style.opacity = String(Math.max(MIN_OPACITY, 1 - d * step * 3.2))
        })
      })
    },
    [still],
  )

  useEffect(() => {
    if (!api) return
    const select = () => {
      setIndex(api.selectedScrollSnap())
      setCan({ prev: api.canScrollPrev(), next: api.canScrollNext() })
    }
    select()
    tween(api)
    api.on("select", select).on("reInit", select).on("reInit", tween).on("scroll", tween).on("slideFocus", tween)
    return () => {
      api.off("select", select).off("reInit", select).off("reInit", tween).off("scroll", tween).off("slideFocus", tween)
    }
  }, [api, tween])

  const { handlers } = useAutoplay(auto, every, () => (api?.canScrollNext() ? api.scrollNext() : api?.scrollTo(0)))

  const go = (i: number) => api?.scrollTo(i, still)
  const prev = () => (still ? api?.scrollTo((index - 1 + items.length) % items.length, true) : api?.scrollPrev())
  const next = () => (still ? api?.scrollTo((index + 1) % items.length, true) : api?.scrollNext())

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Posters"
      className="grid gap-3"
      {...handlers}
      onKeyDownCapture={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
        e.preventDefault()
        if (e.key === "ArrowLeft") prev()
        else next()
      }}
    >
      <div ref={ref} className="-mx-[calc(1rem*var(--density,1))] overflow-hidden px-[calc(1rem*var(--density,1))] [mask-image:linear-gradient(to_right,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)]">
        <div className="flex touch-pan-y">
          {items.map((it, i) => (
            <div key={it.id} role="group" aria-roledescription="slide" aria-label={`${(i % n) + 1} of ${n}`} aria-hidden={i >= n || undefined} className={cn("min-w-0 shrink-0 grow-0 px-1.5", SLIDE_BASIS[fit(shape)])}>
              <div
                ref={(node) => void (slides.current[i] = node)}
                className="origin-center will-change-transform"
                onClickCapture={(e) => {
                  // A side poster comes to the centre first; only the centred one opens.
                  if (i === index) return
                  e.preventDefault()
                  go(i)
                }}
              >
                <Tile item={it} shape={shape} over={over} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Arrow dir="prev" onClick={prev} disabled={!can.prev} className="disabled:opacity-40" />
        {nav === "dots" && (
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose a poster">
            {posters.map((it, i) => (
              <button key={it.id} type="button" role="tab" aria-selected={i === index % n} aria-label={`Go to ${i + 1}: ${it.title}`} onClick={() => go(index - (index % n) + i)} className="group/dot grid h-6 place-items-center outline-none">
                <span
                  className="block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-ring"
                  style={{ width: i === index % n ? "1.25rem" : "0.375rem", background: i === index % n ? "var(--card-foreground)" : "color-mix(in oklab, var(--card-foreground) 24%, transparent)" }}
                />
              </button>
            ))}
          </div>
        )}
        {nav === "counter" && (
          <span className={cn(TYPE.small, "min-w-12 text-center tabular-nums")} aria-live="polite">
            {(index % n) + 1} / {n}
          </span>
        )}
        <Arrow dir="next" onClick={next} disabled={!can.next} className="disabled:opacity-40" />
      </div>
    </div>
  )
}

const SOURCE_ICON = { courses: BookOpen, lessons: Play, downloads: Download, own: GalleryHorizontal }

/** Shelf: row (scrolls), carousel (centred, sides shrink), grid (cards that fill the row; a list when narrow). */
export function Shelf({ variant = "row", props }: WidgetProps) {
  const { source, cards, title, href } = useShelfCards(props)
  const shape = (["portrait", "landscape", "photo", "classic", "square"].includes(String(props.shape)) ? props.shape : variant === "grid" ? "photo" : SHAPE_OF[source]) as Shape
  const over = props.words !== "below"
  const { core } = useFrame()
  const [ref, width] = useWidth<HTMLDivElement>()
  const auto = autoOf(props, false)
  const every = everyOf(props, 5)
  const Icon = SOURCE_ICON[source] ?? GalleryHorizontal

  if (cards.length === 0)
    return (
      <WidgetEmpty
        icon={Icon}
        title={source === "own" ? "No cards yet" : source === "downloads" ? "No files yet" : source === "lessons" ? "Nothing to continue yet" : "No courses yet"}
        text={source === "own" ? "Add cards in Design → Content." : "What the coach publishes shows here as posters."}
      />
    )

  // The carousel needs room for its sides to shrink: under ~30rem it is a row.
  const carousel = variant === "carousel" && width >= 480
  const unit = source === "downloads" ? "files" : source === "lessons" ? "lessons" : source === "own" ? "cards" : "courses"
  return (
    <WCard icon={Icon} title={String(props.title || title)} meta={`${cards.length} ${unit}`} action={core || source === "own" ? undefined : { label: "See all", href }} bodyClassName="min-h-0">
      <SameTitleSize>
        <div ref={ref} className={cn("min-w-0", variant === "grid" && GRID_COLUMN)}>
          {carousel ? (
            <Carousel items={cards} shape={shape} over={over} nav={String(props.nav || "dots")} auto={auto} every={every} />
          ) : variant === "grid" ? (
            <Grid items={cards.slice(0, 12)} shape={shape} />
          ) : (
            <Row items={cards} shape={shape} over={over} auto={auto} every={every} />
          )}
        </div>
      </SameTitleSize>
    </WCard>
  )
}
