"use client"

import { Check, ListChecks, Pencil, Plus, Search, X } from "lucide-react"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import type { WidgetDef } from "@/components/lab/reui-widgets/registry"
import { themeToCss } from "@/lib/theme/css"
import type { Mode } from "@/lib/theme/types"
import type { Detail, Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS, LabButton, LabSeg } from "./lab-controls"
import { colourOf, resolveLab, setCompared, setPicked, type LabThemeEntry, type LabThemes } from "./lab-themes"
import { PANEL, PanelHeading, panelStyle, ThemeChip, ThemeRow, useDismiss } from "./theme-switcher"
import { colsOf, LIBRARY, meaningFor, Pane, px, rowsOf, rowsPx } from "./widget-base"

export type CompareSource = "view" | "picked"

/** The narrowest a theme's column gets before the comparison scrolls sideways. */
const MIN_COL = 260
const MAX_THEMES = 8

/**
 * Compare: the same widgets under several themes, one column per theme and
 * one row per widget layout, rows aligned so a difference reads across. Each
 * cell is the theme's own page colour, so the whole theme shows, not just the
 * card. The library's light/dark switch applies to every column.
 */
export function CompareView({
  lab,
  mode,
  rows,
  scale,
  emphasis,
  detail,
  onEdit,
  stickyHeaders = true,
}: {
  /** Off inside a scrolling box (the widget modal), where a sticky header would sit too low. */
  stickyHeaders?: boolean
  lab: LabThemes
  mode: Mode
  rows: [WidgetDef, string][]
  scale: number
  emphasis: Emphasis
  detail: Detail
  onEdit: (id: string) => void
}) {
  const themes = lab.compared
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const n = Math.max(themes.length, 1)
  const gap = 12
  const col = Math.max(MIN_COL, (width - gap * (n - 1)) / n)
  // Too many themes for the screen: the comparison scrolls sideways, and its headers stop following the page (a sideways scroller would trap them).
  const wide = n * MIN_COL + gap * (n - 1) > width
  const css = useMemo(() => themes.map((t) => themeToCss(resolveLab(t, mode), `.cmp-${t.id}`) + meaningFor(colourOf(t), mode, `.cmp-${t.id}`)).join(""), [themes, mode])
  const remove = (id: string) => setCompared(themes.map((t) => t.id).filter((x) => x !== id))

  if (!themes.length) return <Empty text="No themes to compare. Add two or more from the bar above." />
  if (!rows.length) return <Empty text="No widgets to compare. Pick some, or choose a category in the sidebar." />

  const grid = { gridTemplateColumns: `repeat(${n}, ${col}px)`, columnGap: gap }
  return (
    <div ref={ref} className="grid min-w-0 pb-16">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={cn("-mx-1 px-1 pb-2", wide && "overflow-x-auto")}>
        <div className="grid w-max min-w-full gap-y-2" style={grid}>
          {/* One header per theme; it stays in view while the rows scroll. */}
          {themes.map((t) => (
            <div
              key={t.id}
              className={cn("z-[5] flex h-12 min-w-0 items-center gap-2.5 rounded-xl border px-3", !wide && stickyHeaders && "sticky top-[7.5rem] lg:top-[4.25rem]")}
              style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}
            >
              <ThemeChip entry={t} mode={mode} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
              <button
                type="button"
                onClick={() => lab.pick(t.id)}
                className={cn("h-7 rounded-md px-2 text-[0.8125rem] transition-colors duration-150", CONTROL_FOCUS, lab.active.id === t.id ? "text-(--c-t3)" : "text-(--c-t2) hover:bg-(--c-on) hover:text-(--c-t1)")}
                disabled={lab.active.id === t.id}
                title="Show the whole library in this theme"
              >
                {lab.active.id === t.id ? "In use" : "Use"}
              </button>
              <IconBtn label={`Edit ${t.name}`} onClick={() => onEdit(t.id)}>
                <Pencil className="size-3.5" />
              </IconBtn>
              <IconBtn label={`Remove ${t.name} from the comparison`} onClick={() => remove(t.id)}>
                <X className="size-3.5" />
              </IconBtn>
            </div>
          ))}
          {rows.map(([def, variant]) => {
            const label = def.variants.find((v) => v.value === variant)?.label
            const w = px(colsOf(def, variant))
            const h = rowsOf(def, variant)
            const fit = Math.min(1, (col - 40) / w)
            return (
              <div key={`${def.type}/${variant}`} className="contents">
                <div className="col-span-full mt-4 flex items-baseline gap-2 px-1 text-[0.8125rem]">
                  <span className="font-medium">{def.name}</span>
                  {def.variants.length > 1 && <span className="text-(--c-t3)">{label}</span>}
                </div>
                {themes.map((t) => (
                  <div
                    key={t.id}
                    className={cn(`cmp-${t.id}`, "grid place-items-center overflow-hidden rounded-xl border p-5")}
                    style={{ borderColor: "var(--c-hair)", background: "var(--background)", minHeight: Math.round(rowsPx(h) * fit * scale) + 40 }}
                  >
                    <Pane def={def} variant={variant} h={h} scale={fit * scale} mode={mode} theme={resolveLab(t, mode)} emphasis={emphasis} detail={detail} scope={`cmp-${t.id}`} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-xl border border-dashed px-6 py-12 text-sm text-(--c-t2)" style={{ borderColor: "var(--c-hair)" }}>
      {text}
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("grid size-7 shrink-0 place-items-center rounded-md text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
    >
      {children}
    </button>
  )
}

/**
 * Compare's controls, under the page heading: which themes (chips, add or
 * remove), which widgets (this view, or a picked set) and how many layouts.
 */
export function CompareBar({ lab, mode, source, onSource, viewCount }: { lab: LabThemes; mode: Mode; source: CompareSource; onSource: (s: CompareSource) => void; viewCount: number }) {
  return (
    <div className="mt-3 grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[0.8125rem] text-(--c-t3)">Themes</span>
        {lab.compared.map((t) => (
          <span key={t.id} className="flex h-8 items-center gap-1.5 rounded-full border pr-1 pl-1.5 text-[0.8125rem]" style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}>
            <ThemeChip entry={t} mode={mode} size={18} />
            {t.name}
            <button
              type="button"
              onClick={() => setCompared(lab.compared.map((x) => x.id).filter((x) => x !== t.id))}
              aria-label={`Remove ${t.name}`}
              className={cn("grid size-6 place-items-center rounded-full text-(--c-t3) hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <AddThemes lab={lab} mode={mode} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <LabSeg
          label="Widgets"
          value={source}
          onChange={onSource}
          options={[
            ["view", `This view · ${viewCount}`],
            ["picked", `Picked · ${lab.picked.length}`],
          ]}
        />
        <PickWidgets lab={lab} onPicked={() => onSource("picked")} />
      </div>
    </div>
  )
}

/** Add or remove themes from the comparison, from every theme there is. */
export function AddThemes({ lab, mode }: { lab: LabThemes; mode: Mode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => setOpen(false))
  const ids = lab.compared.map((t) => t.id)
  const toggle = (t: LabThemeEntry) => setCompared(ids.includes(t.id) ? ids.filter((x) => x !== t.id) : [...ids, t.id].slice(0, MAX_THEMES))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn("flex h-8 items-center gap-1.5 rounded-full border border-dashed px-3 text-[0.8125rem] text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
        style={{ borderColor: "var(--c-hair)" }}
      >
        <Plus className="size-3.5" /> Add theme
      </button>
      {open && (
        <div className={cn(PANEL, "left-0 max-h-[28rem] overflow-y-auto")} style={panelStyle}>
          <PanelHeading>Compare up to {MAX_THEMES}</PanelHeading>
          {lab.all.map((t) => (
            <ThemeRow key={t.id} role="menuitemcheckbox" entry={t} mode={mode} active={ids.includes(t.id)} onPick={() => toggle(t)} />
          ))}
          <div className="my-1 h-px" style={{ background: "var(--c-hair)" }} />
          <div className="flex gap-1.5 p-1">
            <SmallBtn onClick={() => setCompared(lab.all.slice(0, MAX_THEMES).map((t) => t.id))}>All themes</SmallBtn>
            <SmallBtn onClick={() => setCompared(lab.all.filter((t) => t.builtIn).map((t) => t.id))}>Starting points</SmallBtn>
            {lab.mine.length > 0 && <SmallBtn onClick={() => setCompared(lab.mine.slice(0, MAX_THEMES).map((t) => t.id))}>Mine</SmallBtn>}
          </div>
        </div>
      )}
    </div>
  )
}

/** Pick the widgets to compare: search, tick by category, all or none. */
function PickWidgets({ lab, onPicked }: { lab: LabThemes; onPicked: () => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => setOpen(false))
  const picked = new Set(lab.picked)
  const found = LIBRARY.filter((w) => !q || `${w.name} ${w.group}`.toLowerCase().includes(q.trim().toLowerCase()))
  const groups = [...new Set(found.map((w) => w.group as string))]
  const set = (types: string[]) => {
    setPicked(types)
    onPicked()
  }
  const toggle = (type: string) => set(picked.has(type) ? lab.picked.filter((x) => x !== type) : [...lab.picked, type])
  return (
    <div ref={ref} className="relative">
      <LabButton onClick={() => setOpen(!open)} label="Pick widgets" expanded={open}>
        <ListChecks className="size-4" />
      </LabButton>
      {open && (
        <div className={cn(PANEL, "left-0 w-[22rem] gap-1")} style={panelStyle}>
          <label className="m-1 flex h-9 items-center gap-2 rounded-lg border px-2.5" style={{ borderColor: "var(--c-hair)", background: "var(--c-page)" }}>
            <Search className="size-4 text-(--c-t3)" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a widget…"
              aria-label="Find a widget"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-(--c-t3)"
            />
          </label>
          <div className="flex gap-1.5 px-1">
            <SmallBtn onClick={() => set(LIBRARY.map((w) => w.type))}>All {LIBRARY.length}</SmallBtn>
            <SmallBtn onClick={() => set([])}>None</SmallBtn>
            <span className="flex-1" />
            <span className="self-center pr-1.5 text-xs text-(--c-t3) tabular-nums">{picked.size} picked</span>
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {groups.map((g) => {
              const items = found.filter((w) => w.group === g)
              const allOn = items.every((w) => picked.has(w.type))
              return (
                <div key={g} className="grid">
                  <button
                    type="button"
                    onClick={() => set(allOn ? lab.picked.filter((x) => !items.some((w) => w.type === x)) : [...new Set([...lab.picked, ...items.map((w) => w.type)])])}
                    className={cn("flex h-8 items-center justify-between rounded-lg px-2.5 text-[0.6875rem] font-medium tracking-wide text-(--c-t3) uppercase hover:text-(--c-t1)", CONTROL_FOCUS)}
                  >
                    {g}
                    <span className="normal-case">{allOn ? "Untick all" : "Tick all"}</span>
                  </button>
                  {items.map((w) => (
                    <button
                      key={w.type}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={picked.has(w.type)}
                      onClick={() => toggle(w.type)}
                      className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 hover:bg-(--c-on)", CONTROL_FOCUS)}
                    >
                      <span
                        className={cn("grid size-4 shrink-0 place-items-center rounded-[4px] border", picked.has(w.type) && "border-transparent bg-(--c-t1) text-(--c-page)")}
                        style={picked.has(w.type) ? undefined : { borderColor: "var(--c-t3)" }}
                      >
                        {picked.has(w.type) && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-7 rounded-md border px-2.5 text-[0.8125rem] text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
      style={{ borderColor: "var(--c-hair)" }}
    >
      {children}
    </button>
  )
}
