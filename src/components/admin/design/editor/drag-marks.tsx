"use client"

import { useState, useSyncExternalStore } from "react"
import { motion, useReducedMotion } from "motion/react"
import { GRID_NUDGE } from "@/components/widgets/page-renderer"
import { cn } from "@/lib/utils"
import type { Edges } from "@/components/widgets/page-grid"

/** A rectangle on the page, in px of the page (the canvas scale undone). */
export type Rect = { left: number; top: number; width: number; height: number }

const Z = "var(--ui-zoom,1)"
/** The editor's quiet grey (neutral, readable on a dark page and on a light one). */
const QUIET = "rounded-(--radius) border border-dashed border-[rgb(150_150_160/0.9)] bg-[rgb(150_150_160/0.16)]"

/**
 * The size of the card being resized, in plain words, in a small pill just inside the corner (or edge) being dragged. The builder moves
 * it with the card, straight from the pointer (`pillRef`, a transform written every frame); the text only changes when the snapped size does.
 * At the least a card can be it says "Minimum size".
 */
export function SizePill({ edges, label, atMin, pillRef }: { edges: Edges; label: string; atMin: boolean; pillRef: React.Ref<HTMLDivElement> }) {
  const tx = edges.r ? `calc(-100% - 10px * ${Z})` : edges.l ? `calc(10px * ${Z})` : "-50%"
  const ty = edges.b ? `calc(-100% - 10px * ${Z})` : edges.t ? `calc(10px * ${Z})` : "-50%"
  return (
    <div ref={pillRef} aria-hidden className="pointer-events-none absolute top-0 left-0 z-50">
      <span
        data-size-pill
        className="block w-max rounded-full bg-[#141416] px-2.5 py-1 font-[family-name:var(--ff-geist)] text-xs whitespace-nowrap text-white shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_6px_16px_-6px_rgb(0_0_0/0.7)] [zoom:var(--ui-zoom,1)]"
        style={{ translate: `${tx} ${ty}` }}
      >
        {atMin ? "Minimum size" : label}
      </span>
    </div>
  )
}

/**
 * The grid a dragged card snaps to, shown only during a drag: 12 faint columns and a line every half row, counted from `top` (the
 * block's rows start there). Over the cards, never catching the pointer. Neutral, so it reads on dark and light pages.
 */
export function SnapGrid({ top, gap, pitch }: { top: number | null; gap: number; pitch: number }) {
  const col = "rgb(150 150 160 / 0.07)"
  const row = "rgb(150 150 160 / 0.2)"
  const step = pitch / 2
  return (
    <div
      aria-hidden
      data-snap-grid={top !== null || undefined}
      className={cn("pointer-events-none absolute inset-0 z-40 transition-opacity duration-150 ease-out", top === null && "opacity-0")}
      style={{
        backgroundImage: `repeating-linear-gradient(to right, ${col} 0 calc((100% + ${gap}px) / 12 - ${gap}px), transparent 0 calc((100% + ${gap}px) / 12)), repeating-linear-gradient(to bottom, ${row} 0 1px, transparent 1px ${step}px)`,
        backgroundPositionY: `0, ${(top ?? 0) % step}px`,
      }}
    />
  )
}

/**
 * The rectangle a card or widget would take where it is dropped: a quiet grey fill and a fine dashed line, the card's own radius. It
 * glides from one target to the next and fades in and out; it never glides in from where it last was after being away.
 */
export function DropRect({ rect }: { rect: Rect | null }) {
  const [shown, setShown] = useState<Rect | null>(rect)
  const [prev, setPrev] = useState<Rect | null>(rect)
  const [glide, setGlide] = useState(false)
  const reduce = !!useReducedMotion()
  // The target changed (a new object with the same numbers is not a change).
  if (rect !== prev && !(rect && prev && sameRect(rect, prev))) {
    setPrev(rect)
    if (rect) {
      setShown(rect)
      // Glide only between spots of the same size; a new size (an empty slot) shows at once in its place, never stretching across.
      setGlide(!!prev && Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1)
    }
  }
  if (!shown) return null
  return (
    <motion.span
      aria-hidden
      data-drop-rect={rect ? "" : undefined}
      className={cn("pointer-events-none absolute top-0 left-0 z-50", QUIET)}
      initial={false}
      animate={{ x: shown.left, y: shown.top, width: shown.width, height: shown.height, opacity: rect ? 1 : 0 }}
      transition={{ ...(glide && !reduce ? GRID_NUDGE : { duration: 0 }), opacity: { duration: reduce ? 0 : 0.15 } }}
    />
  )
}

/** The empty areas of the page, as the coach sees them (never on a student's page): very quiet, so empty space reads as empty and not as a card. They are read from a store the grid fills, so a change draws only this, not the editor. */
export class GapStore {
  rects: Rect[] = []
  private listeners = new Set<() => void>()
  set(rects: Rect[]) {
    if (JSON.stringify(rects) === JSON.stringify(this.rects)) return
    this.rects = rects
    this.listeners.forEach((f) => f())
  }
  subscribe = (f: () => void) => {
    this.listeners.add(f)
    return () => {
      this.listeners.delete(f)
    }
  }
  get = () => this.rects
}

export function GapAreas({ store }: { store: GapStore }) {
  const rects = useSyncExternalStore(store.subscribe, store.get, store.get)
  return (
    <>
      {rects.map((r, i) => (
        <span
          key={i}
          aria-hidden
          data-gap
          className="pointer-events-none absolute z-0 rounded-(--radius) border border-dashed border-[rgb(150_150_160/0.25)] bg-[rgb(150_150_160/0.05)]"
          style={r}
        />
      ))}
    </>
  )
}

const sameRect = (a: Rect, b: Rect) => Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5
