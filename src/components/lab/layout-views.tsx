"use client"

import { Copy, MoreHorizontal, Pencil, Plus, Redo2, Search, Trash2, Undo2, X } from "lucide-react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import ReactGridLayout from "react-grid-layout"
import { transformStrategy, verticalCompactor, type Layout, type PositionStrategy } from "react-grid-layout/core"
import { GridBackground } from "react-grid-layout/extras"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { toast } from "sonner"
import { CoachContext } from "@/components/coach/coach-provider"
import { WidgetFrame } from "@/components/widgets/kit"
import { PageRenderer } from "@/components/widgets/page-renderer"
import { getWidget } from "@/components/widgets/registry"
import { PageIdContext, PageTitleShownContext } from "@/components/widgets/shared"
import { getDemoCoach } from "@/lib/data/coaches"
import { DeviceSwitch } from "@/components/admin/design/settings-panel"
import { backdropStyle } from "@/lib/theme/backdrops"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach } from "@/lib/theme/resolve"
import { widgetFinishOf, widgetSetOf, type CoachTheme, type Mode } from "@/lib/theme/types"
import { COLS, GAP, ROW_HEIGHT, uid, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS, LabButton, LabSeg } from "./lab-controls"
import { createLayout, deleteLayout, duplicateLayout, restoreLayout, saveLayout, setComparedLayouts, type LabLayout, type LabLayouts } from "./lab-layouts"
import { colourOf, resolveLab, setCompared, type LabThemes } from "./lab-themes"
import { MenuAction, PANEL, PanelHeading, panelStyle, ThemeChip, ThemeRow, useDismiss } from "./theme-switcher"
import { LIBRARY, meaningFor } from "./widget-base"

const coach = resolveCoach(getDemoCoach("northline")!)

export type Device = "desktop" | "tablet" | "phone"
/** The page area's width on each device (the menu takes the rest of a desktop screen). */
const DEVICE_W: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }
const PAD: Record<Device, number> = { desktop: 32, tablet: 24, phone: 16 }

/** CSS for every theme a layout is shown in at once (Compare), each under its own class. */
const scopesCss = (lab: LabThemes, mode: Mode, prefix: string) => lab.all.map((t) => themeToCss(resolveLab(t, mode), `.${prefix}-${t.id}`) + meaningFor(colourOf(t), mode, `.${prefix}-${t.id}`)).join("")

/** Watches an element's width. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/**
 * A student page drawn from a layout in a theme, laid out at the device's
 * real width and zoomed to fit `fit` pixels (or its box), so the page reflows
 * exactly as it would on that screen.
 */
export function PagePreview({ layout, theme, scope, device = "desktop", fit, inert: still = true }: { layout: LabLayout; theme: CoachTheme; scope: string; device?: Device; fit?: number; inert?: boolean }) {
  const [ref, boxW] = useWidth<HTMLDivElement>()
  const logical = DEVICE_W[device]
  const target = fit ?? boxW
  const zoom = target ? Math.min(1, target / logical) : 0
  const ctx = useMemo(() => ({ coach, theme, base: "/c/northline", scope: `.${scope}`, preview: true }), [theme, scope])
  return (
    <div ref={ref} className="min-w-0">
      {zoom > 0 && (
        <CoachContext.Provider value={ctx}>
          <div
            inert={still}
            className={cn(scope, "overflow-hidden rounded-xl border", device === "phone" ? "mx-auto rounded-[28px]" : "mx-auto")}
            style={{ width: logical, zoom, background: "var(--background)", ...backdropStyle(theme), color: "var(--foreground)", fontFamily: "var(--coach-font-body)", borderColor: "var(--c-hair)", padding: PAD[device] }}
          >
            {layout.items.length ? (
              <PageRenderer layout={{ items: layout.items }} />
            ) : (
              <div className="grid h-60 place-items-center rounded-(--radius) border-2 border-dashed text-sm opacity-60" style={{ borderColor: "var(--border)" }}>
                An empty page
              </div>
            )}
          </div>
        </CoachContext.Provider>
      )}
    </div>
  )
}

/* ---------- All layouts ---------- */

/** Every layout as a card, drawn in the library's theme. Click to open; the menu edits, copies, compares or deletes. */
export function LayoutGallery({ layouts, theme, scope, onOpen, onEdit }: { layouts: LabLayouts; theme: CoachTheme; scope: string; onOpen: (id: string) => void; onEdit: (id: string) => void }) {
  const grid = "grid gap-x-5 gap-y-7 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]"
  const mine = layouts.all.filter((l) => !l.builtIn)
  const built = layouts.all.filter((l) => l.builtIn)
  return (
    <div className="grid gap-10 pb-16">
      <section className="grid gap-4">
        <Head title="My layouts" note={mine.length ? `${mine.length} in this browser` : "Saved in this browser only"} />
        <div className={grid}>
          <button
            type="button"
            onClick={() => onEdit(createLayout())}
            className={cn("grid min-h-[15rem] content-center justify-items-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors duration-150 hover:bg-(--c-on)", CONTROL_FOCUS)}
            style={{ borderColor: "var(--c-hair)" }}
          >
            <span className="grid size-10 place-items-center rounded-full border" style={{ borderColor: "var(--c-hair)" }}>
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-medium">New empty layout</span>
            <span className="max-w-[16rem] text-[0.8125rem] text-(--c-t2)">Or copy a template’s Home below and change it.</span>
          </button>
          {mine.map((l) => (
            <LayoutCard key={l.id} layout={l} layouts={layouts} theme={theme} scope={scope} onOpen={onOpen} onEdit={onEdit} />
          ))}
        </div>
      </section>
      <section className="grid gap-4">
        <Head title="Starting points" note="The templates’ Homes; editing one makes your own copy" />
        <div className={grid}>
          {built.map((l) => (
            <LayoutCard key={l.id} layout={l} layouts={layouts} theme={theme} scope={scope} onOpen={onOpen} onEdit={onEdit} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Head({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="text-sm font-medium">{title}</h2>
      <span className="text-[0.8125rem] text-(--c-t3)">{note}</span>
    </div>
  )
}

function LayoutCard({ layout, layouts, theme, scope, onOpen, onEdit }: { layout: LabLayout; layouts: LabLayouts; theme: CoachTheme; scope: string; onOpen: (id: string) => void; onEdit: (id: string) => void }) {
  return (
    <div className="group grid content-start gap-3">
      <div
        role="link"
        tabIndex={0}
        onClick={() => onOpen(layout.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(layout.id))}
        aria-label={`Open ${layout.name}`}
        className={cn("relative h-[15rem] cursor-pointer overflow-hidden rounded-xl border p-3 transition-colors duration-150 hover:bg-(--c-cell-on)", CONTROL_FOCUS)}
        style={{ borderColor: "var(--c-hair)", background: "var(--c-cell)" }}
      >
        <PagePreview layout={layout} theme={theme} scope={scope} />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12" style={{ background: "linear-gradient(transparent, var(--c-cell))" }} />
      </div>
      <div className="flex items-start gap-2.5 px-1">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[0.8125rem] font-medium">{layout.name}</span>
          <span className="text-xs text-(--c-t3)">
            {layout.builtIn ? "Starting point" : "Mine"} · {layout.items.length} {layout.items.length === 1 ? "widget" : "widgets"}
          </span>
        </div>
        <LayoutMenu layout={layout} layouts={layouts} onEdit={onEdit} />
      </div>
    </div>
  )
}

function LayoutMenu({ layout, layouts, onEdit }: { layout: LabLayout; layouts: LabLayouts; onEdit: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => (setOpen(false), setConfirm(false)))
  const close = (f: () => void) => () => {
    setOpen(false)
    setConfirm(false)
    f()
  }
  const ids = layouts.compared.map((l) => l.id)
  const compared = ids.includes(layout.id)
  const remove = () => {
    const gone = deleteLayout(layout.id)
    if (gone) toast(`Deleted ${gone.name}`, { action: { label: "Undo", onClick: () => restoreLayout(gone) } })
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`${layout.name}: more`}
        aria-expanded={open}
        className={cn("grid size-8 place-items-center rounded-lg text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS, open && "bg-(--c-on)")}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div role="menu" className={cn(PANEL, "top-9 right-0 w-56")} style={panelStyle}>
          {confirm ? (
            <div className="grid gap-2 p-2">
              <p className="text-sm">Delete {layout.name}?</p>
              <p className="text-[0.8125rem] text-(--c-t2)">You can undo it right after.</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={close(remove)} className={cn("h-8 flex-1 rounded-lg px-3 text-sm font-medium text-white", CONTROL_FOCUS)} style={{ background: "#cf222e" }}>
                  Delete
                </button>
                <button type="button" onClick={() => setConfirm(false)} className={cn("h-8 flex-1 rounded-lg border px-3 text-sm hover:bg-(--c-on)", CONTROL_FOCUS)} style={{ borderColor: "var(--c-hair)" }}>
                  Keep
                </button>
              </div>
            </div>
          ) : (
            <>
              <MenuAction icon={<Pencil className="size-4" />} label={layout.builtIn ? "Edit a copy" : "Edit"} onClick={close(() => onEdit(layout.id))} />
              <MenuAction icon={<Copy className="size-4" />} label="Duplicate" onClick={close(() => duplicateLayout(layout))} />
              <MenuAction
                icon={<Plus className="size-4" />}
                label={compared ? "Remove from layout compare" : "Add to layout compare"}
                onClick={close(() => setComparedLayouts(compared ? ids.filter((x) => x !== layout.id) : [...ids, layout.id]))}
              />
              {!layout.builtIn && <MenuAction icon={<Trash2 className="size-4" />} label="Delete…" onClick={() => setConfirm(true)} />}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- One layout ---------- */

export type LayoutCompare = "off" | "themes" | "layouts"

/**
 * One layout, full size: the page in the library's theme on a desktop, tablet
 * or phone, or compared, under several themes or beside other layouts.
 * Edit turns the page into a grid to arrange.
 */
export function LayoutView({
  layout,
  layouts,
  lab,
  mode,
  theme,
  scope,
  editing,
  compare,
  device,
}: {
  layout: LabLayout
  layouts: LabLayouts
  lab: LabThemes
  mode: Mode
  theme: CoachTheme
  scope: string
  editing: boolean
  compare: LayoutCompare
  device: Device
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  if (editing && !layout.builtIn) return <LayoutEditor key={layout.id} layout={layout} theme={theme} scope={scope} />
  const cols =
    compare === "themes"
      ? lab.compared.map((t) => ({ key: t.id, label: <ThemeLabel name={t.name} chip={<ThemeChip entry={t} mode={mode} />} />, layout, theme: resolveLab(t, mode), scope: `lyt-${t.id}` }))
      : compare === "layouts"
        ? layouts.compared.map((l) => ({ key: l.id, label: <span className="truncate text-sm font-medium">{l.name}</span>, layout: l, theme, scope }))
        : []
  const gap = 16
  const n = Math.max(cols.length, 1)
  const colW = Math.max(device === "phone" ? 200 : 240, (width - gap * (n - 1)) / n)
  return (
    <div ref={ref} className="grid min-w-0 gap-4 pb-16">
      {compare === "themes" && <style dangerouslySetInnerHTML={{ __html: scopesCss(lab, mode, "lyt") }} />}
      {compare === "off" ? (
        <PagePreview layout={layout} theme={theme} scope={scope} device={device} fit={Math.min(width, DEVICE_W[device])} />
      ) : cols.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-sm text-(--c-t2)" style={{ borderColor: "var(--c-hair)" }}>
          Nothing to compare yet. Add some above.
        </p>
      ) : (
        <div className={cn("-mx-1 px-1 pb-2", n * colW + gap * (n - 1) > width + 1 && "overflow-x-auto")}>
          <div className="grid w-max min-w-full gap-y-3" style={{ gridTemplateColumns: `repeat(${n}, ${colW}px)`, columnGap: gap }}>
            {cols.map((c) => (
              <div key={c.key} className="flex h-10 min-w-0 items-center gap-2 rounded-xl border px-3" style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}>
                {c.label}
              </div>
            ))}
            {cols.map((c) => (
              <div key={c.key} className="min-w-0">
                <PagePreview layout={c.layout} theme={c.theme} scope={c.scope} device={device} fit={colW} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeLabel({ name, chip }: { name: string; chip: React.ReactNode }) {
  return (
    <>
      {chip}
      <span className="truncate text-sm font-medium">{name}</span>
    </>
  )
}

/** The layout page's controls, under its heading: device, what to compare and with what. */
export function LayoutBar({
  layout,
  layouts,
  lab,
  mode,
  editing,
  onEditing,
  compare,
  onCompare,
  device,
  onDevice,
}: {
  layout: LabLayout
  layouts: LabLayouts
  lab: LabThemes
  mode: Mode
  editing: boolean
  onEditing: (on: boolean) => void
  compare: LayoutCompare
  onCompare: (c: LayoutCompare) => void
  device: Device
  onDevice: (d: Device) => void
}) {
  return (
    <div className="mt-3 grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {editing ? (
          <LabButton onClick={() => onEditing(false)} label="Done" pressed>
            <Pencil className="size-4" />
          </LabButton>
        ) : (
          <LabButton onClick={() => (layout.builtIn ? duplicateLayout(layout, `My ${layout.name}`) : null, onEditing(true))} label={layout.builtIn ? "Edit a copy" : "Edit"} hint="Arrange the widgets on the grid">
            <Pencil className="size-4" />
          </LabButton>
        )}
        {!editing && (
          <>
            {/* The same screen-size switch as the theme editor and the admin's Design (drawn in the library's chrome). */}
            <span className="lab-ui contents">
              <DeviceSwitch value={device} onChange={onDevice} />
            </span>
            <LabSeg
              label="Compare"
              value={compare}
              onChange={onCompare}
              options={[
                ["off", "Off"],
                ["themes", "Themes"],
                ["layouts", "Layouts"],
              ]}
            />
          </>
        )}
        {!layout.builtIn && (
          <input
            value={layout.name}
            onChange={(e) => saveLayout({ ...layout, name: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && saveLayout({ ...layout, name: "Untitled layout" })}
            aria-label="Layout name"
            title="Rename"
            className="h-9 w-56 rounded-lg border bg-transparent px-3 text-sm outline-none focus:border-(--c-t3)"
            style={{ borderColor: "var(--c-hair)" }}
          />
        )}
      </div>
      {!editing && compare === "themes" && (
        <Chips
          label="Themes"
          items={lab.compared.map((t) => ({ id: t.id, name: t.name, chip: <ThemeChip entry={t} mode={mode} size={18} /> }))}
          onRemove={(id) => setCompared(lab.compared.map((t) => t.id).filter((x) => x !== id))}
          add={(close) => (
            <>
              <PanelHeading>Show this layout in</PanelHeading>
              {lab.all.map((t) => {
                const ids = lab.compared.map((x) => x.id)
                return <ThemeRow key={t.id} role="menuitemcheckbox" entry={t} mode={mode} active={ids.includes(t.id)} onPick={() => setCompared(ids.includes(t.id) ? ids.filter((x) => x !== t.id) : [...ids, t.id])} />
              })}
              <Done onClick={close} />
            </>
          )}
        />
      )}
      {!editing && compare === "layouts" && (
        <Chips
          label="Layouts"
          items={layouts.compared.map((l) => ({ id: l.id, name: l.name }))}
          onRemove={(id) => setComparedLayouts(layouts.compared.map((l) => l.id).filter((x) => x !== id))}
          add={(close) => (
            <>
              <PanelHeading>Compare with</PanelHeading>
              {layouts.all.map((l) => {
                const ids = layouts.compared.map((x) => x.id)
                const on = ids.includes(l.id)
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => setComparedLayouts(on ? ids.filter((x) => x !== l.id) : [...ids, l.id])}
                    className={cn("flex h-9 items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm transition-colors duration-150", CONTROL_FOCUS, on ? "bg-(--c-on)" : "hover:bg-(--c-on)")}
                  >
                    <span className="truncate">{l.name}</span>
                    <span className="text-xs text-(--c-t3)">{l.items.length}</span>
                  </button>
                )
              })}
              <Done onClick={close} />
            </>
          )}
        />
      )}
    </div>
  )
}

function Done({ onClick }: { onClick: () => void }) {
  return (
    <>
      <div className="my-1 h-px" style={{ background: "var(--c-hair)" }} />
      <button type="button" onClick={onClick} className={cn("h-8 rounded-lg text-sm text-(--c-t2) hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}>
        Done
      </button>
    </>
  )
}

/** Removable chips with an Add button that opens a list. */
function Chips({ label, items, onRemove, add }: { label: string; items: { id: string; name: string; chip?: React.ReactNode }[]; onRemove: (id: string) => void; add: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => setOpen(false))
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[0.8125rem] text-(--c-t3)">{label}</span>
      {items.map((t) => (
        <span key={t.id} className={cn("flex h-8 items-center gap-1.5 rounded-full border pr-1 text-[0.8125rem]", t.chip ? "pl-1.5" : "pl-3")} style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}>
          {t.chip}
          {t.name}
          <button
            type="button"
            onClick={() => onRemove(t.id)}
            aria-label={`Remove ${t.name}`}
            className={cn("grid size-6 place-items-center rounded-full text-(--c-t3) hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={cn("flex h-8 items-center gap-1.5 rounded-full border border-dashed px-3 text-[0.8125rem] text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
          style={{ borderColor: "var(--c-hair)" }}
        >
          <Plus className="size-3.5" /> Add
        </button>
        {open && (
          <div className={cn(PANEL, "left-0 max-h-[28rem] overflow-y-auto")} style={panelStyle}>
            {add(() => setOpen(false))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Editing ---------- */

const scaled = (scale: number): PositionStrategy => ({ ...transformStrategy, scale })

/**
 * Arrange a layout on the real 12-column grid at desktop width, scaled to
 * fit: drag to move, drag an edge to resize, add from the list on the left,
 * remove or change a widget's layout from its tag. Saves on every change;
 * ⌘Z and ⇧⌘Z step back and forward.
 */
function LayoutEditor({ layout, theme, scope }: { layout: LabLayout; theme: CoachTheme; scope: string }) {
  const [area, areaW] = useWidth<HTMLDivElement>()
  // The canvas is scaled with a transform, which doesn't change its box: hold its scaled height for it.
  const canvas = useRef<HTMLDivElement>(null)
  const [canvasH, setCanvasH] = useState(0)
  useLayoutEffect(() => {
    const el = canvas.current
    if (!el) return
    const ro = new ResizeObserver(() => setCanvasH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const [selected, setSelected] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [q, setQ] = useState("")
  const [hist, setHist] = useState<{ steps: WidgetInstance[][]; at: number }>({ steps: [layout.items], at: 0 })
  const items = layout.items
  const gap = GAP[theme.density]
  const logical = DEVICE_W.desktop
  const scale = areaW ? Math.min(1, areaW / logical) : 1
  const gridW = logical - PAD.desktop * 2
  const ctx = useMemo(() => ({ coach, theme, base: "/c/northline", scope: `.${scope}`, preview: true }), [theme, scope])

  const save = (next: WidgetInstance[]) => {
    saveLayout({ ...layout, items: next })
    setHist((h) => ({ steps: [...h.steps.slice(0, h.at + 1), next], at: h.at + 1 }))
  }
  const step = (by: number) => {
    const at = hist.at + by
    if (at < 0 || at >= hist.steps.length) return
    saveLayout({ ...layout, items: hist.steps[at] })
    setHist({ ...hist, at })
  }
  const compacted = (list: WidgetInstance[]) => {
    const packed = verticalCompactor.compact(
      list.map((w) => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h })),
      COLS,
    )
    const pos = new Map(packed.map((g) => [g.i, g]))
    return list.map((w) => ({ ...w, x: pos.get(w.id)!.x, y: pos.get(w.id)!.y }))
  }
  const fromGrid = (grid: Layout) => {
    const pos = new Map(grid.map((g) => [g.i, g]))
    return items.map((w) => {
      const g = pos.get(w.id)
      return g ? { ...w, x: g.x, y: g.y, w: g.w, h: g.h } : w
    })
  }
  const add = (type: string) => {
    const def = getWidget(type)!
    const v = def.variants[0]
    const bottom = items.reduce((m, w) => Math.max(m, w.y + w.h), 0)
    const w: WidgetInstance = { id: uid(), type, variant: v.value, x: 0, y: bottom, w: Math.min(COLS, Math.max(v.minW, def.defaultW)), h: v.h }
    save([...items, w])
    setSelected(w.id)
  }
  const remove = (id: string) => {
    save(compacted(items.filter((w) => w.id !== id)))
    if (selected === id) setSelected(null)
  }
  const setVariant = (id: string, value: string) => {
    save(
      items.map((w) => {
        if (w.id !== id) return w
        const v = getWidget(w.type)?.variants.find((x) => x.value === value)
        return v ? { ...w, variant: value, h: Math.min(v.maxH, Math.max(v.minH, w.h)), w: Math.min(v.maxW, Math.max(v.minW, w.w)) } : w
      }),
    )
  }

  // ⌘Z / ⇧⌘Z, Delete removes the selected widget, Escape deselects.
  const keys = useRef({ step, remove, selected })
  useEffect(() => {
    keys.current = { step, remove, selected }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]")) return
      const k = keys.current
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        k.step(e.shiftKey ? 1 : -1)
      } else if ((e.key === "Delete" || e.key === "Backspace") && k.selected) {
        e.preventDefault()
        k.remove(k.selected)
      } else if (e.key === "Escape") setSelected(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const grid = items.map((w) => {
    const v = getWidget(w.type)?.variants.find((x) => x.value === w.variant) ?? getWidget(w.type)?.variants[0]
    return { i: w.id, x: w.x, y: w.y, w: w.w, h: w.h, minW: v?.minW ?? 2, minH: v?.minH ?? 1, maxW: v?.maxW ?? COLS, maxH: v?.maxH }
  })
  const rows = items.reduce((m, w) => Math.max(m, w.y + w.h), 0) + 4
  const term = q.trim().toLowerCase()
  const found = LIBRARY.filter((w) => !term || `${w.name} ${w.group}`.toLowerCase().includes(term))
  const groups = [...new Set(found.map((w) => w.group as string))]

  return (
    <div className="grid gap-4 pb-16 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Add widgets. */}
      <aside
        className="grid content-start gap-2 self-start rounded-xl border p-2 lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100svh-5.5rem)] lg:overflow-y-auto"
        style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}
      >
        <div className="flex items-center gap-1 px-1">
          <span className="flex-1 text-[0.8125rem] font-medium">Add a widget</span>
          <IconBtn label="Undo (⌘Z)" onClick={() => step(-1)} disabled={hist.at === 0}>
            <Undo2 className="size-4" />
          </IconBtn>
          <IconBtn label="Redo (⇧⌘Z)" onClick={() => step(1)} disabled={hist.at >= hist.steps.length - 1}>
            <Redo2 className="size-4" />
          </IconBtn>
        </div>
        <label className="flex h-8 items-center gap-2 rounded-lg border px-2.5" style={{ borderColor: "var(--c-hair)", background: "var(--c-page)" }}>
          <Search className="size-3.5 text-(--c-t3)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a widget…"
            aria-label="Find a widget"
            className="min-w-0 flex-1 bg-transparent text-[0.8125rem] outline-none placeholder:text-(--c-t3)"
          />
        </label>
        {groups.map((g) => (
          <div key={g} className="grid">
            <span className="px-2 pt-1.5 pb-0.5 text-[0.6875rem] font-medium tracking-wide text-(--c-t3) uppercase">{g}</span>
            {found
              .filter((w) => w.group === g)
              .map((w) => (
                <button
                  key={w.type}
                  type="button"
                  onClick={() => add(w.type)}
                  title={`Add ${w.name} at the bottom`}
                  className={cn("group/add flex h-8 items-center gap-2 rounded-lg px-2 text-left text-[0.8125rem] transition-colors duration-150 hover:bg-(--c-on)", CONTROL_FOCUS)}
                >
                  <span className="flex-1 truncate">{w.name}</span>
                  <Plus className="size-3.5 text-(--c-t3) opacity-0 group-hover/add:opacity-100" />
                </button>
              ))}
          </div>
        ))}
      </aside>

      {/* The page, as a grid. */}
      <div ref={area} className="min-w-0" onClick={() => setSelected(null)}>
        <p className="mb-3 text-[0.8125rem] text-(--c-t3)">Drag to move, drag an edge to resize. Click a widget to change its layout or remove it (Delete). Saved as you go.</p>
        <PageIdContext.Provider value="home">
          <PageTitleShownContext.Provider value={!items.some((w) => w.type === "page-header")}>
            <CoachContext.Provider value={ctx}>
              <div style={{ width: logical * scale, height: canvasH * scale }}>
                <div
                  ref={canvas}
                  className={cn(scope, "hb-canvas origin-top-left rounded-xl border")}
                  style={{
                    width: logical,
                    transform: `scale(${scale})`,
                    padding: PAD.desktop,
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontFamily: "var(--coach-font-body)",
                    borderColor: "var(--c-hair)",
                  }}
                >
                  <div className="hb-set relative" data-set={widgetSetOf(theme)} data-finish={widgetFinishOf(theme)} style={{ minHeight: 6 * (ROW_HEIGHT + gap), "--gap": `${gap}px` } as React.CSSProperties}>
                    {active && (
                      <GridBackground
                        width={gridW}
                        cols={COLS}
                        rowHeight={ROW_HEIGHT}
                        margin={[gap, gap]}
                        containerPadding={[0, 0]}
                        rows={rows}
                        color="color-mix(in oklab, var(--foreground) 6%, transparent)"
                        borderRadius={6}
                        className="pointer-events-none absolute inset-0"
                      />
                    )}
                    {items.length === 0 && (
                      <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-(--radius) border-2 border-dashed text-sm opacity-60">Add widgets from the list on the left</div>
                    )}
                    <ReactGridLayout
                      width={gridW}
                      layout={grid}
                      gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [gap, gap], containerPadding: [0, 0] }}
                      positionStrategy={scaled(scale)}
                      dragConfig={{ enabled: true, threshold: 4, cancel: ".react-resizable-handle, .no-drag" }}
                      resizeConfig={{ enabled: true, handles: ["e", "s", "w", "se", "sw"] }}
                      style={{ minHeight: 6 * (ROW_HEIGHT + gap) }}
                      onDragStart={(_l, _o, item) => (setActive(true), item && setSelected(item.i))}
                      onResizeStart={(_l, _o, item) => (setActive(true), item && setSelected(item.i))}
                      onDragStop={(l) => (setActive(false), save(fromGrid(l)))}
                      onResizeStop={(l) => (setActive(false), save(fromGrid(l)))}
                    >
                      {items.map((w) => (
                        <div key={w.id} className={cn(w.type === "page-header" && "g-plain")} onClick={(e) => (e.stopPropagation(), setSelected(w.id))}>
                          <GridWidget w={w} selected={selected === w.id} onRemove={() => remove(w.id)} onVariant={(v) => setVariant(w.id, v)} />
                        </div>
                      ))}
                    </ReactGridLayout>
                  </div>
                </div>
              </div>
            </CoachContext.Provider>
          </PageTitleShownContext.Provider>
        </PageIdContext.Provider>
      </div>
    </div>
  )
}

/** One widget on the editing grid: the real widget (inert), its name tag and quick actions. */
function GridWidget({ w, selected, onRemove, onVariant }: { w: WidgetInstance; selected: boolean; onRemove: () => void; onVariant: (v: string) => void }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  const variant = w.variant ?? def.variants[0].value
  return (
    <div
      className={cn(
        "group/w relative flex size-full cursor-grab flex-col rounded-[calc(var(--radius)+2px)] outline-2 outline-offset-2 active:cursor-grabbing",
        selected ? "outline-(--foreground)" : "outline-transparent hover:outline-[color-mix(in_oklab,var(--foreground)_35%,transparent)]",
      )}
    >
      <div inert className="@container flex min-h-0 flex-1 flex-col [&>*]:min-h-0 [&>*]:flex-1">
        <WidgetFrame emphasis={w.emphasis} detail={w.detail} header={w.header} note={w.note} fixed>
          <C variant={variant} props={w.props ?? {}} />
        </WidgetFrame>
      </div>
      <div
        data-on={selected}
        className="no-drag absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg border p-1 font-[family-name:var(--ff-geist)] text-[0.75rem] opacity-0 shadow-sm transition-opacity group-hover/w:opacity-100 data-[on=true]:opacity-100"
        style={{ background: "var(--c-bar)", color: "var(--c-t1)", borderColor: "var(--c-hair)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="px-1.5 font-medium">{def.name}</span>
        <span className="tabular-nums text-(--c-t3)">
          {w.w}×{w.h}
        </span>
        {def.variants.length > 1 && (
          <select
            value={variant}
            onChange={(e) => onVariant(e.target.value)}
            aria-label={`${def.name} layout`}
            className="h-6 rounded-md border bg-transparent px-1 text-[0.75rem] outline-none"
            style={{ borderColor: "var(--c-hair)" }}
          >
            {def.variants.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={onRemove} aria-label={`Remove ${def.name}`} title="Remove (Delete)" className="grid size-6 place-items-center rounded-md text-(--c-t2) hover:bg-(--c-on) hover:text-(--c-t1)">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("grid size-7 place-items-center rounded-md text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1) disabled:opacity-35 disabled:hover:bg-transparent", CONTROL_FOCUS)}
    >
      {children}
    </button>
  )
}
