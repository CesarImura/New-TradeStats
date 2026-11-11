"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, MoreHorizontal, Trash2, Upload } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useTiers } from "@/lib/data/access"
import { DOWNLOAD_CATEGORIES, categoryLabel, daysAgo, saveDownloads, shortDate, useDownloads, type DownloadCategory, type DownloadFile, type DownloadItem } from "@/lib/data/downloads"
import { useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { PageHeader } from "../kit"
import { AdminButton, AdminDrawer, AdminField, AdminFilter, AdminSearch, AdminSegmented, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, Callout, Dropzone, EmptyState, FileIcon, FileItem, Tag, adminControl } from "../ui"

const TYPES: Record<string, string> = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  csv: "CSV",
  zip: "Zip",
  pine: "Pine Script",
  ex4: "MetaTrader 4",
  ex5: "MetaTrader 5",
  mq4: "MetaTrader 4",
  mq5: "MetaTrader 5",
  ntwtemplate: "NinjaTrader template",
  png: "Image",
  jpg: "Image",
}

const sizeOf = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)
const fileOf = (f: File): DownloadFile => ({ name: f.name, size: sizeOf(f.size), type: TYPES[f.name.split(".").pop()?.toLowerCase() ?? ""] ?? "File" })
const ago = (iso: string) => {
  const d = Math.max(0, daysAgo(iso))
  return d === 0 ? "today" : d < 7 ? `${d} d ago` : d < 30 ? `${Math.floor(d / 7)} w ago` : `${Math.floor(d / 30)} mo ago`
}
const count = (id: string) => ([...id].reduce((n, c) => n + c.charCodeAt(0), 0) * 7) % 400 + 14
/** Figma groups checklists, trading plans and the rest as Tools. */
const TABS = [
  { id: "all", label: "All" },
  { id: "indicators", label: "Indicators" },
  { id: "templates", label: "Templates" },
  { id: "tools", label: "Tools" },
  { id: "lesson", label: "Lesson files" },
] as const
const groupOf = (c: DownloadCategory) => (c === "indicators" ? "indicators" : c === "templates" ? "templates" : "tools")

type Row = { id: string; title: string; sub: string; name: string; tag: string; version: string; who: string; whoIds: string[]; updated: string; date: string; downloads: number; item?: DownloadItem }

/** Downloads (Figma 532:7152, 01 List, 02 Upload a file, 03 No files yet): files beyond the ones attached to a lesson, and the lesson files from Content. */
export function DownloadsAdmin() {
  const { coach, base } = useCoach()
  const items = useDownloads(coach)
  const catalog = useCatalog(coach)
  const tiers = useTiers(coach)
  const [tab, setTab] = useState<string>("all")
  const [q, setQ] = useState("")
  const [tierSel, setTierSel] = useState("all")
  const [editing, setEditing] = useState<DownloadItem | "new" | null>(null)
  const tierName = (d: DownloadItem) => (d.tiers.length === 0 ? "Everyone" : d.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))

  const own: Row[] = items.map((d) => ({ id: d.id, title: d.title, sub: d.file.type, name: d.file.name, tag: categoryLabel(d.category), version: `v${d.version}`, who: tierName(d), whoIds: d.tiers, updated: ago(d.updated), date: shortDate(d.updated), downloads: count(d.id), item: d }))
  const lesson: Row[] = catalog.courses.flatMap((c) =>
    c.modules.flatMap((m) =>
      m.lessons.flatMap((l, i) => l.downloads.map((f, k) => ({ id: `${l.id}-${k}`, title: f.name.replace(/\.[^.]+$/, ""), sub: `${TYPES[f.name.split(".").pop()?.toLowerCase() ?? ""] ?? "File"} · from ${c.title} · Lesson ${i + 1}`, name: f.name, tag: "Lesson file", version: "—", who: "All tiers", whoIds: [], updated: "—", date: "", downloads: count(l.id) })))
    )
  )
  const all = [...own, ...lesson]
  const rows = all.filter((r) => {
    const g = r.item ? groupOf(r.item.category) : "lesson"
    return (tab === "all" || tab === g) && (tierSel === "all" || r.whoIds.length === 0 || r.whoIds.includes(tierSel)) && (!q || `${r.title} ${r.name}`.toLowerCase().includes(q.toLowerCase()))
  })
  const remove = (d: DownloadItem) => {
    saveDownloads(coach, (l) => l.filter((x) => x.id !== d.id))
    toast(`${d.title} deleted`, { action: { label: "Undo", onClick: () => saveDownloads(coach, (l) => [d, ...l]) } })
  }
  const upload = <AdminButton onClick={() => setEditing("new")}><Upload /> Upload a file</AdminButton>

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader title="Downloads" text={all.length === 0 ? "No files yet" : `Files students can download · ${all.length} files · ${all.reduce((n, r) => n + r.downloads, 0).toLocaleString("en")} downloads this month`} actions={upload} />
      {!coach.modules.downloads && (
        <Callout tone="warning" action={<AdminButton nativeButton={false} render={<Link href={`${base}/design`} />} hierarchy="secondary" size="md">Review</AdminButton>}>
          Downloads is switched off, so students don&apos;t see it yet.
        </Callout>
      )}

      {all.length === 0 ? (
        <EmptyState icon={Download} title="No files yet" description="Share indicators, templates and worksheets. Students get a notification when you add one." actions={upload} />
      ) : (
        <>
          <AdminToolbar>
            <AdminTabs label="Category" tabs={TABS.map((t) => (t.id === "all" ? { ...t, count: all.length } : t))} value={tab} onChange={setTab} />
            <div className="flex-1" />
            <AdminSearch value={q} onChange={setQ} placeholder="Search files" hint="⌘K" />
            <AdminFilter ariaLabel="Tier" value={tierSel} onValueChange={setTierSel} options={[{ value: "all", label: "All tiers" }, ...tiers.map((t) => ({ value: t.id, label: t.name }))]} />
          </AdminToolbar>
          {rows.length === 0 ? (
            <EmptyState icon={Download} title="No files match" description="Clear the search or the filters." />
          ) : (
            <AdminTable minWidth={980} footer={<AdminTableFooter>Lesson files come from Content and are grouped by course</AdminTableFooter>}>
              <AdminTableHead>
                <AdminTh>File</AdminTh>
                <AdminTh width={146}>Category</AdminTh>
                <AdminTh width={96}>Version</AdminTh>
                <AdminTh width={216}>Who gets it</AdminTh>
                <AdminTh width={116}>Updated</AdminTh>
                <AdminTh width={106} align="end">Downloads</AdminTh>
                <AdminTh width={56} />
              </AdminTableHead>
              <tbody>
                {rows.map((r) => (
                  <AdminTr key={r.id}>
                    <AdminTd>
                      <div className="flex min-w-0 items-center gap-3">
                        <FileIcon name={r.name} />
                        <div className="grid min-w-0 gap-0.5">
                          <span className="truncate t-body-m text-a-text">{r.title}</span>
                          <span className="truncate t-caption text-a-text-2">{r.sub}</span>
                        </div>
                      </div>
                    </AdminTd>
                    <AdminTd><Tag>{r.tag}</Tag></AdminTd>
                    <AdminTd className="text-a-text tabular-nums">{r.version}</AdminTd>
                    <AdminTd className="truncate text-a-text">{r.who}</AdminTd>
                    <AdminTd className="whitespace-nowrap" title={r.date || undefined}>{r.updated}</AdminTd>
                    <AdminTd align="end" className="text-a-text">{r.downloads.toLocaleString("en")}</AdminTd>
                    <AdminTd align="end">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${r.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {r.item ? (
                            <>
                              <DropdownMenuItem onClick={() => setEditing(r.item!)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => remove(r.item!)}><Trash2 /> Delete</DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem render={<Link href={`${base}/content`} />}>Open in Content</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </>
      )}

      {editing && <UploadDrawer key={editing === "new" ? "new" : editing.id} item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

/** Downloads · 02 Upload a file (Figma 556:17251): the file first, then what it is and who gets it. */
function UploadDrawer({ item, onClose }: { item?: DownloadItem; onClose: () => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [open, setOpen] = useState(true)
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [category, setCategory] = useState<DownloadCategory>(item?.category ?? "indicators")
  const [version, setVersion] = useState(item?.version ?? "1.0")
  const [chosen, setChosen] = useState<string[]>(item?.tiers ?? [])
  const [pick, setPick] = useState((item?.tiers.length ?? 0) > 0)
  const [file, setFile] = useState<DownloadFile | undefined>(item?.file)
  const [notify, setNotify] = useState(item?.notify ?? true)
  const take = (f?: File) => {
    if (!f) return
    setFile(fileOf(f))
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""))
  }
  const missing = !title.trim() || !file || (pick && chosen.length === 0)
  const close = () => {
    setOpen(false)
    setTimeout(onClose, 250)
  }
  const save = () => {
    if (missing || !file) return
    const next: DownloadItem = { id: item?.id ?? `d${Date.now()}`, title: title.trim(), description: description.trim(), category, file, version: version.trim() || "1.0", updated: "2026-10-12", tiers: pick ? chosen : [], cover: item?.cover ?? Math.floor(Math.random() * 5), notify }
    saveDownloads(coach, (l) => (item ? l.map((x) => (x.id === item.id ? next : x)) : [next, ...l]))
    toast(item ? `${next.title} updated` : `${next.title} added`, { description: notify ? "Students get a notification." : undefined })
    close()
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={(o) => !o && close()}
      title={item ? "Edit file" : "Upload a file"}
      className="sm:data-[side=right]:w-[480px]"
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton disabled={missing} onClick={save}>{item ? "Save" : "Upload"}</AdminButton>
        </div>
      }>
      {file ? (
        <FileItem name={file.name} status="done" meta={`${file.size} · Completed`} trailing={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Remove ${file.name}`} onClick={() => setFile(undefined)}><Trash2 /></AdminButton>} />
      ) : (
        <Dropzone title="Drop a file here, or click to choose" hint="Only the name and size are kept in this prototype." onFiles={(f) => take(f[0])} />
      )}
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div className="flex flex-col gap-4">
        <AdminField label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session levels indicator" className={cn(adminControl, "h-11")} />
        </AdminField>
        <AdminField label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What it is and how to use it" className={cn(adminControl, "h-11")} />
        </AdminField>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Category</span>
            <AdminFilter ariaLabel="Category" value={category} onValueChange={(v) => setCategory(v as DownloadCategory)} options={DOWNLOAD_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} className="h-11! w-full justify-between" />
          </div>
          <AdminField label="Version">
            <input value={version} onChange={(e) => setVersion(e.target.value)} className={cn(adminControl, "h-11 tabular-nums")} />
          </AdminField>
        </div>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Who gets it</span>
          <AdminSegmented label="Who gets it" value={pick ? "tiers" : "all"} onChange={(v) => (setPick(v === "tiers"), v === "tiers" && !chosen.length && setChosen(tiers.slice(1, 2).map((t) => t.id)))} options={[{ value: "all", label: "Everyone" }, { value: "tiers", label: "Pick tiers" }]} />
          {pick && (
            <div className="grid gap-2 pt-1">
              {tiers.map((t) => (
                <label key={t.id} className="flex items-center gap-2.5 t-body-m text-a-text">
                  <Checkbox checked={chosen.includes(t.id)} onCheckedChange={(v) => setChosen((c) => (v ? [...c, t.id] : c.filter((x) => x !== t.id)))} />
                  {t.name}
                </label>
              ))}
              <span className="t-caption text-a-text-2">Other tiers see it locked.</span>
            </div>
          )}
        </div>
        <label className="flex items-center justify-between gap-6">
          <span className="grid gap-0.5">
            <span className="t-body-m text-a-text">Notify students</span>
            <span className="t-caption text-a-text-2">A notification says it is new or updated</span>
          </span>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </label>
      </div>
    </AdminDrawer>
  )
}
