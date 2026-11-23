"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Clock, Copy, MoreHorizontal, Pencil, Plus, Radio, Trash2, Users, Video } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { newStreamKey, lengthLabel, saveLivestreams, untilLabel, useLivestreams, whenLabel, patchLivestream, type Livestream } from "@/lib/data/livestreams"
import { saveCatalog, uid, useCatalog, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { PageHeader } from "../kit"
import { AdminSelect, AdminButton, AdminField, AdminModal, AdminSearch, AdminSegmented, AdminTable, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, EmptyState, Tag, adminControl } from "../ui"

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
  const list = (tab === "upcoming" ? upcoming.filter((x) => x.id !== next?.id) : tab === "live" ? live : past).filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()))
  const studio = (s: Livestream) => router.push(`${base}/livestreams/${s.id}`)
  const link = (s: Livestream) => navigator.clipboard?.writeText(`${window.location.origin}/c/${coach.slug}/live/${s.id}`).then(() => toast("Link copied"), () => toast.error("Couldn't copy. Select it and copy by hand."))
  const quick = () => {
    const s: Livestream = { id: uid("s"), title: "Livestream", startsAt: "2025-11-12T10:00", state: "scheduled", tiers: [], key: newStreamKey(), peak: 0, viewers: 0, chat: [], planned: 60, where: "both" }
    saveLivestreams(coach, (l) => [...l, s])
    studio(s)
  }
  const remove = (s: Livestream) => {
    saveLivestreams(coach, (l) => l.filter((x) => x.id !== s.id))
    toast(`${s.title} deleted`, { action: { label: "Undo", onClick: () => saveLivestreams(coach, (l) => [...l, s]) } })
  }
  const schedule = <AdminButton hierarchy={streams.length === 0 ? "primary" : "secondary"} onClick={() => setEditing("new")}><Plus /> Schedule a livestream</AdminButton>

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Livestreams"
        text="Go live with OBS, chat with your students, and keep the recording."
        actions={
          <>
            {schedule}
          </>
        }
      />

      {streams.length === 0 ? (
        <EmptyState icon={Radio} title="No livestreams yet" description="Schedule one or go live now. The recording can become a lesson." actions={<>{schedule}<AdminButton hierarchy="secondary" onClick={quick}>Open the studio to connect OBS</AdminButton></>} />
      ) : (
        <>
          {next && (
            <section aria-label="Next livestream" className="grid overflow-hidden rounded-a-lg border border-a-border bg-a-panel md:min-h-[230px] md:grid-cols-[minmax(0,440px)_minmax(0,1fr)_minmax(0,300px)]">
              {/* Figma Livestreams 01: preview, what is next, and who is coming. */}
              <div aria-hidden className="relative h-40 bg-[linear-gradient(135deg,var(--admin-color-accent-soft),var(--admin-color-bg-sunk)_70%)] md:h-auto">
                <Video className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-a-text-3" />
                <span className="absolute right-3 bottom-3 rounded-a-sm bg-a-page px-2 py-1 t-caption text-a-text">{lengthLabel(next.planned ?? 60)}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-3 border-a-border px-7 pt-8 pb-7 md:border-x">
                <div className="flex flex-wrap items-center gap-2 t-caption text-a-text-2">
                  {next.state === "live" ? <Tag tone="danger">Live now</Tag> : <><span>Next live</span><Tag>{untilLabel(next.startsAt).replace(/^./, (c) => c.toUpperCase())}</Tag><Tag tone="warning">Waiting for OBS</Tag></>}
                </div>
                <h2 className="-mt-0.5 t-heading-xl text-a-text [overflow-wrap:anywhere]">{next.title}</h2>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 t-caption text-a-text-2">
                  <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden />{whenLabel(next.startsAt).replace(",", " ·")}</span>
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden />{lengthLabel(next.planned ?? 60)}</span>
                  <span className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden />{who(next)}</span>
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <AdminButton onClick={() => studio(next)}>Open studio <ArrowRight /></AdminButton>
                  <AdminButton hierarchy="secondary" onClick={() => link(next)}><Copy /> Copy link</AdminButton>
                  {next.state === "scheduled" && <AdminButton hierarchy="ghost" onClick={() => setEditing(next)}><Pencil /> Edit</AdminButton>}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4 p-7">
                <div className="flex items-center">
                  {["MA", "AL", "PR", "DA", "JW"].map((i) => <span key={i} aria-hidden className="-ml-1.5 grid size-7 place-items-center rounded-full border border-a-border bg-a-raised t-micro-medium text-a-text first:ml-0">{i}</span>)}
                  <span className="ml-2 t-caption text-a-text-2">+36</span>
                </div>
                <div className="flex items-baseline gap-2"><span className="t-metric text-a-text tabular-nums">{next.state === "live" ? next.viewers : 41}</span><span className="t-caption text-a-text-2">{next.state === "live" ? "watching now" : "said they’ll join"}</span></div>
                <span aria-hidden className="h-px bg-a-border" />
                <div className="flex items-baseline gap-2"><span className="t-metric text-a-text tabular-nums">{past[0] ? past[0].peak : "—"}</span><span className="t-caption text-a-text-2">watching at the last live&apos;s peak</span></div>
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
                <AdminTh width={166}>{tab === "live" ? "Started" : "Starts"}</AdminTh>
                <AdminTh width={106}>Length</AdminTh>
                <AdminTh width={96}>{tab === "live" ? "Watching" : "Joining"}</AdminTh>
                <AdminTh width={226}>Who can watch</AdminTh>
                <AdminTh width={108}>Status</AdminTh>
                <AdminTh width={56} />
              </AdminTableHead>
              <tbody>
                {list.map((s) => (
                  <AdminTr key={s.id} onClick={() => studio(s)}>
                    <AdminTd>
                      <div className="flex min-w-0 items-center gap-6">
                        <span aria-hidden className="h-8 w-[52px] shrink-0 rounded-a-xs bg-[linear-gradient(135deg,var(--admin-color-accent-soft),var(--admin-color-bg-raised))]" />
                        <div className="flex min-w-0 flex-col">
                          <Link href={`${base}/livestreams/${s.id}`} onClick={(e) => e.stopPropagation()} className="truncate rounded-a-xs t-body-m text-a-text outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">{s.title}</Link>
                          <span className="truncate t-caption text-a-text-2">{s.where === "live" ? "Live page only" : "Calendar and Live page"}</span>
                        </div>
                      </div>
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap">{whenLabel(s.startsAt).replace(",", " ·")}</AdminTd>
                    <AdminTd className="whitespace-nowrap">{lengthLabel(s.planned ?? s.minutes ?? 60)}</AdminTd>
                    <AdminTd className="text-a-text tabular-nums">{tab === "live" ? s.viewers : s.joining ?? "—"}</AdminTd>
                    <AdminTd><span className="flex flex-wrap gap-1">{(s.tiers.length === 0 ? ["Everyone"] : s.tiers.map((id) => coach.tiers.find((t) => t.id === id)?.name ?? id)).map((n) => <Tag key={n}>{n}</Tag>)}</span></AdminTd>
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
    <Tag tone={state === "live" ? "danger" : "neutral"}>
      {state === "live" ? "Live now" : state === "scheduled" ? "Scheduled" : "Ended"}
    </Tag>
  )
}

/** Livestreams · 02 Schedule a livestream (Figma 1485:102166), also used to edit one. */
function ScheduleModal({ stream, onClose }: { stream: Livestream | "new" | null; onClose: () => void }) {
  const { coach } = useCoach()
  const [last, setLast] = useState<Livestream | "new" | null>(stream)
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [where, setWhere] = useState("both")
  const [pick, setPick] = useState(false)
  const [tiers, setTiers] = useState<string[]>([])
  const [when, setWhen] = useState("2025-11-12T15:00")
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
    setWhen(s?.startsAt ?? "2025-11-12T15:00")
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
          <AdminSelect ariaLabel="Where this livestream is" value={where} onValueChange={setWhere} options={[{ value: "both", label: "Calendar and Live page" }, { value: "live", label: "Live page only" }]} />
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
            <AdminSelect ariaLabel="Length" value={len} onValueChange={setLen} options={lengths} />
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

/** Livestreams · 05 Ended · Save as a lesson (Figma 1485:102303): the recording becomes a draft lesson in a module. */
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
          <AdminSelect ariaLabel="Course" value={courseId} onValueChange={(v) => (setCourseId(v), setModuleId(""))} options={catalog.courses.map((c) => ({ value: c.id, label: c.title }))} />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Module</span>
          <AdminSelect ariaLabel="Module" value={mod?.id ?? ""} onValueChange={setModuleId} options={(course?.modules ?? []).map((m, i) => ({ value: m.id, label: `${i + 1} · ${m.title}` }))} />
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
