"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { PAGE_ICONS, pageIdOf, type CustomPage, type MenuId, type PageIcon } from "@/lib/data/coaches"
import { uid } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { move, useDesign } from "./design-fields"
import { HIDDEN_INPUT, menuRow, SortHandle, SWITCH_OFF, useSort } from "./menu-sort"

/** A page the coach added: name, icon, order, on/off and remove. */
export function PageRow({ id }: { id: `page:${string}` }) {
  const { coach, change } = useDesign()
  const sort = useSort()
  const pageId = pageIdOf(id)
  const pages = coach.customPages ?? []
  const page = pages.find((p) => p.id === pageId)
  const i = coach.menu.indexOf(id)
  if (!page || i < 0) return null
  const on = page.on !== false
  const edit = (patch: Partial<CustomPage>, key: string) =>
    change({ content: { customPages: pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)) } }, key)
  const remove = () => {
    const hasLayout = Object.keys(coach.pages?.[id] ?? {}).length > 0
    if (hasLayout && !confirm(`Remove "${page.name}"? Its widgets are kept only if you add the page again.`)) return
    change({ content: { customPages: pages.filter((p) => p.id !== pageId), menu: coach.menu.filter((m) => m !== id) } }, `menu-${Date.now()}`)
  }
  const Icon = PAGE_ICONS[page.icon]
  return (
    <div data-field={`menu-${id}`} className={cn(menuRow(!on), "gap-1")}>
      <SortHandle />
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Icon for ${page.name}`} />}>
          <Icon />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(PAGE_ICONS) as PageIcon[]).map((k) => {
              const I = PAGE_ICONS[k]
              return (
                <Button key={k} variant={k === page.icon ? "secondary" : "ghost"} size="icon-xs" aria-label={k} onClick={() => edit({ icon: k }, `cp-icon-${pageId}`)}>
                  <I />
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        className={cn("h-7", HIDDEN_INPUT)}
        value={page.name}
        disabled={!on}
        onChange={(e) => edit({ name: e.target.value }, `cp-name-${pageId}`)}
        aria-label="Page name"
      />
      <div className="flex shrink-0 items-center">
        {/* In Design's sortable list the handle moves it; the setup's list keeps the arrows. */}
        {!sort && (
          <>
            <Button variant="ghost" size="icon-xs" disabled={i === 0} aria-label={`Move ${page.name} up`} onClick={() => change({ content: { menu: move(coach.menu, i, -1) } }, `menu-${Date.now()}`)}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-xs" disabled={i === coach.menu.length - 1} aria-label={`Move ${page.name} down`} onClick={() => change({ content: { menu: move(coach.menu, i, 1) } }, `menu-${Date.now()}`)}>
              <ArrowDown />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon-xs" aria-label={`Remove ${page.name}`} onClick={remove}>
          <Trash2 />
        </Button>
        <Switch size="sm" className={cn("ml-1.5", SWITCH_OFF)} checked={on} aria-label={`Show ${page.name}`} onCheckedChange={(v) => edit({ on: v }, `cp-on-${pageId}`)} />
      </div>
    </div>
  )
}

/** The "Add a page" button: a new page at the end of the menu, its name selected. */
export function AddPageButton() {
  const { coach, change } = useDesign()
  const addPage = () => {
    const pages = coach.customPages ?? []
    const id = `new-page-${uid().slice(0, 4)}`
    const menuId: MenuId = `page:${id}`
    change({ content: { customPages: [...pages, { id, name: "New page", icon: "file", on: true }], menu: [...coach.menu, menuId] } }, `menu-${Date.now()}`)
    // The row exists after the next render: put the cursor in its name.
    setTimeout(() => document.querySelector<HTMLInputElement>(`[data-field="menu-${menuId}"] input`)?.select(), 80)
  }
  return (
    <Button variant="outline" size="sm" className="justify-self-start" onClick={addPage}>
      <Plus /> Add a page
    </Button>
  )
}

