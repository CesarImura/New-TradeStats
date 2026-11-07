import { ROW_HEIGHT, legacyWidth, readingOrder, type WidgetInstance } from "@/lib/widgets/layout"
import { getWidget, lookOf, noteRows, rowBounds, type CardBox } from "./registry"

/**
 * The desktop page as free cards. Every card keeps its own x and w (12ths of the page) and y and h (half rows). Between two bands (the
 * page title, a page's own tool) the cards of a block never overlap, and may leave empty space. Nothing re-plans after an edit: you drag
 * a card's edge or corner and only that card changes; a card it grows into slides down, as little as needed, and nothing else moves.
 * Shrinking, moving or removing a card leaves empty space, which "Fill gaps" closes in one step. A block is as tall as its lowest card.
 * All of it is pure: the page, the builder's canvas, the student page's hidden cards and the saves work it out the same way.
 */
export type TileOptions = { gap: number; width: number; pad: number }
/** Where a card is drawn: x and w in 12ths of the page, top and height in px (height unset: the card is as tall as its content). */
export type Spot = { x: number; w: number; top: number; height?: number }
/** A block of cards (or a band) as drawn: its cards, top and height (px). */
export type BlockSpot = { ids: string[]; top: number; height: number; band: boolean }
export type Placement = { spots: Map<string, Spot>; blocks: BlockSpot[]; height: number }
export type PlanOptions = TileOptions & {
  /** The layout was saved as tiles; else it is a masonry (or an earlier grid) and its tiles are derived. */
  tiles: boolean
  /** The px a page title or a page's own tool is as tall as (measured, or estimated before). */
  ownPx: (w: WidgetInstance) => number
}

/** The title and the page's own tool are as tall as their content: a height set on them would be the one they measure back (a tool measured at 0 while it loads stayed at 0). */
export const ownHeight = (w: WidgetInstance) => w.type === "page-header" || !!getWidget(w.type)?.core

/** A card that spans the page on a tablet or phone: the page title, a page's own tool, and a card that is the whole page wide. */
export const isBand = (w: WidgetInstance, cols: number) => cols > 1 && (ownHeight(w) || w.w >= 12)

const EPS = 1e-6
const half = (n: number) => Math.round(n * 2) / 2
const up = (n: number) => Math.ceil(n * 2 - EPS) / 2
const overlaps = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0) > EPS

/** The least width a card can have: its layout's minW. */
export const minWidth = (w: WidgetInstance) => {
  const def = getWidget(w.type)
  return def ? Math.max(1, lookOf(def, w.variant).minW) : 3
}

/** The rows a card may be, note included (the note's rows need the page's width): the least it can show, and what its layout is designed at. */
function cardRange(w: WidgetInstance, o: TileOptions) {
  const def = getWidget(w.type)
  if (!def) return { min: 1, designed: Math.max(1, w.h) }
  const box: CardBox | undefined = o.width > 0 ? { width: (w.w / 12) * (o.width + o.gap) - o.gap, pad: o.pad } : undefined
  const b = rowBounds(def, w.variant, w.detail, w.w, box)
  const note = box ? noteRows(def, w.variant, w.note, box.width, ROW_HEIGHT + o.gap) : 0
  return { min: up(b.min + note), designed: up(b.designed + note) }
}
/** The least height a card can have. */
export const minHeight = (w: WidgetInstance, o: TileOptions) => cardRange(w, o).min
/** The height a card's layout is designed at (at its width and Detail). */
export const designedHeight = (w: WidgetInstance, o: TileOptions) => cardRange(w, o).designed


// ---------- the page in blocks

/** A band, or a block: the cards between two bands. */
export type Part = { band: WidgetInstance } | { tiles: WidgetInstance[] }

/** The page cut at its bands, in reading order. */
export function partsOf(items: WidgetInstance[]): Part[] {
  const out: Part[] = []
  for (const w of readingOrder(items)) {
    const last = out[out.length - 1]
    if (ownHeight(w)) out.push({ band: w })
    else if (last && "tiles" in last) last.tiles.push(w)
    else out.push({ tiles: [w] })
  }
  return out
}

// ---------- the page in groups

/** The page cut at its bands: a band, or a block with the row it starts at (right after the band before it, or the top of the page). */
type Group = { band: WidgetInstance } | { ids: string[]; origin: number }

function groupsOf(items: WidgetInstance[]): Group[] {
  const out: Group[] = []
  let prevEnd = 0
  for (const p of partsOf(items)) {
    if ("band" in p) {
      out.push({ band: p.band })
      prevEnd = p.band.y + Math.max(1, p.band.h)
    } else out.push({ ids: p.tiles.map((t) => t.id), origin: Math.min(prevEnd, ...p.tiles.map((t) => t.y)) })
  }
  return out
}

/**
 * The page with these cards (`byId`: every card on it, changed or not) laid out again in `groups`: each part follows the one before it, so
 * a block that grew pushes what follows down and one that shrank lets it up. Inside a block nothing moves: rows keep their offset from
 * the block's start, so empty rows stay empty. A group left with no card is skipped.
 */
function reflow(items: WidgetInstance[], groups: Group[], byId: Map<string, WidgetInstance>): WidgetInstance[] {
  let cursor = 0
  const out = new Map<string, WidgetInstance>()
  for (const g of groups) {
    if ("band" in g) {
      const b = byId.get(g.band.id) ?? g.band
      out.set(b.id, { ...b, x: 0, w: 12, y: cursor })
      cursor += Math.max(1, b.h)
      continue
    }
    const tiles = g.ids.map((id) => byId.get(id)).filter((t): t is WidgetInstance => !!t)
    if (!tiles.length) continue
    const shift = cursor - g.origin
    for (const t of tiles) out.set(t.id, shift ? { ...t, y: t.y + shift } : t)
    cursor += Math.max(...tiles.map((t) => t.y + t.h)) - g.origin
  }
  const known = new Set(items.map((w) => w.id))
  return [...items.filter((w) => out.has(w.id)).map((w) => out.get(w.id)!), ...[...out.values()].filter((w) => !known.has(w.id))]
}

/** The block (a group with cards) holding card `id`. */
const blockOf = (groups: Group[], id: string) => groups.findIndex((g) => "ids" in g && g.ids.includes(id))

/**
 * Where `fixed` has been put, every card of `others` it overlaps slides straight down until it is clear, and so does any card those
 * hit, by the least needed, top to bottom. Nothing else moves: they keep x, w and h.
 */
function pushDown(others: WidgetInstance[], fixed: WidgetInstance): Map<string, WidgetInstance> {
  const placed: WidgetInstance[] = [fixed]
  const out = new Map<string, WidgetInstance>()
  for (const k of [...others].sort((a, b) => a.y - b.y || a.x - b.x)) {
    let y = k.y
    for (;;) {
      const hit = placed.find((p) => overlaps(p.x, p.x + p.w, k.x, k.x + k.w) && overlaps(p.y, p.y + p.h, y, y + k.h))
      if (!hit) break
      y = hit.y + hit.h
    }
    const n = y === k.y ? k : { ...k, y }
    placed.push(n)
    out.set(k.id, n)
  }
  return out
}

/** Puts `rect` (a card, new or moved) in block `gi`, sliding down what it overlaps; the card leaves the block it was in. */
function putIn(items: WidgetInstance[], groups: Group[], gi: number, rect: WidgetInstance): WidgetInstance[] {
  const g = groups[gi] as { ids: string[]; origin: number }
  const byId = new Map(items.map((w) => [w.id, w]))
  const next = groups.map((x) => ("ids" in x ? { ...x, ids: x.ids.filter((id) => id !== rect.id) } : x))
  const target = next[gi] as { ids: string[]; origin: number }
  const others = g.ids.filter((id) => id !== rect.id).map((id) => byId.get(id)!)
  for (const [id, t] of pushDown(others, rect)) byId.set(id, t)
  byId.set(rect.id, rect)
  target.ids.push(rect.id)
  return reflow(items, next, byId)
}

/** The last block, or (a page with no cards yet, or only bands) a new one after the last band. */
function withBlock(groups: Group[]): { groups: Group[]; gi: number } {
  const last = groups[groups.length - 1]
  if (last && "ids" in last) return { groups, gi: groups.length - 1 }
  const origin = last ? last.band.y + Math.max(1, last.band.h) : 0
  return { groups: [...groups, { ids: [], origin }], gi: groups.length }
}

const bottomOf = (tiles: WidgetInstance[]) => Math.max(0, ...tiles.map((t) => t.y + t.h))

// ---------- resizing a card

/** Which edges of a card a drag moves: one edge, or two (a corner). */
export type Edges = { l?: boolean; r?: boolean; t?: boolean; b?: boolean }

/**
 * The page with card `id` dragged by `d` (columns to the right, rows down) at `edges`: only that card changes its x, y, w and h, snapped
 * (a column, a half row), never below its own minimum, never off the page (0 to 12), and its top edge stops at its block's top and at
 * any card above it (it never pushes upward). Growing into other cards slides them straight down, as little as needed (and cards those
 * hit); nothing else moves, and shrinking leaves empty space. It works from the layout the drag started with, so dragging back
 * restores whatever was pushed. `atMin`: the drag asked for less than the card's minimum.
 */
export function resizeCard(items: WidgetInstance[], id: string, edges: Edges, d: { dx: number; dy: number }, o: TileOptions): { items: WidgetInstance[]; atMin: boolean } {
  const c = items.find((w) => w.id === id)
  const groups = groupsOf(items)
  const gi = blockOf(groups, id)
  if (!c || gi < 0 || ownHeight(c)) return { items, atMin: false }
  const g = groups[gi] as { ids: string[]; origin: number }
  const byId = new Map(items.map((w) => [w.id, w]))
  const tiles = g.ids.map((i) => byId.get(i)!)
  let atMin = false
  let { x, w } = c
  if (edges.r) {
    const lo = Math.min(c.w, minWidth(c))
    const want = Math.round(c.w + d.dx)
    atMin = want < lo
    w = Math.min(12 - c.x, Math.max(lo, want))
  } else if (edges.l) {
    const right = c.x + c.w
    const lo = Math.min(c.w, minWidth(c))
    const want = Math.round(c.x + d.dx)
    atMin = want > right - lo
    x = Math.max(0, Math.min(right - lo, want))
    w = right - x
  }
  let { y, h } = c
  const probe = { ...c, x, w }
  const loH = Math.min(c.h, minHeight(probe, o))
  if (edges.b) {
    const want = half(c.h + d.dy)
    atMin = atMin || want < loH
    h = Math.max(loH, want)
  } else if (edges.t) {
    const bottom = c.y + c.h
    const stop = Math.max(g.origin, ...tiles.filter((t) => t.id !== id && t.y + t.h <= c.y + EPS && overlaps(t.x, t.x + t.w, x, x + w)).map((t) => t.y + t.h))
    const want = half(c.y + d.dy)
    atMin = atMin || want > bottom - loH
    y = Math.max(stop, Math.min(bottom - loH, want))
    h = bottom - y
  }
  if (x === c.x && w === c.w && y === c.y && h === c.h) return { items, atMin }
  return { items: putIn(items, groups, gi, { ...c, x, y, w, h }), atMin }
}

/** The card, at least `w` wide (taking the room on its right, else its left) and `h` tall: it grows, pushing what is below it down; it never shrinks. */
export function fitCard(items: WidgetInstance[], id: string, w: number, h: number): WidgetInstance[] {
  const c = items.find((t) => t.id === id)
  const groups = groupsOf(items)
  const gi = blockOf(groups, id)
  if (!c || gi < 0 || ownHeight(c)) return items
  const nw = Math.max(c.w, Math.min(12, w))
  const x = c.x + nw > 12 ? 12 - nw : c.x
  const nh = Math.max(c.h, up(h))
  if (nw === c.w && nh === c.h && x === c.x) return items
  return putIn(items, groups, gi, { ...c, x, w: nw, h: nh })
}

// ---------- putting a card in, taking it out

/** Where a card lands: at column `x`, row `y` (from the block's start) of block number `block` (counting blocks, not bands), or after the last block. */
export type Target = { block: number; x: number; y: number; /** The card takes exactly this size there (an empty slot, see slotAt). */ slot?: { w: number; h: number } } | { end: true }

/** An empty rectangle of a block, in columns and rows from the block's start. */
export type Slot = { x: number; y: number; w: number; h: number }

/**
 * Where a card fits in the empty space under the pointer (column `x`, row `y`, in the block number `block`): at its own size, shrunk only
 * as far as the empty space needs (never below its minimum), never grown to fill it. The room the card is in
 * now counts as empty, and so do the empty rows down to the block's bottom (the ragged end). Null when the cell is taken by a card, is the
 * card's own place, or no empty rectangle is big enough: then the card keeps its own size.
 */
export function slotAt(items: WidgetInstance[], card: WidgetInstance, cell: { block: number; x: number; y: number }, o: TileOptions): Slot | null {
  if (ownHeight(card)) return null
  const groups = groupsOf(items)
  const blocks = groups.filter((g): g is { ids: string[]; origin: number } => "ids" in g)
  const g = blocks[cell.block]
  if (!g) return null
  const byId = new Map(items.map((w) => [w.id, w]))
  const own = g.ids.includes(card.id) ? byId.get(card.id) : undefined
  const cells = toCells(g.ids.filter((id) => id !== card.id).map((id) => byId.get(id)!), g.origin)
  const rows = Math.max(rowsOfCells(cells), own ? Math.round((own.y + own.h - g.origin) * 2) : 0)
  const cx = Math.round(cell.x)
  const cy = Math.floor(cell.y * 2 + 1e-9)
  if (cx < 0 || cx > 11 || cy < 0 || cy >= rows) return null
  if (own && cx >= own.x && cx < own.x + own.w && cy >= Math.round((own.y - g.origin) * 2) && cy < Math.round((own.y + own.h - g.origin) * 2)) return null
  const occ = new Array<boolean>(12 * rows).fill(false)
  for (const c of cells) for (let r = c.y; r < c.y + c.h; r++) for (let x = c.x; x < c.x + c.w; x++) occ[r * 12 + x] = true
  const free = (r: number, x: number) => !occ[r * 12 + x]
  if (!free(cy, cx)) return null
  // For each column: how far the empty run through the cell reaches up and down.
  const lo: number[] = []
  const hi: number[] = []
  for (let x = 0; x < 12; x++) {
    let a = cy
    while (a > 0 && free(a - 1, x)) a--
    let b = cy + 1
    while (b < rows && free(b, x)) b++
    lo[x] = free(cy, x) ? a : cy
    hi[x] = free(cy, x) ? b : cy
  }
  // The card keeps its own size: it only shrinks where the empty space is smaller, and never grows to fill it. Of the empty rectangles
  // through the cell, the one that leaves the card biggest wins; there the card sits at the rectangle's top left, shifted just enough to
  // stay under the pointer.
  const ownW = Math.min(12, Math.max(card.w, minWidth(card)))
  let best: Slot | null = null
  let bestArea = 0
  for (let x0 = cx; x0 >= 0 && free(cy, x0); x0--) {
    for (let x1 = cx + 1; x1 <= 12 && free(cy, x1 - 1); x1++) {
      const a = Math.max(...lo.slice(x0, x1))
      const b = Math.min(...hi.slice(x0, x1))
      const w = Math.min(ownW, x1 - x0)
      if (w < Math.min(12, minWidth(card))) continue
      const h2 = Math.min(Math.round(Math.max(card.h, minHeight({ ...card, w }, o)) * 2), b - a)
      if (h2 / 2 < minHeight({ ...card, w }, o)) continue
      const area = w * h2
      if (area > bestArea) {
        const x = Math.max(x0, cx + 1 - w)
        const y = Math.max(a, cy + 1 - h2)
        best = { x, y: y / 2, w, h: h2 / 2 }
        bestArea = area
      }
    }
  }
  return best
}

/** A full-width card, as tall as its layout is designed (never below what it can show). */
const strip = (card: WidgetInstance, o: TileOptions): WidgetInstance => {
  const c = { ...card, x: 0, w: 12 }
  return { ...c, h: Math.max(designedHeight(c, o), minHeight(c, o)) }
}

/** How many blocks the page has (what `Target.block` counts). */
export const blockCount = (items: WidgetInstance[]) => groupsOf(items).filter((g) => "ids" in g).length

/**
 * The page with `card` (moved from where it is, or new) put at `at`, at its own size: at that column and row, its block's start at the
 * earliest, and no lower than the block's bottom. Cards it overlaps slide down; the spot it left stays empty. `{ end: true }` is a
 * full-width card at the bottom of the last block. Null for the page title and a page's own tool.
 */
export function dropAt(items: WidgetInstance[], card: WidgetInstance, at: Target, o: TileOptions): WidgetInstance[] | null {
  if (ownHeight(card)) return null
  let groups = groupsOf(items)
  const blocks = groups.map((g, i) => ({ g, i })).filter((b) => "ids" in b.g)
  let gi: number
  let rect: WidgetInstance
  const byId = new Map(items.map((w) => [w.id, w]))
  const bottomRel = (i: number) => {
    const g = groups[i] as { ids: string[]; origin: number }
    return Math.max(0, bottomOf(g.ids.filter((id) => id !== card.id).map((id) => byId.get(id)!)) - g.origin)
  }
  if ("end" in at || !blocks.length) {
    const b = withBlock(groups)
    groups = b.groups
    gi = b.gi
    const s = strip(card, o)
    rect = { ...s, y: (groups[gi] as { origin: number }).origin + bottomRel(gi) }
  } else {
    gi = blocks[Math.max(0, Math.min(blocks.length - 1, at.block))].i
    // Empty space: the card takes the size slotAt fitted it to (nothing is there, so nothing moves).
    const sw = at.slot ? Math.min(12, at.slot.w) : 0
    const w = sw || Math.min(12, Math.max(card.w, minWidth(card)))
    const own = { ...card, w }
    const h = at.slot ? at.slot.h : Math.max(card.h, minHeight(own, o))
    rect = { ...own, h, x: Math.max(0, Math.min(12 - w, Math.round(at.x))), y: (groups[gi] as { origin: number }).origin + Math.max(0, Math.min(bottomRel(gi), half(at.y))) }
  }
  return putIn(items, groups, gi, rect)
}

/** The page without this card: its space stays empty (a block left shorter lets what follows come up with it). */
export function removeCard(items: WidgetInstance[], id: string): WidgetInstance[] {
  const groups = groupsOf(items).map((g) => ("ids" in g ? { ...g, ids: g.ids.filter((i) => i !== id) } : g)).filter((g) => !("band" in g && g.band.id === id))
  const byId = new Map(items.filter((w) => w.id !== id).map((w) => [w.id, w]))
  return reflow(items, groups, byId)
}

/** A copy of a card: directly below the original, the same size; what it overlaps slides down. */
export function duplicateCard(items: WidgetInstance[], id: string, copy: WidgetInstance): WidgetInstance[] | null {
  const c = items.find((w) => w.id === id)
  const groups = groupsOf(items)
  const gi = blockOf(groups, id)
  if (!c || gi < 0 || ownHeight(c)) return null
  return putIn(items, groups, gi, { ...copy, x: c.x, w: c.w, y: c.y + c.h, h: c.h })
}

/** A card first or last on the page, as a full-width card: at the top of the first block or the bottom of the last; what it overlaps slides down. */
export function stripAt(items: WidgetInstance[], card: WidgetInstance, where: "top" | "bottom", o: TileOptions): WidgetInstance[] | null {
  if (ownHeight(card)) return null
  if (where === "bottom" || !blockCount(items)) return dropAt(items, card, { end: true }, o)
  const groups = groupsOf(items)
  const gi = groups.findIndex((g) => "ids" in g)
  const s = strip(card, o)
  return putIn(items, groups, gi, { ...s, y: (groups[gi] as { origin: number }).origin })
}

// ---------- gaps

/** A block's cards as whole cells (a column wide, half a row tall), from the block's start. */
type Cell = { id: string; x: number; w: number; y: number; h: number }
const toCells = (tiles: WidgetInstance[], origin: number): Cell[] => tiles.map((t) => ({ id: t.id, x: t.x, w: t.w, y: Math.round((t.y - origin) * 2), h: Math.round(t.h * 2) }))
const rowsOfCells = (cells: Cell[]) => Math.max(0, ...cells.map((c) => c.y + c.h))
function occupancy(cells: Cell[]) {
  const rows = rowsOfCells(cells)
  const occ = new Array<string | null>(12 * rows).fill(null)
  for (const c of cells) for (let r = c.y; r < c.y + c.h; r++) for (let x = c.x; x < c.x + c.w; x++) occ[r * 12 + x] = c.id
  return { rows, occ }
}

/** The empty areas of the blocks, in columns and half rows from the block's start: each row's empty runs, joined down when they line up. */
function emptyAreas(cells: Cell[]) {
  const { rows, occ } = occupancy(cells)
  const out: { x: number; w: number; y: number; h: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < 12; ) {
      if (occ[r * 12 + x]) {
        x++
        continue
      }
      let e = x
      while (e < 12 && !occ[r * 12 + e]) e++
      const above = out.find((a) => a.x === x && a.w === e - x && a.y + a.h === r)
      if (above) above.h++
      else out.push({ x, w: e - x, y: r, h: 1 })
      x = e
    }
  }
  return out
}

/** Whether any block has an empty cell (inside its rectangle, down to its lowest card). */
export function hasGaps(items: WidgetInstance[]): boolean {
  const byId = new Map(items.map((w) => [w.id, w]))
  return groupsOf(items).some((g) => "ids" in g && emptyAreas(toCells(g.ids.map((i) => byId.get(i)!), g.origin)).length > 0)
}

/** The empty areas as px rectangles on the page (for the editor to draw): `placement` says where each block is. */
export function gapRects(items: WidgetInstance[], placement: Placement, o: TileOptions): { left: number; top: number; width: number; height: number }[] {
  const byId = new Map(items.map((w) => [w.id, w]))
  const unit = (o.width + o.gap) / 12
  const pitch = ROW_HEIGHT + o.gap
  const tops = placement.blocks.filter((b) => !b.band)
  const out: { left: number; top: number; width: number; height: number }[] = []
  groupsOf(items)
    .filter((g): g is { ids: string[]; origin: number } => "ids" in g)
    .forEach((g, i) => {
      const top = tops[i]?.top
      if (top === undefined) return
      for (const a of emptyAreas(toCells(g.ids.map((id) => byId.get(id)!), g.origin))) out.push({ left: a.x * unit, top: top + (a.y / 2) * pitch, width: a.w * unit - o.gap, height: (a.h / 2) * pitch - o.gap })
    })
  return out
}

/** Fills the empty cells of one block (cells from its start), in place. */
function fillBlock(cells: Cell[]) {
  // First, every card rises straight up as far as it can, keeping its columns.
  const done: Cell[] = []
  for (const c of [...cells].sort((a, b) => a.y - b.y || a.x - b.x)) {
    c.y = Math.max(0, ...done.filter((p) => p.x < c.x + c.w && c.x < p.x + p.w).map((p) => p.y + p.h))
    done.push(c)
  }
  // Then what is still empty is taken by stretching a neighbour sideways, or the card above downward (the card below upward, last).
  for (let guard = 0; guard < 400; guard++) {
    const { rows, occ } = occupancy(cells)
    const at = occ.indexOf(null)
    if (at < 0) return
    const r = Math.floor(at / 12)
    const col = at % 12
    const free = (rr: number, cc: number) => rr >= 0 && rr < rows && cc >= 0 && cc < 12 && !occ[rr * 12 + cc]
    const owner = (rr: number, cc: number) => (rr >= 0 && rr < rows && cc >= 0 && cc < 12 ? cells.find((c) => c.id === occ[rr * 12 + cc]) : undefined)
    let moved = false
    const left = owner(r, col - 1)
    if (left && left.x + left.w === col) {
      let k = 0
      while (col + k < 12 && Array.from({ length: left.h }, (_, i) => free(left.y + i, col + k)).every(Boolean)) k++
      if (k) {
        left.w += k
        moved = true
      }
    }
    if (!moved) {
      let e = col
      while (e < 12 && !occ[r * 12 + e]) e++
      const right = owner(r, e)
      if (right && right.x === e) {
        let k = 0
        while (e - 1 - k >= 0 && Array.from({ length: right.h }, (_, i) => free(right.y + i, e - 1 - k)).every(Boolean)) k++
        if (k) {
          right.x -= k
          right.w += k
          moved = true
        }
      }
    }
    if (!moved) {
      const above = owner(r - 1, col)
      if (above && above.y + above.h === r) {
        let k = 0
        while (Array.from({ length: above.w }, (_, i) => free(r + k, above.x + i)).every(Boolean)) k++
        if (k) {
          above.h += k
          moved = true
        }
      }
    }
    if (!moved) {
      let rr = r
      while (rr < rows && !occ[rr * 12 + col]) rr++
      const below = owner(rr, col)
      if (below && below.y === rr) {
        let k = 0
        while (Array.from({ length: below.w }, (_, i) => free(below.y - 1 - k, below.x + i)).every(Boolean)) k++
        if (k) {
          below.y -= k
          below.h += k
          moved = true
        }
      }
    }
    if (!moved) return repack(cells)
  }
  repack(cells)
}

/**
 * The last resort, when an empty pocket is walled in so that no card can take it without another giving way: the block's cards in
 * reading order fill rows (up to four, as wide as 12 allows), each row sharing out its width and as tall as its tallest card. Nobody gets
 * smaller; there is no gap left.
 */
function repack(cells: Cell[]) {
  const order = [...cells].sort((a, b) => a.y - b.y || a.x - b.x)
  let y = 0
  let row: Cell[] = []
  const flush = () => {
    if (!row.length) return
    const ws = row.map((c) => c.w)
    for (let i = 0, extra = 12 - ws.reduce((n, v) => n + v, 0); extra > 0; i = (i + 1) % ws.length, extra--) ws[i]++
    const h = Math.max(...row.map((c) => c.h))
    let x = 0
    row.forEach((c, i) => {
      Object.assign(c, { x, w: ws[i], y, h })
      x += ws[i]
    })
    y += h
    row = []
  }
  for (const c of order) {
    if (row.length >= 4 || row.reduce((n, v) => n + v.w, 0) + c.w > 12) flush()
    row.push(c)
  }
  flush()
}

/**
 * The page with no empty cells: in each block (only those holding a card of `only`, if given) the cards rise straight up as far as they
 * can, then what is left empty is taken by stretching a neighbour sideways or the card above downward. Blocks and bands after a block that
 * got shorter move up with it.
 */
export function fillGaps(items: WidgetInstance[], only?: ReadonlySet<string>): WidgetInstance[] {
  const groups = groupsOf(items)
  const byId = new Map(items.map((w) => [w.id, w]))
  for (const g of groups) {
    if (!("ids" in g) || (only && !g.ids.some((i) => only.has(i)))) continue
    const cells = toCells(g.ids.map((i) => byId.get(i)!), g.origin)
    fillBlock(cells)
    for (const c of cells) byId.set(c.id, { ...byId.get(c.id)!, x: c.x, w: c.w, y: g.origin + c.y / 2, h: c.h / 2 })
  }
  return reflow(items, groups, byId)
}

/** The page's tiles without these cards: blocks that lost a card close up (see fillGaps), the rest is as saved. */
export function withoutCards(items: WidgetInstance[], hide: ReadonlySet<string>): WidgetInstance[] {
  const groups = groupsOf(items)
  const touched = new Set<string>()
  for (const g of groups) if ("ids" in g && g.ids.some((i) => hide.has(i))) for (const i of g.ids) if (!hide.has(i)) touched.add(i)
  const kept = items.filter((w) => !hide.has(w.id))
  const byId = new Map(kept.map((w) => [w.id, w]))
  const rest = groups.map((g) => ("ids" in g ? { ...g, ids: g.ids.filter((i) => !hide.has(i)) } : g)).filter((g) => !("band" in g && hide.has(g.band.id)))
  const next = reflow(kept, rest, byId)
  return touched.size ? fillGaps(next, touched) : next
}

/** Whether any two cards of a block overlap, or a card is off the page: the one rule a page of cards has to keep. */
export function hasOverlap(items: WidgetInstance[]): boolean {
  for (const g of groupsOf(items)) {
    if (!("ids" in g)) continue
    const tiles = g.ids.map((i) => items.find((w) => w.id === i)!)
    for (let a = 0; a < tiles.length; a++) {
      const p = tiles[a]
      if (p.x < -EPS || p.x + p.w > 12 + EPS || p.y < g.origin - EPS) return true
      for (let b = a + 1; b < tiles.length; b++) {
        const q = tiles[b]
        if (overlaps(p.x, p.x + p.w, q.x, q.x + q.w) && overlaps(p.y, p.y + p.h, q.y, q.y + q.h)) return true
      }
    }
  }
  return false
}

// ---------- drawing

/** The width a card drew at before tiles: one of 4, 8 and 12, as its layout allowed. */
function legacyFit(w: WidgetInstance) {
  const def = getWidget(w.type)
  const lw = legacyWidth(w.w)
  if (!def) return lw
  const { minW, maxW } = lookOf(def, w.variant)
  const old = [4, 8, 12]
  const nearest = (list: number[], to: number) => list.reduce((a, b) => (Math.abs(b - to) < Math.abs(a - to) ? b : a))
  const ok = old.filter((x) => x >= minW && x <= maxW)
  const list = ok.length ? ok : [nearest(old, minW)]
  return list.includes(lw) ? lw : nearest(list, lw)
}

/**
 * A page's tiles. Saved as tiles: the cards as they are. Anything else (a masonry, an earlier grid, a template): the cards in
 * reading order fill a row while their old widths fit in 12 (up to four), the row's width is shared out to the page, and it is as
 * tall as its tallest designed card; rows stack one under the other. The title and the page's own tool are a band of their own.
 */
export function toTiles(items: WidgetInstance[], o: TileOptions, saved: boolean): WidgetInstance[] {
  // Saved tiles keep the order they come in (the stacked order of phones); the geometry never depends on it.
  const ordered = saved ? items : readingOrder(items)
  if (saved) return ordered.map((w) => (ownHeight(w) ? { ...w, x: 0, w: 12, h: Math.max(1, w.h || 1) } : w))
  const out: WidgetInstance[] = []
  let y = 0
  let cur: WidgetInstance[] = []
  const flush = () => {
    if (!cur.length) return
    const ws = cur.map((c) => c.w)
    for (let i = 0, extra = 12 - ws.reduce((n, x) => n + x, 0); extra > 0; i = (i + 1) % ws.length, extra--) ws[i]++
    const cards = cur.map((c, i) => ({ ...c, w: ws[i] }))
    const h = Math.max(...cards.map((c) => designedHeight(c, o)))
    let x = 0
    for (const c of cards) {
      out.push({ ...c, x, y, h })
      x += c.w
    }
    y += h
    cur = []
  }
  for (const w of ordered) {
    if (ownHeight(w)) {
      flush()
      const h = Math.max(1, w.h || 1)
      out.push({ ...w, x: 0, y, w: 12, h })
      y += h
      continue
    }
    const wl = legacyFit(w)
    if (cur.length >= 4 || cur.reduce((n, c) => n + c.w, 0) + wl > 12) flush()
    cur.push({ ...w, w: wl })
  }
  flush()
  return out
}

/** Where every card and band is drawn, straight from the saved numbers: left = x/12 of the page, top = y rows down its block, height = h rows. */
export function planTiles(items: WidgetInstance[], o: PlanOptions): Placement {
  const pitch = ROW_HEIGHT + o.gap
  const spots = new Map<string, Spot>()
  const blocks: BlockSpot[] = []
  let top = 0
  let prevEnd = 0
  for (const p of partsOf(items)) {
    if ("band" in p) {
      prevEnd = p.band.y + Math.max(1, p.band.h)
      const px = o.ownPx(p.band)
      spots.set(p.band.id, { x: 0, w: 12, top })
      blocks.push({ ids: [p.band.id], top, height: px, band: true })
      top += px + o.gap
      continue
    }
    // A block starts right after the band before it: rows left empty at its top stay empty.
    const y0 = Math.min(prevEnd, ...p.tiles.map((t) => t.y))
    const rows = Math.max(...p.tiles.map((t) => t.y + t.h)) - y0
    for (const t of p.tiles) spots.set(t.id, { x: t.x, w: t.w, top: top + (t.y - y0) * pitch, height: t.h * pitch - o.gap })
    blocks.push({ ids: p.tiles.map((t) => t.id), top, height: rows * pitch - o.gap, band: false })
    top += rows * pitch
  }
  return { spots, blocks, height: Math.max(0, top - o.gap) }
}

/** The page's tiles (`layout`, with the hidden cards taken out and their blocks closed up) and where they are drawn (desktop). */
export function planGrid(items: WidgetInstance[], o: PlanOptions, hide?: ReadonlySet<string>) {
  let layout = toTiles(items, o, o.tiles)
  // A card the viewer doesn't see leaves no hole: its block closes up (see withoutCards).
  if (hide?.size) layout = withoutCards(layout, hide)
  return { layout, ...planTiles(layout, o) }
}

/** Tablets and phones: each card in the column where it starts highest (the masonry as it always was), as tall as its content (`heights`, px). */
export function placeStacked(items: WidgetInstance[], cols: number, heights: Record<string, number>, gap: number, spanOf: (w: WidgetInstance) => number, fallback: (w: WidgetInstance) => number): Placement {
  const tops = Array.from({ length: cols }, () => 0)
  const spots = new Map<string, Spot>()
  const per = 12 / cols
  for (const w of items) {
    const span = spanOf(w)
    let col = 0
    let best = Infinity
    for (let c = 0; c + span <= cols; c++) {
      const top = Math.max(...tops.slice(c, c + span))
      if (top < best - 0.5) {
        best = top
        col = c
      }
    }
    const top = Math.max(...tops.slice(col, col + span))
    spots.set(w.id, { x: col * per, w: span * per, top })
    const bottom = top + (heights[w.id] ?? fallback(w)) + gap
    for (let c = col; c < col + span; c++) tops[c] = bottom
  }
  return { spots, blocks: [], height: Math.max(0, ...tops.map((t) => t - gap)) }
}

