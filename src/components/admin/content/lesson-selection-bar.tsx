"use client"

import { ArrowRight, EyeOff, Trash2, X } from "@/components/icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AdminButton } from "../ui"

/**
 * The bar that appears when lessons are selected in the curriculum: how many, and what to do with them all at once.
 * It is a polite live region, so a screen reader hears the count as it changes. Esc clears the selection (see Curriculum).
 */
export function LessonSelectionBar({ count, modules, onMove, onHide, onDelete, onClear }: { count: number; modules: { id: string; title: string }[]; onMove: (moduleId: string) => void; onHide: () => void; onDelete: () => void; onClear: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-6 z-40 flex justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-200 motion-safe:ease-out">
      <div role="region" aria-label="Selected lessons" className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1.5 rounded-a-lg border border-a-border-strong bg-a-raised py-1.5 pr-1.5 pl-3.5 shadow-[0_16px_40px_rgb(0_0_0/0.55)]">
        <span role="status" aria-live="polite" className="mr-1.5 t-body-m text-a-text">
          {count} {count === 1 ? "lesson" : "lessons"} selected
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<AdminButton hierarchy="secondary" size="md" />}>
            <ArrowRight /> Move to
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Module</DropdownMenuLabel>
              {modules.map((m, i) => (
                <DropdownMenuItem key={m.id} onClick={() => onMove(m.id)}>
                  {i + 1} · {m.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AdminButton hierarchy="secondary" size="md" onClick={onHide}>
          <EyeOff /> Hide
        </AdminButton>
        <AdminButton hierarchy="danger" size="md" onClick={onDelete}>
          <Trash2 /> Delete
        </AdminButton>
        <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Clear selection" onClick={onClear}>
          <X />
        </AdminButton>
      </div>
    </div>
  )
}
