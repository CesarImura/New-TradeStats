"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Copy, MoreHorizontal, Plus, Radio, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { newStreamKey, lengthLabel, saveLivestreams, untilLabel, useLivestreams, whenLabel, patchLivestream, type Livestream } from "@/lib/data/livestreams"
import { saveCatalog, uid, useCatalog, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { PageHeader } from "../kit"
import { AdminButton, AdminField, AdminFilter, AdminModal, AdminSearch, AdminSegmented, AdminTable, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, EmptyState, Tag, adminControl } from "../ui"

const LENGTHS = [30, 45, 60, 90, 120, 180].map((m) => ({ value: String(m), label: lengthLabel(m) }))
type Tab = "upcoming" | "live" | "past"

/** Livestreams (Figma 533:7152, 01 to 06): what is next, what is live, and the recordings. */
export function LivestreamsAdmin() {
  const { coach, base } = useCoach()
  const streams = useLivestreams(coach)
  const router = useRouter()
  const [editing, setEditing] = useState<Livestream | "new" | null>(null)
  const [saving, setSaving] = useState<Livestream | null>(null)
  const live = streams.filter((s) => s.state === "live")
  const upcoming = streams.filter((s) => s.state === "scheduled").sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const past = streams.filter((s) => s.state === "ended").sort((a, b) => b.startsAt.localeCompare(a.startsAt))
  const [tab, setTab] = useState<Tab>(live.length ? "live" : upcoming.length ? "upcoming" : "past")
  const [q, setQ] = useState("")
  const next = live[0] ?? upcoming[0]
  const who = (s: Livestream) => (s.tiers.length === 0 ? "Everyone" : s.tiers.map((id) => coach.tiers.find((t) => t.id === id)?.name ?? id).join(", "))
  const list = (tab === "upcoming" ? upcoming : tab === "live" ? live : past).filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()))
  const studio = (s: Livestream) => router.push(`${base}/livestreams/${s.id}`)
  const link = (s: Livestream) => navigator.clipboard?.writeText(`${window.location.origin}/c/${coach.slug}/live/${s.id}`).then(() => toast("Link copied"), () => toast.error("Couldn't copy. Select it and copy by hand."))
  const quick = () => {
    const s: Livestream = { id: uid("s"), title: "Livestream", startsAt: "2026-10-12T10:00", state: "scheduled", tiers: [], key: newStreamKey(), peak: 0, viewers: 0, chat: [], planned: 60, where: "both" }
    saveLivestreams(coach, (l) => [...l, s])
    studio(s)
  }
  const remove = (s: Livestream) => {
    saveLivestreams(coach, (l) => l.filter((x) => x.id !== s.id))
    toast(`${s.title} deleted`, { action: { label: "Undo", onClick: () => saveLivestreams(coach, (l) => [...l, s]) } })
  }
  const schedule = <AdminButton onClick={() => setEditing("new")}><Plus /> Schedule a livestream</AdminButton>

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Livestreams"
        text="Go live with OBS, chat with your students, and keep the recording."
        actions={
          <>
            {streams.length > 0 && (
              <AdminButton hierarchy="secondary" onClick={() => studio(next ?? streams[0])}><Radio /> Open studio</AdminButton>
            )}
            {schedule}
          </>
        }
      />

      {streams.length === 0 ? (
        <EmptyState icon={Radio} title="No livestreams yet" description="Schedule one or go live now. The recording can become a lesson." actions={<>{schedule}<AdminButton hierarchy="secondary" onClick={quick}>Open the studio to connect OBS</AdminButton></>} />
      ) : (
        <>
          {next && (
            <section aria-label="Next livestream" className="flex flex-col overflow-hidden rounded-a-lg border border-a-border bg-a-panel md:min-h-[280px] md:flex-row">
              <div aria-hidden className="h-28 shrink-0 bg-[linear-gradient(135deg,var(--admin-color-accent-soft),var(--admin-color-bg-raised)_70%)] md:h-auto md:w-[360px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-7">
                <span className="t-mono-label text-a-text-accent">{next.state === "live" ? "Live now" : `Next live · ${untilLabel(next.startsAt)}`}</span>
                <h2 className="t-heading-xl text-a-text [overflow-wrap:anywhere]">{next.title}</h2>
                <p className="t-body-m text-a-text-2">{whenLabel(next.startsAt).replace(",", " ·")} · {lengthLabel(next.planned ?? 60)} · {who(next)}</p>
                <dl className="flex flex-wrap gap-x-8 gap-y-3 py-1.5">
                  <div className="grid min-w-40 gap-1.5">
                    <dt className="t-mono-label text-a-text-2">{next.state === "live" ? "Watching now" : "Said they'll join"}</dt>
                    <dd className="t-title text-a-text tabular-nums">{next.state === "live" ? next.viewers : 41}</dd>
                  </div>
                  <span aria-hidden className="w-px bg-a-border" />
                  <div className="grid min-w-40 gap-1.5">
                    <dt className="t-mono-label text-a-text-2">Last live</dt>
                    <dd className="t-title text-a-text tabular-nums">{past[0] ? `${past[0].peak} watching` : "None yet"}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminButton onClick={() => studio(next)}>Open studio <ArrowRight /></AdminButton>
                  <AdminButton hierarchy="secondary" onClick={() => link(next)}><Copy /> Copy the link</AdminButton>
                  {next.state === "scheduled" && <AdminButton hierarchy="ghost" onClick={() => setEditing(next)}>Edit</AdminButton>}
                </div>
              </div>
            </section>
          )}
          <AdminToolbar>
            <AdminTabs label="Livestreams" value={tab} onChange={setTab} tabs={[{ id: "upcoming", label: "Coming up", count: upcoming.length }, { id: "live", label: "Live now", count: live.length }, { id: "past", label: "Recordings", count: past.length }]} />
            <div className="flex-1" />
            <AdminSearch value={q} onChange={setQ} placeholder="Search livestreams" hint="⌘K" />
          </AdminToolbar>
          {list.length === 0 ? (
            <EmptyState icon={Radio} title={q ? "No livestreams match" : tab === "live" ? "Nothing live right now" : "Nothing here yet"} description={q ? "Clear the search." : tab === "live" ? "When you go live from the studio, it shows up here." : undefined} />
          ) : tab === "past" ? (
            <AdminTable minWidth={900}>
              <AdminTableHead>
                <AdminTh>Recording</AdminTh>
                <AdminTh width={216}>When</AdminTh>
                <AdminTh width={136} align="end">Most watching</AdminTh>
                <AdminTh width={216}>Course</AdminTh>
                <AdminTh width={150} />
              </AdminTableHead>
              <tbody>
                {list.map((s) => (
                  <AdminTr key={s.id} onClick={() => studio(s)}>
                    <AdminTd>
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="h-7 w-10 shrink-0 rounded-a-xs bg-[linear-gradient(135deg,var(--admin-color-accent-soft),var(--admin-color-bg-raised))]" />
                        <span className="truncate t-body-m text-a-text">{s.title}</span>
                      </div>
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap">{whenLabel(s.startsAt)} · {lengthLabel(s.minutes ?? 0)}</AdminTd>
                    <AdminTd align="end" className="text-a-text">{s.peak}</AdminTd>
                    <AdminTd className="truncate">{s.recording === "processing" ? "Processing…" : s.lesson ? `Lesson in ${s.lesson}` : "—"}</AdminTd>
                    <AdminTd align="end" onClick={(e) => e.stopPropagation()}>
                      <AdminButton hierarchy="secondary" size="md" disabled={s.recording === "processing" || !!s.lesson} onClick={() => setSaving(s)}>{s.lesson ? "Saved" : "Save as a lesson"}</AdminButton>
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminTable minWidth={900}>
              <AdminTableHead>
                <AdminTh>Livestream</AdminTh>
                <AdminTh width={216}>{tab === "live" ? "Started" : "Starts"}</AdminTh>
                <AdminTh width={236}>{tab === "live" ? "Watching" : "Who can watch"}</AdminTh>
                <AdminTh width={136}>Status</AdminTh>
                <AdminTh width={56} />
              </AdminTableHead>
              <tbody>
                {list.map((s) => (
                  <AdminTr key={s.id} onClick={() => studio(s)}>
                    <AdminTd className="truncate text-a-text"><Link href={`${base}/livestreams/${s.id}`} onClick={(e) => e.stopPropagation()} className="rounded-a-xs outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">{s.title}</Link></AdminTd>
                    <AdminTd className="whitespace-nowrap">{whenLabel(s.startsAt).replace(",", " ·")}</AdminTd>
                    <AdminTd className="truncate text-a-text">{tab === "live" ? `${s.viewers} watching` : who(s)}</AdminTd>
                    <AdminTd><StateBadge state={s.state} /></AdminTd>
                    <AdminTd align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${s.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => studio(s)}>Open studio</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => link(s)}>Copy the link</DropdownMenuItem>
                          {s.state === "scheduled" && <DropdownMenuItem onClick={() => setEditing(s)}>Edit</DropdownMenuItem>}
                          {s.state === "scheduled" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => remove(s)}><Trash2 /> Delete</DropdownMenuItem>
                            </>
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

      <ScheduleModal stream={editing} onClose={() => setEditing(null)} />
      <SaveLessonModal stream={saving} onClose={() => setSaving(null)} />
    </div>
  )
}

export function StateBadge({ state }: { state: Livestream["state"] }) {
  return (
    <Tag tone={state === "live" ? "danger" : state === "scheduled" ? "accent" : "neutral"} dot>
      {state === "live" ? "Live now" : state === "scheduled" ? "Scheduled" : "Ended"}
    </Tag>
  )
}

/** Livestreams · 02 Schedule a livestream (Figma 556:19753), also used to edit one. */
function ScheduleModal({ stream, onClose }: { stream: Livestream | "new" | null; onClose: () => void }) {
  const { coach } = useCoach()
  const [last, setLast] = useState<Livestream | "new" | null>(stream)
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [where, setWhere] = useState("both")
  const [pick, setPick] = useState(false)
  const [tiers, setTiers] = useState<string[]>([])
  const [when, setWhen] = useState("2026-11-12T15:00")
  const [len, setLen] = useState("60")
  const [toCourse, setToCourse] = useState(false)
  if (stream && stream !== last) {
    setLast(stream)
    const s = stream === "new" ? null : stream
    setTitle(s?.title ?? "")
    setText(s?.description ?? "")
    setWhere(s?.where ?? "both")
    setPick((s?.tiers.length ?? 0) > 0)
    setTiers(s?.tiers ?? [])
    setWhen(s?.startsAt ?? "2026-11-12T15:00")
    setLen(String(s?.planned ?? 60))
    setToCourse(false)
  }
  const shown = stream ?? last
  const isNew = shown === "new"
  const lengths = LENGTHS.some((l) => l.value === len) ? LENGTHS : [...LENGTHS, { value: len, label: lengthLabel(Number(len)) }]
  const missing = !title.trim() || !when || (pick && tiers.length === 0)
  const submit = () => {
    if (missing) return
    const patch = { title: title.trim(), description: text.trim() || undefined, startsAt: when, tiers: pick ? tiers : [], planned: Number(len), where: where as "both" | "live" }
    if (isNew) saveLivestreams(coach, (l) => [...l, { id: uid("s"), state: "scheduled", key: newStreamKey(), peak: 0, viewers: 0, chat: [], ...patch }])
    else if (shown) patchLivestream(coach, shown.id, patch)
    toast(isNew ? "Livestream scheduled" : "Livestream saved", { description: "Students are reminded automatically." })
    onClose()
  }
  return (
    <AdminModal open={!!stream} onOpenChange={(o) => !o && onClose()} title={isNew ? "Schedule a livestream" : "Edit livestream"} subtitle="Students are reminded automatically." className="sm:max-w-[560px]" bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton disabled={missing} onClick={submit}>{isNew ? "Schedule" : "Save"}</AdminButton>
        </div>
      }>
      <div className="flex flex-col gap-4">
        <AdminField label="Title">
          <input autoFocus={isNew} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="London open breakdown" className={cn(adminControl, "h-11")} />
        </AdminField>
        <AdminField label="What it is about" optional>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Levels for the session and the first 30 minutes live" className={cn(adminControl, "h-11")} />
        </AdminField>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Where this livestream is</span>
          <AdminFilter ariaLabel="Where this livestream is" value={where} onValueChange={setWhere} options={[{ value: "both", label: "Calendar and Live page" }, { value: "live", label: "Live page only" }]} className="h-11! w-full justify-between" />
        </div>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Who can watch</span>
          <AdminSegmented label="Who can watch" value={pick ? "tiers" : "all"} onChange={(v) => (setPick(v === "tiers"), v === "tiers" && !tiers.length && setTiers(coach.tiers.slice(1).map((t) => t.id)))} options={[{ value: "all", label: "Everyone" }, { value: "tiers", label: "Pick tiers" }]} />
          {pick && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {coach.tiers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 t-body-m text-a-text">
                  <Checkbox checked={tiers.includes(t.id)} onCheckedChange={(v) => setTiers((x) => (v ? [...x, t.id] : x.filter((y) => y !== t.id)))} />
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Starts">
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={cn(adminControl, "h-11 scheme-dark")} />
          </AdminField>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Length</span>
            <AdminFilter ariaLabel="Length" value={len} onValueChange={setLen} options={lengths} className="h-11! w-full justify-between" />
          </div>
        </div>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <label className="flex items-center justify-between gap-6">
        <span className="grid gap-0.5">
          <span className="t-body-m text-a-text">Add it to a course as a lesson</span>
          <span className="t-caption text-a-text-2">After it ends, the recording goes into the module you pick</span>
        </span>
        <Switch checked={toCourse} onCheckedChange={setToCourse} />
      </label>
    </AdminModal>
  )
}

/** Livestreams · 05 Ended · Save as a lesson (Figma 556:20594): the recording becomes a draft lesson in a module. */
export function SaveLessonModal({ stream, onClose }: { stream: Livestream | null; onClose: () => void }) {
  const { coach, base } = useCoach()
  const router = useRouter()
  const catalog = useCatalog(coach)
  const [last, setLast] = useState<Livestream | null>(stream)
  const [courseId, setCourseId] = useState("")
  const [moduleId, setModuleId] = useState("")
  const [title, setTitle] = useState("")
  const [replay, setReplay] = useState(true)
  if (stream && stream !== last) {
    setLast(stream)
    setCourseId(catalog.courses[0]?.id ?? "")
    setModuleId("")
    setTitle(stream.title)
    setReplay(true)
  }
  const s = stream ?? last
  const course = catalog.courses.find((c) => c.id === courseId)
  const mod = course?.modules.find((m) => m.id === moduleId) ?? course?.modules[0]
  const save = () => {
    if (!s || !course || !mod || !title.trim()) return
    const lesson: Lesson = { id: uid("l"), title: title.trim(), minutes: s.minutes ?? 0, status: "draft", video: `${s.title}.mp4`, chapters: [], downloads: [] }
    saveCatalog(coach, (c) => ({ ...c, courses: c.courses.map((x) => (x.id === course.id ? { ...x, modules: x.modules.map((m) => (m.id === mod.id ? { ...m, lessons: [...m.lessons, lesson] } : m)) } : x)) }))
    patchLivestream(coach, s.id, { lesson: course.title })
    toast.success(`Saved as a draft lesson in ${course.title}.`, { action: { label: "Open", onClick: () => router.push(`${base}/content/${course.id}`) } })
    onClose()
  }
  return (
    <AdminModal open={!!stream} onOpenChange={(o) => !o && onClose()} title="Save as a lesson" subtitle="Livestream ended. The recording is being made." className="sm:max-w-[520px]" bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton disabled={!mod || !title.trim()} onClick={save}>Save as a lesson</AdminButton>
        </div>
      }>
      <div className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Course</span>
          <AdminFilter ariaLabel="Course" value={courseId} onValueChange={(v) => (setCourseId(v), setModuleId(""))} options={catalog.courses.map((c) => ({ value: c.id, label: c.title }))} className="h-11! w-full justify-between" />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Module</span>
          <AdminFilter ariaLabel="Module" value={mod?.id ?? ""} onValueChange={setModuleId} options={(course?.modules ?? []).map((m, i) => ({ value: m.id, label: `${i + 1} · ${m.title}` }))} className="h-11! w-full justify-between" />
        </div>
        <AdminField label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={cn(adminControl, "h-11")} />
        </AdminField>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <label className="flex items-center justify-between gap-6">
        <span className="grid gap-0.5">
          <span className="t-body-m text-a-text">Chat replay</span>
          <span className="t-caption text-a-text-2">Show the chat next to the recording</span>
        </span>
        <Switch checked={replay} onCheckedChange={setReplay} />
      </label>
    </AdminModal>
  )
}
