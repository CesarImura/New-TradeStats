"use client"

import { useState } from "react"
import { studentNav } from "@/components/coach/nav"
import { designedHeight, dropAt, duplicateCard, fillGaps, fitCard, hasGaps, minHeight, minWidth, removeCard, stripAt, toTiles, type TileOptions } from "@/components/widgets/page-grid"
import { getWidget, heightOf } from "@/components/widgets/registry"
import { isPageId, type Coach } from "@/lib/data/coaches"
import { DENSITY } from "@/lib/theme/css"
import { pageLayout } from "@/lib/theme/resolve"
import type { CoachTheme } from "@/lib/theme/types"
import { GAP, normalizeLayout, oneStar, phoneSequence, placeInOrder, stackOrder, uid, withCore, type PageId, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { toast } from "./canvas-toast"
import type { useDraftEditor } from "./editor-shell"

/**
 * ADM-37 / ADM-39: the layout of one student page, per tier, and every edit
 * to it. Home is all widgets; a module page also has its core widget (the
 * page's own tool), which can move and resize but not be removed.
 */
export function useArrange({
  coach,
  theme,
  editor,
  page,
  tier,
  selected,
  setSelected,
}: {
  coach: Coach
  theme: CoachTheme
  editor: ReturnType<typeof useDraftEditor>
  page: PageId
  tier: string
  selected: string | null
  setSelected: (id: string | null) => void
}) {
  const { working, commit } = editor
  const pages = studentNav(coach, `/c/${coach.slug}`)
  const pageInfo = pages.find((p) => p.id === page) ?? pages[0]
  const layouts = coach.pages?.[page] ?? {}
  const baseLayout = pageLayout(coach, page, theme.template, undefined, heightOf)
  const inherits = tier !== "default" && !layouts[tier]
  const own = (l: PageLayout) => (page === "home" || isPageId(page) ? l : withCore(page, l))
  const layout = tier === "default" || !layouts[tier] ? baseLayout : own(normalizeLayout(layouts[tier], heightOf))
  const tierName = coach.tiers.find((t) => t.id === tier)?.name

  // The page's width in px, as the canvas last laid it out (set by the canvas): a card's least height and a note's rows depend on it.
  // 0 until it is known (the editor opened on a tablet or phone), then they are worked out without the card's px.
  const [pageWidth, setMeasure] = useState(0)
  const opts: TileOptions = { gap: GAP[theme.density], width: pageWidth, pad: 16 * DENSITY[theme.density] }
  /** The page's tiles (a layout saved before tiles is turned into them, as it is drawn). */
  const tiles = toTiles(stackOrder(layout), opts, !!layout.tiles)
  const savePages = (next: typeof layouts, key: string) =>
    commit({ ...working, content: { ...working.content, pages: { ...coach.pages, [page]: next } } }, `${page}-${key}`)

  /**
   * Every edit goes through here. Only one Star per page: `keep` names the
   * widget that just became the star; any other star becomes Accent in the
   * same commit, so one undo brings both back.
   */
  const save = (next: PageLayout, key: string, keep?: string) => {
    // The first save from the editor puts the page on tiles: a masonry's cards get the rectangles they are drawn in.
    const asTiles = next.tiles ?? layout.tiles ? next.items : toTiles(next.items, opts, false)
    const items = oneStar(asTiles, keep)
    const demoted = asTiles.filter((w, i) => w.emphasis === "star" && items[i].emphasis !== "star")
    // Keep "title removed on purpose", and set it when this save drops the Page title.
    const titleRemoved = page !== "home" && !items.some((w) => w.type === "page-header") ? true : undefined
    // The phone's order survives edits that don't touch it; "phoneOrder" present (even unset) is the coach changing it.
    const phoneOrder = "phoneOrder" in next ? next.phoneOrder : layout.phoneOrder
    savePages({ ...layouts, [tier]: { ...next, items, titleRemoved, tiles: true, ordered: true, phoneOrder } }, `${tier}-${key}`)
    if (demoted.length) {
      const names = demoted.map((w) => getWidget(w.type)?.name ?? "A widget").join(", ")
      toast(`${names} gave up ${demoted.length > 1 ? "their" : "its"} star.`, { description: "Only one Star per page; it is Accent now." })
    }
    if (inherits) toast(`${tierName} now has its own ${pageInfo.label} page. Other tiers keep the default.`)
  }
  /** Saves the page as these tiles. */
  // `place`: the card that was moved or added, which takes its stacked place from where it landed. Without it (a line moved, a card removed
  // or restyled) the stacked order of phones stays as it was.
  const commitTiles = (next: WidgetInstance[], key: string, keep?: string, place?: string) => save({ items: place ? placeInOrder(next, place) : next, tiles: true }, key, keep)
  const pinned = (id: string) => !!getWidget(layout.items.find((w) => w.id === id)?.type ?? "")?.core
  const updateItem = (id: string, patch: Partial<WidgetInstance>, key: string) => {
    if (!tiles.some((c) => c.id === id)) return
    // A card's rectangle is the coach's, dragged on the canvas: a patch never carries one.
    const rest = { ...patch }
    delete rest.x
    delete rest.y
    delete rest.w
    delete rest.h
    let next = tiles.map((c) => (c.id === id ? { ...c, ...rest } : c))
    // A new layout, Detail or note may need more room: only that card grows (wider, taller), and what it grows into slides down. Choosing a
    // Detail asks for what it shows. Never smaller than before.
    if ("variant" in patch || "detail" in patch || "note" in patch) {
      const c = next.find((x) => x.id === id)!
      next = fitCard(next, id, minWidth(c), 0)
      const now = next.find((x) => x.id === id)!
      next = fitCard(next, id, 0, "detail" in patch && patch.detail !== undefined ? Math.max(minHeight(now, opts), designedHeight(now, opts)) : minHeight(now, opts))
    }
    commitTiles(next, key, patch.emphasis === "star" ? id : undefined)
  }

  /** Every widget on this page goes back to All widgets' style: the surface, tone, picture, header and charts they kept as their own. */
  const clearOwnStyles = () => save({ items: stackOrder(layout).map((w) => (w.style ? { ...w, style: undefined } : w)) }, "clear-own-styles")

  /** Adds a card at the bottom of the last block, full width. */
  const append = (w: WidgetInstance) => {
    const next = dropAt(tiles, w, { end: true }, opts)
    if (next) commitTiles(next, `add-${w.id}`, undefined, w.id)
  }
  const addWidget = (type: string) => {
    const def = getWidget(type)!
    const w: WidgetInstance = { id: uid(), type, x: 0, y: 0, w: 12, h: def.variants[0].h }
    append(w)
    setSelected(w.id)
    toast(`${def.name} added at the bottom. Drag it where you want it.`)
  }

  const removeWidget = (id: string) => {
    if (pinned(id)) {
      toast(`${pageInfo.label} is the main part of this page, so it stays. Move or resize it instead.`)
      return
    }
    const def = getWidget(layout.items.find((w) => w.id === id)?.type ?? "")
    commitTiles(removeCard(tiles, id), `del-${id}`)
    if (selected === id) setSelected(null)
    toast(`${def?.name ?? "Widget"} removed.`, { description: "Press ⌘Z to undo." })
  }
  const duplicateWidget = (id: string) => {
    const w = tiles.find((c) => c.id === id)
    if (!w || pinned(id)) return
    // A copy of the star is Accent: the original keeps the star. It goes directly below the original, the same size.
    const copy: WidgetInstance = { ...w, id: uid(), emphasis: w.emphasis === "star" ? "accent" : w.emphasis }
    const next = duplicateCard(tiles, id, copy)
    if (next) commitTiles(next, `dup-${copy.id}`, undefined, copy.id)
    setSelected(copy.id)
  }
  const moveTo = (id: string, where: "top" | "bottom") => {
    const w = tiles.find((c) => c.id === id)
    const next = w && stripAt(tiles, w, where, opts)
    if (next) commitTiles(next, `order-${uid()}`, undefined, id)
  }
  /** The phone's order: the widgets phones show, in the order they show them. */
  const phoneList = phoneSequence(stackOrder(layout), layout.phoneOrder).filter((w) => !w.hideOnPhone).map((w) => w.id)
  const movePhone = (id: string, step: -1 | 1) => {
    const at = phoneList.indexOf(id)
    const to = at + step
    if (at < 0 || to < 0 || to >= phoneList.length) return
    const next = [...phoneList]
    ;[next[at], next[to]] = [next[to], next[at]]
    // Widgets hidden on phones keep their place at the end of the list, so showing one again puts it back near the desktop order.
    const hidden = layout.items.filter((w) => w.hideOnPhone).map((w) => w.id)
    save({ items: stackOrder(layout), phoneOrder: [...next, ...hidden] }, `${id}-phone-order`)
  }
  const resetPhoneOrder = () => save({ items: stackOrder(layout), phoneOrder: undefined }, "phone-order-reset")
  /** Closes every gap on the page: one undo step. */
  const fillAll = () => commitTiles(fillGaps(tiles), `fill-${uid()}`)
  const useDefault = () => {
    const rest = { ...layouts }
    delete rest[tier]
    savePages(rest, `reset-${tier}`)
    toast(`${tierName} uses the default ${pageInfo.label} page again.`)
  }

  return {
    page,
    tier,
    pageInfo,
    layout,
    layouts,
    inherits,
    tierName,
    selected,
    setSelected,
    selWidget: tiles.find((w) => w.id === selected) ?? null,
    pinned,
    save,
    tiles,
    gaps: hasGaps(tiles),
    fillAll,
    opts,
    setMeasure,
    commitTiles,
    append,
    updateItem,
    clearOwnStyles,
    addWidget,
    removeWidget,
    duplicateWidget,
    moveTo,
    phoneList,
    movePhone,
    resetPhoneOrder,
    useDefault,
  }
}

export type Arrange = ReturnType<typeof useArrange>
