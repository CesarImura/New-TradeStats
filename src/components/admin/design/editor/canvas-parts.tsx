import { createContext, memo, useContext } from "react"
import type { MotionValue } from "motion/react"
import { StudentShell } from "@/components/shells/student-shell"
import type { Edges, Target } from "@/components/widgets/page-grid"
import type { WidgetInstance } from "@/lib/widgets/layout"
import type { Rect } from "./drag-marks"

/** The canvas's own sizes, labels, hit zones and shell frame: plain parts of ArrangeCanvas, apart from its logic. */

export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }
/** A tablet or phone is a screen of its own size (Figma Canvas 02 and 03): the page scrolls inside it instead of showing at its full length. */
export const DEVICE_HEIGHT: Partial<Record<Device, number>> = { tablet: 844, phone: 844 }
export const PAD = { desktop: 32, tablet: 24, phone: 16 }

export type Device = "desktop" | "tablet" | "phone"

/** Where a moving or arriving card would land, and the exact rectangle it will take (px on the page). */
export type Mark = { at: Target; rect: Rect }
/** What a drag says on the card being resized. */
export const colsLabel = (n: number) => `${n} ${n === 1 ? "column" : "columns"}`
/** Rows count in halves: "1 row", "4½ rows", "½ row". */
export const rowsLabel = (n: number) => {
  const whole = Math.floor(n + 1e-6)
  const half = n - whole > 0.25
  return `${whole || !half ? whole : ""}${half ? "½" : ""} ${n === 1 ? "row" : "rows"}`
}
/** How long the pointer rests on a spot before the cards in the way move aside (ms). */
export const REST = 350
/** The motion values of a card being carried: its box, and how much it is lifted. */
export type Carried = { x: MotionValue<number>; y: MotionValue<number>; w: MotionValue<number>; h: MotionValue<number>; s: MotionValue<number> }
/** The pointer while something is dragged. */
export const setCursor = (c: string) => {
  document.body.style.cursor = c
}
/** A card that has not been saved yet (a widget on its way in from the library). */
export const NEW = "__new"
/** Whether two arrangements are the same cards in the same rectangles. */
export const same = (a: WidgetInstance[], b: WidgetInstance[]) => JSON.stringify(a.map((c) => [c.id, c.x, c.y, c.w, c.h])) === JSON.stringify(b.map((c) => [c.id, c.x, c.y, c.w, c.h]))

/**
 * The platform's shell drawn inside the canvas: the canvas is scaled (a transform), so the shell's fixed parts (the side
 * menu, the backdrop) are placed in it already; they just must not take the window's height.
 */
export const SHELL_CSS =
  // A card that arrives fades and scales in (0.98 to 1); reduced motion zeroes it in globals.css.
  `@keyframes hb-in{from{opacity:0;scale:.98}to{opacity:1;scale:1}}.hb-enter{animation:hb-in 180ms var(--ease-out)}` +
  `[data-shell] [data-slot=sidebar-container]{height:auto!important}[data-shell] .min-h-svh{min-height:0!important}` +
  // Click to edit shows itself: a part that opens a setting (the logo, the menu, a heading, a label) is outlined under the pointer, as in the preview.
  // Only the innermost part: pointing at a menu item outlines the item, not also the whole side menu around it.
  `[data-shell] :is([data-edit],h1,h2,h3,.eyebrow):not([data-slot=widget] *):not(:has([data-edit]:hover)):hover{outline:calc(1.5px * var(--ui-zoom,1)) solid rgb(244 244 245 / .55);outline-offset:3px;border-radius:4px;cursor:pointer}`

/** A click inside a widget, its quick bar or the canvas tools: the builder's own, never click-to-edit. */
export const inWidget = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-widget-id], .group\\/wrap, .no-drag, [role=toolbar]")

/** Hit zones of a card: inside its edge (6px on the screen) and half the gap outside it; corners are squares over both edges. */
export const IN = "calc(6px * var(--ui-zoom,1))"
export const OUT = "calc(var(--gap) / 2)"
export const OUTN = `calc(${OUT} * -1)`
export const EDGE = `calc(${IN} + ${OUT})`
export const CORNER = `calc(12px * var(--ui-zoom,1) + ${OUT})`
export const HANDLES: { name: string; edges: Edges; cursor: string; corner?: boolean; style: React.CSSProperties }[] = [
  { name: "right", edges: { r: true }, cursor: "ew-resize", style: { top: 0, bottom: 0, right: OUTN, width: EDGE } },
  { name: "left", edges: { l: true }, cursor: "ew-resize", style: { top: 0, bottom: 0, left: OUTN, width: EDGE } },
  { name: "top", edges: { t: true }, cursor: "ns-resize", style: { left: 0, right: 0, top: OUTN, height: EDGE } },
  { name: "bottom", edges: { b: true }, cursor: "ns-resize", style: { left: 0, right: 0, bottom: OUTN, height: EDGE } },
  { name: "top-left", edges: { t: true, l: true }, cursor: "nwse-resize", corner: true, style: { top: OUTN, left: OUTN, width: CORNER, height: CORNER } },
  { name: "top-right", edges: { t: true, r: true }, cursor: "nesw-resize", corner: true, style: { top: OUTN, right: OUTN, width: CORNER, height: CORNER } },
  { name: "bottom-left", edges: { b: true, l: true }, cursor: "nesw-resize", corner: true, style: { bottom: OUTN, left: OUTN, width: CORNER, height: CORNER } },
  { name: "bottom-right", edges: { b: true, r: true }, cursor: "nwse-resize", corner: true, style: { bottom: OUTN, right: OUTN, width: CORNER, height: CORNER } },
]

/**
 * The page's content is handed to the platform's shell through a context: the shell (side menu, top bar) draws again only when it changes
 * itself, not at every step of a drag. `BODY` is the same element every time, so the shell is skipped, and `Body` draws what the editor says.
 */
export const BodyCtx = createContext<React.ReactNode>(null)
export function Body() {
  return useContext(BodyCtx)
}
export const BODY = <Body />
export const ShellFrame = memo(function ShellFrame({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>
})

/** Zoom steps for − and +, as in Figma. */
export const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 1.5, 2]
