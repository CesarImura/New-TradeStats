"use client"

import { ArrowDownToLine, ArrowUpToLine, Copy, Pencil, Trash2 } from "@/components/icons"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { widthOf } from "@/components/widgets/page-renderer"
import { getWidget, lookOf, widthsFor } from "@/components/widgets/registry"
import type { Detail, Emphasis, WidgetInstance } from "@/lib/widgets/layout"
import { DETAIL, EMPHASIS, WIDTH } from "../panels/builder-panels"

/** Right-click menu for a widget on the grid. */
export function WidgetMenu({
  w,
  children,
  onOpen,
  onLook,
  onEmphasis,
  onDetail,
  onWidth,
  onDuplicate,
  onMove,
  onPhone,
  onRemove,
}: {
  w: WidgetInstance
  children: React.ReactNode
  onOpen: () => void
  onLook: (variant: string, minH: number) => void
  onEmphasis: (emphasis: Emphasis) => void
  onDetail: (detail: Detail) => void
  /** Columns: 4 (one), 8 (two) or 12 (the page's full width), as the layout allows (widthsFor). */
  onWidth: (cols: number) => void
  onDuplicate: () => void
  onMove: (where: "top" | "bottom") => void
  onPhone: (hide: boolean) => void
  onRemove: () => void
}) {
  const def = getWidget(w.type)
  if (!def) return <>{children}</>
  const look = lookOf(def, w.variant)
  return (
    <ContextMenu onOpenChange={(open) => open && onOpen()}>
      <ContextMenuTrigger render={<div className="size-full select-auto" />}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 font-[family-name:var(--ff-geist)]">
        <ContextMenuGroup>
          <ContextMenuLabel className="text-xs text-muted-foreground">{def.name}</ContextMenuLabel>
          <ContextMenuItem onClick={onOpen}>
            <Pencil /> Edit settings
          </ContextMenuItem>
          {def.variants.length > 1 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Layout</ContextMenuSubTrigger>
              <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
                <ContextMenuRadioGroup value={look.value} onValueChange={(v) => onLook(String(v), def.variants.find((x) => x.value === v)?.minH ?? 1)}>
                  {def.variants.map((v) => (
                    <ContextMenuRadioItem key={v.value} value={v.value}>
                      {v.label}
                    </ContextMenuRadioItem>
                  ))}
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          <ContextMenuSub>
            <ContextMenuSubTrigger>Stand out</ContextMenuSubTrigger>
            <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
              <ContextMenuRadioGroup value={w.emphasis ?? "accent"} onValueChange={(v) => onEmphasis(v as Emphasis)}>
                {EMPHASIS.map((o) => (
                  <ContextMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Shows</ContextMenuSubTrigger>
            <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
              <ContextMenuRadioGroup value={w.detail ?? "standard"} onValueChange={(v) => onDetail(v as Detail)}>
                {DETAIL.map((o) => (
                  <ContextMenuRadioItem key={o.value} value={o.value}>
                    {{ compact: "Less", standard: "Standard", detailed: "More" }[o.value]}
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          {!def.core && w.type !== "page-header" && widthsFor(def, w.variant).length > 1 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Width</ContextMenuSubTrigger>
              <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
                <ContextMenuRadioGroup value={widthOf(w)} onValueChange={(v) => onWidth(Number(v))}>
                  {WIDTH.map((o) => (
                    <ContextMenuRadioItem key={o.value} value={o.value} disabled={!widthsFor(def, w.variant).includes(o.value)}>
                      {o.label}
                    </ContextMenuRadioItem>
                  ))}
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          {!def.core && (
            <ContextMenuItem onClick={onDuplicate}>
              <Copy /> Duplicate
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onMove("top")}>
            <ArrowUpToLine /> Bring to top
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onMove("bottom")}>
            <ArrowDownToLine /> Send to bottom
          </ContextMenuItem>
          {!def.core && (
            <ContextMenuCheckboxItem checked={!!w.hideOnPhone} onCheckedChange={(v) => onPhone(!!v)}>
              Hide on phones
            </ContextMenuCheckboxItem>
          )}
        </ContextMenuGroup>
        {!def.core && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 /> Remove
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
