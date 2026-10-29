"use client"

import { ArrowLeft, ChevronRight, Command, Eye, Menu, Moon, Search, SlidersHorizontal, Sun, X } from "lucide-react"
import Link from "next/link"
import { Component, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { CoachContext } from "@/components/coach/coach-provider"
import { WidgetFrame } from "@/components/lab/reui-widgets/kit"
import { DETAILED_EXTRA_ROWS, WIDGETS, type WidgetDef } from "@/components/lab/reui-widgets/registry"
import { getDemoCoach } from "@/lib/data/coaches"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach } from "@/lib/theme/resolve"
import { TEMPLATES } from "@/lib/theme/templates"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import { ROW_HEIGHT, type Detail, type Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { checkWidget } from "@/lib/widgets/checks"
import { LabButton, LabDivider, LabPopover, LabSeg } from "./lab-controls"
import { CommandPalette, type PaletteItem } from "./kit/command-palette"
import { ComponentModal } from "./kit/component-modal"
import { COMPONENT_GROUPS, COMPONENTS, type KitDef } from "./kit/components"
import { KitPane } from "./kit/preview"
import { NEW_TYPES, NEW_WIDGETS, WIDGET_TAGS } from "./new-widgets/registry"
import { AnatomyCompare } from "./anatomy-compare"
import { StressTool } from "./stress-bench"
import { WidgetProof } from "./widget-proof"
import { WidgetWall } from "./widget-wall"
import { THEME_SETS, ThemeLabControls, ThemeLabGrid, themeSetSize, useThemeLab, type ThemeSet } from "./theme-lab"
import { WidgetModal } from "./widget-modal"

/** The real grid: 80px columns, 16px gaps, 56px rows. */
export const px = (cols: number) => cols * 80 + (cols - 1) * 16
export const rowsPx = (h: number) => h * ROW_HEIGHT + (h - 1) * 16

/**
 * The white-label base: no coach colour, no template personality. Neutral
 * greys, the accent is the text colour, Geist, plain cards. Every
 * personality setting is at its plainest, so what shows is the structure.
 */
const BASE: CoachTheme = {
  ...TEMPLATES.pulse.theme,
  template: "pulse",
  palettes: {
    light: {
      background: "#f4f4f5",
      card: "#ffffff",
      foreground: "#0a0a0a",
      muted: "#f4f4f5",
      mutedForeground: "#5f5f66",
      border: "#e4e4e7",
      sidebar: "#f4f4f5",
      highlight: "#e4e4e7",
      highlightForeground: "#0a0a0a",
      // A matched pair: same weight, so a loss doesn't shout louder than a profit.
      profit: "#1a7f37",
      loss: "#cf222e",
    },
    dark: {
      background: "#0a0a0b",
      card: "#161618",
      foreground: "#f4f4f5",
      muted: "#202023",
      mutedForeground: "#a1a1aa",
      border: "#2a2a2e",
      sidebar: "#0a0a0b",
      highlight: "#27272a",
      highlightForeground: "#f4f4f5",
      // Calmer than the pastel 400s on a near-black card; text still gets its 4.5:1 from derive.
      profit: "#3fb950",
      loss: "#f85149",
    },
  },
  tint: "none",
  radius: 12,
  buttonShape: "rounded",
  shadow: "none",
  borders: true,
  density: "comfortable",
  fonts: { heading: "geist", body: "geist", label: "geist" },
  labelStyle: "plain",
  headingWeight: 500,
  background: "plain",
  effects: "flat",
  widgetStyle: "soft",
  widgetFont: "body",
  widgetSet: "cards",
  cardSurface: "raised",
  headerForm: "top",
  figureStyle: "plain",
  chartStyle: "solid",
  panelStyle: "filled",
  starStyle: "brand",
  widgetFinish: "none",
  widgetHeader: undefined,
  trading: undefined,
  highlight: undefined,
}

export type Colour = "minimal" | "mono"

/**
 * The accent. Minimal: a calm placeholder blue, like a component library's
 * demo, for the one mark per widget. Mono: the text colour (black on light,
 * near-white on dark), so only profit and loss carry colour.
 */
export const themeFor = (mode: Mode, colour: Colour): CoachTheme => ({
  ...BASE,
  mode,
  // The same blue on dark: white text on it keeps 5:1 (a lighter blue drops under 4.5:1); readable blue text comes from derive.
  primary: colour === "mono" ? (mode === "light" ? "#18181b" : "#f4f4f5") : "#2563eb",
  primaryForeground: colour === "mono" && mode === "dark" ? "#0a0a0a" : "#ffffff",
})

/**
 * Meaning colours beside profit (success) and loss (destructive): warning
 * (amber) and info (the accent). Only where they mean something: urgency,
 * high impact, a status. Mono keeps them grey.
 */
export const meaningCss = (colour: Colour) =>
  colour === "mono"
    ? ".wb-light,.wb-dark{--warning:var(--muted-foreground);--info:var(--foreground);--warning-text:var(--muted-foreground);--info-text:var(--foreground)}"
    : ".wb-light{--warning:#d97706;--warning-text:#b45309;--info:#2563eb;--info-text:var(--brand-text)}.wb-dark{--warning:#f59e0b;--warning-text:#fbbf24;--info:#3b82f6;--info-text:var(--brand-text)}"

/** Every widget in the library: the app's (minus pages' core widgets) and the ones added in the lab. */
export const LIBRARY = [...WIDGETS.filter((w) => !w.core), ...NEW_WIDGETS]
/** For "Recently added": the lab's new widgets first, newest first, then the rest. */
const ADDED = new Map(LIBRARY.map((w, i) => [w.type, NEW_TYPES.has(w.type) ? 1000 + i : i]))
/** The sidebar's order: the student's day first, the coach's own content after. */
const ORDER = ["Page", "Learning", "Calendar", "Journal", "Progress", "Community", "Coach and brand", "Your content", "AI", "Coaching"]
const GROUPS = [...new Set(LIBRARY.map((w) => w.group as string))].sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99)
const SORTED = GROUPS.flatMap((g) => LIBRARY.filter((w) => w.group === g))
const coach = resolveCoach(getDemoCoach("northline")!)

/**
 * The review page's own surfaces, apart from the widgets' theme: a layered
 * neutral ladder (page, sidebar, header bar, preview cell, hairline) and three
 * text strengths, all at 4.5:1 or more on every surface they sit on. Light is
 * not pure white and dark is not pure black, so the widgets' cards stand out.
 */
const CHROME: Record<Mode, Record<string, string>> = {
  light: { "--c-page": "#f4f4f5", "--c-side": "#fafafa", "--c-bar": "#ffffff", "--c-cell": "#e9e9ec", "--c-cell-on": "#e2e2e6", "--c-hair": "#dcdce0", "--c-on": "#e3e3e7", "--c-t1": "#18181b", "--c-t2": "#4b4b53", "--c-t3": "#63636b" },
  dark: { "--c-page": "#111113", "--c-side": "#0c0c0e", "--c-bar": "#161618", "--c-cell": "#0b0b0d", "--c-cell-on": "#07070a", "--c-hair": "#2c2c31", "--c-on": "#232327", "--c-t1": "#f4f4f5", "--c-t2": "#c0c0c8", "--c-t3": "#9a9aa3" },
}
export const t2 = "text-(--c-t2)"
export const t3 = "text-(--c-t3)"
export const hair = { borderColor: "var(--c-hair)" }

type Scope = "widgets" | "components" | "everything"
type Sort = "category" | "az" | "recent"
const KIT_CATS = COMPONENT_GROUPS.map((g) => `kit:${g}`)
const kitOf = (cat: string) => (cat === "kit" ? "all" : cat.startsWith("kit:") ? cat.slice(4) : null)
const THEME_CATS = THEME_SETS.map((t) => `themes:${t.id}`)
const themeOf = (cat: string) => (cat.startsWith("themes:") ? (cat.slice(7) as ThemeSet) : null)
const THEME_COUNTS = new Map(THEME_SETS.map((t) => [t.id, themeSetSize(t.id)]))

/** The lab's benches, each a page of the library: they check widgets and themes rather than show them. */
const TOOLS = [
  { id: "wall", label: "Widget wall", blurb: "Every widget, every layout, at three widths in one coach theme, each measured against the widget rules: type size, contrast, brand share and overflow.", ownModes: true },
  { id: "anatomy", label: "Across templates", blurb: "The same widgets under Terminal, Atelier and Pulse side by side: do two coaches look like different products?", ownModes: false },
  { id: "stress", label: "Stress bench", blurb: "One widget's layouts at many grid sizes and amounts of content, to find where it cuts, squeezes or leaves a gap.", ownModes: false },
  { id: "proof", label: "Base proof", blurb: "Up next, Performance and Discipline on the base structure, for each template in light and dark, with the personality settings to try on all of them at once.", ownModes: true },
] as const
type ToolId = (typeof TOOLS)[number]["id"]
const TOOL_CATS = TOOLS.map((t) => `tool:${t.id}`)
const toolOf = (cat: string) => TOOLS.find((t) => `tool:${t.id}` === cat) ?? null

/**
 * TradeHub's widget library (prototype only), laid out like a component
 * catalogue. The sidebar is navigation only: a filter, ⌘K search, and two
 * sections, Widgets and Components, each with its categories and counts. A
 * sticky bar on top holds every look control. Grids are uniform cells scaled
 * to fit; a cell opens its widget or component in a modal.
 */
export function WidgetBase() {
  const [emphasis, setEmphasis] = useState<Emphasis>("accent")
  const [detail, setDetail] = useState<Detail>("standard")
  const [layout, setLayout] = useState<"first" | "all">("all")
  const [menu, setMenu] = useState(false)
  const [query, setQuery] = useState("")
  const [palette, setPalette] = useState(false)
  const [mode, setMode] = useStored<Mode>("wb-mode", "dark", ["light", "dark"])
  const [size, setSize] = useStored<Size>("wb-size", "auto", ["auto", "s", "m", "l"])
  const [colour, setColour] = useStored<Colour>("wb-colour", "minimal", ["minimal", "mono"])
  const [cat, setCat] = useStored<string>("wb-cat", "all", ["all", ...GROUPS, "kit", ...KIT_CATS, ...THEME_CATS, ...TOOL_CATS])
  const [scopeView, setScopeView] = useStored<Scope>("wb-scope", "widgets", ["widgets", "components", "everything"])
  const [sort, setSort] = useStored<Sort>("wb-sort", "category", ["category", "az", "recent"])
  const [openW, setOpenW] = useState(true)
  const [openK, setOpenK] = useState(true)
  const [openT, setOpenT] = useState(true)
  const [openX, setOpenX] = useState(true)
  const themeSet = themeOf(cat)
  const themeLab = useThemeLab(themeSet ?? "branded", query)
  const tool = toolOf(cat)
  const scale = scaleFor(size, useViewportWidth())
  const extra = detail === "detailed" ? DETAILED_EXTRA_ROWS : 0
  const light = themeFor("light", colour)
  const dark = themeFor("dark", colour)
  const theme = mode === "light" ? light : dark
  const scope = mode === "light" ? "wb-light" : "wb-dark"

  const q = query.trim().toLowerCase()
  const tagsOf = (w: WidgetDef) => WIDGET_TAGS[w.type] ?? []
  const found = SORTED.filter((w) => !q || `${w.name} ${w.group} ${w.description} ${tagsOf(w).join(" ")}`.toLowerCase().includes(q))
  const foundK = COMPONENTS.filter((c) => !q || `${c.name} ${c.group} ${c.description} ${c.tags.join(" ")}`.toLowerCase().includes(q))
  const kitCat = kitOf(cat)
  const showW = cat === "all" ? scopeView !== "components" : !kitCat && !themeSet && !tool
  const showK = cat === "all" ? scopeView !== "widgets" : !!kitCat
  const sortW = (list: WidgetDef[]) => (sort === "az" ? [...list].sort((x, y) => x.name.localeCompare(y.name)) : sort === "recent" ? [...list].sort((x, y) => ADDED.get(y.type)! - ADDED.get(x.type)!) : list)
  const sortK = (list: KitDef[]) => (sort === "az" ? [...list].sort((x, y) => x.name.localeCompare(y.name)) : list)
  const widgets = showW ? sortW(cat === "all" ? found : found.filter((w) => w.group === cat)) : []
  const kits = showK ? sortK(kitCat && kitCat !== "all" ? foundK.filter((c) => c.group === kitCat) : foundK) : []
  const variantsOf = (def: WidgetDef) => (layout === "all" ? def.variants : def.variants.slice(0, 1))
  const [shown, setShown] = useState<{ type: string; variant: string } | null>(null)
  const shownDef = shown && LIBRARY.find((w) => w.type === shown.type)
  const [kit, setKit] = useState<{ id: string; i: number } | null>(null)
  const kitDef = kit && COMPONENTS.find((c) => c.id === kit.id)

  /** Open a category (or All) from the top. */
  const open = (g: string) => {
    setMenu(false)
    setCat(g)
    window.scrollTo(0, 0)
  }
  /** Open one widget in the modal, linkable as #type/layout. */
  const show = (type: string, variant?: string) => {
    const def = LIBRARY.find((w) => w.type === type)
    if (!def) return
    const v = def.variants.find((x) => x.value === variant)?.value ?? def.variants[0].value
    setMenu(false)
    setShown({ type, variant: v })
    history.replaceState(null, "", `#${type}/${v}`)
  }
  /** Open one component in its modal, linkable as #kit/id/variant. */
  const showKit = (id: string, i = 0) => {
    setMenu(false)
    setKit({ id, i })
    history.replaceState(null, "", `#kit/${id}/${i}`)
  }
  const hide = () => {
    setShown(null)
    setKit(null)
    history.replaceState(null, "", location.pathname)
  }
  useEffect(() => {
    // The widget wall's automatic checks, for measuring this page from the console.
    ;(window as unknown as { checkWidget?: typeof checkWidget }).checkWidget = checkWidget
    // The first render used the fallbacks (no browser storage on the server); re-read the remembered choices now.
    storeListeners.forEach((cb) => cb())
    // A shared link opens that widget (#performance/curve) or component (#kit/button/2).
    const [type, variant, idx] = decodeURIComponent(location.hash.slice(1)).split("/")
    // Reading the URL once on load is outside React's state, so it lands after the first render.
    if (type === "kit" && COMPONENTS.some((c) => c.id === variant)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKit({ id: variant, i: Number(idx) || 0 })
    } else if (type === "tools" && TOOLS.some((t) => t.id === variant)) {
      // #tools/wall opens a bench (the old /lab/widgets, /lab/anatomy and /lab/proof send here).
      setCat(`tool:${variant as ToolId}`)
      history.replaceState(null, "", location.pathname)
    } else if (type === "themes") {
      // #themes or #themes/matrix opens the readability check (the old Theme lab).
      setCat(`themes:${THEME_SETS.find((t) => t.id === variant)?.id ?? "branded"}`)
      history.replaceState(null, "", location.pathname)
    } else if (type && LIBRARY.some((w) => w.type === type)) {
      const def = LIBRARY.find((w) => w.type === type)!
      setShown({ type, variant: def.variants.find((x) => x.value === variant)?.value ?? def.variants[0].value })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const paletteItems = useMemo<PaletteItem[]>(
    () => [
      ...SORTED.map((w) => ({ id: `w:${w.type}`, kind: "Widget" as const, name: w.name, group: w.group, description: w.description, tags: WIDGET_TAGS[w.type] ?? [], isNew: NEW_TYPES.has(w.type) })),
      ...COMPONENTS.map((c) => ({ id: `k:${c.id}`, kind: "Component" as const, name: c.name, group: c.group, description: c.description, tags: c.tags })),
    ],
    [],
  )

  const themeDef = THEME_SETS.find((t) => t.id === themeSet)
  const crumbs = cat === "all" ? ["Library"] : tool ? ["Library", "Tools", tool.label] : themeDef ? ["Library", "Themes", themeDef.label] : kitCat ? ["Library", "Components", ...(kitCat === "all" ? [] : [kitCat])] : ["Library", "Widgets", cat]
  const title = cat === "all" ? (scopeView === "components" ? "Components" : scopeView === "everything" ? "Everything" : "TradeHub widgets") : tool ? tool.label : themeDef ? themeDef.label : kitCat === "all" ? "Components" : (kitCat ?? cat)
  const count = tool ? null : themeDef ? themeLab.shown.length : widgets.length + kits.length
  const blurb = tool
    ? tool.blurb
    : themeDef
    ? `${themeDef.blurb} Each shows a slice of the student Home in that theme, with its readability check.`
    : cat === "all"
      ? scopeView === "components"
        ? "The pieces widgets are made of: actions, inputs, navigation, feedback, data and charts. Open one to try its variants and states."
        : scopeView === "everything"
          ? "Every widget and every component in one place."
          : "Every student widget in its white-label base. Open one to see its layouts at real size."
      : kitCat
        ? "Components to build widgets with. Open one to try its variants and states."
        : `Every layout of the ${cat.toLowerCase()} widgets. Open one to use it at real size.`
  const cellCols = { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.round(CELL_W * scale)}px), 1fr))` }

  // `mode` as a class too: Tailwind's dark: variant follows .dark / .light, not this page's own toggle.
  // No ts-ui here: the admin look (dark buttons) would leak into the widgets.
  return (
    <div
      // Not on Themes, the wall or the proof: their cells set their own .light or .dark, and a page-level .light would switch off dark: inside a dark one.
      className={cn(scope, !themeSet && !tool?.ownModes && mode, "min-h-svh font-[family-name:var(--ff-geist)] text-[0.8125rem]")}
      // The sidebar widens with the widget size (272px at real size, ~288px at 1.15×, ~312px at 1.3×); the side padding follows the screen.
      style={{ ...CHROME[mode], background: "var(--c-page)", color: "var(--c-t1)", colorScheme: mode, "--sb": `${Math.round(272 * (1 + (scale - 1) / 2))}px`, "--gutter": "clamp(24px, 3vw, 64px)" } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: themeToCss(light, ".wb-light") + themeToCss(dark, ".wb-dark") + meaningCss(colour) }} />

      {/* Narrow screens: a top bar, the sidebar opens over the page. */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 lg:hidden" style={{ ...hair, background: "var(--c-bar)" }}>
        <div className="flex items-center gap-3">
          <BackHome compact />
          <Wordmark />
        </div>
        <button type="button" onClick={() => setMenu(!menu)} aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} className={cn("grid size-8 place-items-center rounded-lg border", FOCUS)} style={hair}>
          {menu ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <aside
        className={cn("fixed top-14 bottom-0 left-0 z-20 w-full overflow-y-auto border-r sm:w-72 lg:top-0 lg:block lg:w-(--sb)", menu ? "block" : "hidden")}
        style={{ ...hair, background: "var(--c-side)" }}
      >
        <div className="grid gap-3 px-4 pb-6">
          <div className="hidden h-14 items-center gap-3 lg:flex">
            <BackHome />
            <Wordmark />
          </div>
          <label className="mt-4 flex h-9 items-center gap-2 rounded-lg border px-3 focus-within:ring-2 focus-within:ring-(--brand-mark) lg:mt-0" style={{ ...hair, background: "var(--c-bar)" }}>
            <Search className={cn("size-4 shrink-0", t3)} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter the library…" aria-label="Filter the library" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-(--c-t3)" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear filter" className={cn("grid size-5 place-items-center rounded", t3, FOCUS)}>
                <X className="size-3.5" />
              </button>
            )}
          </label>
          <button type="button" onClick={() => setPalette(true)} className={cn("flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150 hover:bg-(--c-on)", t2, FOCUS)}>
            <Command className="size-4" />
            <span className="flex-1 text-left">Search everything</span>
            <kbd className="rounded border px-1.5 text-[0.6875rem]" style={hair}>
              ⌘K
            </kbd>
          </button>
          <nav className="grid gap-0.5" aria-label="Library">
            <NavRow active={cat === "all"} onClick={() => open("all")} label="All" count={found.length + foundK.length} strong />

            <Section label="Widgets" count={found.length} open={openW} onToggle={() => setOpenW(!openW)} />
            {openW && (
              <>
                {GROUPS.map((g) => {
                  const items = found.filter((w) => w.group === g)
                  if (!items.length) return null
                  const on = cat === g
                  return (
                    <div key={g} className="grid gap-0.5">
                      <NavRow active={on} onClick={() => open(g)} label={g} count={items.length} expanded={on} />
                      {on && (
                        <div className="my-0.5 ml-3 grid gap-0.5 border-l pl-2" style={hair}>
                          {items.map((w) => (
                            <a
                              key={w.type}
                              href={`#${w.type}`}
                              onClick={(e) => {
                                e.preventDefault()
                                show(w.type)
                              }}
                              aria-current={shown?.type === w.type ? "location" : undefined}
                              className={cn("flex h-8 items-center gap-2 rounded-lg px-3 text-[0.8125rem] transition-colors duration-150", FOCUS, shown?.type === w.type ? "bg-(--c-on) font-medium text-(--c-t1)" : cn(t2, "hover:bg-(--c-on) hover:text-(--c-t1)"))}
                            >
                              <span className="truncate">{w.name}</span>
                              {NEW_TYPES.has(w.type) && <NewBadge />}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            <Section label="Components" count={foundK.length} open={openK} onToggle={() => setOpenK(!openK)} />
            {openK && (
              <>
                <NavRow active={cat === "kit"} onClick={() => open("kit")} label="All components" count={foundK.length} />
                {COMPONENT_GROUPS.map((g) => {
                  const n = foundK.filter((c) => c.group === g).length
                  return n ? <NavRow key={g} active={cat === `kit:${g}`} onClick={() => open(`kit:${g}`)} label={g} count={n} /> : null
                })}
              </>
            )}

            <Section label="Themes" count={THEME_SETS.length} open={openT} onToggle={() => setOpenT(!openT)} />
            {openT && THEME_SETS.map((t) => <NavRow key={t.id} active={cat === `themes:${t.id}`} onClick={() => open(`themes:${t.id}`)} label={t.label} count={THEME_COUNTS.get(t.id)!} />)}

            <Section label="Tools" count={TOOLS.length} open={openX} onToggle={() => setOpenX(!openX)} />
            {openX && TOOLS.map((t) => <NavRow key={t.id} active={cat === `tool:${t.id}`} onClick={() => open(`tool:${t.id}`)} label={t.label} />)}
          </nav>
        </div>
      </aside>

      <main className="lg:pl-(--sb)">
        {/* Every look control, always in reach: a sticky bar in two clusters, widget state on the left and the view on the right. */}
        <div className="sticky top-14 z-10 border-b lg:top-0" style={{ ...hair, background: "var(--c-bar)" }}>
          <div className="flex h-14 items-center gap-3 px-6">
            {tool ? (
              <span className="flex-1" />
            ) : themeSet ? (
              <>
                {/* The readability check's controls: inline from 1280px, in a Controls panel below. */}
                <div className="hidden items-center gap-3 xl:flex">
                  <ThemeLabControls lab={themeLab} />
                </div>
                <div className="xl:hidden">
                  <LabPopover label="Controls" align="start" icon={<SlidersHorizontal className="size-4" />}>
                    <ThemeLabControls lab={themeLab} />
                  </LabPopover>
                </div>
                <span className="flex-1" />
              </>
            ) : (
              <>
                {/* Widget state: inline from 1280px, in a Controls panel below. */}
                <div className="hidden items-center gap-3 xl:flex">
                  <LabSeg label="Emphasis" value={emphasis} onChange={setEmphasis} options={[["quiet", "Quiet"], ["accent", "Accent"], ["star", "Star"]]} />
                  <LabSeg label="Detail" value={detail} onChange={setDetail} options={[["compact", "Compact"], ["standard", "Standard"], ["detailed", "Detailed"]]} />
                </div>
                <div className="xl:hidden">
                  <LabPopover label="Controls" align="start" icon={<SlidersHorizontal className="size-4" />}>
                    <LabSeg label="Emphasis" value={emphasis} onChange={setEmphasis} options={[["quiet", "Quiet"], ["accent", "Accent"], ["star", "Star"]]} />
                    <LabSeg label="Detail" value={detail} onChange={setDetail} options={[["compact", "Compact"], ["standard", "Standard"], ["detailed", "Detailed"]]} />
                  </LabPopover>
                </div>
                <span className="flex-1" />
                {/* View: inline from 1760px, in a View menu below, so nothing wraps. */}
                <div className="hidden items-center gap-3 min-[1760px]:flex">
                  <LabSeg label="Layouts" value={layout} onChange={setLayout} options={[["all", "All"], ["first", "Default"]]} />
                  <LabSeg label="Colour" value={colour} onChange={setColour} options={[["minimal", "Minimal"], ["mono", "Mono"]]} />
                  <LabSeg label="Size" value={size} onChange={setSize} options={[["auto", "Auto"], ["s", "S"], ["m", "M"], ["l", "L"]]} />
                </div>
                <div className="min-[1760px]:hidden">
                  <LabPopover label="View" icon={<Eye className="size-4" />}>
                    <LabSeg label="Layouts" value={layout} onChange={setLayout} options={[["all", "All"], ["first", "Default"]]} />
                    <LabSeg label="Colour" value={colour} onChange={setColour} options={[["minimal", "Minimal"], ["mono", "Mono"]]} />
                    <LabSeg label="Size" value={size} onChange={setSize} options={[["auto", "Auto"], ["s", "S"], ["m", "M"], ["l", "L"]]} />
                  </LabPopover>
                </div>
              </>
            )}
            <LabDivider />
            <LabButton onClick={() => setMode(mode === "light" ? "dark" : "light")} label={mode === "light" ? "Dark" : "Light"} hint={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
              {mode === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </LabButton>
          </div>
        </div>

        <div className="px-4 sm:px-8 lg:px-(--gutter)">
          <header className="grid gap-2 py-6">
            <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-[0.8125rem]", t2)}>
              {crumbs.map((c, n) => (
                <span key={c} className="flex items-center gap-1.5">
                  {n > 0 && (
                    <span aria-hidden className={t3}>
                      /
                    </span>
                  )}
                  {n < crumbs.length - 1 ? (
                    <button type="button" onClick={() => open(n === 0 ? "all" : c === "Components" ? "kit" : c === "Themes" ? "themes:branded" : c === "Tools" ? "tool:wall" : "all")} className={cn("rounded hover:text-(--c-t1)", FOCUS)}>
                      {c}
                    </button>
                  ) : (
                    <span className="text-(--c-t1)">{c}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="flex items-center gap-3 text-[1.75rem] leading-9 font-medium tracking-[-0.02em]">
              {title}
              {count !== null && (
                <span className={cn("rounded-full border px-2.5 text-[0.8125rem] leading-6 font-normal tracking-normal tabular-nums", t2)} style={hair}>
                  {count}
                </span>
              )}
            </h1>
            <p className={cn("max-w-2xl text-sm", t2)}>{blurb}</p>
            {/* What to show (on All) and how to order it; the themes' own controls sit in the bar. */}
            {!themeSet && !tool && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {cat === "all" && (
                  <LabSeg inline label="Show" value={scopeView} onChange={setScopeView} options={[["widgets", "Widgets"], ["components", "Components"], ["everything", "Everything"]]} />
                )}
                <LabSeg inline label="Sort" value={sort} onChange={setSort} options={[["category", "Category"], ["az", "A–Z"], ["recent", "Recently added"]]} />
              </div>
            )}
          </header>

          {themeSet && <ThemeLabGrid lab={themeLab} />}
          {tool?.id === "wall" && <WidgetWall />}
          {tool?.id === "anatomy" && <AnatomyCompare mode={mode} />}
          {tool?.id === "stress" && <StressTool mode={mode} theme={theme} />}
          {tool?.id === "proof" && <WidgetProof />}

          {!themeSet && !tool && count === 0 && (
            <div className="grid justify-items-start gap-3 rounded-xl border border-dashed px-6 py-12" style={hair}>
              <p className="text-sm font-medium">Nothing matches “{query}”</p>
              <p className={t2}>Try a name, a category or a tag, like “calendar”, “inputs” or “chart”.</p>
              <button type="button" onClick={() => setQuery("")} className={cn("h-8 rounded-lg border px-3 transition-colors duration-150 hover:bg-(--c-on)", FOCUS)} style={hair}>
                Clear filter
              </button>
            </div>
          )}

          {widgets.length > 0 && (
            // One equal cell per widget (All) or per layout (a category), rows aligned; each sits centred at real size, scaled down only to fit.
            <section aria-label="Widgets" className="grid gap-4 pb-12">
              {cat === "all" && scopeView === "everything" && <h2 className="text-sm font-medium">Widgets</h2>}
              <div className="grid gap-x-6 gap-y-8" style={cellCols}>
                {cat === "all"
                  ? widgets.map((def) => (
                      <Cell
                        key={def.type}
                        def={def}
                        variant={def.variants[0]}
                        extra={extra}
                        scale={scale}
                        mode={mode}
                        theme={theme}
                        emphasis={emphasis}
                        detail={detail}
                        name={def.name}
                        note={`${def.variants.length} ${def.variants.length === 1 ? "layout" : "layouts"}`}
                        tags={tagsOf(def)}
                        isNew={NEW_TYPES.has(def.type)}
                        onOpen={() => show(def.type)}
                      />
                    ))
                  : widgets.flatMap((def) =>
                      variantsOf(def).map((v) => (
                        <Cell
                          key={`${def.type}/${v.value}`}
                          def={def}
                          variant={v}
                          extra={extra}
                          scale={scale}
                          mode={mode}
                          theme={theme}
                          emphasis={emphasis}
                          detail={detail}
                          name={`${def.name} · ${v.label}`}
                          isNew={NEW_TYPES.has(def.type)}
                          onOpen={() => show(def.type, v.value)}
                        />
                      )),
                    )}
              </div>
            </section>
          )}

          {kits.length > 0 && (
            <section aria-label="Components" className="grid gap-4 pb-16">
              {cat === "all" && scopeView === "everything" && <h2 className="text-sm font-medium">Components</h2>}
              {/* Category order: one heading per group; A–Z: one flat grid. */}
              {(sort === "az" || (kitCat && kitCat !== "all") ? [["", kits] as [string, KitDef[]]] : COMPONENT_GROUPS.map((g) => [g, kits.filter((c) => c.group === g)] as [string, KitDef[]])).map(([g, list]) =>
                list.length ? (
                  <div key={g || "all"} className="grid gap-3">
                    {g && <h3 className={cn("text-xs", t2)}>{g}</h3>}
                    <div className="grid gap-x-6 gap-y-8" style={cellCols}>
                      {list.map((c) => (
                        <KitCell key={c.id} def={c} scale={scale} mode={mode} theme={theme} emphasis={emphasis} detail={detail} onOpen={() => showKit(c.id)} />
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </section>
          )}
        </div>
      </main>

      {shownDef && shown && (
        <WidgetModal def={shownDef} variant={shown.variant} onVariant={(v) => show(shownDef.type, v)} onClose={hide} extra={extra} scale={scale} mode={mode} theme={theme} emphasis={emphasis} detail={detail} />
      )}
      {kitDef && kit && <ComponentModal def={kitDef} index={kit.i} onIndex={(i) => showKit(kitDef.id, i)} onClose={hide} mode={mode} theme={theme} emphasis={emphasis} detail={detail} />}
      <CommandPalette
        items={paletteItems}
        open={palette}
        onOpenChange={setPalette}
        onPick={(x) => (x.kind === "Widget" ? show(x.id.slice(2)) : showKit(x.id.slice(2)))}
      />
    </div>
  )
}

/** A sidebar section heading: Widgets or Components, with its count; click to fold. */
function Section({ label, count, open, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className={cn("mt-4 flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium tracking-wide uppercase transition-colors duration-150 hover:text-(--c-t1)", t3, FOCUS)}>
      <ChevronRight className={cn("size-3.5 transition-transform duration-150", open && "rotate-90")} />
      <span className="flex-1 text-left">{label}</span>
      <span className="font-normal tabular-nums">{count}</span>
    </button>
  )
}

/** "New": for the widgets added in the lab. */
function NewBadge() {
  return (
    <span className="shrink-0 rounded-full border px-1.5 text-[0.625rem] leading-4" style={{ borderColor: "var(--brand-mark)", color: "var(--brand-text)" }}>
      New
    </span>
  )
}

/** One component in the grid: its first variant, live but inert, scaled to fit the cell. */
function KitCell({ def, scale, mode, theme, emphasis, detail, onOpen }: { def: KitDef; scale: number; mode: Mode; theme: CoachTheme; emphasis: Emphasis; detail: Detail; onOpen: () => void }) {
  const v = def.variants[0]
  const fit = Math.min(1, (CELL_W - 48) / ((v.width ?? 320) + 34))
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      aria-label={`Open ${def.name}`}
      className={cn("group grid min-w-0 cursor-pointer content-start gap-3 rounded-[14px]", FOCUS)}
    >
      <div inert aria-hidden className="grid place-items-center overflow-hidden rounded-xl border bg-(--c-cell) transition-colors duration-150 group-hover:bg-(--c-cell-on)" style={{ height: Math.round(CELL_H * scale), ...hair }}>
        <KitPane mode={mode} theme={theme} emphasis={emphasis} detail={detail} scale={fit * scale} width={v.width} bare={v.bare}>
          {v.render()}
        </KitPane>
      </div>
      <CellCaption name={def.name} note={`${def.variants.length} ${def.variants.length === 1 ? "variant" : "variants"}`} tags={def.tags} />
    </div>
  )
}

/** Name, tags and count under a cell; "Open →" on hover or focus. */
function CellCaption({ name, note, tags = [], isNew }: { name: string; note?: string; tags?: string[]; isNew?: boolean }) {
  return (
    <div className="grid gap-1.5 px-1">
      <div className="flex h-5 items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[0.8125rem] font-medium">{name}</span>
          {isNew && <NewBadge />}
        </span>
        {note && <span className={cn("shrink-0 text-xs group-hover:hidden group-focus-visible:hidden", t2)}>{note}</span>}
        <span className="hidden shrink-0 text-xs font-medium group-hover:inline group-focus-visible:inline">Open →</span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => (
            <span key={t} className={cn("rounded-full border px-1.5 text-[0.6875rem] leading-4", t2)} style={hair}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** The page's focus ring: the accent, 2px, only for keyboard focus. */
export const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark) focus-visible:ring-offset-1 focus-visible:ring-offset-(--c-page)"

/** A sidebar row: a label with its count on the right. */
function NavRow({ active, onClick, label, count, strong, expanded }: { active: boolean; onClick: () => void; label: string; count?: number; strong?: boolean; expanded?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-expanded={expanded}
      className={cn(
        "flex h-[34px] items-center justify-between rounded-lg px-3 text-left text-sm transition-colors duration-150",
        FOCUS,
        active ? "bg-(--c-on) font-medium text-(--c-t1)" : strong ? "text-(--c-t1) hover:bg-(--c-on)" : cn(t2, "hover:bg-(--c-on) hover:text-(--c-t1)"),
      )}
    >
      {label}
      {count !== undefined && <span className={cn("text-xs font-normal tabular-nums", t3)}>{count}</span>}
    </button>
  )
}

/** Narrowest All cell at real size; the widget is scaled to fit it, like a catalogue thumbnail. */
const CELL_W = 300
/** Height of an All cell's preview area at real size. */
const CELL_H = 240

type Variant = WidgetDef["variants"][number]

/**
 * One cell of the grid: a layout at real size, centred in a fixed preview
 * area, scaled down only when it is larger than the area. The preview is
 * inert (looking, not using); the cell opens the widget's detail sheet.
 */
function Cell({ def, variant, extra, scale, mode, theme, emphasis, detail, name, note, tags, isNew, onOpen }: { def: WidgetDef; variant: Variant; extra: number; scale: number; mode: Mode; theme: CoachTheme; emphasis: Emphasis; detail: Detail; name: string; note?: string; tags?: string[]; isNew?: boolean; onOpen: () => void }) {
  const w = px(colsOf(def, variant.value))
  const h = rowsOf(def, variant.value) + extra
  // Fit the layout's largest box inside the preview, with 24px of room on each side.
  const fit = Math.min(1, (CELL_W - 48) / w, (CELL_H - 48) / rowsPx(h))
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      aria-label={`Open ${name}`}
      className={cn("group grid min-w-0 cursor-pointer content-start gap-3 rounded-[14px]", FOCUS)}
    >
      <div
        inert
        aria-hidden
        className="grid place-items-center overflow-hidden rounded-xl border bg-(--c-cell) transition-colors duration-150 group-hover:bg-(--c-cell-on)"
        style={{ height: Math.round(CELL_H * scale), ...hair }}
      >
        <Pane def={def} variant={variant.value} h={h} scale={fit * scale} mode={mode} theme={theme} emphasis={emphasis} detail={detail} />
      </div>
      <CellCaption name={name} note={note} tags={tags} isNew={isNew} />
    </div>
  )
}

/** Back to the prototype's start screen. `compact`: the arrow alone, for the phone's top bar. */
function BackHome({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Back to the start screen"
      title="Back to the start screen"
      className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-lg border text-[0.8125rem] transition-colors duration-150 hover:bg-(--c-on)", compact ? "w-8 justify-center" : "px-2.5", t2, "hover:text-(--c-t1)", FOCUS)}
      style={hair}
    >
      <ArrowLeft className="size-4" />
      {!compact && "Home"}
    </Link>
  )
}

function Wordmark() {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[0.9375rem] font-semibold tracking-[-0.01em]">TradeHub</span>
      <span className={t2}>Library</span>
      <span className={cn("rounded-full border px-1.5 text-[0.6875rem] leading-4 tabular-nums", t2)} style={hair}>
        {LIBRARY.length + COMPONENTS.length}
      </span>
    </div>
  )
}

type Size = "auto" | "s" | "m" | "l"

/** Widget scale. Auto follows the screen: real size on a laptop, larger on a big external monitor. */
function scaleFor(size: Size, width: number) {
  if (size === "s") return 1
  if (size === "m") return 1.15
  if (size === "l") return 1.3
  return width >= 2560 ? 1.3 : width >= 1900 ? 1.15 : 1
}

function useViewportWidth() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb)
      return () => window.removeEventListener("resize", cb)
    },
    () => window.innerWidth,
    () => 1440,
  )
}

/** A choice remembered in this browser (theme, size). The fallback until the browser says otherwise. */
const storeListeners = new Set<() => void>()
function useStored<T extends string>(key: string, fallback: T, allowed: T[]): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    (cb) => {
      storeListeners.add(cb)
      return () => storeListeners.delete(cb)
    },
    () => {
      try {
        const v = localStorage.getItem(key) as T | null
        return v && allowed.includes(v) ? v : fallback
      } catch {
        return fallback
      }
    },
    () => fallback,
  )
  const set = (v: T) => {
    try {
      localStorage.setItem(key, v)
    } catch {}
    storeListeners.forEach((cb) => cb())
  }
  return [value, set]
}

/** A preview's height in rows at `cols` wide: more where the layout stacks when narrow (see the variant's `narrow`). */
export const rowsOf = (def: WidgetDef, variant: string, cols = colsOf(def, variant)) => {
  const v = def.variants.find((x) => x.value === variant) ?? def.variants[0]
  return v.narrow && cols < v.narrow.below ? Math.max(v.h, v.narrow.minH) : v.h
}
/** A preview's width in columns: up to 6, inside the layout's own narrowest and widest. */
export const colsOf = (def: WidgetDef, variant?: string) => {
  const v = def.variants.find((x) => x.value === variant) ?? def.variants[0]
  return Math.max(v.minW, Math.min(6, Math.max(v.minW, 4), v.maxW))
}
/** One stable empty object, so a widget's memoised work isn't redone each render. */
const NO_PROPS: Record<string, string | boolean> = {}

/** `fill`: the widget takes the box it is given (a builder grid cell) instead of its own size. */
export function Pane({ def, variant, h, scale, mode, theme, emphasis, detail, fill, fixed = fill, props, scope: own }: { def: WidgetDef; variant: string; h: number; scale: number; mode: Mode; theme: CoachTheme; emphasis: Emphasis; detail: Detail; fill?: boolean; /** The box sets the height (a grid cell), so the card may size itself by it; false for a phone's column. */ fixed?: boolean; /** The widget's own settings; empty shows its sample content. */ props?: Record<string, string | boolean>; /** The class its theme's CSS is scoped to, when not the library's own (another template's). */ scope?: string }) {
  const scope = own ?? (mode === "light" ? "wb-light" : "wb-dark")
  const ctx = useMemo(() => ({ coach, theme, base: "/c/northline", scope: `.${scope}`, preview: false }), [theme, scope])
  const cols = colsOf(def, variant)
  const C = def.Component
  return (
    <CoachContext.Provider value={ctx}>
      {/* zoom scales type, spacing and size together, so the widget keeps its proportions at every size. */}
      <div className={cn(scope, "max-w-full", fill && "size-full")} style={{ color: "var(--foreground)", fontFamily: "var(--coach-font-body)", zoom: scale === 1 ? undefined : scale }}>
        {/* Library view: as tall as its content, up to its grid height, so no leftover band shows. */}
        <div data-cell={`${def.type}/${variant}`} className="@container flex max-w-full flex-col" style={fill ? { width: "100%", height: "100%" } : { width: px(cols), maxHeight: rowsPx(h) }}>
          <Boundary name={def.name}>
            <WidgetFrame emphasis={emphasis} detail={detail} fixed={fixed}>
              <C variant={variant} props={props ?? NO_PROPS} />
            </WidgetFrame>
          </Boundary>
        </div>
      </div>
    </CoachContext.Provider>
  )
}

class Boundary extends Component<{ name: string; children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
  render() {
    if (this.state.error) return <div className="grid h-full place-items-center rounded-[4px] border border-dashed border-[#fa4d56] p-3 text-xs text-[#fa4d56]">{this.props.name} crashed: {this.state.error}</div>
    return this.props.children
  }
}

export function Seg<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-xs", t2)}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex h-8 items-center gap-0.5 rounded-lg border p-0.5" style={{ ...hair, background: "var(--c-page)" }}>
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={v === value}
            onClick={() => onChange(v)}
            className={cn(
              "h-full rounded-md px-2 text-[0.8125rem] transition-colors duration-150",
              FOCUS,
              v === value ? "bg-(--c-bar) font-medium text-(--c-t1) shadow-[0_0_0_1px_var(--c-hair),0_1px_2px_0_rgb(0_0_0/0.08)]" : cn(t2, "hover:text-(--c-t1)"),
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
