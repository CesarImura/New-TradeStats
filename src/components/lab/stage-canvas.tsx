"use client"

import { Copy, FoldVertical, RotateCcw, Trash2, Undo2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ReactGridLayout from "react-grid-layout"
import type { LayoutItem } from "react-grid-layout/core"
import { GridBackground } from "react-grid-layout/extras"
import "react-grid-layout/css/styles.css"
import { unusedHeight } from "@/components/lab/reui-widgets/kit"
import type { WidgetDef } from "@/components/lab/reui-widgets/registry"
import { DataModeProvider } from "@/components/lab/reui-widgets/shared"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import { COLS, ROW_HEIGHT, type Detail, type Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS, LabButton, LabSeg } from "./lab-controls"
import { propsFor, type Content } from "./stress-content"
import { Pane, px, rowsPx, t2, t3 } from "./widget-base"

type Variant = WidgetDef["variants"][number]
type Item = { i: string; x: number; y: number; w: number; h: number }

/** The builder's grid: 12 columns of 80px, 56px rows, 16px gaps. */
const GAP = 16
// Worked out here, not with px(): this module and widget-base import each other, so px is not ready when this line runs.
const GRID_W = COLS * 80 + (COLS - 1) * GAP
const MAX_COPIES = 3
/** A phone's column: 390px screen less 16px gutters. */
const PHONE_W = 358
const CONTENT_LABEL: [Content, string][] = [
  ["sample", "Sample"],
  ["empty", "Empty"],
  ["short", "Short"],
  ["long", "Long"],
]

/**
 * The selected layout on a real-size builder grid (prototype only), to see
 * how it behaves in the page builder: click to select, drag to move, pull
 * the right edge, bottom edge or corner to resize (snapping to the grid,
 * within the widget's limits). Duplicate puts copies side by side to compare
 * sizes; ⌘Z undoes the last change. The widget stays live at every size.
 */
export function StageCanvas({ def, variant, extra, mode, theme, emphasis, detail }: { def: WidgetDef; variant: Variant; extra: number; mode: Mode; theme: CoachTheme; emphasis: Emphasis; detail: Detail }) {
  const minW = Math.min(variant.minW, COLS)
  const minH = Math.min(variant.minH, variant.h + extra)
  // A layout that stacks when narrow can need more rows there (a full-width video over its words).
  const minHAt = (w: number) => (variant.narrow && w < variant.narrow.below ? Math.max(minH, variant.narrow.minH) : minH)
  // The layout's own box (registry), plus Detail's extra rows.
  const maxH = variant.maxH + extra
  // …and fewer where it lies flat when wide (its words fit in fewer lines).
  const maxHAt = (w: number) => (variant.wide && w >= variant.wide.from ? Math.max(minHAt(w), variant.wide.maxH + extra) : maxH)
  const maxW = Math.min(COLS, variant.maxW)
  const first: Item = { i: "a", x: 0, y: 0, w: Math.max(minW, Math.min(maxW, def.defaultW)), h: variant.h + extra }
  const [items, setItems] = useState<Item[]>([first])
  const [past, setPast] = useState<Item[][]>([])
  const [selected, setSelected] = useState<string | null>("a")
  const [live, setLive] = useState<{ i: string; w: number; h: number } | null>(null)
  // What to try the widget with: how much content, and the grid or a phone's column.
  const [content, setContent] = useState<Content>("sample")
  const [device, setDevice] = useState<"grid" | "phone">("grid")
  const props = propsFor(def, content)
  // Rows each copy leaves blank under its content (charts and lists that grow leave none): the grid stops it growing
  // there, the label says so and "Fit height" trims it. Measured once the widget has settled.
  const canvas = useRef<HTMLDivElement>(null)
  const [spare, setSpare] = useState<Record<string, number>>({})
  // The copy just resized: once measured, it snaps back to the rows its content uses ("stretch and snap").
  const snap = useRef<{ id: string; tries: number } | null>(null)
  useEffect(() => {
    if (live) return
    const t = setTimeout(() => {
      const next: Record<string, number> = {}
      for (const x of items) {
        const card = canvas.current?.querySelector<HTMLElement>(`[data-item="${x.i}"] [data-slot=widget]`)
        if (card) next[x.i] = Math.floor((unusedHeight(card) + GAP / 2) / (ROW_HEIGHT + GAP))
      }
      const id = snap.current?.id
      const tries = snap.current?.tries ?? 0
      snap.current = null
      const it = id ? items.find((x) => x.i === id) : undefined
      // Replaces the resize in place (no new undo step): ⌘Z still goes back to the size before the drag. A shorter card
      // can change shape (and so its layout), so it is measured again, up to three times, until nothing is left over.
      if (it && next[it.i] > 0 && it.h > minHAt(it.w)) {
        if (tries < 2) snap.current = { id: it.i, tries: tries + 1 }
        return setItems(items.map((x) => (x.i === it.i ? { ...x, h: Math.max(minHAt(x.w), x.h - next[x.i]) } : x)))
      }
      setSpare(next)
    }, 400)
    return () => clearTimeout(t)
  }, [items, live, content, detail, variant.value, emphasis, minH])
  // The click that ends a drag or a resize lands on the canvas; it must not clear the selection.
  const moved = useRef(false)
  const settle = () => {
    moved.current = true
    setTimeout(() => (moved.current = false), 0)
  }

  const commit = (next: Item[]) => {
    setPast((p) => [...p.slice(-19), items])
    setItems(next)
  }
  const undo = () => {
    const prev = past[past.length - 1]
    if (!prev) return
    setPast(past.slice(0, -1))
    setItems(prev)
  }
  const sel = items.find((x) => x.i === selected) ?? null
  const resize = (w: number, h: number) => sel && commit(items.map((x) => (x.i === sel.i ? { ...x, w, h } : x)))
  const duplicate = (from: Item) => {
    if (items.length >= MAX_COPIES) return
    const id = "abc"[items.length] ?? String(items.length)
    // Beside it when there is room on the row, otherwise under everything.
    const beside = from.x + from.w * 2 <= COLS
    const bottom = Math.max(...items.map((x) => x.y + x.h))
    commit([...items, { ...from, i: id, x: beside ? from.x + from.w : 0, y: beside ? from.y : bottom }])
    setSelected(id)
  }
  const remove = (id: string) => {
    if (items.length === 1) return
    commit(items.filter((x) => x.i !== id))
    setSelected(null)
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest("input, textarea")) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        undo()
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && items.length > 1) remove(selected)
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  })

  // Suggested sizes for the selected widget: its smallest, its default, wider, and the full row.
  const presets: [string, number, number][] = [
    ["Min", minW, minHAt(minW)],
    ["Default", Math.min(first.w, maxW), first.h],
    ["Wide", Math.min(maxW, Math.max(minW, 8)), first.h],
    ["Max", maxW, maxHAt(maxW)],
  ]
  const seen = new Set<string>()
  const sizes = presets.filter(([, w, h]) => (seen.has(`${w}x${h}`) ? false : (seen.add(`${w}x${h}`), true)))

  const rows = Math.max(8, Math.max(...items.map((x) => x.y + x.h)) + 3)
  const layout: LayoutItem[] = items.map((x) => ({ ...x, minW, minH: minHAt(x.w), maxW, maxH: spare[x.i] ? Math.min(maxHAt(x.w), x.h) : maxHAt(x.w) }))

  return (
    <div className="grid w-max gap-4">
      {/* Size presets and undo, for the selected widget. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("mr-1 text-xs", t2)}>Size</span>
        {sizes.map(([label, w, h]) => {
          const on = sel?.w === w && sel?.h === h
          return (
            <button
              key={label}
              type="button"
              disabled={!sel}
              onClick={() => resize(w, h)}
              className={cn("h-8 rounded-full border px-3 text-[0.8125rem] transition-colors duration-150 disabled:opacity-40", CONTROL_FOCUS, on ? "bg-(--c-t1) font-medium text-(--c-bar)" : "hover:bg-(--c-on)")}
              style={{ borderColor: on ? "var(--c-t1)" : "var(--c-hair)" }}
            >
              {label}{" "}
              <span className={cn("tabular-nums", on ? "opacity-80" : t3)}>
                {w}×{h}
              </span>
            </button>
          )
        })}
        <span className="flex-1" />
        <LabSeg label="Content" value={content} onChange={setContent} options={CONTENT_LABEL} />
        <LabSeg
          label="Show on"
          value={device}
          onChange={setDevice}
          options={[
            ["grid", "Grid"],
            ["phone", "Phone"],
          ]}
        />
        <LabButton onClick={undo} label="Undo" hint="Undo the last move or resize (⌘Z)">
          <Undo2 className="size-4" />
        </LabButton>
      </div>

      <DataModeProvider value={content === "empty" ? "empty" : "sample"}>
        {device === "phone" ? (
          // A phone: one column, every widget as tall as its content (the builder's heights apply from 60rem up).
          <div className="grid justify-items-center rounded-xl border bg-(--background) px-4 py-10" style={{ borderColor: "var(--c-hair)", width: GRID_W + 48 }}>
            <div className="grid gap-2" style={{ width: PHONE_W }}>
              <span className={cn("text-xs tabular-nums", t3)}>Phone · 390px · as tall as its content</span>
              <Pane fill fixed={false} def={def} variant={variant.value} h={first.h} scale={1} mode={mode} theme={theme} emphasis={emphasis} detail={detail} props={props} />
            </div>
          </div>
        ) : (
          // The grid itself, real size; the top padding leaves room for the label and actions over the first row.
          <div ref={canvas} className="hb-canvas lab-canvas relative rounded-xl border bg-(--background) p-6 pt-12" style={{ borderColor: "var(--c-hair)", width: GRID_W + 48 }} onClick={() => !moved.current && setSelected(null)}>
            <style>{CANVAS_CSS}</style>
            <div className="relative" style={{ width: GRID_W, minHeight: rowsPx(rows) }}>
              <GridBackground
                width={GRID_W}
                cols={COLS}
                rowHeight={ROW_HEIGHT}
                margin={[GAP, GAP]}
                containerPadding={[0, 0]}
                rows={rows}
                color="color-mix(in oklab, var(--foreground) 5%, transparent)"
                borderRadius={6}
                className="pointer-events-none absolute inset-0"
              />
              <ReactGridLayout
                width={GRID_W}
                layout={layout}
                gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [GAP, GAP], containerPadding: [0, 0] }}
                dragConfig={{ enabled: true, threshold: 4, cancel: ".react-resizable-handle, .no-drag" }}
                resizeConfig={{ enabled: true, handles: ["w", "e", "s", "sw", "se"] }}
                style={{ minHeight: rowsPx(rows) }}
                onDragStart={(_l, _o, item) => item && setSelected(item.i)}
                onResizeStart={(_l, _o, item) => {
                  if (!item) return
                  setSelected(item.i)
                  setLive({ i: item.i, w: item.w, h: item.h })
                }}
                onResize={(_l, _o, item) => item && setLive({ i: item.i, w: item.w, h: item.h })}
                onDragStop={(l) => {
                  settle()
                  commit(fromGrid(l))
                }}
                onResizeStop={(l, _o, item) => {
                  settle()
                  setLive(null)
                  if (item) snap.current = { id: item.i, tries: 0 }
                  commit(fromGrid(l).map((x) => ({ ...x, h: Math.min(Math.max(x.h, minHAt(x.w)), maxHAt(x.w)) })))
                }}
              >
                {items.map((x) => {
                  const on = selected === x.i
                  const size = live?.i === x.i ? live : x
                  return (
                    <div
                      key={x.i}
                      data-item={x.i}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(x.i)
                      }}
                    >
                      <div
                        className={cn(
                          "group/w relative size-full cursor-grab rounded-[calc(var(--radius)+3px)] outline-2 outline-offset-3 outline-transparent active:cursor-grabbing",
                          on ? "outline-(--brand-mark)" : "hover:outline-[color-mix(in_oklab,var(--brand-mark)_45%,transparent)]",
                        )}
                      >
                        {/* Name and size above the widget, so they never cover its own controls; the pixel size shows while resizing. */}
                        <span
                          className={cn(
                            "pointer-events-none absolute -top-8 left-0 z-20 rounded-md px-2 py-1 font-[family-name:var(--ff-geist)] text-xs whitespace-nowrap tabular-nums transition-opacity",
                            on || live?.i === x.i ? "opacity-100" : "opacity-0 group-hover/w:opacity-100",
                          )}
                          style={{ background: "var(--brand-mark)", color: "#fff" }}
                        >
                          {def.name} · {size.w}×{size.h}
                          {live?.i === x.i && ` · ${px(size.w)}×${rowsPx(size.h)}px`}
                          <ShownDetail detail={detail} />
                          {!live && !!spare[x.i] && ` · content ends ${spare[x.i]} row${spare[x.i] > 1 ? "s" : ""} up`}
                        </span>
                        {/* Quick actions; .no-drag keeps clicks here from starting a drag. */}
                        <div
                          className={cn("no-drag absolute -top-9 right-0 z-30 flex items-center gap-0.5 rounded-lg border p-0.5 shadow-sm transition-opacity", on ? "opacity-100" : "pointer-events-none opacity-0")}
                          style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}
                        >
                          <Action label="Duplicate to compare" disabled={items.length >= MAX_COPIES} onClick={() => duplicate(x)}>
                            <Copy className="size-3.5" />
                          </Action>
                          <Action label="Fit height to content" disabled={!spare[x.i]} onClick={() => commit(items.map((y) => (y.i === x.i ? { ...y, h: Math.max(minHAt(y.w), y.h - (spare[x.i] ?? 0)) } : y)))}>
                            <FoldVertical className="size-3.5" />
                          </Action>
                          <Action label="Reset size" onClick={() => commit(items.map((y) => (y.i === x.i ? { ...y, w: first.w, h: first.h } : y)))}>
                            <RotateCcw className="size-3.5" />
                          </Action>
                          <Action label="Remove copy" disabled={items.length === 1} onClick={() => remove(x.i)}>
                            <Trash2 className="size-3.5" />
                          </Action>
                        </div>
                        <Pane fill def={def} variant={variant.value} h={size.h} scale={1} mode={mode} theme={theme} emphasis={emphasis} detail={detail} props={props} />
                      </div>
                    </div>
                  )
                })}
              </ReactGridLayout>
            </div>
          </div>
        )}
      </DataModeProvider>
      <p className={cn("text-xs", t3)}>
        Click to select · drag to move · pull the right edge, bottom edge or corner to resize · {items.length}/{MAX_COPIES} copies · ⌘Z undo
      </p>
    </div>
  )
}

const fromGrid = (l: readonly LayoutItem[]): Item[] => l.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))

/** While dragging, the widget underneath ignores the pointer, so the drag layer gets every move. */
const CANVAS_CSS = `.lab-canvas .react-draggable-dragging * { pointer-events: none; } .lab-canvas .react-grid-item.react-draggable-dragging { z-index: 30; }`

const DETAIL_NAME: Record<Detail, string> = { compact: "Compact", standard: "Standard", detailed: "Detailed" }

/**
 * " · shows Standard" in the label while the widget is too short for the
 * chosen Detail and shows a lower level (the card's data-detail-shown), so a
 * coach knows why the extra rows went away and how to get them back.
 */
function ShownDetail({ detail }: { detail: Detail }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState<Detail>()
  useEffect(() => {
    const item = ref.current?.closest(".react-grid-item")
    if (!item) return
    const read = () => setShown((item.querySelector<HTMLElement>("[data-detail-shown]")?.dataset.detailShown as Detail | undefined) ?? undefined)
    read()
    const mo = new MutationObserver(read)
    mo.observe(item, { attributes: true, attributeFilter: ["data-detail-shown"], subtree: true })
    return () => mo.disconnect()
  }, [])
  return <span ref={ref}>{shown && shown !== detail && ` · too short for ${DETAIL_NAME[detail]}, shows ${DETAIL_NAME[shown]}`}</span>
}

function Action({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn("grid size-7 place-items-center rounded-md transition-colors duration-150 hover:bg-(--c-on) disabled:opacity-35 disabled:hover:bg-transparent", CONTROL_FOCUS)}
    >
      {children}
    </button>
  )
}
