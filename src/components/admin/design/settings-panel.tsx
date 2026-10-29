"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Image as ImageIcon, LayoutDashboard, LayoutGrid, Monitor, Palette, PanelLeftIcon, RotateCcw, Search, Smartphone, Square, Tablet, TriangleAlert, Type, Wand2, X } from "@/components/icons"
import type { ThemeDraft } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { widgetFinishOf, type CoachTheme } from "@/lib/theme/types"
import { DesignField, useDesign } from "./design-fields"
import { ChartPanelField, FOCUS, HeaderPartsField, LogoColoursField, NumbersField, StylePresetField, SurfaceField } from "./settings-fields"

/**
 * The theme editor's panel, one for the admin's Design and the library's
 * theme editor, so both work the same way: an icon rail of sections on the
 * left, each section's settings in small groups on the right. A group knows
 * which theme settings it holds, so it shows "changed" and resets just
 * itself; one search finds any setting in every section. Drawn in shadcn
 * tokens, so it takes the host's look (the admin's dark, the library's
 * chrome through `.lab-ui`).
 */

export type SettingsGroup = { title: string; note?: string; fields: string[]; keys: (keyof ThemeDraft)[]; words: string }
/** A section: groups of fields, or its own content (the admin's Look, Menu and Pages). */
export type SettingsTab = { id: string; label: string; icon: React.ReactNode; blurb?: string; groups?: SettingsGroup[]; content?: React.ReactNode }

/** The theme's settings, by section. Hosts add their own groups (identity, dark colours) and sections around these. */
export const THEME_GROUPS = {
  colour: [
    { title: "Brand", fields: ["primary", "highlight", "logo-colours"], keys: ["primary", "primaryForeground", "highlight"], words: "brand colour accent highlight buttons links badges logo" },
    { title: "Profit and loss", fields: ["trading"], keys: ["trading"], words: "profit loss green red trading numbers" },
  ],
  type: [
    { title: "Fonts", fields: ["fonts"], keys: ["fonts"], words: "font pair typeface heading text serif mono" },
    { title: "Headings and labels", fields: ["heading-weight", "labels"], keys: ["headingWeight", "labelStyle"], words: "weight bold uppercase caps small labels" },
    { title: "Numbers", fields: ["numbers"], keys: ["figureStyle", "widgetFont"], words: "figures numbers headline mono display marked font" },
  ],
  shape: [
    { title: "Corners and buttons", fields: ["corners", "buttons"], keys: ["radius", "buttonShape"], words: "radius round square pill corners buttons" },
    { title: "Depth", fields: ["effects", "borders"], keys: ["effects", "borders"], words: "brand depth borders outline flat shadow" },
    { title: "Spacing", fields: ["density"], keys: ["density"], words: "density compact comfortable airy spacing" },
  ],
  widgets: [
    { title: "Look", note: "A starting point for every setting below", fields: ["widget-look"], keys: ["widgetStyle"], words: "widget style look instrument soft editorial preset" },
    {
      title: "Card",
      note: "How each widget sits on the page",
      fields: ["widget-surface", "chart-panels"],
      keys: ["widgetSet", "cardSurface", "shadow", "panelStyle"],
      words: "cards sheet open surface raised grey outline shadow chart panels background",
    },
    { title: "Header", fields: ["header-form", "header-parts"], keys: ["headerForm", "widgetHeader"], words: "header title icon description value chip names" },
    { title: "Charts", fields: ["chart-style"], keys: ["chartStyle"], words: "bars gauges ticks solid thin blocks dots charts" },
    { title: "Finish", fields: ["widget-finish"], keys: ["widgetFinish"], words: "finish corners grid crosses" },
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
const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; blurb?: string }[] = [
  { id: "brand", label: "Brand", icon: <Palette />, blurb: "Your name, logo and colours." },
  { id: "look", label: "Look", icon: <Wand2 />, blurb: "A ready-made look to start from. Your colours and logo stay." },
  { id: "type", label: "Type", icon: <Type /> },
  { id: "shape", label: "Shape", icon: <Square /> },
  { id: "widgets", label: "Widgets", icon: <LayoutGrid /> },
  { id: "page", label: "Page", icon: <ImageIcon /> },
  { id: "menu", label: "Menu", icon: <PanelLeftIcon />, blurb: "What the menu shows and what you call things." },
  { id: "pages", label: "Pages", icon: <LayoutDashboard />, blurb: "What's on each page." },
]
/** The theme sections' settings unless a host gives its own. */
const DEFAULT_GROUPS: Partial<Record<SectionId, SettingsGroup[]>> = { brand: THEME_GROUPS.colour, type: THEME_GROUPS.type, shape: THEME_GROUPS.shape, widgets: THEME_GROUPS.widgets, page: THEME_GROUPS.page }
/** The menu's look: the part of Menu that belongs to the theme. */
export const MENU_LOOK: SettingsGroup = { title: "Menu layout", fields: ["nav-layout", "nav-frame", "nav-style", "nav-logo"], keys: ["nav"], words: "menu navigation sidebar top bar logo frame floating" }

/**
 * The tabs for an editor: every section in the standard order; `only` keeps
 * some (the wizard's Fine-tune), and each part can give its groups, its own
 * content or a different line under the title.
 */
export function designTabs(parts: Partial<Record<SectionId, Pick<SettingsTab, "groups" | "content" | "blurb">>>, only?: SectionId[]): SettingsTab[] {
  return SECTIONS.filter((s) => !only || only.includes(s.id)).map((s) => ({ id: s.id, label: s.label, icon: s.icon, blurb: s.blurb, groups: DEFAULT_GROUPS[s.id], ...parts[s.id] }))
}

/** Fields drawn by the panel itself instead of from the Design fields; hosts can add their own. */
const OWN: Record<string, () => React.ReactNode> = {
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
  "widget-finish": (t) => (widgetFinishOf(t) === "corners" && t.radius > 4 ? "Corner brackets show on square cards: set Corners to 4px or less (Shape)." : undefined),
}

/** What a setting changes when it isn't plain from its name: shown under it, without dimming it. */
const ABOUT: Record<string, string> = {
  effects: "Shades brand-coloured cards, like the Star widget on a page.",
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

  return (
    <div className="flex min-h-0 flex-1">
      {/* The sections, as an icon rail: always in view, one click each. */}
      <nav aria-label="Settings" className="flex w-[4.5rem] shrink-0 flex-col gap-1 overflow-y-auto border-r p-2 [scrollbar-width:none]">
        {tabs.map((t) => {
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
                "group relative grid justify-items-center gap-1.5 rounded-lg px-1 pt-2.5 pb-2 text-[0.6875rem] leading-3.5 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
                FOCUS,
                on ? "bg-muted font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {/* A short bar on the left edge marks the open section. */}
              <span aria-hidden className={cn("absolute top-1/2 -left-2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground transition-opacity duration-150", on ? "opacity-100" : "opacity-0")} />
              <span className={cn("grid size-[1.125rem] place-items-center transition-transform duration-150 ease-out [&_svg]:size-[1.125rem]", !on && "group-hover:-translate-y-px")}>{t.icon}</span>
              <span className="max-w-full truncate">{t.label}</span>
              {dirty && <span aria-label="changed" className="absolute top-1.5 right-2 size-1.5 rounded-full bg-muted-foreground" />}
            </button>
          )
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* The section's name, or a search across every section. */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b pr-1.5 pl-4">
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
            <h2 className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-foreground">{current.label}</h2>
          )}
          <IconButton label={searching ? "Close search" : "Find a setting"} onClick={() => (setSearching(!searching), setQ(""))}>
            {searching ? <X className="size-4" /> : <Search className="size-4" />}
          </IconButton>
        </div>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto" {...bodyProps}>
          {term ? (
            found.length ? (
              found.map(([t, g]) => <Group key={`${t.id}/${g.title}`} group={g} section={t.label} draft={draft} onReset={onReset} fields={fields} />)
            ) : (
              <p className="px-4 py-6 text-[0.8125rem] text-muted-foreground">No setting matches “{q}”.</p>
            )
          ) : (
            <>
              {current.blurb && <p className="border-b px-4 py-2.5 text-xs text-muted-foreground">{current.blurb}</p>}
              {current.content ?? current.groups?.map((g) => <Group key={g.title} group={g} draft={draft} onReset={onReset} fields={fields} />)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Group({ group: g, section, draft, onReset, fields }: { group: SettingsGroup; section?: string; draft: ThemeDraft; onReset: (keys: (keyof ThemeDraft)[]) => void; fields: Record<string, () => React.ReactNode> }) {
  const { theme } = useDesign()
  const dirty = changedIn(draft, g.keys)
  return (
    <section className="grid gap-4 border-b px-4 pt-4 pb-5 last:border-b-0">
      <div className="flex h-6 items-center gap-2">
        <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {section && <span className="font-normal">{section} · </span>}
          {g.title}
        </h3>
        {dirty && <span className="size-1.5 rounded-full bg-muted-foreground" />}
        <span className="flex-1" />
        {dirty && (
          <button type="button" onClick={() => onReset(g.keys)} className={cn("flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground", FOCUS)}>
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </div>
      {g.note && <p className="-mt-2 text-xs text-muted-foreground">{g.note}</p>}
      {g.fields.map((f) => {
        const Own = fields[f]
        const idle = IDLE[f]?.(theme) ?? ABOUT[f]
        return (
          <div key={f} className="grid gap-1.5">
            <div className={cn("grid gap-4", IDLE[f]?.(theme) && "opacity-55")}>{Own ? <Own /> : <DesignField id={f} />}</div>
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
