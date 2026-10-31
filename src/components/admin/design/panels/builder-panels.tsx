"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Check, ChevronRight, GripVertical, ImagePlus, Plus } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { fitWidth, getWidget, librarySections, lookOf, pageWidth, settingsFor, widthsFor, type WidgetDef } from "@/components/widgets/registry"
import type { Coach } from "@/lib/data/coaches"
import { pictureFrom } from "@/lib/images"
import { COLS, type Detail, type Emphasis, type PageId, type WidgetInstance, type WidgetPhase } from "@/lib/widgets/layout"
import { SelectOptions } from "@/components/kit/select-field"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "../fields/controls"
import { card } from "../states"
import { ThumbCard, WidgetThumb, dragGhost, galleryWidget } from "../thumbs/widget-thumb"
import { Flyout } from "./flyout"
import { usePanelSearch } from "./settings-panel"

/** Per-widget Emphasis and Detail (see the rules in widgets/kit.tsx). Shared with the grid's right-click menu. */
export const EMPHASIS: { value: Emphasis; label: string; hint: string }[] = [
  { value: "quiet", label: "Quiet", hint: "No colour. Sits back so other widgets stand out." },
  { value: "accent", label: "Accent", hint: "One mark in your brand colour." },
  { value: "star", label: "Star", hint: "On your brand colour, bigger numbers. One per page." },
]
export const DETAIL: { value: Detail; label: string; hint: string }[] = [
  { value: "compact", label: "Compact", hint: "Just the headline number or item." },
  { value: "standard", label: "Standard", hint: "The headline plus its main context." },
  { value: "detailed", label: "Detailed", hint: "Everything this widget can show." },
]

/** Page widths (grid columns, see PAGE_WIDTHS) and what each does on every screen. Shared with the grid's right-click menu. */
export const WIDTH: { value: number; label: string; hint: string }[] = [
  { value: 4, label: "One column", hint: "Desktop: a third of the page. Tablet: half (the full width when the side menu leaves room for one column). Phone: the full width." },
  { value: 8, label: "Two columns", hint: "Desktop: two thirds, the next widgets beside and under it. Tablet: like One column. Phone: the full width." },
  { value: COLS, label: "Full width", hint: "The whole page on every screen." },
]

/** Visibility rules: the phases of a student's life a widget can be limited to. */
export const PHASE_LABEL: Record<WidgetPhase, string> = { "first-week": "First week", inactive: "Inactive", finished: "Finished a course" }
export const PHASES: { value: WidgetPhase | ""; label: string }[] = [
  { value: "", label: "Everyone" },
  { value: "first-week", label: "Their first week" },
  { value: "inactive", label: "Inactive students" },
  { value: "finished", label: "Finished a course" },
]

/** Where a widget's own button can lead: the pages the banner offers, plus any web address. */
export function noteTargets() {
  const t = getWidget("banner")?.settings?.find((s) => s.key === "target")
  const pages = t?.type === "select" ? t.options : [{ value: "courses", label: "Courses" }]
  return [...pages, { value: "url", label: "A web address" }]
}

/** Upload a picture: a thumbnail, Upload or Replace, and Remove. An empty value means the widget's sample picture. */
export function PictureUpload({ value, onChange, label = "picture" }: { value?: string; onChange: (dataUrl: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-10 w-16 shrink-0 rounded-md border object-cover" />
      ) : (
        <span className="grid h-10 w-16 shrink-0 place-items-center rounded-md border border-dashed text-muted-foreground">
          <ImagePlus className="size-4" />
        </span>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          {value ? "Replace" : `Upload ${label}`}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (!f) return
          try {
            // Scaled down so saved pages stay small.
            onChange(await pictureFrom(f, { max: 960 }))
          } catch (err) {
            toast.error((err as Error).message)
          }
        }}
      />
    </div>
  )
}

const MODULE_LABEL = { courses: "Courses", calendar: "Calendar", charts: "Charts", community: "Community", journal: "Journal", ranking: "Ranking", ai: "AI assistant", downloads: "Downloads", partners: "Partners" }

/** One line per widget for the gallery: what it is, no more. The registry's description stays the long one. */
const SHORT: Record<string, string> = {
  "page-header": "Page title and intro",
  "continue-lesson": "The next lesson to watch",
  "course-progress": "Progress in every course",
  "next-live": "The next live session",
  "econ-news": "Market events this week",
  "journal-pnl": "Results from the journal",
  "rules-followed": "How well your rules are kept",
  "first-week": "A new member's first steps",
  "my-rank": "Place on your leaderboard",
  announcement: "Your newest announcement",
  "community-feed": "Newest posts from your feed",
  discord: "Invite to your Discord",
  "welcome-video": "A personal message from you",
  banner: "A headline with a button",
  text: "A heading and a paragraph",
  image: "A picture, with a caption",
  button: "One call to action",
  embed: "A video or page from elsewhere",
  hero: "A big picture with a headline",
  faq: "Questions and answers",
  links: "A list of links",
  countdown: "Counts down to a date",
  "partner-links": "Brokers and tools you recommend",
  "latest-downloads": "The newest files",
  "ai-ask": "Ask your AI assistant",
  "book-call": "Book a call with you",
  drawdown: "Distance to the loss limits",
  "coach-feedback": "Trade reviews",
  upgrade: "Their tier and the next one",
  "coach-profile": "Your photo and socials",
}
export const shortOf = (d: WidgetDef) => SHORT[d.type] ?? d.description.split(/,|:| e\.g\./)[0]

/** Width as pictures: the page's three columns, with the ones the widget takes filled. Widths the layout can't take are off. */
export function SizePicker({ value, allowed, onChange }: { value: number; allowed: number[]; onChange: (w: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Width" className="grid grid-cols-3 gap-2">
      {WIDTH.map((o) => {
        const on = value === o.value
        const ok = allowed.includes(o.value)
        const span = o.value / 4
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!ok}
            title={ok ? o.hint : "This layout can't take this width"}
            onClick={() => onChange(o.value)}
            className={cn(
              "grid gap-1.5 p-2 text-left disabled:opacity-40 disabled:active:scale-100",
              card(on),
            )}
          >
            <span aria-hidden className="grid h-6 grid-cols-3 gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className={cn("rounded-[3px] transition-colors duration-150", i < span ? (on ? "bg-[var(--ts-interactive)]" : "bg-muted-foreground/60") : "border border-dashed border-muted-foreground/40")} />
              ))}
            </span>
            <span className="text-[0.6875rem] leading-tight font-medium">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** What a widget from the gallery is added with: chosen in its details before it goes on the page. */
export type AddOptions = { variant: string; w: number; detail: Detail; props: Record<string, string | boolean> }

/**
 * The widget gallery, on the left in Pages (the Framer model): Add, a short list of groups, each opening a grid of
 * plain tiles (the widget's icon and name, nothing else); On this page, the page's widgets as a list of names, like
 * layers. Search finds widgets across every group. A tile opens the widget's details (its real preview, size,
 * layout and options, then Add to the page) or drags straight onto the page. The real widget is shown there and on
 * the canvas, not in the list, so the gallery stays quiet beside the page.
 */
export function WidgetLibrary({
  page,
  pageLabel,
  coach,
  onPage,
  onAdd,
  onSelect,
  onDragType,
}: {
  page: PageId
  pageLabel: string
  coach: Coach
  /** The widgets already on the page, in reading order. */
  onPage: WidgetInstance[]
  onAdd: (type: string, opts: AddOptions) => void
  onSelect: (id: string) => void
  /** Tells the grid which widget is being dragged in, and with what chosen in its details (if from there). */
  onDragType: (type: string | null, opts?: AddOptions) => void
}) {
  const [view, setView] = useState<"add" | "page">("add")
  // Typed in the panel's header search, the same place as in Theme and Menu.
  const query = usePanelSearch()
  const [group, setGroup] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const q = query.trim().toLowerCase()
  const match = (w: WidgetDef) => !q || `${w.name} ${w.description} ${w.group} ${w.variants.map((v) => v.label).join(" ")}`.toLowerCase().includes(q)
  const sections = librarySections(page).filter((s) => s.types.length)
  const count = (type: string) => onPage.filter((w) => w.type === type).length

  const def = picked ? getWidget(picked) : undefined
  // While a widget is dragged out of the flyout it fades and lets the drop through to the page under it.
  const [dragging, setDragging] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // The flyout opens against the whole left sidebar (the aside), not just this list.
  const edge = useRef<HTMLElement | null>(null)
  useEffect(() => {
    edge.current = root.current?.closest("aside") ?? root.current
  })
  const drag = (type: string | null, opts?: AddOptions) => {
    setDragging(!!type)
    onDragType(type, opts)
  }

  // Search finds widgets in every group, in the panel; a group opens beside it, in the flyout.
  const tiles = q ? sections.flatMap((s) => s.types).map((t) => getWidget(t)!).filter(match) : null
  const groupTypes = group ? (sections.find((s) => s.title === group)?.types ?? []).map((t) => getWidget(t)!) : []
  const tile = (w: WidgetDef) => {
    const off = !!w.module && !coach.modules[w.module]
    const n = count(w.type)
    return (
      <ThumbCard
        key={w.type}
        role="button"
        tabIndex={off ? -1 : 0}
        aria-disabled={off || undefined}
        draggable={!off}
        // Native drag and drop: the grid accepts drops from outside.
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", w.type)
          e.dataTransfer.effectAllowed = "copy"
          dragGhost(e, w.name)
          drag(w.type)
        }}
        onDragEnd={() => drag(null)}
        onClick={() => !off && setPicked(w.type)}
        onKeyDown={(e) => {
          if (!off && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            setPicked(w.type)
          }
        }}
        className={off ? undefined : "cursor-grab active:cursor-grabbing"}
        dragHint={!off}
        aria-label={off ? `${w.name}. Switch on ${MODULE_LABEL[w.module!]} to use it.` : `${w.name}: see its options`}
        off={off}
        thumb={<WidgetThumb w={galleryWidget(w)} />}
        meta={n > 0 ? <><Check className="size-3" /> On page</> : undefined}
        // Just its name: what it is shows in its picture (and in the tooltip).
        title={w.name}
        sub={off ? `Switch on ${MODULE_LABEL[w.module!]} to use it` : undefined}
      />
    )
  }
  const here = onPage.filter((w) => getWidget(w.type) && match(getWidget(w.type)!))

  return (
    <div ref={root} className="grid">
      <Flyout
        open={!!def || (!!group && !q)}
        onClose={() => (setPicked(null), setGroup(null))}
        anchor={edge}
        side="right"
        width={380}
        title={def ? def.name : group}
      >
        <div className={cn("transition-opacity duration-150", dragging && "pointer-events-none opacity-30")}>
          {def ? (
            <WidgetDetails key={def.type} def={def} pageLabel={pageLabel} onPage={onPage.filter((w) => w.type === def.type)} onBack={() => setPicked(null)} onAdd={(o) => (onAdd(def.type, o), setPicked(null), setGroup(null))} onSelect={onSelect} onDrag={(o) => drag(o && def.type, o ?? undefined)} back={group ?? "Widgets"} />
          ) : (
            <div className="grid gap-3">{groupTypes.map(tile)}</div>
          )}
        </div>
      </Flyout>
      <div className="sticky top-0 z-10 grid border-t border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)] bg-background px-5 pt-4 pb-3">
        <Segmented
          label="Gallery"
          value={view}
          onChange={(v) => {
            setView(v)
            setGroup(null)
          }}
          options={[
            { value: "add", label: "Add" },
            { value: "page", label: "On this page" },
          ]}
        />
      </div>

      {view === "page" ? (
        // The page's widgets as a list of names, in reading order: one click selects it on the page.
        <div className="grid gap-1 px-3 pb-3">
          {here.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">{onPage.length ? `No widget on this page matches “${query}”.` : "No widgets on this page yet."}</p>}
          {here.map((w) => {
            const d = getWidget(w.type)!
            return (
              <button key={w.id} type="button" onClick={() => onSelect(w.id)} className={cn(LIST_ROW, "text-muted-foreground hover:text-foreground")}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)] [&_svg]:size-3.5">
                  <d.icon />
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-foreground">{d.name}</span>
                <span className="shrink-0 text-[0.6875rem]">{[d.variants.length > 1 && lookOf(d, w.variant).label, w.emphasis === "star" && "Star"].filter(Boolean).join(" · ")}</span>
              </button>
            )
          })}
        </div>
      ) : tiles ? (
        <div className="grid gap-3 px-4 pb-4">
          {tiles.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">No widget matches “{query}”. Try “calendar”, “progress” or “banner”.</p>}
          {tiles.map(tile)}
        </div>
      ) : (
        // The groups: one short list, each opening its widgets.
        <div className="grid gap-1 px-3 pb-3">
          {sections.map((s) => {
            const first = getWidget(s.types[0])
            return (
              <button key={s.title} type="button" aria-expanded={group === s.title} onClick={() => (setPicked(null), setGroup(group === s.title ? null : s.title))} className={cn(LIST_ROW, "text-muted-foreground hover:text-foreground", group === s.title && "bg-white/8 text-foreground")}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)] [&_svg]:size-4">{first && <first.icon />}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{s.title}</span>
                <ChevronRight className="size-3.5" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** A row of the gallery's lists (groups, On this page): 36px, a faint fill on hover. */
const LIST_ROW = `flex h-11 w-full items-center gap-3 rounded-[10px] px-2.5 text-left outline-none hover:bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] ${"transition-colors duration-150"}`

/**
 * One widget from the gallery, before it is added: a big preview of the chosen layout, then what can be set for it
 * (size, layout, detail and its own switches and choices), and Add to the page. Text and pictures are set once it
 * is on the page, in its panel.
 */
function WidgetDetails({
  def,
  pageLabel,
  onPage,
  onBack,
  onAdd,
  onSelect,
  onDrag,
  back = "Widgets",
}: {
  def: WidgetDef
  pageLabel: string
  onPage: WidgetInstance[]
  onBack: () => void
  onAdd: (opts: AddOptions) => void
  onSelect: (id: string) => void
  /** A drag of the preview or of a layout onto the page starts (with what is chosen) or ends (null). */
  onDrag: (opts: AddOptions | null) => void
  /** Where Back goes: the group the widget came from. */
  back?: string
}) {
  const [variant, setVariant] = useState(def.variants[0].value)
  const [w, setW] = useState(fitWidth(def, def.variants[0].value, def.defaultW))
  const [detail, setDetail] = useState<Detail>("standard")
  const [props, setProps] = useState<Record<string, string | boolean>>({})
  const widths = widthsFor(def, variant)
  const settings = settingsFor(def, variant)
  const choices = settings.filter((s) => s.type === "toggle" || s.type === "select")
  const top = useRef<HTMLDivElement>(null)
  // The preview and each layout drag onto the page as chosen here (a layout with its own width, if the size does not fit it).
  const drag = (v: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", def.type)
      e.dataTransfer.effectAllowed = "copy"
      dragGhost(e, def.name)
      onDrag({ variant: v, w: fitWidth(def, v, w), detail, props })
    },
    onDragEnd: () => onDrag(null),
  })
  // Opens at its top, wherever the gallery was scrolled to.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" })
  }, [])
  return (
    <div ref={top} className="flex min-h-full flex-col">
      <div className="pb-2">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
          <ArrowLeft /> {back}
        </Button>
      </div>
      <div className="grid flex-1 content-start gap-6 px-1 pb-2">
        <div className="grid gap-3">
          <div {...drag(variant)} title="Drag onto the page" className="group/card relative cursor-grab overflow-hidden rounded-xl border p-1.5 active:cursor-grabbing">
            <span aria-hidden className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1 rounded-md bg-black/75 py-0.5 pr-2 pl-1 text-[0.7rem] font-medium text-white shadow-sm backdrop-blur-sm">
              <GripVertical className="size-3.5" /> Drag to page
            </span>
            <div data-thumb className="pointer-events-none overflow-hidden rounded-lg">
              <WidgetThumb w={galleryWidget(def, variant, detail, props)} />
            </div>
          </div>
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold">{def.name}</span>
            <span className="text-xs text-muted-foreground">{shortOf(def)}</span>
          </div>
        </div>
        {onPage.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <Check className="size-3" /> Already on this page.
            <button type="button" className="font-medium text-foreground underline underline-offset-2" onClick={() => onSelect(onPage[0].id)}>
              Edit that one
            </button>
            or add another.
          </p>
        )}
        {def.type !== "page-header" && widths.length > 1 && (
          <div className="grid gap-2">
            <span className="text-[0.8rem] font-medium">Size</span>
            <SizePicker value={pageWidth(w)} allowed={widths} onChange={setW} />
          </div>
        )}
        {def.variants.length > 1 && (
          <div className="grid gap-2">
            <span className="text-[0.8rem] font-medium">Layout</span>
            <div role="radiogroup" aria-label="Layout" className="grid grid-cols-2 gap-2">
              {def.variants.map((v) => (
                <ThumbCard
                  key={v.value}
                  {...drag(v.value)}
                  role="radio"
                  tabIndex={0}
                  aria-checked={variant === v.value}
                  aria-label={v.label}
                  onClick={() => {
                    setVariant(v.value)
                    setW(fitWidth(def, v.value, w))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setVariant(v.value)
                      setW(fitWidth(def, v.value, w))
                    }
                  }}
                  selected={variant === v.value}
                  thumb={<WidgetThumb w={galleryWidget(def, v.value, detail, props)} />}
                  title={v.label}
                />
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <span className="text-[0.8rem] font-medium">Detail</span>
          <Segmented label="How much it shows" value={detail} options={DETAIL.map((o) => ({ value: o.value, label: o.value === "compact" ? "Less" : o.value === "detailed" ? "More" : "Standard", hint: o.hint }))} onChange={setDetail} />
        </div>
        {choices.length > 0 && (
          <div className="grid gap-3">
            <span className="text-[0.8rem] font-medium">Shows</span>
            {choices.map((s) =>
              s.type === "toggle" ? (
                <label key={s.key} className="flex items-center justify-between gap-3 text-[0.8rem]">
                  {s.label}
                  <Switch checked={props[s.key] === undefined ? !!s.defaultOn : !!props[s.key]} onCheckedChange={(v) => setProps({ ...props, [s.key]: v })} />
                </label>
              ) : s.type === "select" ? (
                <Field key={s.key} label={s.label}>
                  <SelectOptions value={String(props[s.key] ?? s.options[0].value)} onChange={(e) => setProps({ ...props, [s.key]: e.target.value })} className="h-8 rounded-lg border bg-background px-2 text-sm">
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectOptions>
                </Field>
              ) : null,
            )}
          </div>
        )}
      </div>
      <div className="sticky -bottom-5 -mx-4 flex gap-2 bg-[#111113] px-4 pt-3 pb-5">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Cancel
        </Button>
        <Button className="flex-[2]" onClick={() => onAdd({ variant, w, detail, props })}>
          <Plus /> Add to {pageLabel}
        </Button>
      </div>
    </div>
  )
}
