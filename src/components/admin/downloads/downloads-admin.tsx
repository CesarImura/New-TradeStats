"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Download, FileUp, Pencil, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useTiers } from "@/lib/data/access"
import { DOWNLOAD_CATEGORIES, categoryLabel, saveDownloads, shortDate, useDownloads, type DownloadCategory, type DownloadFile, type DownloadItem } from "@/lib/data/downloads"
import { cn } from "@/lib/utils"
import { Empty, Field, NativeSelect, Page, PageHeader } from "../kit"

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

/** Files students can download beyond the ones attached to a lesson. */
export function DownloadsAdmin() {
  const { coach, base } = useCoach()
  const items = useDownloads(coach)
  const tiers = useTiers(coach)
  const [editing, setEditing] = useState<DownloadItem | "new" | null>(null)
  const tierName = (d: DownloadItem) => (d.tiers.length === 0 ? "Everyone" : d.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))

  const remove = (d: DownloadItem) => {
    saveDownloads(coach, (l) => l.filter((x) => x.id !== d.id))
    toast(`${d.title} deleted`, { action: { label: "Undo", onClick: () => saveDownloads(coach, (l) => [d, ...l]) } })
  }

  return (
    <Page>
      <PageHeader
        title="Downloads"
        text="Indicators, chart templates, checklists and plans your students can download. Files attached to a lesson stay in the lesson."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Upload
          </Button>
        }
      />
      {!coach.modules.downloads && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ts-interactive)]/40 bg-[var(--ts-interactive)]/8 px-4 py-3 text-sm">
          <Download className="size-4 text-[var(--ts-interactive)]" />
          <span className="flex-1">Downloads is switched off, so students don&apos;t see it yet.</span>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`${base}/design`} />}>
            Switch on in Design
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <Empty icon={Download} title="No files yet" text="Upload an indicator, a template or a checklist and students find it under Downloads." action={<Button onClick={() => setEditing("new")}><Plus /> Upload a file</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>File</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="hidden md:table-cell">Who gets it</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-72">
                    <div className="grid">
                      <span className="truncate font-medium">{d.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {d.file.name} · {d.file.size}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{categoryLabel(d.category)}</TableCell>
                  <TableCell className="tabular-nums">v{d.version}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{tierName(d)}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{shortDate(d.updated)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon-sm" variant="ghost" aria-label={`Edit ${d.title}`} onClick={() => setEditing(d)}>
                        <Pencil />
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label={`Delete ${d.title}`} onClick={() => remove(d)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">For invite-only TradingView scripts, add the student&apos;s username under Settings later.</p>

      {editing && <UploadDialog key={editing === "new" ? "new" : editing.id} item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </Page>
  )
}

function UploadDialog({ item, onClose }: { item?: DownloadItem; onClose: () => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [category, setCategory] = useState<DownloadCategory>(item?.category ?? "indicators")
  const [version, setVersion] = useState(item?.version ?? "1.0")
  const [chosen, setChosen] = useState<string[]>(item?.tiers ?? [])
  const [file, setFile] = useState<DownloadFile | undefined>(item?.file)
  const [notify, setNotify] = useState(item?.notify ?? true)
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const take = (f?: File) => {
    if (!f) return
    setFile(fileOf(f))
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""))
  }
  const ok = title.trim() && file

  const save = () => {
    if (!ok) return
    const next: DownloadItem = {
      id: item?.id ?? `d${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      file,
      version: version.trim() || "1.0",
      updated: "2026-10-12",
      tiers: chosen,
      cover: item?.cover ?? Math.floor(Math.random() * 5),
      notify,
    }
    saveDownloads(coach, (l) => (item ? l.map((x) => (x.id === item.id ? next : x)) : [next, ...l]))
    toast(item ? `${next.title} updated` : `${next.title} added`, { description: notify ? "Students get a notification." : undefined })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit file" : "Upload a file"}</DialogTitle>
          <DialogDescription>Students find it under {coach.wording.downloads}. Replace the file to publish a new version.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              take(e.dataTransfer.files[0])
            }}
            className={cn("grid place-items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center text-sm", over && "border-[var(--ts-interactive)] bg-[var(--ts-interactive)]/8")}
          >
            <FileUp className="size-5 text-muted-foreground" />
            {file ? (
              <>
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {file.type} · {file.size} · click to replace
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">Drop a file here, or click to choose</span>
                <span className="text-xs text-muted-foreground">Only the name and size are kept in this prototype.</span>
              </>
            )}
          </button>
          <input ref={input} type="file" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session levels indicator (TradingView)" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What it is and how to use it" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <NativeSelect value={category} onChange={(e) => setCategory(e.target.value as DownloadCategory)}>
                {DOWNLOAD_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Version">
              <Input value={version} onChange={(e) => setVersion(e.target.value)} className="tabular-nums" />
            </Field>
          </div>
          <Field label="Who gets it" hint={chosen.length === 0 ? "Everyone" : undefined}>
            <div className="grid gap-1.5 rounded-lg border p-2.5">
              {tiers.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={chosen.includes(t.id)} onCheckedChange={(v) => setChosen((c) => (v ? [...c, t.id] : c.filter((x) => x !== t.id)))} />
                  {t.name}
                </label>
              ))}
              <span className="text-xs text-muted-foreground">Leave all unchecked to give it to everyone. Other tiers see it locked.</span>
            </div>
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="grid">
              <span className="font-medium">Notify students</span>
              <span className="text-xs text-muted-foreground">A notification says it is new or updated</span>
            </span>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!ok} onClick={save}>
            {item ? "Save" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
