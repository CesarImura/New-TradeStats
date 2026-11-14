"use client"

import Link from "next/link"
import { ArrowLeft, MoreHorizontal, Redo2, Undo2 } from "@/components/icons"
import { AdminButton, AdminMenu, AdminMenuContent, AdminMenuTrigger, Tag } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

/** What the status tag says about the draft (Figma "Top bar" 01, 04, 05): unpublished and saved, publish failed, or live and up to date. */
export type PublishStatus = { kind: "unpublished"; changes: number } | { kind: "failed" } | { kind: "published" }

/** Status as a Tag with a dot: Warning, Danger or Success. A count of changes only when it is known (it starts at 0 after a reload). */
export function PublishTag({ status, className }: { status: PublishStatus; className?: string }) {
  const tone = status.kind === "published" ? "success" : status.kind === "failed" ? "danger" : "warning"
  const text = status.kind === "published" ? "Published · up to date" : status.kind === "failed" ? "Publish failed" : status.changes > 0 ? `${status.changes} ${status.changes === 1 ? "change" : "changes"} · saved` : "Unpublished · saved"
  const title = status.kind === "published" ? "Students see this design" : status.kind === "failed" ? "Your changes are saved as a draft; publishing did not go through" : "Students still see the last published design"
  return (
    <Tag tone={tone} dot title={title} className={className}>
      {text}
    </Tag>
  )
}

/**
 * Admin / Editor Top bar (Figma 14/11): no fill, 56 high, 24 at the sides. Where you are on the left (the way back in secondary grey, the
 * screen's name in white), what you are looking at in the middle (`center`), the status, history (undo, redo, more: 2 apart) and the
 * Preview and Publish buttons on the right. One bar for the Design workspace and the all-pages overview.
 */
export function EditorTopBar({
  back,
  title = "Design",
  center,
  extra,
  status,
  history,
  moreItems,
  preview,
  onPublish,
  publishDisabled,
  slug,
  className,
}: {
  /** The way back: the Admin, or the setup wizard it was opened from. */
  back?: { href: string; label: string }
  title?: string
  center?: React.ReactNode
  /** Something that belongs before the status (the readability check), only when it has something to say. */
  extra?: React.ReactNode
  status: PublishStatus
  history: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
  /** The ⋯ menu's items (`AdminMenuItem`s). */
  moreItems: React.ReactNode
  /** The Preview control: an `AdminButton` (secondary, xl), as a link or as the trigger of a popover. */
  preview: React.ReactNode
  onPublish: () => void
  publishDisabled: boolean
  slug?: string
  className?: string
}) {
  return (
    <div
      data-design-slug={slug}
      className={cn("grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 max-xl:grid-cols-[auto_minmax(0,1fr)_auto] max-xl:gap-2 max-sm:h-auto max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:px-4 max-sm:py-2", className)}
    >
      <div className="flex min-w-0 items-center gap-6">
        {back && (
          <Link href={back.href} title={back.label === "Admin" ? "Back to the admin" : back.label} className="inline-flex items-center gap-1.5 rounded-a-sm t-body-m text-a-text-2 outline-none transition-colors duration-300 hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
            <ArrowLeft className="size-4" aria-hidden /> {back.label}
          </Link>
        )}
        <span className="t-body-m text-a-text max-lg:hidden">{title}</span>
      </div>
      {center ? <div className="flex min-w-0 items-center justify-center gap-4 max-sm:col-span-2 max-sm:row-start-2">{center}</div> : <span />}
      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-3 max-xl:gap-2 max-sm:gap-1">
        {extra}
        {/* Below 1280 px the bar keeps one line (QA 14/11, Gustavo): the status tag goes, Preview and Publish stay. */}
        <PublishTag status={status} className="max-xl:hidden" />
        <div className="flex items-center gap-0.5">
          <AdminButton hierarchy="ghost" iconOnly onClick={history.undo} disabled={!history.canUndo} aria-label="Undo" title="Undo (⌘Z)">
            <Undo2 />
          </AdminButton>
          <AdminButton hierarchy="ghost" iconOnly onClick={history.redo} disabled={!history.canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
            <Redo2 />
          </AdminButton>
          <AdminMenu>
            <AdminMenuTrigger render={<AdminButton hierarchy="ghost" iconOnly aria-label="More" />}>
              <MoreHorizontal />
            </AdminMenuTrigger>
            <AdminMenuContent align="end">{moreItems}</AdminMenuContent>
          </AdminMenu>
        </div>
        {preview}
        <AdminButton disabled={publishDisabled} onClick={onPublish}>
          Publish
        </AdminButton>
      </div>
    </div>
  )
}
