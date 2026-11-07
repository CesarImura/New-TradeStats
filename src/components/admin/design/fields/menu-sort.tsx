"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { Reorder, useDragControls, useReducedMotion, type DragControls } from "motion/react"
import { GripVertical, Lock } from "@/components/icons"
import type { MenuId } from "@/lib/data/coaches"
import { cn } from "@/lib/utils"
import { move, useDesign } from "./design-fields"

/**
 * Reordering the menu in Design → Menu. Each row has a handle: dragging starts
 * only there (mouse or touch), so typing a name, a switch or a button never
 * moves the row; with the handle focused, ↑ and ↓ move it one place. A drop or
 * a key press is one change to the draft's menu order, so one undo puts it
 * back. While dragging, the row lifts and the others make room; after, the row
 * flashes and a screen reader hears where it went. Home is always first: it
 * has a lock instead of a handle and isn't in the sortable list.
 */

const HINT_ID = "menu-sort-hint"
type Sort = { controls: DragControls; id: string; name: string; onKey: (e: React.KeyboardEvent) => void }
const SortContext = createContext<Sort | null>(null)

/** The row's handle, when it is in a sortable list (null elsewhere, e.g. the setup's page list). */
export const useSort = () => useContext(SortContext)

/**
 * One menu row's frame, shared by Home, the modules and the coach's pages: room on both sides, a faint wash on
 * hover, an orange edge while one of its fields has focus. A hidden item keeps readable text on a dashed edge,
 * so it reads as off without fading away (with its name struck through and its switch off).
 */
export const menuRow = (hidden?: boolean) =>
  cn(
    "flex items-center gap-2 rounded-lg border py-1 pr-2.5 pl-1 transition-[background-color,border-color] duration-150",
    "hover:border-[color-mix(in_oklab,var(--foreground)_20%,transparent)] hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]",
    "focus-within:border-[color-mix(in_oklab,var(--ts-interactive)_45%,transparent)] focus-within:bg-[color-mix(in_oklab,var(--ts-interactive)_4%,transparent)] focus-within:hover:border-[color-mix(in_oklab,var(--ts-interactive)_45%,transparent)]",
    hidden && "border-dashed bg-transparent",
  )
/** A hidden item's name field: still readable (secondary text, not faded), and not editable while it is off. */
export const HIDDEN_INPUT = "disabled:border-dashed disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-100"

/** An off switch in a menu row: a visible track edge and a grey thumb, so "hidden" is plain without looking broken. */
export const SWITCH_OFF =
  // Marked important on these switches only: the admin's own switch styling (ts-system) would win otherwise.
  "data-unchecked:border-[color-mix(in_oklab,var(--foreground)_45%,transparent)]! data-unchecked:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]! *:data-unchecked:bg-muted-foreground!"

/** How to reorder, for the line above the list (the handles point to it). */
export function SortHint({ home = true }: { home?: boolean } = {}) {
  return (
    // Read by screen readers (each handle points to it); sighted coaches see the grip and the drag.
    <p id={HINT_ID} className="sr-only">
      Drag <GripVertical className="inline size-3.5 align-[-3px]" /> to reorder, or focus it and press ↑ ↓.{home && " Home always comes first."}
    </p>
  )
}

export function SortHandle() {
  const s = useSort()
  if (!s) return null
  return (
    <button
      type="button"
      data-sort-handle={s.id}
      aria-label={`Reorder ${s.name}`}
      aria-describedby={HINT_ID}
      title="Drag to reorder, or press ↑ ↓"
      // Dragging starts here only; touch-none lets a finger drag it instead of scrolling the panel.
      onPointerDown={(e) => {
        e.preventDefault()
        s.controls.start(e)
      }}
      onKeyDown={s.onKey}
      className="grid h-7 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:outline-none active:cursor-grabbing"
    >
      <GripVertical className="size-3.5" />
    </button>
  )
}

/** Home's place holder for the handle: a lock, since Home can't move. */
export function FixedFirst() {
  return (
    <span title="Home always comes first" className="grid h-7 w-6 shrink-0 place-items-center text-muted-foreground">
      <Lock className="size-3" />
      <span className="sr-only">Home always comes first</span>
    </span>
  )
}

/**
 * The menu's items in order, each rendered by `row`, sortable by handle. The
 * order shown while dragging is local; the draft changes once, on drop.
 */
export function SortableMenu<T extends string = MenuId>({
  items,
  nameOf,
  row,
  onSave,
}: {
  items: T[]
  nameOf: (id: T) => string
  row: (id: T) => React.ReactNode
  /** Saves a new order (a list other than the menu: the course page's sections). Without it, the order is the menu's. */
  onSave?: (next: T[], key: string) => void
}) {
  const { change } = useDesign()
  const [order, setOrder] = useState<T[] | null>(null)
  const latest = useRef<T[] | null>(null)
  const [moved, setMoved] = useState<{ id: T; n: number } | null>(null)
  const [said, setSaid] = useState("")
  // Counts moves: each one is its own undo step and its own flash.
  const moves = useRef(0)
  const list = order ?? items

  const save = (next: T[], id: T) => {
    if (next.join() === items.join()) return
    moves.current += 1
    if (onSave) onSave(next, `sort-${moves.current}`)
    else change({ content: { menu: next as unknown as MenuId[] } }, `menu-sort-${moves.current}`)
    // Home is first in the student menu, so its positions count from 2.
    const home = onSave ? 0 : 1
    setSaid(`${nameOf(id)} moved to place ${next.indexOf(id) + 1 + home} of ${next.length + home}.`)
    setMoved({ id, n: moves.current })
  }

  return (
    <>
      <Reorder.Group
        as="div"
        axis="y"
        values={list}
        onReorder={(next: T[]) => {
          latest.current = next
          setOrder(next)
        }}
        className="grid gap-1.5"
      >
        {list.map((id) => (
          <SortItem
            key={id}
            id={id}
            name={nameOf(id)}
            flash={moved?.id === id ? moved.n : 0}
            onDrop={() => {
              const next = latest.current
              latest.current = null
              if (next) save(next, id)
              setOrder(null)
            }}
            onMove={(by) => {
              const i = items.indexOf(id)
              if (i + by < 0 || i + by >= items.length) return
              save(move(items, i, by), id)
              // The row moves in the DOM: keep the keyboard on its handle.
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-sort-handle="${id}"]`)?.focus())
            }}
          >
            {row(id)}
          </SortItem>
        ))}
      </Reorder.Group>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </>
  )
}

function SortItem({ id, name, flash, onDrop, onMove, children }: { id: string; name: string; flash: number; onDrop: () => void; onMove: (by: number) => void; children: React.ReactNode }) {
  const controls = useDragControls()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  // After a move: a short flash on the row, where it landed.
  useEffect(() => {
    if (!flash || reduce) return
    ref.current?.animate(
      [
        { boxShadow: "0 0 0 2px rgb(255 255 255 / 0.9)", borderRadius: "8px" },
        { boxShadow: "0 0 0 2px rgb(255 255 255 / 0)", borderRadius: "8px" },
      ],
      { duration: 1200, easing: "ease-in" },
    )
  }, [flash, reduce])
  const onKey = (e: React.KeyboardEvent) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      onMove(e.key === "ArrowUp" ? -1 : 1)
    }
  }
  return (
    <Reorder.Item
      as="div"
      ref={ref}
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false)
        onDrop()
      }}
      data-dragging={dragging || undefined}
      // Lifted while dragging: above the others, on the panel's colour, with a shadow.
      whileDrag={reduce ? { zIndex: 10 } : { scale: 1.02, zIndex: 10, boxShadow: "0 12px 28px -12px rgb(0 0 0 / 0.7)" }}
      className={cn("relative rounded-lg", dragging && "bg-background [&>[data-field]]:border-[color:var(--ring)]")}
    >
      <SortContext.Provider value={{ controls, id, name, onKey }}>{children}</SortContext.Provider>
    </Reorder.Item>
  )
}
