"use client"

import { useState } from "react"
import { Check, Download, Lock, Search } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { OwnTitle } from "@/components/student/own-title"
import { UnlockDialog } from "@/components/student/unlock-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/widgets/instrument"
import { series } from "@/components/widgets/kit"
import { Cover } from "@/components/widgets/shared"
import { useAccess, useViewerTier } from "@/lib/data/access"
import {
  DOWNLOAD_CATEGORIES,
  canDownload,
  categoryLabel,
  isRecent,
  markDownloaded,
  shortDate,
  useDownloaded,
  useDownloads,
  type DownloadItem,
} from "@/lib/data/downloads"
import { cn } from "@/lib/utils"

/** The Downloads page's core widget: files beyond the lessons, filtered by category, with what's new on top. */
export function StudentDownloads({ props = {} }: { props?: Record<string, string | boolean> } = {}) {
  const { coach } = useCoach()
  const items = useDownloads(coach)
  const done = useDownloaded(coach.slug)
  const tier = useViewerTier(coach)
  const access = useAccess(coach.slug)
  const [category, setCategory] = useState("all")
  const [q, setQ] = useState("")
  const [locked, setLocked] = useState<DownloadItem | null>(null)

  // The coach decides whether files for other tiers show locked (as an upsell) or not at all.
  const visible = items.filter((d) => access.locked === "show" || canDownload(d, tier))
  const categories = DOWNLOAD_CATEGORIES.filter((c) => visible.some((d) => d.category === c.id))
  const query = q.trim().toLowerCase()
  const shown = visible.filter((d) => (category === "all" || d.category === category) && (!query || `${d.title} ${d.description} ${d.file.name}`.toLowerCase().includes(query)))
  const fresh = visible.filter((d) => isRecent(d.updated) && canDownload(d, tier) && !done.includes(d.id))

  const get = (d: DownloadItem) => {
    markDownloaded(coach.slug, d.id)
    toast(`${d.file.name} downloaded`, { description: "In the real product the file saves to your device." })
  }

  return (
    <div className="flex flex-col page-gap">
      <OwnTitle>
        <div className="flex flex-col gap-1">
          <span className="eyebrow">
            {visible.length} {visible.length === 1 ? "file" : "files"} · {coach.name}
          </span>
          <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.downloads}</h1>
        </div>
      </OwnTitle>

      {visible.length === 0 ? (
        <Card className="items-center gap-3 rounded-(--radius) px-6 py-12 text-center">
          <Download className="size-8 text-muted-foreground" />
          <p className="font-medium">Nothing here yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">{coach.coachName} hasn&apos;t added any files yet. Indicators, templates and checklists will show here.</p>
        </Card>
      ) : (
        <>
          {fresh.length > 0 && props.whatsNew !== false && (
            <Card className="gap-3 rounded-(--radius) px-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg">What&apos;s new</h2>
                <Chip>{fresh.length}</Chip>
              </div>
              <div className="divide-y">
                {fresh.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="grid min-w-0 flex-1 basis-56 gap-0.5">
                      <span className="truncate text-sm font-medium">{d.title}</span>
                      <span className="text-xs text-muted-foreground">
                        v{d.version} · updated {shortDate(d.updated)} · {d.file.size}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => get(d)}>
                      <Download /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 flex-wrap gap-2" role="radiogroup" aria-label="Category">
              {[{ id: "all", label: "Everything" }, ...categories].map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "r-chip border px-3 py-1.5 text-sm transition-colors",
                    category === c.id ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {props.search !== false && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files" aria-label="Search files" className="pl-8" />
            </div>
            )}
          </div>

          {shown.length === 0 ? (
            <Card className="items-center gap-2 rounded-(--radius) px-6 py-10 text-center">
              <p className="font-medium">No file matches</p>
              <p className="text-sm text-muted-foreground">Try another word or category.</p>
            </Card>
          ) : (
            <div className="grid gap-[var(--page-gap)] sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((d) => {
                const open = canDownload(d, tier)
                const got = done.includes(d.id)
                const need = coach.tiers.find((t) => d.tiers.includes(t.id))
                return (
                  <Card key={d.id} className="gap-0 overflow-hidden rounded-(--radius) p-0">
                    <div className="relative">
                      <Cover color={series(d.cover ?? 0)} label={d.file.type} className="aspect-[16/7] rounded-none" />
                      {!open && (
                        <div className="absolute inset-0 grid place-items-center bg-black/45 text-white backdrop-blur-[1px]">
                          <Lock className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="grid gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="eyebrow">{categoryLabel(d.category)}</span>
                          {open && got ? (
                            <Chip tone="neutral">
                              <Check className="mr-1 size-3" /> Downloaded
                            </Chip>
                          ) : open && isRecent(d.updated) ? (
                            <Chip>New</Chip>
                          ) : null}
                        </div>
                        <h3 className="text-base leading-snug">{d.title}</h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {d.file.type} · {d.file.size} · v{d.version} · {shortDate(d.updated)}
                        </span>
                        {open ? (
                          <Button size="sm" variant={got ? "outline" : "default"} onClick={() => get(d)}>
                            <Download /> Download
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setLocked(d)}>
                            <Lock /> Unlock with {need?.name ?? "a higher tier"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
      <UnlockDialog title={locked?.title} tiers={locked?.tiers ?? []} open={!!locked} onOpenChange={(o) => !o && setLocked(null)} />
    </div>
  )
}
