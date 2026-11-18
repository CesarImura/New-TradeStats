"use client"
import { toast } from "sonner"
import { ArrowDownToLine, ArrowUpToLine, Copy, Lock, MoreHorizontal, RotateCcw, Trash2, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getWidget, lookOf } from "@/components/widgets/registry"
import type { WidgetInstance } from "@/lib/widgets/layout"
import { type AddOptions } from "./builder-panels"
import { StyleTab, OpenRow } from "./widget-style-tab"
import { ContentTab, type PhoneOrder } from "./widget-content-tab"

export { OpenRow, type PhoneOrder }

/** Labels for the style a widget takes from All widgets, for the summaries in its rows. */
/**
 * The top of the right panel, the Framer way: no title block (the bar above already says which page, and the page
 * shows what is selected), just the panel's tabs or name on the left and its actions on the right.
 */
export function InspectorTop({ children, menu, onClose }: { children: React.ReactNode; menu?: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex h-14 min-w-0 items-center gap-1 pr-3 pl-4">
      <div className="min-w-0 flex-1">{children}</div>
      {menu}
      {onClose && (
        <Button variant="ghost" size="icon" aria-label="Close" title="Close (Esc)" onClick={onClose}>
          <X />
        </Button>
      )}
    </div>
  )
}

/**
 * The selected widget, in the right panel (the Framer inspector): its name and actions on top, then one column, no
 * tabs, in the order a coach needs it: Layout (size, how much it shows, its layout), Content (what it says), Style (stand out, card, background; the header and charts open beside the panel) and Visibility. Each
 * property is one row; a value set on this widget only is marked with a dot and its reset on hover. Every widget's
 * style is a place of its own, one link away. Reset this widget (⋯) puts its look and size back in one step.
 */
export function WidgetInspector({
  w,
  pinned,
  count,
  onScope,
  onChange,
  onDuplicate,
  onRemove,
  onMove,
  onClose,
  start,
  onDrag,
  phone,
}: {
  w: WidgetInstance
  /** The page's core widget: it can't be removed, duplicated or hidden. */
  pinned?: boolean
  count: { total: number; own: number }
  onScope: (s: "one" | "all") => void
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDuplicate: () => void
  onRemove: () => void
  onMove: (where: "top" | "bottom") => void
  onClose: () => void
  /** This widget as the page starts (the template's page), if it was there; else the widget's own defaults. */
  start?: WidgetInstance
  /** A layout dragged onto the page adds another widget of this type in that layout (starts with what it adds, ends with null). */
  onDrag?: (opts: AddOptions | null) => void
  /** Where phones show this widget, and how to change it. */
  phone?: PhoneOrder
}) {
  const def = getWidget(w.type)!
  const look = lookOf(def, w.variant)
  const first = lookOf(def, start?.variant).value
  const detail = w.detail ?? "standard"
  const emphasis = w.emphasis ?? "accent"
  const baseDetail = start?.detail ?? "standard"
  const baseEmphasis = start?.emphasis ?? "accent"
  const own = w.style ?? {}
  const changed =
    look.value !== first ||
    detail !== baseDetail ||
    emphasis !== baseEmphasis ||
    (!!w.header && Object.keys(w.header).length > 0) ||
    Object.values(own).some((v) => v !== undefined)
  const reset = () => {
    // One change, so one undo brings it all back. Content, visibility and phones stay.
    onChange({ variant: first, detail: start?.detail, emphasis: start?.emphasis, header: start?.header, style: start?.style }, `${w.id}-reset-widget`)
    toast("This widget is back to its default look.", { description: "Its content stays. Press ⌘Z to undo." })
  }
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`${def.name}: more actions`} title="More actions" />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!pinned && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy /> Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onMove("top")}>
          <ArrowUpToLine /> Bring to top
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove("bottom")}>
          <ArrowDownToLine /> Send to bottom
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!changed} onClick={reset}>
          <RotateCcw /> Reset this widget
        </DropdownMenuItem>
        {!pinned && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 /> Remove
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex min-h-full flex-col">
      {/* The widget's name and its actions; then one column, the Framer way: what it says first, then its size and its look. */}
      <InspectorTop menu={menu} onClose={onClose}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-a-muted [&_svg]:size-4">
            <def.icon />
          </span>
          <span className="truncate t-body-l-medium">{def.name}</span>
        </span>
      </InspectorTop>
      {pinned && (
        <p className="m-4 mb-0 flex gap-2 rounded-[6px] bg-a-muted p-2.5 t-caption text-muted-foreground">
          <Lock className="mt-px size-3.5 shrink-0" />
          The main part of this page. It always stays.
        </p>
      )}
      <StyleTab part="layout" w={w} pinned={pinned} start={start} onChange={onChange} onDrag={onDrag} onAllWidgets={() => onScope("all")} count={count} />
      <ContentTab w={w} pinned={pinned} onChange={onChange} part="content" />
      <StyleTab part="style" w={w} pinned={pinned} start={start} onChange={onChange} onDrag={onDrag} onAllWidgets={() => onScope("all")} count={count} />
      <ContentTab w={w} pinned={pinned} onChange={onChange} part="visibility" phone={phone} />
    </div>
  )
}
