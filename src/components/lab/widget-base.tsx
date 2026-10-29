"use client"

import { ArrowDownUp, ArrowLeft, Check, Columns3, Menu, Palette, PanelsTopLeft, Shapes, ShieldCheck, Moon, Search, SlidersHorizontal, Sun, X } from "lucide-react"
import Link from "next/link"
import { Component, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { CoachContext } from "@/components/coach/coach-provider"
import { WidgetFrame } from "@/components/lab/reui-widgets/kit"
import { DataModeProvider, type DataMode } from "@/components/lab/reui-widgets/shared"
import { DETAILED_EXTRA_ROWS, WIDGETS, type WidgetDef } from "@/components/lab/reui-widgets/registry"
import { getDemoCoach } from "@/lib/data/coaches"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach } from "@/lib/theme/resolve"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import { ROW_HEIGHT, type Detail, type Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { checkWidget } from "@/lib/widgets/checks"
import { LabButton, LabPopover, LabSeg } from "./lab-controls"
import { CommandPalette, type PaletteItem } from "./kit/command-palette"
import { ComponentModal } from "./kit/component-modal"
import { COMPONENT_GROUPS, COMPONENTS, type KitDef } from "./kit/components"
import { KitPane } from "./kit/preview"
import { NEW_TYPES, NEW_WIDGETS, WIDGET_TAGS } from "./new-widgets/registry"
import { CompareBar, CompareView, type CompareSource } from "./compare-view"
import { duplicateLayout, useLabLayouts } from "./lab-layouts"
import { LayoutBar, LayoutGallery, LayoutView, type Device, type LayoutCompare } from "./layout-views"
import { colourOf, createTheme, duplicateTheme, resolveLab, useLabThemes } from "./lab-themes"
import { ThemeEditor, labUiCss } from "./theme-editor"
import { QualityOverview } from "./quality"
import { ThemeGallery } from "./theme-gallery"
import { PANEL, panelStyle, ThemeSwitcher, useDismiss } from "./theme-switcher"
import { StressTool } from "./stress-bench"
import { WidgetWall } from "./widget-wall"
import { THEME_SETS, ThemeLabControls, ThemeLabGrid, useThemeLab, type ThemeSet } from "./theme-lab"
import { WidgetModal } from "./widget-modal"

/** The real grid: 80px columns, 16px gaps, 56px rows. */
export const px = (cols: number) => cols * 80 + (cols - 1) * 16
export const rowsPx = (h: number) => h * ROW_HEIGHT + (h - 1) * 16

import { type Colour } from "./lab-themes"
export { themeFor, type Colour } from "./lab-themes"

/**
 * Meaning colours beside profit (success) and loss (destructive): warning
 * (amber) and info (the accent). Only where they mean something: urgency,
 * high impact, a status. Mono keeps them grey.
 */
export const meaningCss = (colour: Colour) => meaningFor(colour, "light", ".wb-light") + meaningFor(colour, "dark", ".wb-dark")
/** The meaning colours for one theme scope in one mode (Compare and the theme gallery give every theme its own). */
export const meaningFor = (colour: Colour, mode: Mode, sel: string) =>
  colour === "mono"
    ? `${sel}{--warning:var(--muted-foreground);--info:var(--foreground);--warning-text:var(--muted-foreground);--info-text:var(--foreground)}`
    : mode === "light"
      ? `${sel}{--warning:#d97706;--warning-text:#b45309;--info:#2563eb;--info-text:var(--brand-text)}`
      : `${sel}{--warning:#f59e0b;--warning-text:#fbbf24;--info:#3b82f6;--info-text:var(--brand-text)}`

/** Every widget in the library: the app's (minus pages' core widgets) and the ones added in the lab. */
export const LIBRARY = [...WIDGETS.filter((w) => !w.core), ...NEW_WIDGETS]
/** For "Recently added": the lab's new widgets first, newest first, then the rest. */
const ADDED = new Map(LIBRARY.map((w, i) => [w.type, NEW_TYPES.has(w.type) ? 1000 + i : i]))
/** The sidebar's order: the student's day first, the coach's own content after. */
const ORDER = ["Page", "Learning", "Calendar", "Journal", "Progress", "Community", "Coach and brand", "Your content", "AI", "Coaching"]
const GROUPS = [...new Set(LIBRARY.map((w) => w.group as string))].sort((a, b) => ((ORDER.indexOf(a) + 99) % 99) - ((ORDER.indexOf(b) + 99) % 99))
const SORTED = GROUPS.flatMap((g) => LIBRARY.filter((w) => w.group === g))
const coach = resolveCoach(getDemoCoach("northline")!)

/**
 * The review page's own surfaces, apart from the widgets' theme: a layered
 * neutral ladder (page, sidebar, header bar, preview cell, hairline) and three
 * text strengths, all at 4.5:1 or more on every surface they sit on. Light is
 * not pure white and dark is not pure black, so the widgets' cards stand out.
 */
const CHROME: Record<Mode, Record<string, string>> = {
  light: {
    "--c-page": "#f4f4f5",
    "--c-side": "#fafafa",
    "--c-bar": "#ffffff",
    "--c-cell": "#e9e9ec",
    "--c-cell-on": "#e2e2e6",
    "--c-hair": "#dcdce0",
    "--c-on": "#e3e3e7",
    "--c-t1": "#18181b",
    "--c-t2": "#4b4b53",
    "--c-t3": "#63636b",
  },
  dark: {
    "--c-page": "#111113",
    "--c-side": "#0c0c0e",
    "--c-bar": "#161618",
    "--c-cell": "#0b0b0d",
    "--c-cell-on": "#07070a",
    "--c-hair": "#2c2c31",
    "--c-on": "#232327",
    "--c-t1": "#f4f4f5",
    "--c-t2": "#c0c0c8",
    "--c-t3": "#9a9aa3",
  },
}
export const t2 = "text-(--c-t2)"
export const t3 = "text-(--c-t3)"
export const hair = { borderColor: "var(--c-hair)" }

type Scope = "all" | "widgets" | "components"
type Sort = "category" | "az" | "recent"
const KIT_CATS = COMPONENT_GROUPS.map((g) => `kit:${g}`)
const kitOf = (cat: string) => (cat === "kit" ? "all" : cat.startsWith("kit:") ? cat.slice(4) : null)
/** The Themes section's pages: every theme to pick, edit and delete, and the readability check. */
const THEME_VIEWS = [
  { id: "gallery", label: "Manage themes", blurb: "Every theme, drawn in itself. Click one to see the whole library in it; its menu edits, copies, compares or deletes it." },
  { id: "check", label: "Readability check", blurb: "Many themes at once against the readability rules: coaches' own brands, every template with every brand colour, or settings picked at random." },
] as const
type ThemeView = (typeof THEME_VIEWS)[number]["id"]
const THEME_CATS = THEME_VIEWS.map((t) => `themes:${t.id}`)
const themeOf = (cat: string) => THEME_VIEWS.find((t) => `themes:${t.id}` === cat)?.id ?? null

/** The lab's checks, each a page of the library: they measure widgets rather than show them. (Across templates became Compare.) */
const TOOLS = [
  { id: "wall", label: "Widget rules", blurb: "Every widget, every variant, at three widths in the theme above, measured against the widget rules: type size, contrast, brand share and overflow.", ownModes: false },
  { id: "stress", label: "Stress test", blurb: "One widget's variants at many grid sizes and amounts of content. Cells that cut or overflow are marked.", ownModes: false },
] as const
/** Quality: the overview, then each check. */
const QUALITY = [
  { cat: "quality", label: "Overview" },
  { cat: "tool:wall", label: "Widget rules" },
  { cat: "themes:check", label: "Readability" },
  { cat: "tool:stress", label: "Stress test" },
]
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
  const [data, setData] = useStored<DataMode>("wb-data", "sample", ["sample", "empty", "inactive", "finished"])
  const [menu, setMenu] = useState(false)
  const [query, setQuery] = useState("")
  const [palette, setPalette] = useState(false)
  const [mode, setMode] = useStored<Mode>("wb-mode", "dark", ["light", "dark"])
  const [size, setSize] = useStored<Size>("wb-size", "auto", ["auto", "s", "m", "l"])
  const [cat, setCat] = useStored<string>("wb-cat", "all", ["all", ...GROUPS, "kit", ...KIT_CATS, ...THEME_CATS, "layouts", "layout", "quality", ...TOOL_CATS])
  const [scopeView, setScopeView] = useStored<Scope>("wb-scope-v2", "all", ["all", "widgets", "components"])
  const [sort, setSort] = useStored<Sort>("wb-sort", "category", ["category", "az", "recent"])
  const [checkSet, setCheckSet] = useStored<ThemeSet>("wb-check-set", "branded", ["branded", "matrix", "random"])
  const [compareOn, setCompareOn] = useStored<"on" | "off">("wb-compare", "off", ["on", "off"])
  const [compareSource, setCompareSource] = useStored<CompareSource>("wb-compare-source", "view", ["view", "picked"])
  const [editing, setEditing] = useState<string | null>(null)
  const lab = useLabThemes()
  const layouts = useLabLayouts()
  const [stressType, setStressType] = useState(LIBRARY[0].type)
  const [layoutEditing, setLayoutEditing] = useState(false)
  const [layoutCompare, setLayoutCompare] = useStored<LayoutCompare>("wb-layout-compare", "off", ["off", "themes", "layouts"])
  const [device, setDevice] = useStored<Device>("wb-device", "desktop", ["desktop", "tablet", "phone"])
  const layoutView = cat === "layouts" ? "gallery" : cat === "layout" ? "page" : null
  /** Open one layout's page; `edit` opens it on the grid (a starting point is copied first). */
  const openLayout = (id: string, edit = false) => {
    const l = layouts.byId(id)
    if (!l) return
    if (edit && l.builtIn) duplicateLayout(l, `My ${l.name}`)
    else layouts.pick(id)
    setLayoutEditing(edit)
    setMenu(false)
    setCat("layout")
    window.scrollTo(0, 0)
  }
  const themeView: ThemeView | null = themeOf(cat)
  const themeSet = themeView === "check" ? checkSet : null
  const themeLab = useThemeLab(checkSet, query)
  const tool = toolOf(cat)
  const scale = scaleFor(size, useViewportWidth())
  const extra = detail === "detailed" ? DETAILED_EXTRA_ROWS : 0
  // The library's theme: everything below is drawn in it, in the page's light or dark.
  const colour = colourOf(lab.active)
  const light = useMemo(() => resolveLab(lab.active, "light"), [lab.active])
  const dark = useMemo(() => resolveLab(lab.active, "dark"), [lab.active])
  const editEntry = editing ? lab.byId(editing) : undefined
  const theme = mode === "light" ? light : dark
  const scope = mode === "light" ? "wb-light" : "wb-dark"

  const q = query.trim().toLowerCase()
  const tagsOf = (w: WidgetDef) => WIDGET_TAGS[w.type] ?? []
  const found = SORTED.filter((w) => !q || `${w.name} ${w.group} ${w.description} ${tagsOf(w).join(" ")}`.toLowerCase().includes(q))
  const foundK = COMPONENTS.filter((c) => !q || `${c.name} ${c.group} ${c.description} ${c.tags.join(" ")}`.toLowerCase().includes(q))
  const kitCat = kitOf(cat)
  const showW = cat === "all" ? scopeView !== "components" : !kitCat && !themeView && !layoutView && !tool
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

  // Compare: the widgets of this view (category and filter), or a picked set, under every compared theme.
  const comparing = compareOn === "on" && !themeView && !layoutView && !tool && !kitCat
  const viewWidgets = sortW(GROUPS.includes(cat) ? found.filter((w) => w.group === cat) : found)
  const compareRows = (compareSource === "picked" ? SORTED.filter((w) => lab.picked.includes(w.type)) : viewWidgets).flatMap((def) => variantsOf(def).map((v) => [def, v.value] as [WidgetDef, string]))
  const startCompare = () => {
    setCompareOn("on")
    if (themeView || layoutView || tool || kitCat) setCat("all")
    window.scrollTo(0, 0)
  }
  /** Edit a theme in the side panel; a starting point is copied first, so it stays as it is. */
  const edit = (id: string) => {
    const entry = lab.byId(id)
    if (!entry) return
    const target = entry.builtIn ? duplicateTheme(entry, `My ${entry.name}`) : id
    lab.pick(target)
    setEditing(target)
  }
  const newTheme = () => setEditing(createTheme(lab.active.builtIn ? lab.active.base : "whitelabel"))

  // [ and ] step through themes, C toggles Compare, E edits the theme in use, Esc closes the editor.
  const keys = { lab, comparing, editing, edit, startCompare, setCompareOn, setEditing }
  const keysRef = useRef(keys)
  useEffect(() => {
    keysRef.current = keys
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = keysRef.current
      if (e.key === "Escape" && k.editing) return k.setEditing(null)
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable], [role=dialog]")) return
      if (e.key === "[" || e.key === "]") {
        const ids = k.lab.all.map((t) => t.id)
        const i = ids.indexOf(k.lab.active.id)
        k.lab.pick(ids[(i + (e.key === "]" ? 1 : ids.length - 1)) % ids.length])
      } else if (e.key === "c" || e.key === "C") {
        if (k.comparing) k.setCompareOn("off")
        else k.startCompare()
      } else if (e.key === "e" || e.key === "E") k.edit(k.lab.active.id)
      else return
      e.preventDefault()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

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
    } else if (type === "tools" && variant === "anatomy") {
      // Across templates became Compare.
      setCompareOn("on")
      setCat("all")
      history.replaceState(null, "", location.pathname)
    } else if (type === "tools" && TOOLS.some((t) => t.id === variant)) {
      // #tools/wall opens a bench (the old /lab/widgets, /lab/anatomy and /lab/proof send here).
      setCat(`tool:${variant as ToolId}`)
      history.replaceState(null, "", location.pathname)
    } else if (type === "themes") {
      // #themes opens Manage themes; #themes/matrix (or another set) the readability check (the old Theme lab).
      const set = THEME_SETS.find((t) => t.id === variant)?.id
      if (set) setCheckSet(set)
      setCat(set || variant === "check" ? "themes:check" : "themes:gallery")
      history.replaceState(null, "", location.pathname)
    } else if (type && LIBRARY.some((w) => w.type === type)) {
      const def = LIBRARY.find((w) => w.type === type)!
      setShown({ type, variant: def.variants.find((x) => x.value === variant)?.value ?? def.variants[0].value })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Go to a page by its id; "tool:stress:<type>" opens the Stress test on that widget. */
  const goTo = (id: string) => {
    if (id.startsWith("tool:stress:")) {
      setStressType(id.slice(12))
      return open("tool:stress")
    }
    open(id)
  }
  /** A breadcrumb goes back up to its page. */
  const goCrumb = (c: string) => {
    if (c === "Catalog") return open("all")
    if (c === "Widgets" || c === "Components") return (setScopeView(c === "Widgets" ? "widgets" : "components"), open("all"))
    if (c === "Quality") return open("quality")
    if (c === "Layouts") return open("layouts")
    if (c === "Themes") return open("themes:gallery")
    if (c === "Compare") return startCompare()
  }
  // Once the page title scrolls away, it shows in the top bar, so you still know where you are.
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [titleOut, setTitleOut] = useState(false)
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setTitleOut(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const paletteItems: PaletteItem[] = [
    ...SORTED.map((w) => ({ id: `w:${w.type}`, kind: "Widget" as const, name: w.name, group: w.group, description: w.description, tags: WIDGET_TAGS[w.type] ?? [], isNew: NEW_TYPES.has(w.type) })),
    ...COMPONENTS.map((c) => ({ id: `k:${c.id}`, kind: "Component" as const, name: c.name, group: c.group, description: c.description, tags: c.tags })),
    ...lab.all.map((t) => ({ id: `t:${t.id}`, kind: "Theme" as const, name: t.name, group: t.builtIn ? "Starting point" : "My themes", description: "Show the library in this theme", tags: ["theme"] })),
    ...layouts.all.map((l) => ({ id: `l:${l.id}`, kind: "Layout" as const, name: l.name, group: l.builtIn ? "Starting point" : "My layouts", description: `${l.items.length} widgets`, tags: ["layout", "page"] })),
    ...[["themes:gallery", "Themes"], ["layouts", "Layouts"], ["compare", "Compare"], ...QUALITY.map((q) => [q.cat, q.cat === "quality" ? "Quality" : q.label])].map(([id, name]) => ({
      id: `p:${id}`,
      kind: "Page" as const,
      name,
      group: "Library",
      description: "",
      tags: ["page"],
    })),
  ]
  /** ⌘K: open what was picked, whatever it is. */
  const pick = (x: PaletteItem) => {
    const id = x.id.slice(2)
    if (x.kind === "Widget") show(id)
    else if (x.kind === "Component") showKit(id)
    else if (x.kind === "Theme") lab.pick(id)
    else if (x.kind === "Layout") openLayout(id)
    else if (id === "compare") startCompare()
    else open(id)
  }

  const catLabel = cat === "all" ? null : GROUPS.includes(cat) ? cat : null
  const isQuality = cat === "quality" || !!tool || themeView === "check"
  const section = comparing ? "compare" : themeView === "gallery" ? "themes" : layoutView ? "layouts" : isQuality ? "quality" : "catalog"
  const qualityLabel = QUALITY.find((q) => q.cat === cat)?.label
  const crumbs = comparing
    ? ["Compare", ...(compareSource === "view" && catLabel ? [catLabel] : [])]
    : layoutView
      ? ["Layouts", ...(layoutView === "page" ? [layouts.active.name] : [])]
      : isQuality
        ? ["Quality", ...(cat !== "quality" && qualityLabel ? [qualityLabel] : [])]
        : themeView === "gallery"
          ? ["Themes"]
          : kitCat
            ? ["Catalog", "Components", kitCat]
            : cat === "all"
              ? ["Catalog"]
              : ["Catalog", "Widgets", cat]
  const title = comparing
    ? `Compare ${lab.compared.length} themes`
    : layoutView === "gallery"
      ? "Layouts"
      : layoutView === "page"
        ? layouts.active.name
        : cat === "quality"
          ? "Quality"
          : isQuality
            ? (qualityLabel ?? "")
            : themeView === "gallery"
              ? "Themes"
              : cat === "all"
                ? "Catalog"
                : (kitCat ?? cat)
  const count = comparing
    ? compareRows.length
    : layoutView === "gallery"
      ? layouts.all.length
      : layoutView === "page"
        ? layouts.active.items.length
        : cat === "quality" || tool
          ? null
          : themeView === "gallery"
            ? lab.all.length
            : themeView === "check"
              ? themeLab.shown.length
              : widgets.length + kits.length
  const inTheme = lab.active.id === "whitelabel" ? "in the white-label base" : `in ${lab.active.name}`
  const blurb = comparing
    ? `The same widgets in every theme below, one column each, rows aligned. ${compareSource === "view" ? "Widgets come from the sidebar and the search; pick a set to compare exactly those." : "Showing the widgets you picked."}`
    : layoutView === "gallery"
      ? "Student pages: which widgets they hold, where and how big. Any layout shows in any theme."
      : layoutView === "page"
        ? layoutEditing
          ? `Arranging on the real grid, ${inTheme}.`
          : `${layouts.active.builtIn ? "A template’s Home" : "Your layout"}, ${inTheme}.`
        : cat === "quality"
          ? "Where the library stands against its rules, and what to fix first."
          : tool
            ? tool.blurb
            : themeView === "check"
              ? THEME_VIEWS[1].blurb
              : themeView === "gallery"
                ? "Click a theme to see the whole library in it. Its menu edits, copies, compares or deletes it."
                : cat === "all"
                  ? `Every widget and the components they are made of, ${inTheme}. Open one to see it at real size.`
                  : kitCat
                    ? `Components to build widgets with, ${inTheme}.`
                    : `Every variant of the ${cat.toLowerCase()} widgets, ${inTheme}.`
  const cellCols = { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.round(CELL_W * scale)}px), 1fr))` }

  // `mode` as a class too: Tailwind's dark: variant follows .dark / .light, not this page's own toggle.
  // No ts-ui here: the admin look (dark buttons) would leak into the widgets.
  return (
    <div
      // Not on Themes, the wall or the proof: their cells set their own .light or .dark, and a page-level .light would switch off dark: inside a dark one.
      className={cn(scope, !themeView && !layoutView && !tool?.ownModes && mode, "min-h-svh font-[family-name:var(--ff-geist)] text-[0.8125rem]")}
      // The sidebar widens with the widget size (272px at real size, ~288px at 1.15×, ~312px at 1.3×); the side padding follows the screen.
      style={{ ...CHROME[mode], background: "var(--c-page)", color: "var(--c-t1)", colorScheme: mode, "--sb": `${Math.round(272 * (1 + (scale - 1) / 2))}px`, "--gutter": "clamp(24px, 3vw, 64px)" } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: themeToCss(light, ".wb-light") + themeToCss(dark, ".wb-dark") + meaningCss(colour) + labUiCss(CHROME[mode]) }} />

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

      <aside className={cn("fixed top-14 bottom-0 left-0 z-20 w-full overflow-y-auto border-r sm:w-72 lg:top-0 lg:block lg:w-(--sb)", menu ? "block" : "hidden")} style={{ ...hair, background: "var(--c-side)" }}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-3 pb-6">
          <div className="hidden h-14 items-center gap-3 lg:flex">
            <BackHome />
            <Wordmark />
          </div>
          {/* One search: typing filters the catalog; ⌘K finds anything (widgets, components, themes, layouts, pages). */}
          <label className="mt-4 flex h-9 items-center gap-2 rounded-lg border pr-1.5 pl-3 focus-within:ring-2 focus-within:ring-(--brand-mark) lg:mt-0" style={{ ...hair, background: "var(--c-bar)" }}>
            <Search className={cn("size-4 shrink-0", t3)} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (section !== "catalog" && !comparing) setCat("all")
              }}
              placeholder="Search the library…"
              aria-label="Search the library"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-(--c-t3)"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className={cn("grid size-6 place-items-center rounded", t3, FOCUS)}>
                <X className="size-3.5" />
              </button>
            ) : (
              <button type="button" onClick={() => setPalette(true)} title="Find anything (⌘K)" className={cn("rounded border px-1.5 text-[0.6875rem] leading-5 hover:text-(--c-t1)", t3, FOCUS)} style={hair}>
                ⌘K
              </button>
            )}
          </label>

          {/* The main places, one row each; only the open one shows what is inside it. */}
          <nav className="grid gap-0.5" aria-label="Library">
            <MainRow icon={<Shapes className="size-4" />} label="Catalog" count={found.length + foundK.length} active={section === "catalog"} onClick={() => (setScopeView("all"), setCompareOn("off"), open("all"))} />
            {section === "catalog" && (
              <SubList>
                <SubHeading>Widgets</SubHeading>
                {GROUPS.map((g) => {
                  const n = found.filter((w) => w.group === g).length
                  return n ? <SubRow key={g} active={cat === g} onClick={() => open(g)} label={g} count={n} /> : null
                })}
                <SubHeading>Components</SubHeading>
                {COMPONENT_GROUPS.map((g) => {
                  const n = foundK.filter((c) => c.group === g).length
                  return n ? <SubRow key={g} active={cat === `kit:${g}`} onClick={() => open(`kit:${g}`)} label={g} count={n} /> : null
                })}
              </SubList>
            )}
            <MainRow icon={<Palette className="size-4" />} label="Themes" count={lab.all.length} active={section === "themes"} onClick={() => open("themes:gallery")} />
            <MainRow icon={<PanelsTopLeft className="size-4" />} label="Layouts" count={layouts.all.length} active={section === "layouts"} onClick={() => open("layouts")} />
            <MainRow icon={<Columns3 className="size-4" />} label="Compare" count={lab.compared.length} active={section === "compare"} onClick={() => (setMenu(false), startCompare())} />
            <MainRow icon={<ShieldCheck className="size-4" />} label="Quality" active={section === "quality"} onClick={() => open("quality")} />
            {section === "quality" && (
              <SubList>
                {QUALITY.map((q) => (
                  <SubRow key={q.cat} active={cat === q.cat} onClick={() => open(q.cat)} label={q.label} />
                ))}
              </SubList>
            )}
          </nav>
        </div>
      </aside>

      <DataModeProvider value={data}>
        <main className={cn("lg:pl-(--sb) transition-[padding] duration-200", editEntry && "sm:pr-[23rem]")}>
          {/* The bar: what the library is shown in on the left (theme, Compare), how widgets are drawn and light or dark on the right. */}
          <div className="sticky top-14 z-10 border-b lg:top-0" style={{ ...hair, background: "var(--c-bar)" }}>
            <div className="flex min-h-14 flex-wrap items-center gap-2 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:gap-3 sm:px-6 sm:py-0">
              {/* The theme everything is drawn in, and Compare, first: the two things to reach for most. */}
              {themeView !== "check" && !tool?.ownModes && (
                <>
                  <ThemeSwitcher lab={lab} mode={mode} onEdit={edit} onNew={newTheme} onManage={() => open("themes:gallery")} onCompare={startCompare} />
                  <LabButton onClick={() => (comparing ? setCompareOn("off") : startCompare())} label="Compare" hint="Compare themes side by side (C)" pressed={comparing}>
                    <Columns3 className="size-4" />
                  </LabButton>
                </>
              )}
              {/* The page's title, once it has scrolled out of view. */}
              <span
                aria-hidden={!titleOut}
                className={cn("hidden min-w-0 items-center gap-2 truncate text-sm font-medium transition-opacity duration-200 md:flex", titleOut ? "opacity-100" : "pointer-events-none opacity-0")}
              >
                <span className="h-5 w-px shrink-0" style={{ background: "var(--c-hair)" }} />
                <span className="truncate">{title}</span>
              </span>
              {themeSet ? (
                <>
                  {/* The readability check's controls: inline from 1280px, in a Controls panel below. */}
                  <div className="hidden items-center gap-3 xl:flex">
                    <LabSeg label="Set" value={checkSet} onChange={setCheckSet} options={THEME_SETS.map((t) => [t.id, t.label] as [ThemeSet, string])} />
                    <ThemeLabControls lab={themeLab} />
                  </div>
                  <div className="xl:hidden">
                    <LabPopover label="Controls" align="start" icon={<SlidersHorizontal className="size-4" />}>
                      <LabSeg label="Set" value={checkSet} onChange={setCheckSet} options={THEME_SETS.map((t) => [t.id, t.label] as [ThemeSet, string])} />
                      <ThemeLabControls lab={themeLab} />
                    </LabPopover>
                  </div>
                </>
              ) : null}
              <span className="flex-1" />
              {/* How widgets are drawn, in one menu that says what is set; only where there are widgets to draw. */}
              {(!tool || tool.id === "wall") && !layoutView && !themeSet && cat !== "quality" && (
                <DisplayMenu
                  value={{ emphasis, detail, data, variants: layout, size }}
                  showVariants={GROUPS.includes(cat) || comparing}
                  onChange={(p) => {
                    if (p.emphasis) setEmphasis(p.emphasis)
                    if (p.detail) setDetail(p.detail)
                    if (p.data) setData(p.data)
                    if (p.variants) setLayout(p.variants)
                    if (p.size) setSize(p.size)
                  }}
                />
              )}
              <ModeToggle mode={mode} onMode={setMode} />
            </div>
          </div>

          <div className="px-4 sm:px-8 lg:px-(--gutter)">
            <header className="grid gap-1.5 pt-5 pb-6">
              {crumbs.length > 1 && (
                <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-xs", t3)}>
                  {crumbs.map((c, n) => (
                    <span key={c} className="flex items-center gap-1.5">
                      {n > 0 && <span aria-hidden>/</span>}
                      {n < crumbs.length - 1 ? (
                        <button type="button" onClick={() => goCrumb(c)} className={cn("rounded hover:text-(--c-t1)", FOCUS)}>
                          {c}
                        </button>
                      ) : (
                        <span className={t2}>{c}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h1 ref={titleRef} className="flex min-w-0 items-center gap-3 text-[1.75rem] leading-9 font-medium tracking-[-0.02em]">
                  <span className="truncate">{title}</span>
                  {count !== null && (
                    <span className={cn("rounded-full border px-2.5 text-[0.8125rem] leading-6 font-normal tracking-normal tabular-nums", t2)} style={hair}>
                      {count}
                    </span>
                  )}
                </h1>
                {section === "catalog" && <SortMenu value={sort} onChange={setSort} />}
              </div>
              <p className={cn("line-clamp-2 max-w-2xl text-[0.8125rem]", t2)}>{blurb}</p>
              {query && (section === "catalog" || comparing) && (
                <div className="mt-1.5 flex">
                  <span className="flex h-7 items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-[0.8125rem]" style={{ ...hair, background: "var(--c-bar)" }}>
                    <Search className={cn("size-3.5", t3)} />
                    Search: “{query}”
                    <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className={cn("grid size-5 place-items-center rounded-full hover:bg-(--c-on)", t3, FOCUS)}>
                      <X className="size-3.5" />
                    </button>
                  </span>
                </div>
              )}
              {layoutView === "page" && (
                <LayoutBar
                  layout={layouts.active}
                  layouts={layouts}
                  lab={lab}
                  mode={mode}
                  editing={layoutEditing}
                  onEditing={setLayoutEditing}
                  compare={layoutCompare}
                  onCompare={setLayoutCompare}
                  device={device}
                  onDevice={setDevice}
                />
              )}
              {comparing && <CompareBar lab={lab} mode={mode} source={compareSource} onSource={setCompareSource} viewCount={viewWidgets.length} />}
              {/* The catalog's tabs: all of it, or one kind; All first and the default. */}
              {section === "catalog" && cat === "all" && (
                <div role="tablist" aria-label="Show" className="mt-3 flex gap-5 border-b" style={hair}>
                  {(
                    [
                      ["all", "All", found.length + foundK.length],
                      ["widgets", "Widgets", found.length],
                      ["components", "Components", foundK.length],
                    ] as [Scope, string, number][]
                  ).map(([v, l, n]) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={scopeView === v}
                      onClick={() => setScopeView(v)}
                      className={cn(
                        "-mb-px flex h-10 items-center gap-1.5 border-b-2 text-sm transition-colors duration-150",
                        FOCUS,
                        scopeView === v ? "border-(--c-t1) font-medium text-(--c-t1)" : cn("border-transparent hover:text-(--c-t1)", t2),
                      )}
                    >
                      {l}
                      <span className={cn("text-xs font-normal tabular-nums", t3)}>{n}</span>
                    </button>
                  ))}
                </div>
              )}
            </header>

            {themeView === "check" && <ThemeLabGrid lab={themeLab} />}
            {themeView === "gallery" && <ThemeGallery lab={lab} mode={mode} emphasis={emphasis} detail={detail} onEdit={edit} />}
            {comparing && <CompareView lab={lab} mode={mode} rows={compareRows} scale={scale} emphasis={emphasis} detail={detail} onEdit={edit} />}
            {layoutView === "gallery" && <LayoutGallery layouts={layouts} theme={theme} scope={scope} onOpen={(id) => openLayout(id)} onEdit={(id) => openLayout(id, true)} />}
            {layoutView === "page" && <LayoutView layout={layouts.active} layouts={layouts} lab={lab} mode={mode} theme={theme} scope={scope} editing={layoutEditing} compare={layoutCompare} device={device} />}
            {cat === "quality" && <QualityOverview lab={lab} go={goTo} onWidget={(t, v) => show(t, v)} onTheme={(id) => edit(id)} />}
            {tool?.id === "wall" && <WidgetWall theme={theme} themeName={lab.active.name} emphasis={emphasis} detail={detail} onOpen={(t, v) => show(t, v)} />}
            {tool?.id === "stress" && <StressTool mode={mode} theme={theme} type={stressType} onType={setStressType} />}

            {!themeView && !layoutView && !tool && !comparing && count === 0 && (
              <div className="grid justify-items-start gap-3 rounded-xl border border-dashed px-6 py-12" style={hair}>
                <p className="text-sm font-medium">Nothing matches “{query}”</p>
                <p className={t2}>Try a name, a category or a tag, like “calendar”, “inputs” or “chart”.</p>
                <button type="button" onClick={() => setQuery("")} className={cn("h-8 rounded-lg border px-3 transition-colors duration-150 hover:bg-(--c-on)", FOCUS)} style={hair}>
                  Clear filter
                </button>
              </div>
            )}

            {!comparing && widgets.length > 0 && (
              // One equal cell per widget (All) or per layout (a category), rows aligned; each sits centred at real size, scaled down only to fit.
              <section aria-label="Widgets" className="grid gap-4 pb-12">
                {cat === "all" && scopeView === "all" && <h2 className="text-sm font-medium">Widgets</h2>}
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
                          note={`${def.variants.length} ${def.variants.length === 1 ? "variant" : "variants"}`}
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

            {!comparing && kits.length > 0 && (
              <section aria-label="Components" className="grid gap-4 pb-16">
                {cat === "all" && scopeView === "all" && <h2 className="text-sm font-medium">Components</h2>}
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
          <WidgetModal
            lab={lab}
            data={data}
            onData={setData}
            onCompare={() => (hide(), startCompare())}
            def={shownDef}
            variant={shown.variant}
            onVariant={(v) => show(shownDef.type, v)}
            onClose={hide}
            extra={extra}
            scale={scale}
            mode={mode}
            theme={theme}
            emphasis={emphasis}
            detail={detail}
          />
        )}
        {kitDef && kit && <ComponentModal def={kitDef} index={kit.i} onIndex={(i) => showKit(kitDef.id, i)} onClose={hide} mode={mode} theme={theme} emphasis={emphasis} detail={detail} />}
      </DataModeProvider>
      {editEntry && !editEntry.builtIn && <ThemeEditor key={editEntry.id} entry={editEntry} lab={lab} mode={mode} onClose={() => setEditing(null)} onCompare={startCompare} />}
      <CommandPalette items={paletteItems} open={palette} onOpenChange={setPalette} onPick={pick} />
    </div>
  )
}

const EMPHASIS_OPTS: [Emphasis, string][] = [
  ["quiet", "Quiet"],
  ["accent", "Accent"],
  ["star", "Star"],
]
const DETAIL_OPTS: [Detail, string][] = [
  ["compact", "Compact"],
  ["standard", "Standard"],
  ["detailed", "Detailed"],
]
const SIZE_OPTS: [Size, string][] = [
  ["auto", "Auto"],
  ["s", "S"],
  ["m", "M"],
  ["l", "L"],
]

const DATA_OPTS: [DataMode, string][] = [
  ["sample", "Sample"],
  ["empty", "Empty"],
  ["inactive", "Inactive"],
  ["finished", "Finished"],
]
export type DisplayState = { emphasis: Emphasis; detail: Detail; data: DataMode; variants: "first" | "all"; size: Size }
export const DISPLAY_DEFAULT: DisplayState = { emphasis: "accent", detail: "standard", data: "sample", variants: "all", size: "auto" }

/**
 * How the widgets are drawn, in one menu. Its button names only what differs
 * from the default (Accent · Standard · Sample data), with a dot, so a changed
 * setting is never forgotten. Two groups: the widgets' own state (the same
 * settings a coach picks per widget, here for all at once, plus which
 * student's data they show) and the grid. Variants shows only where a
 * widget's variants are listed.
 */
function DisplayMenu({ value, onChange, showVariants }: { value: DisplayState; onChange: (patch: Partial<DisplayState>) => void; showVariants: boolean }) {
  const name = (opts: [string, string][], v: string) => opts.find((o) => o[0] === v)?.[1]
  const diff = [
    value.emphasis !== "accent" && name(EMPHASIS_OPTS, value.emphasis),
    value.detail !== "standard" && name(DETAIL_OPTS, value.detail),
    value.data !== "sample" && `${name(DATA_OPTS, value.data)} data`,
    showVariants && value.variants === "first" && "Default variants",
    value.size !== "auto" && `Size ${name(SIZE_OPTS, value.size)}`,
  ].filter(Boolean) as string[]
  return (
    <LabPopover
      label={diff.length ? diff.join(" · ") : "Display"}
      icon={
        <span className="relative">
          {diff.length > 0 && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full" style={{ background: "var(--brand-mark)" }} />}
          <SlidersHorizontal className="size-4" />
        </span>
      }
    >
      <div className="grid w-[23rem] max-w-full gap-4 p-2">
        <GroupTitle>Widgets</GroupTitle>
        <DisplayRow title="Emphasis" hint="How much each stands out">
          <Choice label="Emphasis" value={value.emphasis} onChange={(emphasis) => onChange({ emphasis })} options={EMPHASIS_OPTS} />
        </DisplayRow>
        <DisplayRow title="Detail" hint="How much each shows">
          <Choice label="Detail" value={value.detail} onChange={(detail) => onChange({ detail })} options={DETAIL_OPTS} />
        </DisplayRow>
        <DisplayRow title="Student data" hint="See empty and edge states">
          <Choice label="Student data" value={value.data} onChange={(data) => onChange({ data })} options={DATA_OPTS} />
        </DisplayRow>
        <div className="h-px" style={{ background: "var(--c-hair)" }} />
        <GroupTitle>Grid</GroupTitle>
        {showVariants && (
          <DisplayRow title="Variants" hint="All of each widget, or its default">
            <Choice
              label="Variants"
              value={value.variants}
              onChange={(variants) => onChange({ variants })}
              options={[
                ["all", "Every variant"],
                ["first", "Default only"],
              ]}
            />
          </DisplayRow>
        )}
        <DisplayRow title="Card size" hint="Auto follows the screen">
          <Choice label="Card size" value={value.size} onChange={(size) => onChange({ size })} options={SIZE_OPTS} />
        </DisplayRow>
        {diff.length > 0 && (
          <button type="button" onClick={() => onChange(DISPLAY_DEFAULT)} className={cn("h-8 justify-self-start rounded-lg px-2 text-[0.8125rem] text-(--c-t2) hover:bg-(--c-on) hover:text-(--c-t1)", FOCUS)}>
            Back to the default
          </button>
        )}
      </div>
    </LabPopover>
  )
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <span className={cn("-mb-1 text-[0.6875rem] font-medium tracking-wide uppercase", t3)}>{children}</span>
}

/** A full-width segmented choice with no label of its own (the row titles it). */
function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid h-9 auto-cols-fr grid-flow-col gap-0.5 rounded-lg border p-[3px]" style={{ ...hair, background: "var(--c-page)" }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={cn(
            "h-full rounded-md px-2 text-sm whitespace-nowrap transition-colors duration-150",
            FOCUS,
            v === value ? "bg-(--c-bar) font-medium text-(--c-t1) shadow-[0_0_0_1px_var(--c-hair),0_1px_2px_0_rgb(0_0_0/0.1)]" : "text-(--c-t2) hover:text-(--c-t1)",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function DisplayRow({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] font-medium">{title}</span>
        <span className="truncate text-xs text-(--c-t3)">{hint}</span>
      </div>
      {children}
    </div>
  )
}

/** Light or dark, as two icons: the one on is raised. */
function ModeToggle({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div role="radiogroup" aria-label="Light or dark" className="flex h-9 shrink-0 items-center gap-0.5 rounded-lg border p-[3px]" style={{ ...hair, background: "var(--c-page)" }}>
      {(
        [
          ["light", <Sun key="l" className="size-4" />, "Light"],
          ["dark", <Moon key="d" className="size-4" />, "Dark"],
        ] as const
      ).map(([m, icon, label]) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-label={label}
          title={label}
          onClick={() => onMode(m)}
          className={cn(
            "grid h-full w-8 place-items-center rounded-md transition-colors duration-150",
            FOCUS,
            mode === m ? "bg-(--c-bar) text-(--c-t1) shadow-[0_0_0_1px_var(--c-hair),0_1px_2px_0_rgb(0_0_0/0.1)]" : "text-(--c-t3) hover:text-(--c-t1)",
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

/** A main place in the sidebar: an icon, its name and how many things are in it. */
function MainRow({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150",
        FOCUS,
        active ? "bg-(--c-on) font-medium text-(--c-t1)" : cn(t2, "hover:bg-(--c-on) hover:text-(--c-t1)"),
      )}
    >
      <span className={active ? "text-(--c-t1)" : t3}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className={cn("text-xs font-normal tabular-nums", t3)}>{count}</span>}
    </button>
  )
}

/** What is inside the open place, indented under it on a hairline. */
function SubList({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-0.5 mb-2 ml-[1.125rem] grid gap-px border-l pl-2" style={hair}>
      {children}
    </div>
  )
}
function SubHeading({ children }: { children: React.ReactNode }) {
  return <span className={cn("px-2.5 pt-2.5 pb-1 text-[0.6875rem] font-medium tracking-wide uppercase", t3)}>{children}</span>
}
function SubRow({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[0.8125rem] transition-colors duration-150",
        FOCUS,
        active ? "bg-(--c-on) font-medium text-(--c-t1)" : cn(t2, "hover:bg-(--c-on) hover:text-(--c-t1)"),
      )}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && <span className={cn("text-xs font-normal tabular-nums", t3)}>{count}</span>}
    </button>
  )
}

const SORTS: [Sort, string][] = [
  ["category", "Category"],
  ["az", "A–Z"],
  ["recent", "Recently added"],
]
/** How the catalog is ordered: a small menu, since it changes rarely. */
function SortMenu({ value, onChange }: { value: Sort; onChange: (v: Sort) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] transition-colors duration-150 hover:bg-(--c-on)", t2, FOCUS, open && "bg-(--c-on)")}
      >
        <ArrowDownUp className="size-3.5" />
        Sort: <span className="text-(--c-t1)">{SORTS.find((x) => x[0] === value)?.[1]}</span>
      </button>
      {open && (
        <div role="menu" className={cn(PANEL, "top-10 right-0 w-48")} style={panelStyle}>
          {SORTS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="menuitemradio"
              aria-checked={v === value}
              onClick={() => (onChange(v), setOpen(false))}
              className={cn("flex h-8 items-center justify-between rounded-lg px-2.5 text-left text-sm hover:bg-(--c-on)", FOCUS)}
            >
              {l}
              {v === value && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
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
      <div
        inert
        aria-hidden
        className="grid place-items-center overflow-hidden rounded-xl border bg-(--c-cell) transition-colors duration-150 group-hover:bg-(--c-cell-on)"
        style={{ height: Math.round(CELL_H * scale), ...hair }}
      >
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
function Cell({
  def,
  variant,
  extra,
  scale,
  mode,
  theme,
  emphasis,
  detail,
  name,
  note,
  tags,
  isNew,
  onOpen,
}: {
  def: WidgetDef
  variant: Variant
  extra: number
  scale: number
  mode: Mode
  theme: CoachTheme
  emphasis: Emphasis
  detail: Detail
  name: string
  note?: string
  tags?: string[]
  isNew?: boolean
  onOpen: () => void
}) {
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
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border text-[0.8125rem] transition-colors duration-150 hover:bg-(--c-on)",
        compact ? "w-8 justify-center" : "px-2.5",
        t2,
        "hover:text-(--c-t1)",
        FOCUS,
      )}
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
export function Pane({
  def,
  variant,
  h,
  scale,
  mode,
  theme,
  emphasis,
  detail,
  fill,
  fixed = fill,
  props,
  scope: own,
}: {
  def: WidgetDef
  variant: string
  h: number
  scale: number
  mode: Mode
  theme: CoachTheme
  emphasis: Emphasis
  detail: Detail
  fill?: boolean
  /** The box sets the height (a grid cell), so the card may size itself by it; false for a phone's column. */ fixed?: boolean
  /** The widget's own settings; empty shows its sample content. */ props?: Record<string, string | boolean>
  /** The class its theme's CSS is scoped to, when not the library's own (another template's). */ scope?: string
}) {
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
    if (this.state.error)
      return (
        <div className="grid h-full place-items-center rounded-[4px] border border-dashed border-[#fa4d56] p-3 text-xs text-[#fa4d56]">
          {this.props.name} crashed: {this.state.error}
        </div>
      )
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
