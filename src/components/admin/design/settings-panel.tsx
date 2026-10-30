"use client"

import { createContext, useContext, useEffect, useId, useRef, useState } from "react"
import { ArrowRight, Check, ChevronDown, Image as ImageIcon, LayoutDashboard, LayoutGrid, Monitor, Palette, PanelLeftIcon, RotateCcw, Search, Smartphone, Tablet, TriangleAlert, Type, Wand2, X } from "@/components/icons"
import type { ThemeDraft } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { widgetFinishOf, widgetSetOf, type CoachTheme } from "@/lib/theme/types"
import { DesignField, useDesign } from "./design-fields"
import { ChartPanelField, FOCUS, HeaderPartsField, LogoColoursField, NumbersField, StylePresetField, SurfaceField } from "./settings-fields"

/**
 * The theme editor's panel in the admin's Design: an icon rail of sections on the
 * left, each section's settings in small groups on the right. A group knows
 * which theme settings it holds, so it shows "changed" and resets just
 * itself; one search finds any setting in every section. Drawn in shadcn
 * tokens, so it takes the host's look (the admin's dark).
 */

/** `folded`: closed until the coach opens it (Advanced). */
export type SettingsGroup = { title: string; note?: string; fields: string[]; keys: (keyof ThemeDraft)[]; words: string; folded?: boolean }
/** A section: groups of fields, or its own content (the admin's Look, Menu and Pages). */
/**
 * The section rail's orange (the admin's selection colour, fixed whatever the coach's theme): open section = a
 * gradient bar, gradient icon and a faint orange wash and edge; hover = a grey wash and edge, as everywhere in
 * the sidebar (states.ts); keyboard focus = an orange ring. Darker stops in light mode so the icon keeps 3:1 on a white panel.
 */
const RAIL_TONE =
  "[--rail-a:#c2410c] [--rail-b:#d9480f] [--rail-glow:rgb(234_88_12/0.35)] [--rail-wash:rgb(234_88_12/0.10)] [--rail-edge:rgb(234_88_12/0.30)] [--rail-hover:rgb(0_0_0/0.04)] [--rail-hover-edge:rgb(0_0_0/0.1)] [--rail-ring:#c2410c] " +
  "dark:[--rail-a:#ff5500] dark:[--rail-b:#ff9f43] dark:[--rail-glow:rgb(255_85_0/0.55)] dark:[--rail-wash:rgb(255_85_0/0.13)] dark:[--rail-edge:rgb(255_110_40/0.32)] dark:[--rail-hover:rgb(255_255_255/0.04)] dark:[--rail-hover-edge:rgb(255_255_255/0.1)] dark:[--rail-ring:rgb(255_110_40/0.85)]"

/** `hidden`: not in the rail, but its settings are still found by search (Design's widget style, which lives in Pages). */
export type SettingsTab = { id: string; label: string; icon: React.ReactNode; blurb?: string; heading?: string; groups?: SettingsGroup[]; content?: React.ReactNode; hidden?: boolean }

/** The theme's settings, by section. Hosts add their own groups (identity, dark colours) and sections around these. */
export const THEME_GROUPS = {
  colour: [
    { title: "Brand", fields: ["primary", "highlight", "logo-colours"], keys: ["primary", "primaryForeground", "highlight"], words: "brand colour accent highlight buttons links badges logo" },
    { title: "Profit and loss", fields: ["trading"], keys: ["trading"], words: "profit loss green red trading numbers" },
  ],
  type: [
    { title: "Fonts", fields: ["fonts"], keys: ["fonts"], words: "font pair typeface heading text serif mono" },
    { title: "Headings and labels", fields: ["heading-weight", "labels"], keys: ["headingWeight", "labelStyle"], words: "weight bold uppercase caps small labels" },
    // Headline numbers are set with the widgets (they only show there); Type points to them.
    { title: "Numbers in widgets", fields: ["numbers-link"], keys: [], words: "figures numbers headline mono display marked font" },
  ],
  // Everything that shapes the widgets is in one section (Widgets), Shape's settings included: corners, buttons,
  // outline and spacing reach the rest of the platform too, and their notes say so.
  widgets: [
    {
      title: "Card",
      note: "How each widget sits on the page",
      fields: ["widget-surface", "chart-panels", "borders"],
      keys: ["widgetSet", "cardSurface", "shadow", "panelStyle", "borders"],
      words: "cards open surface raised grey outline shadow chart panels background borders lines edge",
    },
    {
      title: "Corners and buttons",
      note: "The widgets' corners, and the buttons, menus and forms of your whole platform",
      fields: ["corners", "buttons"],
      keys: ["radius", "buttonShape"],
      words: "shape radius round square pill corners buttons",
    },
    { title: "Spacing", note: "Between and inside widgets, and across your platform", fields: ["density"], keys: ["density"], words: "shape density compact comfortable airy spacing" },
    { title: "Header", fields: ["header-form", "header-parts"], keys: ["headerForm", "widgetHeader"], words: "header title icon description value chip names" },
    { title: "Numbers", fields: ["numbers"], keys: ["figureStyle", "widgetFont"], words: "figures numbers headline mono display marked font" },
    { title: "Charts", fields: ["chart-style"], keys: ["chartStyle"], words: "bars gauges ticks solid thin blocks dots charts" },
    { title: "Finish", fields: ["widget-finish"], keys: ["widgetFinish"], words: "finish corners grid crosses" },
    {
      title: "Advanced",
      note: "Widget look is a preset for the widgets only: it sets every setting above at once. Your platform's overall look (fonts, shape, colours) is in Look.",
      fields: ["widget-look"],
      keys: ["widgetStyle"],
      words: "widget style look instrument soft editorial preset advanced",
      folded: true,
    },
  ],
  page: [
    {
      title: "Background",
      note: "Behind the widgets on every page",
      fields: ["background"],
      keys: ["background", "bgImage", "bgDim", "bgBlur", "bgWhere", "bgAngle"],
      words: "background image gradient grid glow dots plain",
    },
  ],
} satisfies Record<string, SettingsGroup[]>

/**
 * Every theme editor's sections, in this order, with these names and icons:
 * the admin's Design, the setup wizard and the library's theme editor all
 * build their tabs from here, so they look and work the same.
 */
export type SectionId = "brand" | "look" | "type" | "shape" | "widgets" | "page" | "menu" | "pages"
/** `heading`: the panel's title when it says more than the rail's label (Widgets: it changes every widget at once). */
const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; blurb?: string; heading?: string }[] = [
  { id: "brand", label: "Brand", icon: <Palette />, blurb: "Your name, logo and colours." },
  { id: "look", label: "Look", icon: <Wand2 />, blurb: "A ready-made look to start from. Your colours and logo stay." },
  { id: "type", label: "Type", icon: <Type /> },
  { id: "widgets", label: "Widgets", icon: <LayoutGrid />, heading: "Widgets · all widgets", blurb: "Applies to every widget, on every page. To move or change one widget, use Pages." },
  { id: "pages", label: "Pages", icon: <LayoutDashboard />, blurb: "Arrange each page and edit one widget at a time." },
  { id: "menu", label: "Menu", icon: <PanelLeftIcon />, blurb: "What the menu shows and what you call things." },
  { id: "page", label: "Background", icon: <ImageIcon /> },
]
/** The theme sections' settings unless a host gives its own. */
const DEFAULT_GROUPS: Partial<Record<SectionId, SettingsGroup[]>> = { brand: THEME_GROUPS.colour, type: THEME_GROUPS.type, widgets: THEME_GROUPS.widgets, page: THEME_GROUPS.page }

/**
 * The tabs for an editor: every section in the standard order; `only` keeps
 * some (the wizard's Fine-tune), and each part can give its groups, its own
 * content or a different line under the title.
 */
export function designTabs(parts: Partial<Record<SectionId, Pick<SettingsTab, "groups" | "content" | "blurb">>>, only?: SectionId[]): SettingsTab[] {
  return SECTIONS.filter((s) => !only || only.includes(s.id)).map((s) => ({ id: s.id, label: s.label, icon: s.icon, blurb: s.blurb, heading: s.heading, groups: DEFAULT_GROUPS[s.id], ...parts[s.id] }))
}

/** Fields drawn by the panel itself instead of from the Design fields; hosts can add their own. */
const OWN: Record<string, () => React.ReactNode> = {
  "numbers-link": NumbersLink,
  "header-parts": HeaderPartsField,
  numbers: NumbersField,
  "widget-look": StylePresetField,
  "logo-colours": LogoColoursField,
  "widget-surface": SurfaceField,
  "chart-panels": ChartPanelField,
}

/**
 * Settings that another setting switches off, and why, so a control never
 * seems to do nothing: the reason shows under it, with where to change it.
 */
const IDLE: Record<string, (t: CoachTheme) => string | undefined> = {
  "widget-finish": (t) => {
    const finish = widgetFinishOf(t)
    if (finish === "corners" && t.radius > 4) return "Corner brackets show on square cards: set Corners to 4px or less (above)."
    if (finish === "grid" && widgetSetOf(t) === "open") return "Open widgets have no surface, so the grid would run behind their text: pick a card in Card, above, to show it."
    return undefined
  },
  borders: (t) => {
    const set = widgetSetOf(t)
    if (set === "open") return "Open widgets have no line: this only outlines other cards (lists, forms). Widgets, above, changes it."
    if ((t.cardSurface ?? "raised") === "outline") return "Outline cards always have a line: pick Raised or Grey in Widgets, above, to turn it off."
    return undefined
  },
}

/** What a setting changes when it isn't plain from its name: shown under it, without dimming it. */
const ABOUT: Record<string, string> = {
  borders: "A fine line round every card, the Star included. Off, cards stand on their fill and shadow.",
}

/** Lets a field open another section (Type's link to the widgets' numbers). */
const TabContext = createContext<(id: string) => void>(() => {})

/** In Type: where headline numbers are set now, one click away. */
function NumbersLink() {
  const open = useContext(TabContext)
  return (
    <div className="grid gap-2" data-field="numbers-link">
      <p className="text-xs text-muted-foreground">How headline numbers look (Plain, Marked, Display, Mono) is set with the widgets, the only place they show.</p>
      <button type="button" onClick={() => open("widgets")} className={cn("flex h-7 w-fit items-center gap-1.5 rounded-md border px-2.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground", FOCUS)}>
        Widgets → Numbers <ArrowRight className="size-3.5" />
      </button>
    </div>
  )
}

export const changedIn = (draft: ThemeDraft, keys: (keyof ThemeDraft)[]) => keys.some((k) => draft[k] !== undefined)
export const without = (draft: ThemeDraft, keys: (keyof ThemeDraft)[]) => {
  const next = { ...draft }
  for (const k of keys) delete next[k]
  return next
}

export function SettingsPanel({
  tabs,
  tab,
  onTab,
  draft,
  onReset,
  own,
  bodyRef,
  bodyProps,
}: {
  tabs: SettingsTab[]
  tab: string
  onTab: (id: string) => void
  /** The theme's changes, for the "changed" dots and resets. */
  draft: ThemeDraft
  onReset: (keys: (keyof ThemeDraft)[]) => void
  own?: Record<string, () => React.ReactNode>
  bodyRef?: React.Ref<HTMLDivElement>
  bodyProps?: React.HTMLAttributes<HTMLDivElement>
}) {
  const [q, setQ] = useState("")
  const [searching, setSearching] = useState(false)
  const fields = { ...OWN, ...own }
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  const term = q.trim().toLowerCase()
  const found = term ? tabs.flatMap((t) => (t.groups ?? []).filter((g) => `${t.label} ${g.title} ${g.words}`.toLowerCase().includes(term)).map((g) => [t, g] as const)) : []
  const grad = `rail-${useId().replace(/:/g, "")}`

  return (
    <div className="flex min-h-0 flex-1">
      {/* The sections, as an icon rail: always in view, one click each. */}
      <nav aria-label="Settings" className={cn("flex w-[5.25rem] shrink-0 flex-col gap-1 overflow-y-auto border-r p-2 [scrollbar-width:none]", RAIL_TONE)}>
        {/* The open section's icon is drawn in the orange gradient (Carbon icons are filled shapes in a 32 box). */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: "var(--rail-a)" }} />
            <stop offset="1" style={{ stopColor: "var(--rail-b)" }} />
          </linearGradient>
        </svg>
        {tabs.filter((t) => !t.hidden).map((t) => {
          const on = !term && t.id === current.id
          const dirty = (t.groups ?? []).some((g) => changedIn(draft, g.keys))
          return (
            <button
              key={t.id}
              type="button"
              aria-current={on ? "page" : undefined}
              title={t.label}
              onClick={() => (onTab(t.id), setQ(""), setSearching(false))}
              className={cn(
                "group relative grid justify-items-center gap-1.5 rounded-lg px-0.5 pt-2.5 pb-2 text-[0.6875rem] leading-3.5 transition-[background-color,color,box-shadow,transform,scale] duration-150 ease-out outline-none active:scale-[0.97]",
                "focus-visible:shadow-[0_0_0_2px_var(--rail-ring)]",
                on
                  ? "bg-[linear-gradient(180deg,var(--rail-wash),transparent)] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--rail-edge)] focus-visible:shadow-[inset_0_0_0_1px_var(--rail-edge),0_0_0_2px_var(--rail-ring)]"
                  : "text-muted-foreground hover:bg-[var(--rail-hover)] hover:text-foreground hover:shadow-[inset_0_0_0_1px_var(--rail-hover-edge)]",
              )}
            >
              {/* The open section: an orange bar on the left edge, in the gradient, with a soft glow. */}
              <span aria-hidden className={cn("absolute top-1/2 -left-2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[linear-gradient(180deg,var(--rail-a),var(--rail-b))] shadow-[0_0_8px_var(--rail-glow)] transition-opacity duration-150", on ? "opacity-100" : "opacity-0")} />
              <span
                className={cn("grid size-[1.125rem] place-items-center transition-transform duration-150 ease-out [&_svg]:size-[1.125rem]", on ? "[&_svg]:[fill:var(--rail-icon)]" : "group-hover:-translate-y-px")}
                style={on ? ({ "--rail-icon": `url(#${grad})` } as React.CSSProperties) : undefined}
              >
                {t.icon}
              </span>
              <span className="max-w-full truncate">{t.label}</span>
              {dirty && <span aria-label="changed" className="absolute top-1.5 right-2 size-1.5 rounded-full bg-muted-foreground" />}
            </button>
          )
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* The section's name, or a search across every section. */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b pr-2 pl-5">
          {searching ? (
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setQ(""), setSearching(false))}
                placeholder="Find a setting…"
                aria-label="Find a setting"
                className="min-w-0 flex-1 bg-transparent text-[0.8125rem] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
          ) : (
            <h2 className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-foreground">{current.heading ?? current.label}</h2>
          )}
          <IconButton label={searching ? "Close search" : "Find a setting"} onClick={() => (setSearching(!searching), setQ(""))}>
            {searching ? <X className="size-4" /> : <Search className="size-4" />}
          </IconButton>
        </div>

        <TabContext.Provider value={(id) => (onTab(id), setQ(""), setSearching(false))}>
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto" {...bodyProps}>
          {term ? (
            found.length ? (
              found.map(([t, g]) => <Group key={`${t.id}/${g.title}`} group={g} section={t.label} draft={draft} onReset={onReset} fields={fields} />)
            ) : (
              <p className="px-5 py-6 text-[0.8125rem] text-muted-foreground">No setting matches “{q}”.</p>
            )
          ) : (
            <>
              {current.blurb && <p className="border-b px-5 py-3 text-xs leading-relaxed text-muted-foreground">{current.blurb}</p>}
              {current.content ?? current.groups?.map((g) => <Group key={g.title} group={g} draft={draft} onReset={onReset} fields={fields} />)}
            </>
          )}
        </div>
        </TabContext.Provider>
      </div>
    </div>
  )
}

/** Every widget's style (the Widgets section's groups), for a host that shows it outside the rail: Design shows it in Pages, as "All widgets". */
export function WidgetStyleGroups({ draft, onReset }: { draft: ThemeDraft; onReset: (keys: (keyof ThemeDraft)[]) => void }) {
  return THEME_GROUPS.widgets.map((g) => <Group key={g.title} group={g} draft={draft} onReset={onReset} fields={OWN} />)
}

function Group({ group: g, section, draft, onReset, fields }: { group: SettingsGroup; section?: string; draft: ThemeDraft; onReset: (keys: (keyof ThemeDraft)[]) => void; fields: Record<string, () => React.ReactNode> }) {
  const { theme } = useDesign()
  const dirty = changedIn(draft, g.keys)
  // A folded group (Advanced) opens on click; found by search, it is open.
  const [open, setOpen] = useState(false)
  const shut = !!g.folded && !open && !section
  const title = (
    <>
      {section && <span className="font-normal">{section} · </span>}
      {g.title}
    </>
  )
  return (
    <section className="grid gap-5 border-b px-5 pt-5 pb-6 last:border-b-0">
      <div className="flex h-6 items-center gap-2">
        {g.folded && !section ? (
          <button type="button" aria-expanded={!shut} onClick={() => setOpen(!open)} className={cn("flex items-center gap-1 rounded text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase hover:text-foreground", FOCUS)}>
            <ChevronDown className={cn("size-3.5 transition-transform", shut && "-rotate-90")} />
            {title}
          </button>
        ) : (
          <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
        )}
        {dirty && <span className="size-1.5 rounded-full bg-muted-foreground" />}
        <span className="flex-1" />
        {dirty && (
          <button type="button" onClick={() => onReset(g.keys)} className={cn("flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground", FOCUS)}>
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </div>
      {g.note && !shut && <p className="-mt-3 text-xs leading-relaxed text-muted-foreground">{g.note}</p>}
      {!shut && g.fields.map((f) => {
        const Own = fields[f]
        const idle = IDLE[f]?.(theme) ?? ABOUT[f]
        return (
          <div key={f} className="grid gap-2">
            <div className={cn("grid gap-5", IDLE[f]?.(theme) && "opacity-55")}>{Own ? <Own /> : <DesignField id={f} />}</div>
            {idle && <p className="text-xs text-muted-foreground">{idle}</p>}
          </div>
        )
      })}
    </section>
  )
}

export function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent",
        FOCUS,
      )}
    >
      {children}
    </button>
  )
}

export type Device = "desktop" | "tablet" | "phone"
const DEVICES: { value: Device; label: string; icon: React.ReactNode }[] = [
  { value: "desktop", label: "Desktop", icon: <Monitor className="size-4" /> },
  { value: "tablet", label: "Tablet", icon: <Tablet className="size-4" /> },
  { value: "phone", label: "Phone", icon: <Smartphone className="size-4" /> },
]
/** The screen size to preview, as three icons: the one on is raised. */
export function DeviceSwitch({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  return (
    <div role="radiogroup" aria-label="Screen size" className="flex h-9 shrink-0 items-center gap-0.5 rounded-lg border bg-background p-[3px]">
      {DEVICES.map((d) => (
        <button
          key={d.value}
          type="button"
          role="radio"
          aria-checked={value === d.value}
          aria-label={d.label}
          title={d.label}
          onClick={() => onChange(d.value)}
          className={cn(
            "grid h-full w-9 place-items-center rounded-md transition-colors duration-150",
            FOCUS,
            value === d.value ? "bg-muted text-foreground shadow-[0_0_0_1px_var(--border),0_1px_2px_0_rgb(0_0_0/0.12)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {d.icon}
        </button>
      ))}
    </div>
  )
}

/** The theme's colour pairs against WCAG AA: a small pill, the failing pairs listed under it on click. */
export function Readability({ fails, total }: { fails: { id: string; label: string; ratio: number; min: number }[]; total: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", out)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("pointerdown", out)
      document.removeEventListener("keydown", esc)
    }
  }, [open])
  const bad = fails.length > 0
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title={bad ? "Colour pairs under WCAG AA" : `All ${total} colour pairs pass WCAG AA`}
        className={cn("flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap transition-colors duration-150 hover:bg-muted", FOCUS, bad ? "border-[#cf222e]/50 text-[#cf222e]" : "text-muted-foreground")}
      >
        {bad ? <TriangleAlert className="size-3.5" /> : <Check className="size-3.5" />}
        {bad ? `${fails.length} hard to read` : "Readable"}
      </button>
      {open && (
        <div className="absolute top-9 right-0 z-40 grid w-64 gap-2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]">
          <p className="text-[0.8125rem]">{bad ? `${fails.length} of ${total} colour pairs are under WCAG AA` : `All ${total} colour pairs pass WCAG AA, in this mode.`}</p>
          {bad && (
            <ul className="grid gap-1 text-xs text-muted-foreground">
              {fails.map((c) => (
                <li key={c.id} className="flex justify-between gap-3">
                  <span>{c.label}</span>
                  <span className="tabular-nums">
                    {c.ratio.toFixed(1)} / {c.min}:1
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Back to the original: a Reset button that asks first, says what goes back,
 * and can offer one more thing to reset with it (`option`, unticked). The
 * host makes it undoable (⌘Z, and Undo in its toast).
 */
export function ResetButton({ title, text, option, disabled, onReset }: { title: string; text: string; option?: string; disabled?: boolean; onReset: (withOption: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const [withOption, setWithOption] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", out)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("pointerdown", out)
      document.removeEventListener("keydown", esc)
    }
  }, [open])
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (setOpen(!open), setWithOption(false))}
        aria-expanded={open}
        title={title}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent",
          FOCUS,
          open && "bg-muted text-foreground",
        )}
      >
        <RotateCcw className="size-3.5" /> Reset
      </button>
      {open && (
        <div role="alertdialog" aria-label={title} className="absolute top-10 right-0 z-50 grid w-72 gap-2.5 rounded-xl border bg-popover p-3 text-popover-foreground shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[0.8125rem] text-muted-foreground">{text}</p>
          {option && (
            <label className="flex cursor-pointer items-start gap-2 text-[0.8125rem]">
              <input type="checkbox" checked={withOption} onChange={(e) => setWithOption(e.target.checked)} className="mt-0.5 accent-current" />
              {option}
            </label>
          )}
          <div className="flex gap-1.5">
            <button type="button" autoFocus onClick={() => (setOpen(false), onReset(withOption))} className={cn("h-8 flex-1 rounded-lg px-3 text-sm font-medium text-white", FOCUS)} style={{ background: "#cf222e" }}>
              Reset
            </button>
            <button type="button" onClick={() => setOpen(false)} className={cn("h-8 flex-1 rounded-lg border px-3 text-sm hover:bg-muted", FOCUS)}>
              Keep
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
