"use client"

import Link from "next/link"
import { ArrowRight, Download, Lock } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { useAccess, useViewerTier } from "@/lib/data/access"
import { canDownload, categoryLabel, isRecent, shortDate, useDownloaded, useDownloads, type DownloadItem } from "@/lib/data/downloads"
import { cn } from "@/lib/utils"
import { TYPE, series, useMore } from "./kit"
import { Chip, WCard } from "./instrument"
import { Cover, WidgetEmpty, type WidgetProps } from "./shared"

/** Latest downloads: list (title and date), tiles (a small cover each), row (one line with the newest file). */
export function LatestDownloads({ variant = "list", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const all = useDownloads(coach)
  const done = useDownloaded(coach.slug)
  const tier = useViewerTier(coach)
  const access = useAccess(coach.slug)
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const count = Number(props.count) || 3
  const items = all
    .filter((d) => access.locked === "show" || canDownload(d, tier))
    .sort((a, b) => b.updated.localeCompare(a.updated))
  const shown = items.slice(0, count)
  const href = `${base}/downloads`
  const title = coach.wording.downloads

  if (items.length === 0) {
    return <WidgetEmpty icon={Download} title="No files yet" text={`${coach.coachName}'s indicators, templates and checklists will show here.`} />
  }

  const open = (d: DownloadItem) => canDownload(d, tier)
  const badge = (d: DownloadItem) => (!open(d) ? <Lock className="size-3.5 shrink-0 text-muted-foreground" /> : isRecent(d.updated) && !done.includes(d.id) ? <Chip>New</Chip> : null)
  const all_ = (
    <Link href={href} className="mt-auto flex w-fit items-center gap-1 text-[0.8125rem] font-medium hover:underline">
      All {items.length} files <ArrowRight className="size-3.5" />
    </Link>
  )

  if (variant === "row") {
    const d = items[0]
    return (
      <WCard row icon={Download} title={title} meta={more ? `${items.length} files` : undefined}>
        <Link href={href} className="ml-auto flex min-w-0 max-w-full items-center gap-2 text-[0.8125rem] hover:underline">
          <span className="truncate">{d.title}</span>
          {badge(d)}
          <ArrowRight className="size-3.5 shrink-0" />
        </Link>
      </WCard>
    )
  }

  if (variant === "tiles") {
    return (
      <WCard icon={Download} title={title} meta={`${items.length} files`}>
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 @xl:grid-cols-4">
          {shown.map((d) => (
            <Link key={d.id} href={href} className="relative flex min-h-0 flex-col gap-1.5 rounded-[min(var(--radius),8px)] border bg-card p-2 hover:bg-muted">
              <Cover color={series(d.cover ?? 0)} label={more ? d.file.type : undefined} className="min-h-10 flex-1" />
              <span className="flex items-center gap-1.5">
                <span className="line-clamp-1 min-w-0 flex-1 text-[0.8125rem] leading-5 font-medium">{d.title}</span>
                {badge(d)}
              </span>
            </Link>
          ))}
        </div>
        {all_}
      </WCard>
    )
  }

  return (
    <WCard icon={Download} title={title} meta={`${items.length} files`}>
      <div className="grid">
        {shown.map((d) => (
          <Link key={d.id} href={href} className="group flex min-w-0 items-center gap-2.5 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1.5 last:border-b-0">
            <span className="grid min-w-0 flex-1">
              <span className="truncate text-[0.8125rem] leading-5 font-medium group-hover:underline">{d.title}</span>
              {more && (
                <span className={cn(TYPE.small, "truncate")}>
                  {detailed ? `${categoryLabel(d.category)} · ${d.file.type} · ${d.file.size} · ` : ""}v{d.version} · {shortDate(d.updated)}
                </span>
              )}
            </span>
            {badge(d)}
          </Link>
        ))}
      </div>
      {all_}
    </WCard>
  )
}
