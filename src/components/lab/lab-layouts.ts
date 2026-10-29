"use client"

import { getWidget } from "@/components/widgets/registry"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { uid, type WidgetInstance } from "@/lib/widgets/layout"
import { read, useKey, write } from "./lab-themes"

/**
 * The library's page layouts (prototype only): which widgets a student page
 * holds, where and how big, on the 12-column grid. The starting points are
 * the templates' Homes; layouts made here live in this browser only. Any
 * layout can be shown in any theme.
 */
export type LabLayout = { id: string; name: string; items: WidgetInstance[]; builtIn?: boolean; updated?: number }

/** The templates' Homes, minus widgets the library doesn't have. */
export const BUILT_IN_LAYOUTS: LabLayout[] = TEMPLATE_IDS.map((id) => ({
  id: `home-${id}`,
  name: `${TEMPLATES[id].name} Home`,
  builtIn: true,
  items: (TEMPLATES[id].pages.home?.items ?? []).filter((w) => getWidget(w.type)).map((w, i) => ({ ...w, id: `${id}-${i}` }) as WidgetInstance),
}))

const KEY = "lab-layouts-v1"
const ACTIVE = "lab-layout-active"
const COMPARE = "lab-layout-compare-v1"
const NONE: LabLayout[] = []
const DEFAULT_COMPARE = BUILT_IN_LAYOUTS.map((l) => l.id)

export function useLabLayouts() {
  const mine = useKey<LabLayout[]>(KEY, NONE)
  const activeId = useKey<string>(ACTIVE, BUILT_IN_LAYOUTS[0].id)
  const compareIds = useKey<string[]>(COMPARE, DEFAULT_COMPARE)
  const all = [...mine, ...BUILT_IN_LAYOUTS]
  const byId = (id: string) => all.find((l) => l.id === id)
  const active = byId(activeId) ?? BUILT_IN_LAYOUTS[0]
  const compared = compareIds.map(byId).filter((l): l is LabLayout => !!l)
  return { all, mine, active, byId, compared, pick: (id: string) => write(ACTIVE, id) }
}
export type LabLayouts = ReturnType<typeof useLabLayouts>

const mineNow = () => read<LabLayout[]>(KEY, NONE)
const lid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const setComparedLayouts = (ids: string[]) => write(COMPARE, ids)

export function saveLayout(layout: LabLayout) {
  const list = mineNow()
  const next = { ...layout, builtIn: undefined, updated: Date.now() }
  write(KEY, list.some((l) => l.id === layout.id) ? list.map((l) => (l.id === layout.id ? next : l)) : [next, ...list])
}

/** A copy of any layout (fresh widget ids), saved and opened. Returns its id. */
export function duplicateLayout(from: LabLayout, name = `${from.name} copy`): string {
  const id = lid()
  saveLayout({ id, name, items: from.items.map((w) => ({ ...w, id: uid() })) })
  write(ACTIVE, id)
  return id
}

/** An empty page. */
export function createLayout(): string {
  const id = lid()
  saveLayout({ id, name: `My layout ${mineNow().length + 1}`, items: [] })
  write(ACTIVE, id)
  return id
}

export function deleteLayout(id: string): LabLayout | undefined {
  const list = mineNow()
  const gone = list.find((l) => l.id === id)
  write(
    KEY,
    list.filter((l) => l.id !== id),
  )
  if (read(ACTIVE, "") === id) write(ACTIVE, BUILT_IN_LAYOUTS[0].id)
  const cmp = read<string[]>(COMPARE, DEFAULT_COMPARE)
  if (cmp.includes(id))
    write(
      COMPARE,
      cmp.filter((x) => x !== id),
    )
  return gone
}

export function restoreLayout(layout: LabLayout) {
  write(KEY, [layout, ...mineNow().filter((l) => l.id !== layout.id)])
}
