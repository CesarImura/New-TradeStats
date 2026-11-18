"use client"

import { createContext, useContext, useEffect, useId, useRef, useState } from "react"
import { ArrowRight, Check, ChevronDown, ChevronRight, GraduationCap, Image as ImageIcon, LayoutGrid, Monitor, Palette, PanelLeftIcon, RotateCcw, Search, Smartphone, Tablet, TriangleAlert, Type, UserPlus, Wand2, X } from "@/components/icons"
import type { ThemeDraft } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { AdminButton, AdminSegmentGroup } from "@/components/admin/ui"
import { widgetFinishOf, widgetSetOf, type CoachTheme } from "@/lib/theme/types"
import { DesignField, useDesign } from "../fields/design-fields"
import { ChartPanelField, FOCUS, HeaderPartsField, LogoColoursField, NumbersField, StylePresetField, SurfaceField } from "../fields/settings-fields"

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
 * The section rail (Figma Admin / Editor Rail): Nav items, as in the Admin's sidebar. The open section is a panel-filled box with the
 * brand-gradient icon (the gradient's ends are the Admin's `brand/gradient` tokens, fixed whatever the coach's theme); the rest are
 * quiet and take the hover fill. Keyboard focus is the kit's focus ring.
 */
const RAIL_TONE = "[--rail-a:var(--admin-color-brand-gradient-start)] [--rail-b:var(--admin-color-brand-gradient-end)]"

/** A block's title in Design, the TradeStats way: small mono capitals, spaced, quiet. */
export const SECTION_LABEL = "t-mono-label-s text-a-text-3"

/** `hidden`: not in the rail, but its settings are still found by search (Design's widget style, which lives in Pages). */
/** `search`: the header's search looks in this section's own content (Pages: widgets), with this placeholder, instead of in every setting. */
/** `finds`: what the search can find in a section that draws its own content (Theme, Layout): a row that opens the section. */
export type SettingsFind = { title: string; words: string }
export type SettingsTab = { id: string; label: string; icon: React.ReactNode; blurb?: string; heading?: string; groups?: SettingsGroup[]; content?: React.ReactNode; hidden?: boolean; search?: string; finds?: SettingsFind[] }

/** The theme's settings, by section. Hosts add their own groups (identity, dark colours) and sections around these. */
export const THEME_GROUPS = {
  colour: [
    { title: "Colours", fields: ["primary", "highlight"], keys: ["primary", "primaryForeground", "highlight"], words: "brand colour accent highlight buttons links badges logo" },
    { title: "Profit and loss", fields: ["trading"], keys: ["trading"], words: "profit loss green red trading numbers" },
  ],
  type: [
    { title: "Font pair", fields: ["fonts"], keys: ["fonts"], words: "font pair typeface heading text serif mono technical editorial bold elegant desk gallery characterful neutral" },
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
      title: "Page",
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
export type SectionId = "brand" | "look" | "layout" | "type" | "shape" | "widgets" | "page" | "menu" | "pages" | "course" | "join"
/** `heading`: the panel's title when it says more than the rail's label (Widgets: it changes every widget at once). */
const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; blurb?: string; heading?: string; search?: string }[] = [
  { id: "brand", label: "Brand", icon: <Palette />, blurb: "Your name, logo and colours." },
  { id: "look", label: "Theme", icon: <Wand2 />, blurb: "A ready-made theme to start from. Your colours and logo stay." },
  { id: "layout", label: "Layout", icon: <LayoutGrid />, blurb: "How your platform is laid out: menu, page frame, widgets and spacing." },
  { id: "type", label: "Type", icon: <Type /> },
  { id: "widgets", label: "Widgets", icon: <LayoutGrid />, heading: "Widgets · all widgets", blurb: "Applies to every widget, on every page. To move or change one widget, use Widgets." },
  { id: "pages", label: "Widgets", icon: <LayoutGrid />, blurb: "Arrange each page and edit one widget at a time.", search: "Search widgets…" },
  { id: "menu", label: "Menu", icon: <PanelLeftIcon />, blurb: "What the menu shows and what you call things." },
  { id: "page", label: "Background", icon: <ImageIcon /> },
  { id: "course", label: "Course", icon: <GraduationCap />, blurb: "The page inside a course: which sections show, in what order, and how lessons look." },
  { id: "join", label: "Join", icon: <UserPlus />, blurb: "Log in, sign up and subscribe: the screens people pass through to join." },
]
/** The theme sections' settings unless a host gives its own. */
const DEFAULT_GROUPS: Partial<Record<SectionId, SettingsGroup[]>> = { brand: THEME_GROUPS.colour, type: THEME_GROUPS.type, widgets: THEME_GROUPS.widgets, page: THEME_GROUPS.page }

/**
 * The tabs for an editor: every section in the standard order; `only` keeps
 * some (the wizard's Fine-tune), and each part can give its groups, its own
 * content or a different line under the title.
 */
export function designTabs(parts: Partial<Record<SectionId, Pick<SettingsTab, "groups" | "content" | "blurb" | "finds">>>, only?: SectionId[]): SettingsTab[] {
  return SECTIONS.filter((s) => !only || only.includes(s.id)).map((s) => ({ id: s.id, label: s.label, icon: s.icon, blurb: s.blurb, heading: s.heading, search: s.search, groups: DEFAULT_GROUPS[s.id], ...parts[s.id] }))
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
    if (finish === "grid" && widgetSetOf(t) === "open") return "Blended widgets have no surface, so the grid would run behind their text: pick a card in Card, above, to show it."
    return undefined
  },
  borders: (t) => {
    const set = widgetSetOf(t)
    if (set === "open") return "Blended widgets have no line: this only outlines other cards (lists, forms). Widgets, above, changes it."
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

/** What is typed in the header's search, for a section that searches its own content (the widget gallery). */
const PanelSearch = createContext("")
export const usePanelSearch = () => useContext(PanelSearch)
/** True while the header search box is open (Figma Pages · 04 to 06: the panel then shows the search and its results only). */
const PanelSearching = createContext(false)
export const usePanelSearching = () => useContext(PanelSearching)

/** In Type: where headline numbers are set now, one click away. */
function NumbersLink() {
  const open = useContext(TabContext)
  return (
    <div className="grid gap-2" data-field="numbers-link">
      <p className="t-caption text-muted-foreground">Set with the widgets, the only place they show.</p>
      <button type="button" onClick={() => open("widgets")} className={cn("flex h-7 w-fit items-center gap-1.5 rounded-md border px-2.5 t-caption text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground", FOCUS)}>
        All widgets → Numbers <ArrowRight className="size-3.5" />
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
  merge,
  collapsed,
  floating,
  onRail,
  caption,
}: {
  /** A line under the section's name: what is happening to the draft ("Northline Trading · saved as you type"). */
  caption?: string
  /** Only the icon rail shows (narrow screens); the host opens the panel again from `onRail`. */
  collapsed?: boolean
  /** The editor's layout (Figma 16/11): the rail is a column of the host's grid and the panel a card floating over the canvas. */
  floating?: boolean
  /** A rail icon was clicked (with which section it opens and whether it was already open). */
  onRail?: (id: string, wasOpen: boolean) => void
  /** Sections shown as one icon in the rail, with their own pills under the title (Theme: Brand, Look, Type, Background). */
  merge?: { id: string; label: string; icon: React.ReactNode; of: string[] }
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
  // A section with its own search (Pages) gets the text; the others search every setting.
  const ownSearch = !!current.search
  const term = ownSearch ? "" : q.trim().toLowerCase()
  const found = term ? tabs.flatMap((t) => (t.groups ?? []).filter((g) => `${t.label} ${g.title} ${g.words}`.toLowerCase().includes(term)).map((g) => [t, g] as const)) : []
  const foundIn = term ? tabs.flatMap((t) => (t.finds ?? []).filter((f) => `${t.label} ${f.title} ${f.words}`.toLowerCase().includes(term)).map((f) => [t, f] as const)) : []
  const grad = `rail-${useId().replace(/:/g, "")}`
  // The rail: the merged sections as one icon, where the first of them stands.
  const visible = tabs.filter((t) => !t.hidden)
  const railItems = merge ? visible.flatMap((t) => (t.id === merge.of[0] ? [{ ...t, id: merge.id, label: merge.label, icon: merge.icon }] : merge.of.includes(t.id) ? [] : [t])) : visible
  const sub = merge && merge.of.includes(current.id) && !term ? tabs.filter((t) => merge.of.includes(t.id)) : null

  return (
    <div className={floating ? "contents" : "flex min-h-0 flex-1"}>
      {/* The sections, as an icon rail: always in view, one click each. */}
      <nav aria-label="Settings" className={cn("flex w-16 shrink-0 flex-col items-center gap-3 overflow-y-auto p-3 [scrollbar-width:none]", !floating && "border-r border-a-border", RAIL_TONE)}>
        {/* The open section's icon is drawn in the orange gradient (Carbon icons are filled shapes in a 32 box). */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: "var(--rail-a)" }} />
            <stop offset="1" style={{ stopColor: "var(--rail-b)" }} />
          </linearGradient>
        </svg>
        {railItems.map((t) => {
          const on = !term && (t.id === current.id || (t.id === merge?.id && merge.of.includes(current.id)))
          const dirty = (t.id === merge?.id ? tabs.filter((x) => merge.of.includes(x.id)) : [t]).some((x) => (x.groups ?? []).some((g) => changedIn(draft, g.keys)))
          return (
            <button
              key={t.id}
              type="button"
              aria-current={on ? "page" : undefined}
              title={t.label}
              aria-label={t.label}
              onClick={() => {
                const id = t.id === merge?.id ? (merge.of.includes(current.id) ? current.id : merge.of[0]) : t.id
                onRail?.(id, on)
                onTab(id)
                setQ("")
                setSearching(false)
              }}
              className={cn(
                // Icons only (the name is the tooltip): the Admin's Nav item at 40 px, so the rail gives its room to the page.
                "group relative grid size-10 shrink-0 place-items-center rounded-a-md border outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
                on ? "border-a-border bg-a-panel text-a-text" : "border-transparent text-a-text-nav hover:bg-a-hover hover:text-a-text",
              )}
            >
              <span
                className={cn("grid size-4 place-items-center [&_svg]:size-4", on && "[&_svg]:[fill:var(--rail-icon)]")}
                style={on ? ({ "--rail-icon": `url(#${grad})` } as React.CSSProperties) : undefined}
              >
                {t.icon}
              </span>
              {dirty && <span aria-label="changed" className="absolute top-1 right-1 size-1.5 rounded-full bg-a-text-3" />}
            </button>
          )
        })}
      </nav>

      <div
        data-editor-panel
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          // A card over the canvas: the rail's colour, a fine border, the float shadow and a fade where it scrolls on.
          floating &&
            "absolute top-5 bottom-5 left-[92px] z-20 w-[336px] flex-none overflow-hidden rounded-a-lg border border-a-border bg-a-page shadow-[0_8px_24px_-4px_rgb(0_0_0/0.6)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-14 after:bg-gradient-to-t after:from-a-page after:to-transparent",
          collapsed && "hidden",
        )}
      >
        {/* The section's name (Heading S) with a caption of what is happening to the draft, or a search across every section. */}
        <div className={cn("flex shrink-0 flex-col gap-1 px-5 pt-5", sub ? "pb-3" : "pb-4")}>
          <div className="flex min-h-[22px] items-center gap-2">
            {searching ? (
              <label className={cn("flex min-w-0 flex-1 items-center gap-2", ownSearch && "h-9 rounded-a-md border border-a-border-strong px-3")}>
                <Search className="size-4 shrink-0 text-a-icon" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setQ(""), setSearching(false))}
                  placeholder={current.search ?? "Find a setting…"}
                  aria-label={current.search?.replace("…", "") ?? "Find a setting"}
                  className="min-w-0 flex-1 bg-transparent t-body-m text-a-text outline-none placeholder:text-a-text-3"
                />
                {/* Pages (Figma 04 to 06): the way out sits inside the field. */}
                {ownSearch && (
                  <button type="button" aria-label="Close search" title="Close search" onClick={() => (setSearching(false), setQ(""))} className="-mr-1 grid size-6 shrink-0 place-items-center rounded-a-sm text-a-icon outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
                    <X className="size-4" />
                  </button>
                )}
              </label>
            ) : (
              <h2 className="min-w-0 flex-1 truncate t-heading-s text-a-text">{sub ? merge!.label : (current.heading ?? current.label)}</h2>
            )}
            {/* One search, in the same place in every section: in Pages it finds widgets, elsewhere any setting. */}
            {!(searching && ownSearch) && <AdminButton
              hierarchy="ghost"
              size="sm"
              iconOnly
              className="-mr-1"
              aria-label={searching ? "Close search" : (current.search?.replace("…", "") ?? "Find a setting")}
              title={searching ? "Close search" : (current.search?.replace("…", "") ?? "Find a setting")}
              onClick={() => (setSearching(!searching), setQ(""))}
            >
              {searching ? <X /> : <Search />}
            </AdminButton>}
          </div>
          {caption && !searching && <p className="truncate t-caption text-a-text-3">{caption}</p>}
        </div>

        {/* A merged section's parts as tabs: one click between Brand, Look, Type and Background. */}
        {sub && (
          <div role="tablist" aria-label={merge!.label} className="flex shrink-0 gap-0.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {sub.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === current.id}
                onClick={() => onTab(t.id)}
                className={cn(
                  "h-[26px] shrink-0 rounded-a-sm px-2.5 t-caption outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:h-10",
                  t.id === current.id ? "bg-a-raised text-a-text" : "text-a-text-2 hover:bg-a-hover hover:text-a-text",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {current.id !== "pages" && <div aria-hidden className="h-px shrink-0 bg-a-border-subtle" />}
        <TabContext.Provider value={(id) => (onTab(id), setQ(""), setSearching(false))}>
        <PanelSearch.Provider value={ownSearch ? q.trim().toLowerCase() : ""}>
        <PanelSearching.Provider value={ownSearch && searching}>
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" {...bodyProps}>
          {term ? (
            found.length || foundIn.length ? (
              <>
                {foundIn.length > 0 && (
                  <div className="grid gap-1 px-4 pt-3 pb-2">
                    {foundIn.map(([t, f]) => (
                      <button
                        key={`${t.id}/${f.title}`}
                        type="button"
                        onClick={() => (onTab(t.id), setQ(""), setSearching(false))}
                        className={cn("flex h-12 w-full items-center gap-3 rounded-a-md px-3 text-left hover:bg-a-hover", FOCUS)}
                      >
                        <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{f.title}</span>
                        <span className="shrink-0 t-caption text-a-text-3">{t.label}</span>
                        <ChevronRight className="size-3.5 shrink-0 text-a-text-3" />
                      </button>
                    ))}
                  </div>
                )}
                {found.map(([t, g]) => <Group key={`${t.id}/${g.title}`} group={g} section={t.label} draft={draft} onReset={onReset} fields={fields} />)}
              </>
            ) : (
              <p className="px-5 py-6 t-body-m text-muted-foreground">No setting matches “{q}”.</p>
            )
          ) : (
            <>
              {/* No line under the title: what a section is for shows in its groups. */}
              {current.content ?? current.groups?.map((g) => <Group key={g.title} group={g} draft={draft} onReset={onReset} fields={fields} />)}
            </>
          )}
        </div>
        </PanelSearching.Provider>
        </PanelSearch.Provider>
        </TabContext.Provider>
      </div>
    </div>
  )
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
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-a-border-subtle px-5 pt-6 pb-6">
      <div className="flex h-6 items-center gap-2">
        {g.folded && !section ? (
          <button type="button" aria-expanded={!shut} onClick={() => setOpen(!open)} className={cn("flex items-center gap-1 rounded hover:text-foreground", SECTION_LABEL, "text-muted-foreground", FOCUS)}>
            <ChevronDown className={cn("size-3.5 transition-transform", shut && "-rotate-90")} />
            {title}
          </button>
        ) : (
          <h3 className={SECTION_LABEL} title={g.note}>{title}</h3>
        )}
        {/* Changed from the look: the same orange dot as a widget's own value in the inspector. */}
        {dirty && <span aria-label="changed" className="size-1.5 rounded-full bg-a-accent-strong" />}
        <span className="flex-1" />
        {dirty && (
          <button type="button" onClick={() => onReset(g.keys)} className={cn("flex h-6 items-center gap-1 rounded-md px-1.5 t-caption text-muted-foreground hover:bg-muted hover:text-foreground", FOCUS)}>
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </div>
      {/* A group's note is its title's tooltip, not a line of its own. Fields sit further apart than the title from the first one. */}
      {!shut && <div className="grid grid-cols-[minmax(0,1fr)] gap-5">{g.fields.map((f) => {
        const Own = fields[f]
        const idle = IDLE[f]?.(theme) ?? ABOUT[f]
        return (
          <div key={f} className="grid gap-2">
            <div className={cn("grid gap-4", IDLE[f]?.(theme) && "opacity-55")}>{Own ? <Own /> : <DesignField id={f} />}</div>
            {idle && <p className="t-caption text-muted-foreground">{idle}</p>}
          </div>
        )
      })}</div>}
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
/** The screen size to preview, as three icons in the Admin's Segmented group. */
export function DeviceSwitch({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  return <AdminSegmentGroup label="Screen size" value={value} onChange={onChange} options={DEVICES.map((d) => ({ value: d.value, icon: d.icon, title: d.label }))} />
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
        className={cn("flex h-7 items-center gap-1.5 rounded-full border px-2.5 t-caption whitespace-nowrap transition-colors duration-150 hover:bg-muted", FOCUS, bad ? "border-a-border-danger text-a-danger" : "border-a-border text-a-text-2")}
      >
        {bad ? <TriangleAlert className="size-3.5" /> : <Check className="size-3.5" />}
        {bad ? `${fails.length} hard to read` : "Readable"}
      </button>
      {open && (
        <div className="absolute top-9 right-0 z-40 grid w-64 gap-2 rounded-a-lg border border-a-border-strong bg-a-raised p-3 text-a-text">
          <p className="t-body-m">{bad ? `${fails.length} of ${total} colour pairs are under WCAG AA` : `All ${total} colour pairs pass WCAG AA, in this mode.`}</p>
          {bad && (
            <ul className="grid gap-1 t-caption text-muted-foreground">
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
          "flex h-8 items-center gap-1.5 rounded-md px-2 t-caption whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent",
          FOCUS,
          open && "bg-muted text-foreground",
        )}
      >
        <RotateCcw className="size-3.5" /> Reset
      </button>
      {open && (
        <div role="alertdialog" aria-label={title} className="absolute top-10 right-0 z-50 grid w-72 gap-2.5 rounded-a-lg border border-a-border-strong bg-a-raised p-3 text-a-text">
          <p className="t-body-m-medium">{title}</p>
          <p className="t-body-m text-a-text-2">{text}</p>
          {option && (
            <label className="flex cursor-pointer items-start gap-2 t-body-m">
              <input type="checkbox" checked={withOption} onChange={(e) => setWithOption(e.target.checked)} className="mt-0.5 accent-current" />
              {option}
            </label>
          )}
          <div className="flex gap-1.5">
            <AdminButton hierarchy="danger" size="lg" autoFocus className="flex-1" onClick={() => (setOpen(false), onReset(withOption))}>
              Reset
            </AdminButton>
            <AdminButton hierarchy="secondary" size="lg" className="flex-1" onClick={() => setOpen(false)}>
              Keep
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  )
}
