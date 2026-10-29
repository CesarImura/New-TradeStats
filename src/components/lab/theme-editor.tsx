"use client"

import { Check, Columns3, Download, LayoutTemplate, MoreHorizontal, Redo2, RotateCcw, Search, Shuffle, TriangleAlert, Undo2, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DesignField, DesignProvider, useDesign } from "@/components/admin/design/design-fields"
import { getDemoCoach } from "@/lib/data/coaches"
import type { Overrides, ThemeDraft } from "@/lib/prototype-store"
import { auditTheme } from "@/lib/theme/contrast"
import { resolveCoach } from "@/lib/theme/resolve"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { CAN_SAVE_TEMPLATE } from "@/components/admin/design/save-template"
import { toast } from "sonner"
import { widgetHeaderOf, type CoachTheme, type Mode, type TemplateId, type WidgetHeader } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS } from "./lab-controls"
import { BASES, exportTheme, mergeDraft, resolveLab, saveTheme, setCompared, type LabThemeEntry, type LabThemes } from "./lab-themes"
import { DarkColoursField, EntryContext, LogoColoursField, NumbersField, shuffled, StylePresetField } from "./theme-editor-fields"
import { MenuAction, PANEL, panelStyle, ThemeChip, useDismiss } from "./theme-switcher"

const coach = resolveCoach(getDemoCoach("northline")!)

/**
 * The editor's settings: the Design editor's own fields (the ones a coach
 * uses), sorted into five tabs and small groups. Each group knows which
 * theme settings it holds, so it can say "changed" and reset just itself;
 * `words` is what the settings search matches beyond the titles.
 */
type Group = { title: string; note?: string; fields: string[]; keys: (keyof ThemeDraft)[]; words: string }
const TABS: { id: string; label: string; groups: Group[] }[] = [
  {
    id: "colour",
    label: "Colour",
    groups: [
      { title: "Brand", fields: ["primary", "highlight", "lab-logo"], keys: ["primary", "primaryForeground", "highlight"], words: "brand colour accent highlight buttons links badges logo" },
      { title: "Dark mode", note: "Use other brand colours when the page is dark", fields: ["lab-dark"], keys: [], words: "dark mode night colours brand highlight" },
      { title: "Profit and loss", fields: ["trading"], keys: ["trading"], words: "profit loss green red trading numbers" },
    ],
  },
  {
    id: "type",
    label: "Type",
    groups: [
      { title: "Fonts", fields: ["fonts"], keys: ["fonts"], words: "font pair typeface heading text serif mono" },
      { title: "Headings and labels", fields: ["heading-weight", "labels"], keys: ["headingWeight", "labelStyle"], words: "weight bold uppercase caps small labels" },
      { title: "Numbers", fields: ["lab-numbers"], keys: ["figureStyle", "widgetFont"], words: "figures numbers headline mono display marked font" },
    ],
  },
  {
    id: "shape",
    label: "Shape",
    groups: [
      { title: "Corners and buttons", fields: ["corners", "buttons"], keys: ["radius", "buttonShape"], words: "radius round square pill corners buttons" },
      { title: "Depth", fields: ["shadows", "effects", "borders"], keys: ["shadow", "effects", "borders"], words: "shadow brand depth borders outline flat" },
      { title: "Spacing", fields: ["density"], keys: ["density"], words: "density compact comfortable airy spacing" },
    ],
  },
  {
    id: "widgets",
    label: "Widgets",
    groups: [
      { title: "Look", note: "A starting point for every setting below", fields: ["lab-style"], keys: ["widgetStyle"], words: "widget style look instrument soft editorial preset" },
      { title: "Surfaces", fields: ["widget-set", "card-surface", "panel-style"], keys: ["widgetSet", "cardSurface", "panelStyle"], words: "cards sheet open surface grey outline chart panels" },
      { title: "Header", fields: ["header-form", "lab-header-parts"], keys: ["headerForm", "widgetHeader"], words: "header title icon description value chip names" },
      { title: "Charts", fields: ["chart-style"], keys: ["chartStyle"], words: "bars gauges ticks solid thin blocks dots charts" },
      { title: "Star and finish", fields: ["star-style", "widget-finish"], keys: ["starStyle", "widgetFinish"], words: "star inverted finish corners grid crosses" },
    ],
  },
  {
    id: "page",
    label: "Page",
    groups: [
      {
        title: "Background",
        note: "Shows behind the widgets on Layouts",
        fields: ["background"],
        keys: ["background", "bgImage", "bgDim", "bgBlur", "bgWhere", "bgAngle"],
        words: "background image gradient grid glow dots plain",
      },
    ],
  },
]

/** The four header parts as toggle chips: one compact row instead of four switches with captions. */
const PARTS: { key: keyof WidgetHeader; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "The small icon before the title" },
  { key: "title", label: "Title", hint: "The widget's name" },
  { key: "description", label: "Description", hint: "The grey line under the title" },
  { key: "value", label: "Value", hint: "The figure on the right, like “58% win”" },
]
function HeaderPartsField() {
  const { theme, change } = useDesign()
  const on = widgetHeaderOf(theme)
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-(--c-t2)">Show in every widget’s header</span>
      <div className="flex flex-wrap gap-1.5">
        {PARTS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={on[p.key]}
            title={p.hint}
            onClick={() => change({ theme: { widgetHeader: { [p.key]: !on[p.key] } } }, `header-${p.key}`)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-150",
              CONTROL_FOCUS,
              on[p.key] ? "border-transparent bg-(--c-t1) text-(--c-page)" : "text-(--c-t2) hover:text-(--c-t1)",
            )}
            style={on[p.key] ? undefined : { borderColor: "var(--c-hair)" }}
          >
            {on[p.key] && <Check className="size-3" strokeWidth={3} />}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
/** Fields drawn here instead of from the Design editor. */
const OWN: Record<string, () => React.ReactNode> = { "lab-header-parts": HeaderPartsField, "lab-numbers": NumbersField, "lab-style": StylePresetField, "lab-logo": LogoColoursField, "lab-dark": DarkColoursField }

const changedIn = (draft: ThemeDraft, keys: (keyof ThemeDraft)[]) => keys.some((k) => draft[k] !== undefined)
const without = (draft: ThemeDraft, keys: (keyof ThemeDraft)[]) => {
  const next = { ...draft }
  for (const k of keys) delete next[k]
  return next
}

/**
 * The shadcn tokens the Design editor's fields are drawn with, mapped onto
 * the library's own chrome, so the editor looks like the library and not
 * like the theme it edits. `:root:has(.lab-ui)` reaches the colour picker,
 * which opens outside the panel.
 */
export const labUiCss = (c: Record<string, string>) => {
  const v = `--background:${c["--c-side"]};--foreground:${c["--c-t1"]};--card:${c["--c-bar"]};--card-foreground:${c["--c-t1"]};--popover:${c["--c-bar"]};--popover-foreground:${c["--c-t1"]};--muted:${c["--c-on"]};--muted-foreground:${c["--c-t2"]};--accent:${c["--c-on"]};--accent-foreground:${c["--c-t1"]};--border:${c["--c-hair"]};--input:${c["--c-hair"]};--ring:${c["--c-t2"]};--primary:${c["--c-t1"]};--primary-foreground:${c["--c-page"]};--secondary:${c["--c-on"]};--secondary-foreground:${c["--c-t1"]};--ts-interactive:${c["--c-t1"]};--radius:0.5rem;--coach-font-label:var(--ff-geist);--coach-font-body:var(--ff-geist);font-family:var(--ff-geist)`
  return `:root:has(.lab-ui){${v}}.lab-ui{${v};color:var(--foreground)}`
}

/**
 * Edit a theme made in the library, live: the library behind shows it as you
 * change it, and it saves on every change. Undo and redo (⌘Z, ⇧⌘Z) step
 * through this session's changes; each group resets on its own.
 */
export function ThemeEditor({ entry, lab, mode, onClose, onCompare }: { entry: LabThemeEntry; lab: LabThemes; mode: Mode; onClose: () => void; onCompare: () => void }) {
  const [tab, setTab] = useState("colour")
  const [q, setQ] = useState("")
  const [searching, setSearching] = useState(false)
  // This session's history, oldest first; `at` is the step shown.
  const [hist, setHist] = useState<{ steps: ThemeDraft[]; at: number; key: string | null; time: number }>({ steps: [entry.draft], at: 0, key: null, time: 0 })
  const draft = entry.draft
  const theme: CoachTheme = useMemo(() => resolveLab(entry, mode), [entry, mode])
  const checks = auditTheme(theme, { fixes: true })
  const fails = checks.filter((c) => !c.pass)

  const apply = (next: ThemeDraft, key: string | null) => {
    saveTheme({ ...entry, draft: next })
    setHist((h) => {
      const now = Date.now()
      // A slider drag or typing is one step: the same setting again within a moment replaces the last step.
      const merge = key !== null && key === h.key && now - h.time < 800 && h.at === h.steps.length - 1 && h.at > 0
      const base = h.steps.slice(0, h.at + (merge ? 0 : 1))
      return { steps: [...base, next], at: base.length, key, time: now }
    })
  }
  const step = (by: number) => {
    const at = hist.at + by
    if (at < 0 || at >= hist.steps.length) return
    saveTheme({ ...entry, draft: hist.steps[at] })
    setHist({ ...hist, at, key: null })
  }
  const ctx = useMemo(
    () => ({
      coach,
      theme,
      working: { theme: draft, content: {} } as Overrides,
      change: (patch: Partial<Overrides>, key: string) => patch.theme && apply(mergeDraft(draft, patch.theme), key),
      commit: (next: Overrides, key: string) => apply(mergeDraft({}, next.theme), key),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, draft, hist],
  )

  // ⌘Z / ⇧⌘Z while the editor is open, unless typing in a field.
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]")
      if (typing || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      stepRef.current(e.shiftKey ? 1 : -1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const term = q.trim().toLowerCase()
  const shown = term ? TABS.flatMap((t) => t.groups.filter((g) => `${t.label} ${g.title} ${g.words}`.toLowerCase().includes(term))) : (TABS.find((t) => t.id === tab)?.groups ?? [])
  const changes = Object.keys(draft).filter((k) => k !== "primaryForeground").length
  const baseName = BASES.find((b) => b.id === entry.base)?.label ?? entry.base

  return (
    <aside
      aria-label={`Edit ${entry.name}`}
      className="lab-ui fixed top-14 right-0 bottom-0 z-30 flex w-full flex-col border-l shadow-[-16px_0_40px_-24px_rgb(0_0_0/0.35)] sm:w-[23rem] lg:top-0"
      style={{ borderColor: "var(--c-hair)", background: "var(--c-side)" }}
    >
      {/* Name and close; then history, readability and compare; then what it starts from. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 border-b px-4 pt-3 pb-4" style={{ borderColor: "var(--c-hair)" }}>
        <div className="flex items-center gap-2">
          <ThemeChip entry={entry} mode={mode} size={28} />
          <input
            value={entry.name}
            onChange={(e) => saveTheme({ ...entry, name: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && saveTheme({ ...entry, name: "Untitled theme" })}
            aria-label="Theme name"
            title="Rename"
            className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[0.9375rem] font-medium outline-none hover:border-(--c-hair) focus:border-(--c-t3)"
          />
          <Icon label="Close the editor (Esc)" onClick={onClose}>
            <X className="size-4" />
          </Icon>
        </div>
        <div className="flex items-center gap-0.5">
          <Icon label="Undo (⌘Z)" onClick={() => step(-1)} disabled={hist.at === 0}>
            <Undo2 className="size-4" />
          </Icon>
          <Icon label="Redo (⇧⌘Z)" onClick={() => step(1)} disabled={hist.at >= hist.steps.length - 1}>
            <Redo2 className="size-4" />
          </Icon>
          <Icon label={`Reset everything to ${baseName}`} onClick={() => apply({}, null)} disabled={!changes}>
            <RotateCcw className="size-4" />
          </Icon>
          <span className="min-w-0 flex-1 truncate pl-1.5 text-xs text-(--c-t3)">{changes ? `${changes} ${changes === 1 ? "change" : "changes"}` : "No changes"}</span>
          <Readability fails={fails} total={checks.length} />
          <Icon label="Shuffle: a random look on top of this theme (your colours stay)" onClick={() => apply(mergeDraft(draft, shuffled(theme)), null)}>
            <Shuffle className="size-4" />
          </Icon>
          <MoreMenu
            entry={entry}
            baseName={baseName}
            onCompare={() => {
              setCompared([entry.id, entry.base])
              onCompare()
            }}
          />
        </div>
        {/* What it starts from: switching keeps every change on top. */}
        <div className="grid gap-1.5">
          <span className="text-xs text-(--c-t3)">Starts from · your changes stay on top</span>
          <div role="radiogroup" aria-label="Starts from" className="grid h-9 grid-cols-4 gap-0.5 rounded-lg border p-[3px]" style={{ borderColor: "var(--c-hair)", background: "var(--c-page)" }}>
            {BASES.map((b) => (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={entry.base === b.id}
                onClick={() => saveTheme({ ...entry, base: b.id })}
                className={cn(
                  "h-full min-w-0 truncate rounded-md px-1.5 text-[0.8125rem] transition-colors duration-150",
                  CONTROL_FOCUS,
                  entry.base === b.id ? "bg-(--c-bar) font-medium text-(--c-t1) shadow-[0_0_0_1px_var(--c-hair),0_1px_2px_0_rgb(0_0_0/0.1)]" : "text-(--c-t2) hover:text-(--c-t1)",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Browse by tab, or search every setting. */}
      <div className="flex items-center gap-1 border-b px-2" style={{ borderColor: "var(--c-hair)" }}>
        {searching ? (
          <label className="flex h-11 flex-1 items-center gap-2 px-2">
            <Search className="size-4 text-(--c-t3)" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setQ(""), setSearching(false))}
              placeholder="Find a setting…"
              aria-label="Find a setting"
              className="min-w-0 flex-1 bg-transparent text-[0.8125rem] outline-none placeholder:text-(--c-t3)"
            />
          </label>
        ) : (
          <div role="tablist" aria-label="Settings" className="flex min-w-0 flex-1 gap-4 overflow-x-auto px-2 [scrollbar-width:none]">
            {TABS.map((t) => {
              const dirty = t.groups.some((g) => changedIn(draft, g.keys))
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "-mb-px flex h-11 shrink-0 items-center gap-1.5 border-b-2 text-[0.8125rem] transition-colors duration-150",
                    CONTROL_FOCUS,
                    tab === t.id ? "border-(--c-t1) font-medium text-(--c-t1)" : "border-transparent text-(--c-t2) hover:text-(--c-t1)",
                  )}
                >
                  {t.label}
                  {dirty && <span aria-label="changed" className="size-1.5 rounded-full bg-(--c-t2)" />}
                </button>
              )
            })}
          </div>
        )}
        <Icon label={searching ? "Close search" : "Find a setting"} onClick={() => (setSearching(!searching), setQ(""))}>
          {searching ? <X className="size-4" /> : <Search className="size-4" />}
        </Icon>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <EntryContext.Provider value={entry}>
          <DesignProvider value={ctx}>
            {shown.length === 0 && <p className="px-4 py-6 text-[0.8125rem] text-(--c-t3)">No setting matches “{q}”.</p>}
            {shown.map((g) => {
              const dirty = changedIn(draft, g.keys)
              return (
                <section key={g.title} className="grid gap-4 border-b px-4 pt-4 pb-5 last:border-b-0" style={{ borderColor: "var(--c-hair)" }}>
                  <div className="flex h-6 items-center gap-2">
                    <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-(--c-t3) uppercase">{g.title}</h3>
                    {dirty && <span className="size-1.5 rounded-full bg-(--c-t2)" />}
                    <span className="flex-1" />
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => apply(without(draft, g.keys), null)}
                        className={cn("flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-(--c-t2) hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
                      >
                        <RotateCcw className="size-3" /> Reset
                      </button>
                    )}
                  </div>
                  {g.note && <p className="-mt-2 text-xs text-(--c-t3)">{g.note}</p>}
                  {g.fields.map((f) => {
                    const Own = OWN[f]
                    return Own ? <Own key={f} /> : <DesignField key={f} id={f} />
                  })}
                </section>
              )
            })}
          </DesignProvider>
        </EntryContext.Provider>
      </div>
      <p className="border-t px-4 py-2.5 text-xs text-(--c-t3)" style={{ borderColor: "var(--c-hair)" }}>
        Saved in this browser · follows the light/dark switch
      </p>
    </aside>
  )
}

/** The theme's colour pairs against WCAG AA: a small pill, the failing pairs listed under it on click. */
function Readability({ fails, total }: { fails: { id: string; label: string; ratio: number; min: number }[]; total: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => setOpen(false))
  const bad = fails.length > 0
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title={bad ? "Colour pairs under WCAG AA" : `All ${total} colour pairs pass WCAG AA`}
        className={cn("flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-150 hover:bg-(--c-on)", CONTROL_FOCUS)}
        style={{ borderColor: bad ? "color-mix(in oklab, #cf222e 50%, var(--c-hair))" : "var(--c-hair)", color: bad ? "#cf222e" : "var(--c-t2)" }}
      >
        {bad ? <TriangleAlert className="size-3.5" /> : <Check className="size-3.5" />}
        {bad ? `${fails.length} hard to read` : "Readable"}
      </button>
      {open && (
        <div className={cn(PANEL, "top-9 right-0 w-64 gap-2 p-3")} style={panelStyle}>
          <p className="text-[0.8125rem]">{bad ? `${fails.length} of ${total} colour pairs are under WCAG AA` : `All ${total} colour pairs pass WCAG AA, in this mode.`}</p>
          {bad && (
            <ul className="grid gap-1 text-xs text-(--c-t2)">
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

/** Less frequent actions: compare with the base, export, and write it into a template. */
function MoreMenu({ entry, baseName, onCompare }: { entry: LabThemeEntry; baseName: string; onCompare: () => void }) {
  const [open, setOpen] = useState(false)
  const [tpl, setTpl] = useState<TemplateId | null>(null)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => (setOpen(false), setTpl(null)))
  const save = async (id: TemplateId) => {
    setSaving(true)
    try {
      const theme = resolveLab(entry, TEMPLATES[id].theme.mode)
      const res = await fetch("/api/dev/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: entry.name, theme, pages: TEMPLATES[id].pages }) })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error ?? res.statusText)
      toast.success(`${entry.name} is now the ${TEMPLATES[id].name} template`, { description: `Its look, with ${TEMPLATES[id].name}'s pages · ${out.file}` })
      setOpen(false)
      setTpl(null)
    } catch (e) {
      toast.error("Couldn't save the template", { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div ref={ref} className="relative">
      <Icon label="More" onClick={() => setOpen(!open)}>
        <MoreHorizontal className="size-4" />
      </Icon>
      {open && (
        <div role="menu" className={cn(PANEL, "top-10 right-0 w-64")} style={panelStyle}>
          {tpl ? (
            <div className="grid gap-2 p-2">
              <p className="text-sm">Replace the {TEMPLATES[tpl].name} template with this look?</p>
              <p className="text-[0.8125rem] text-(--c-t2)">Its pages stay. This writes the template file in the code (git keeps the old one), so every new coach starting from {TEMPLATES[tpl].name} gets it.</p>
              <div className="flex gap-1.5">
                <button type="button" disabled={saving} onClick={() => save(tpl)} className={cn("h-8 flex-1 rounded-lg bg-(--c-t1) px-3 text-sm font-medium text-(--c-page) disabled:opacity-50", CONTROL_FOCUS)}>
                  {saving ? "Saving…" : "Replace"}
                </button>
                <button type="button" onClick={() => setTpl(null)} className={cn("h-8 flex-1 rounded-lg border px-3 text-sm hover:bg-(--c-on)", CONTROL_FOCUS)} style={{ borderColor: "var(--c-hair)" }}>
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <MenuAction icon={<Columns3 className="size-4" />} label={`Compare with ${baseName}`} onClick={() => (setOpen(false), onCompare())} />
              <MenuAction icon={<Download className="size-4" />} label="Export as a file" onClick={() => (setOpen(false), exportTheme(entry))} />
              {CAN_SAVE_TEMPLATE && (
                <>
                  <div className="my-1 h-px" style={{ background: "var(--c-hair)" }} />
                  <span className="px-2.5 pt-1 pb-0.5 text-[0.6875rem] font-medium tracking-wide text-(--c-t3) uppercase">Make it a template</span>
                  {TEMPLATE_IDS.map((id) => (
                    <MenuAction key={id} icon={<LayoutTemplate className="size-4" />} label={`Replace ${TEMPLATES[id].name}…`} onClick={() => setTpl(id)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Icon({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1) disabled:opacity-35 disabled:hover:bg-transparent",
        CONTROL_FOCUS,
      )}
    >
      {children}
    </button>
  )
}
