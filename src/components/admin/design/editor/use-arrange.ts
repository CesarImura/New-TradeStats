"use client"

import { verticalCompactor } from "react-grid-layout/core"
import { studentNav } from "@/components/coach/nav"
import { fitWidth, getWidget, heightFor, heightOf, lookOf } from "@/components/widgets/registry"
import { isPageId, type Coach } from "@/lib/data/coaches"
import { pageLayout } from "@/lib/theme/resolve"
import type { CoachTheme } from "@/lib/theme/types"
import { COLS, normalizeLayout, oneStar, phoneSequence, uid, withCore, type PageId, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
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
  const savePages = (next: typeof layouts, key: string) =>
    commit({ ...working, content: { ...working.content, pages: { ...coach.pages, [page]: next } } }, `${page}-${key}`)

  /**
   * Every edit goes through here. Only one Star per page: `keep` names the
   * widget that just became the star; any other star becomes Accent in the
   * same commit, so one undo brings both back.
   */
  const save = (next: PageLayout, key: string, keep?: string) => {
    const items = oneStar(next.items, keep)
    const demoted = next.items.filter((w, i) => w.emphasis === "star" && items[i].emphasis !== "star")
    // Keep "title removed on purpose", and set it when this save drops the Page title.
    const titleRemoved = page !== "home" && !items.some((w) => w.type === "page-header") ? true : undefined
    // An edit that doesn't touch the arrangement keeps it free (each widget in the column it was put in).
    const free = next.free ?? layout.free
    // The phone's order survives edits that don't touch it; "phoneOrder" present (even unset) is the coach changing it.
    const phoneOrder = "phoneOrder" in next ? next.phoneOrder : layout.phoneOrder
    savePages({ ...layouts, [tier]: { ...next, items, titleRemoved, free, phoneOrder } }, `${tier}-${key}`)
    if (demoted.length) {
      const names = demoted.map((w) => getWidget(w.type)?.name ?? "A widget").join(", ")
      toast(`${names} gave up ${demoted.length > 1 ? "their" : "its"} star.`, { description: "Only one Star per page; it is Accent now." })
    }
    if (inherits) toast(`${tierName} now has its own ${pageInfo.label} page. Other tiers keep the default.`)
  }
  const pinned = (id: string) => !!getWidget(layout.items.find((w) => w.id === id)?.type ?? "")?.core
  const updateItem = (id: string, patch: Partial<WidgetInstance>, key: string) => {
    const cur = layout.items.find((w) => w.id === id)
    const def = cur && getWidget(cur.type)
    // A new layout keeps the width only if the layout allows it (its minW to maxW), else the nearest it allows.
    if (cur && def && patch.variant) patch = { ...patch, w: fitWidth(def, patch.variant, patch.w ?? cur.w) }
    // Detailed shows more, so it gets more rows (and back); widgets below move down to make room.
    if (cur && def && patch.detail && patch.detail !== (cur.detail ?? "standard")) {
      const grow = heightFor(def, cur.variant, patch.detail) - heightFor(def, cur.variant, cur.detail)
      const next = { ...cur, ...patch, h: Math.max(lookOf(def, cur.variant).minH, cur.h + grow) }
      saveCompacted(layout.items.map((w) => (w.id === id ? next : w)), key)
      return
    }
    save({ items: layout.items.map((w) => (w.id === id ? { ...w, ...patch } : w)) }, key, patch.emphasis === "star" ? id : undefined)
  }

  /** Every widget on this page goes back to All widgets' style: the surface, tone, picture, header and charts they kept as their own. */
  const clearOwnStyles = () => save({ items: layout.items.map((w) => (w.style ? { ...w, style: undefined } : w)) }, "clear-own-styles")

  const addWidget = (type: string) => {
    const def = getWidget(type)!
    const look = def.variants[0]
    const bottom = layout.items.reduce((m, w) => Math.max(m, w.y + w.h), 0)
    const w: WidgetInstance = { id: uid(), type, x: 0, y: bottom, w: fitWidth(def, look.value, def.defaultW), h: look.h }
    save({ items: [...layout.items, w] }, `add-${w.id}`)
    setSelected(w.id)
    toast(`${def.name} added at the bottom. Drag it where you want it.`)
  }

  /** Save with the grid compacted upward, so the live page never has overlaps. */
  const saveCompacted = (items: WidgetInstance[], key: string) => {
    const packed = verticalCompactor.compact(items.map((w) => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h })), COLS)
    const pos = new Map(packed.map((g) => [g.i, g]))
    save({ items: items.map((w) => ({ ...w, x: pos.get(w.id)!.x, y: pos.get(w.id)!.y })) }, key)
  }
  const removeWidget = (id: string) => {
    if (pinned(id)) {
      toast(`${pageInfo.label} is the main part of this page, so it stays. Move or resize it instead.`)
      return
    }
    const def = getWidget(layout.items.find((w) => w.id === id)?.type ?? "")
    saveCompacted(layout.items.filter((w) => w.id !== id), `del-${id}`)
    if (selected === id) setSelected(null)
    toast(`${def?.name ?? "Widget"} removed.`, { description: "Press ⌘Z to undo." })
  }
  const duplicateWidget = (id: string) => {
    const w = layout.items.find((x) => x.id === id)
    if (!w || pinned(id)) return
    // A copy of the star is Accent: the original keeps the star.
    const copy: WidgetInstance = { ...w, id: uid(), y: w.y + w.h, emphasis: w.emphasis === "star" ? "accent" : w.emphasis }
    saveCompacted([...layout.items, copy], `dup-${copy.id}`)
    setSelected(copy.id)
  }
  const moveTo = (id: string, where: "top" | "bottom") =>
    saveCompacted(layout.items.map((w) => (w.id === id ? { ...w, y: where === "top" ? -1 : 9999 } : w)), `order-${uid()}`)
  /** The phone's order: the widgets phones show, in the order they show them. */
  const phoneList = phoneSequence(layout.items, layout.phoneOrder).filter((w) => !w.hideOnPhone).map((w) => w.id)
  const movePhone = (id: string, step: -1 | 1) => {
    const at = phoneList.indexOf(id)
    const to = at + step
    if (at < 0 || to < 0 || to >= phoneList.length) return
    const next = [...phoneList]
    ;[next[at], next[to]] = [next[to], next[at]]
    // Widgets hidden on phones keep their place at the end of the list, so showing one again puts it back near the desktop order.
    const hidden = layout.items.filter((w) => w.hideOnPhone).map((w) => w.id)
    save({ items: layout.items, phoneOrder: [...next, ...hidden] }, `${id}-phone-order`)
  }
  const resetPhoneOrder = () => save({ items: layout.items, phoneOrder: undefined }, "phone-order-reset")
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
    selWidget: layout.items.find((w) => w.id === selected) ?? null,
    pinned,
    save,
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
