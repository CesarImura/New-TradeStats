"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, FolderUp, Loader2, Sparkles, Trash2, Video, X } from "@/components/icons"
import type { CourseDraft } from "@/lib/data/communities"
import { uid } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { mono } from "./frame"
import type { StepProps } from "./wizard"

type Upload = { id: string; path: string; size: number; progress: number }

const SAMPLE = [
  "1 Foundations/01 welcome.mp4",
  "1 Foundations/02 how-markets-move.mp4",
  "1 Foundations/03 reading-the-tape.mp4",
  "2 Risk/01 position-sizing.mp4",
  "2 Risk/02 the-daily-stop.mp4",
  "2 Risk/03 journaling_v2_FINAL.mp4",
  "3 Setups/01 opening-range-breakout.mp4",
  "3 Setups/02 vwap-reclaim.mp4",
  "3 Setups/03 failed-breakdown.mp4",
  "3 Setups/04 live-example-NQ.mov",
]

/** "02 the-daily-stop_v2_FINAL.mp4" → "The daily stop". */
function tidy(name: string) {
  const base = name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^[\d\s._-]+/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(v\d+|final|edit|export|copy)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
  // Keep words in capitals (NQ, VWAP) as they are.
  const words = base.split(/\s+/).map((w, i) => (/^[A-Z]{2,}$/.test(w) ? w : i === 0 ? w[0]?.toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
  return words.join(" ").replace(/\bvwap\b/i, "VWAP") || "Untitled lesson"
}

/** What the AI proposes: one module per folder, or groups of four when there are no folders. */
function propose(files: Upload[]): CourseDraft[] {
  const byFolder = new Map<string, Upload[]>()
  files.forEach((f, i) => {
    const parts = f.path.split("/")
    const folder = parts.length > 1 ? parts[parts.length - 2] : `Part ${Math.floor(i / 4) + 1}`
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), f])
  })
  return [...byFolder.entries()].map(([folder, list]) => ({
    id: uid(),
    title: tidy(folder),
    lessons: list
      .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
      .map((f) => ({ id: f.id, title: tidy(f.path.split("/").pop()!), minutes: Math.max(3, Math.round(f.size / 9e6)) })),
  }))
}

async function filesFromDrop(items: DataTransferItemList) {
  const out: { path: string; size: number }[] = []
  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej))
      if (/^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name)) out.push({ path: prefix + file.name, size: file.size })
      return
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const entries = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
    for (const e of entries) await walk(e, `${prefix}${entry.name}/`)
  }
  for (const item of [...items]) {
    const entry = item.webkitGetAsEntry()
    if (entry) await walk(entry, "")
  }
  return out
}

/**
 * ONB-13 · First videos. Drop a folder; each file shows its progress; then
 * the AI proposes modules and lessons from the folder and file names, which
 * the coach can rename and reorder before accepting.
 */
export function VideosStep({ community, update }: StepProps) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const courses = community.setup?.courses
  const save = (next: CourseDraft[] | undefined) => update({ setup: { ...community.setup, courses: next } })

  const start = (files: { path: string; size: number }[]) => {
    if (!files.length) return
    save(undefined)
    setUploads(files.map((f) => ({ id: uid(), ...f, progress: 0 })))
  }

  // Simulated upload: bigger files take longer.
  const uploading = uploads.length > 0 && uploads.some((u) => u.progress < 100)
  useEffect(() => {
    if (!uploading) return
    const t = setInterval(() => {
      setUploads((list) => {
        // Two at a time, like a real uploader.
        let active = 0
        return list.map((u) => {
          if (u.progress >= 100 || active >= 2) return u
          active++
          return { ...u, progress: Math.min(100, u.progress + Math.max(9, 4e8 / Math.max(u.size, 1e7))) }
        })
      })
    }, 120)
    return () => clearInterval(t)
  }, [uploading])

  const uploaded = uploads.length > 0 && !uploading
  const thinking = uploaded && !courses
  useEffect(() => {
    if (!thinking) return
    const t = setTimeout(() => save(propose(uploads)), 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking])

  // ----- 3. The proposed structure
  if (courses) {
    const lessons = courses.reduce((n, c) => n + c.lessons.length, 0)
    const edit = (ci: number, fn: (c: CourseDraft) => CourseDraft) => save(courses.map((c, i) => (i === ci ? fn(c) : c)))
    const move = (ci: number, li: number, by: -1 | 1) =>
      edit(ci, (c) => {
        const next = [...c.lessons]
        const [l] = next.splice(li, 1)
        next.splice(li + by, 0, l)
        return { ...c, lessons: next }
      })
    return (
      <div className="grid gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-[var(--ts-cta)]" />
          <span>
            {courses.length} modules, {lessons} lessons. Rename or reorder anything.
          </span>
        </div>
        <div className="grid gap-3">
          {courses.map((c, ci) => (
            <div key={c.id} className="rounded-[var(--radius)] border bg-card">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <span className={cn(mono, "text-muted-foreground")}>M{ci + 1}</span>
                <input
                  value={c.title}
                  onChange={(e) => edit(ci, (x) => ({ ...x, title: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none focus:underline"
                  aria-label={`Module ${ci + 1} name`}
                />
                <span className="text-xs text-muted-foreground tabular-nums">{c.lessons.reduce((n, l) => n + l.minutes, 0)} min</span>
              </div>
              <ol className="grid">
                {c.lessons.map((l, li) => (
                  <li key={l.id} className="group flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/[0.03]">
                    <Video className="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                      value={l.title}
                      onChange={(e) => edit(ci, (x) => ({ ...x, lessons: x.lessons.map((y) => (y.id === l.id ? { ...y, title: e.target.value } : y)) }))}
                      className="min-w-0 flex-1 bg-transparent outline-none focus:underline"
                      aria-label="Lesson name"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums">{l.minutes}′</span>
                    <span className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <IconBtn label="Move up" disabled={li === 0} onClick={() => move(ci, li, -1)}>
                        <ArrowUp />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={li === c.lessons.length - 1} onClick={() => move(ci, li, 1)}>
                        <ArrowDown />
                      </IconBtn>
                      <IconBtn label="Remove lesson" onClick={() => edit(ci, (x) => ({ ...x, lessons: x.lessons.filter((y) => y.id !== l.id) }))}>
                        <Trash2 />
                      </IconBtn>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            save(undefined)
            setUploads([])
          }}
          className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Start over with other videos
        </button>
      </div>
    )
  }

  // ----- 2. Uploading, then organising
  if (uploads.length) {
    const done = uploads.filter((u) => u.progress >= 100).length
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between text-sm">
          {thinking ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-[var(--ts-cta)]" /> Organising into modules and lessons…
            </span>
          ) : (
            <span>
              Uploading {done} of {uploads.length}
            </span>
          )}
          {!thinking && (
            <button onClick={() => setUploads([])} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          )}
        </div>
        <ul className="grid max-h-[46vh] gap-px overflow-y-auto rounded-[var(--radius)] border bg-border">
          {uploads.map((u) => (
            <li key={u.id} className="grid gap-1.5 bg-card px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate">{u.path}</span>
                <span className="text-muted-foreground tabular-nums">{u.progress >= 100 ? "Done" : `${Math.round(u.progress)}%`}</span>
                {u.progress < 100 && (
                  <button onClick={() => setUploads((l) => l.filter((x) => x.id !== u.id))} aria-label={`Cancel ${u.path}`} className="text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <span className="h-0.5 overflow-hidden bg-white/10">
                <span className={cn("block h-full transition-[width]", u.progress >= 100 ? "bg-[var(--ts-cta)]" : "bg-[var(--ts-interactive)]")} style={{ width: `${u.progress}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">You can carry on — uploads continue in the background.</p>
      </div>
    )
  }

  // ----- 1. Drop zone
  return (
    <div className="grid gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setOver(false)
          start(await filesFromDrop(e.dataTransfer.items))
        }}
        className={cn(
          "grid place-items-center gap-3 rounded-[var(--radius)] border border-dashed border-white/20 px-6 py-12 text-center transition-colors",
          over && "border-[var(--ts-interactive)] bg-[color-mix(in_oklab,var(--ts-interactive)_6%,transparent)]",
        )}
      >
        <FolderUp className={cn("size-8 text-muted-foreground", over && "text-[var(--ts-interactive)]")} />
        <div className="grid gap-1">
          <span className="text-base">Drop your course folder here</span>
          <span className="text-sm text-muted-foreground">Subfolders become modules. MP4 or MOV, any size.</span>
        </div>
        <button onClick={() => input.current?.click()} className="mt-1 text-sm underline underline-offset-4">
          or choose a folder
        </button>
        <input
          ref={input}
          type="file"
          multiple
          className="hidden"
          {...({ webkitdirectory: "" } as object)}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])].filter((f) => /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name))
            start(files.map((f) => ({ path: f.webkitRelativePath || f.name, size: f.size })))
            e.target.value = ""
          }}
        />
      </div>
      <button
        onClick={() => start(SAMPLE.map((path, i) => ({ path, size: (40 + ((i * 37) % 90)) * 1e6 * 3 })))}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        <Sparkles className="size-3.5" /> Try it with 10 sample videos
      </button>
      <p className="text-xs text-muted-foreground">Videos on YouTube, Vimeo or Kajabi? We can import them after setup — or on your setup call.</p>
    </div>
  )
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="grid size-6 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30 [&_svg]:size-3.5">
      {children}
    </button>
  )
}
