"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, Eye, EyeOff, Play, RefreshCw, Send, Users, Video } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectOptions } from "@/components/kit/select-field"
import { allLessons, saveCatalog, uid, useCatalog, type Lesson } from "@/lib/data/learning"
import { STATE_LABEL, STREAM_SERVER, newStreamKey, patchLivestream, useLivestreams, whenLabel, type ChatMessage, type Livestream } from "@/lib/data/livestreams"
import { cn } from "@/lib/utils"
import { Field } from "../kit"
import { StateBadge } from "./livestreams-admin"
import { AdminButton } from "@/components/admin/ui"

const STEPS = ["scheduled", "live", "ended"] as const

/** One livestream, from before to after: connect OBS, go live and chat, then keep the recording. */
export function StreamStudio({ id }: { id: string }) {
  const { coach, base } = useCoach()
  const streams = useLivestreams(coach)
  const s = streams.find((x) => x.id === id)
  if (!s)
    return (
      <div className="grid place-items-center gap-3 py-24 text-center">
        <p className="text-lg font-medium">This livestream no longer exists</p>
        <AdminButton nativeButton={false} render={<Link href={`${base}/livestreams`} />} hierarchy="secondary">
          Back to Livestreams
        </AdminButton>
      </div>
    )
  const patch = (p: Partial<Livestream>) => patchLivestream(coach, s.id, p)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton nativeButton={false} render={<Link href={`${base}/livestreams`} />} hierarchy="ghost" size="md">
          <ArrowLeft /> Livestreams
        </AdminButton>
        <span className="h-4 w-px bg-border" />
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{s.title}</h1>
        <StateBadge state={s.state} />
      </div>
      <Progress state={s.state} />
      {s.state === "scheduled" && <Before s={s} patch={patch} />}
      {s.state === "live" && <Live s={s} patch={patch} />}
      {s.state === "ended" && <After s={s} />}
    </div>
  )
}

/** Before, Live, After: where this livestream is. */
function Progress({ state }: { state: Livestream["state"] }) {
  const at = STEPS.indexOf(state)
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Where this livestream is">
      {STEPS.map((st, i) => (
        <li key={st} className="flex flex-1 items-center gap-2" aria-current={i === at ? "step" : undefined}>
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums", i < at && "border-transparent bg-foreground text-background", i === at && "border-foreground font-medium")}>{i < at ? <Check className="size-3.5" /> : i + 1}</span>
          <span className={cn(i === at ? "font-medium" : "text-muted-foreground")}>{STATE_LABEL[st]}</span>
          {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

const copy = (text: string, what: string) => navigator.clipboard?.writeText(text).then(() => toast(`${what} copied`), () => toast.error("Couldn't copy. Select it and copy by hand."))

/** Before: connect OBS (three short steps), check it works, then go live. */
function Before({ s, patch }: { s: Livestream; patch: (p: Partial<Livestream>) => void }) {
  const { coach } = useCoach()
  const [show, setShow] = useState(false)
  const [conn, setConn] = useState<"waiting" | "checking" | "ok">("waiting")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])
  const check = () => {
    setConn("checking")
    timer.current = setTimeout(() => setConn("ok"), 1200)
  }
  // Shown as a path; copying adds the address of the page the coach is on.
  const path = `/c/${coach.slug}/live/${s.id}`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid content-start gap-5 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-medium">Connect OBS</h2>
          <p className="text-sm text-muted-foreground">Three steps, once. The same settings work for every livestream you schedule.</p>
        </div>
        <ol className="grid gap-5">
          <Step n={1} title="Open the stream settings in OBS" text="Settings, then Stream. Choose “Custom…” as the service." />
          <Step n={2} title="Paste these two lines">
            <div className="grid gap-3">
              <Field label="Server">
                <div className="flex gap-2">
                  <Input readOnly value={STREAM_SERVER} className="font-mono text-xs" />
                  <AdminButton aria-label="Copy the server" onClick={() => copy(STREAM_SERVER, "Server")} hierarchy="secondary" iconOnly>
                    <Copy />
                  </AdminButton>
                </div>
              </Field>
              <Field label="Stream key" hint="Keep it private. Anyone with it can stream as you.">
                <div className="flex gap-2">
                  <Input readOnly type={show ? "text" : "password"} value={s.key} className="font-mono text-xs" />
                  <AdminButton aria-label={show ? "Hide the key" : "Show the key"} onClick={() => setShow(!show)} hierarchy="secondary" iconOnly>
                    {show ? <EyeOff /> : <Eye />}
                  </AdminButton>
                  <AdminButton aria-label="Copy the key" onClick={() => copy(s.key, "Stream key")} hierarchy="secondary" iconOnly>
                    <Copy />
                  </AdminButton>
                  <AdminButton aria-label="Make a new key" title="Make a new key (the old one stops working)" onClick={() => (patch({ key: newStreamKey() }), setConn("waiting"), toast("New key made. Paste it into OBS again."))} hierarchy="secondary" iconOnly>
                    <RefreshCw />
                  </AdminButton>
                </div>
              </Field>
            </div>
          </Step>
          <Step n={3} title="Press “Start Streaming” in OBS" text="Then check the connection here. When OBS is sending video, you can go live.">
            <div className="flex flex-wrap items-center gap-3">
              <AdminButton onClick={check} disabled={conn === "checking"} hierarchy="secondary">
                {conn === "checking" ? "Checking…" : "Check the connection"}
              </AdminButton>
              <span className={cn("flex items-center gap-2 text-sm", conn === "ok" ? "text-foreground" : "text-muted-foreground")} role="status">
                <span className={cn("size-2 rounded-full", conn === "ok" ? "bg-emerald-500" : conn === "checking" ? "animate-pulse bg-amber-500" : "bg-muted-foreground/50")} />
                {conn === "ok" ? "OBS is sending video" : conn === "checking" ? "Looking for OBS…" : "Waiting for OBS"}
              </span>
            </div>
          </Step>
        </ol>
        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <AdminButton disabled={conn !== "ok"} onClick={() => (patch({ state: "live", startedAt: Date.now(), viewers: 3, peak: 3, chat: [] }), toast.success("You are live. Students can watch now."))} size="xl">
            <Play /> Go live
          </AdminButton>
          <span className="text-sm text-muted-foreground">{conn === "ok" ? "Students see you the moment you go live." : "Available once OBS is connected."}</span>
        </div>
      </section>

      <aside className="grid content-start gap-5 rounded-xl border bg-card p-5">
        <h2 className="font-medium">Details</h2>
        <Field label="Title">
          <Input value={s.title} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field label="Starts">
          <Input type="datetime-local" value={s.startsAt} onChange={(e) => patch({ startsAt: e.target.value })} />
        </Field>
        <Field label="What it is about">
          <Textarea value={s.description ?? ""} onChange={(e) => patch({ description: e.target.value || undefined })} className="min-h-20" />
        </Field>
        <Field label="Link for students">
          <div className="flex gap-2">
            <Input readOnly value={path} className="text-xs" />
            <AdminButton aria-label="Copy the link" onClick={() => copy(`${window.location.origin}${path}`, "Link")} hierarchy="secondary" iconOnly>
              <Copy />
            </AdminButton>
          </div>
        </Field>
        <p className="text-xs text-muted-foreground">Starts {whenLabel(s.startsAt)}. You can go live early or late: students always see the real state.</p>
      </aside>
    </div>
  )
}

function Step({ n, title, text, children }: { n: number; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
      <span className="grid size-6 place-items-center rounded-full border text-xs tabular-nums">{n}</span>
      <div className="grid gap-2">
        <span className="text-sm font-medium">{title}</span>
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
        {children}
      </div>
    </li>
  )
}

const VIEWER_LINES = ["Hi everyone", "Sound is good", "Can you zoom in on the chart?", "What is your stop here?", "Thanks for this", "Is this the 5 minute?", "Great level", "Will you share the recording?"]
const VIEWERS = ["Alex", "Dana", "Sam", "Priya", "Leo", "Maya"]

/** Live: the stream, who is watching, and the chat. */
function Live({ s, patch }: { s: Livestream; patch: (p: Partial<Livestream>) => void }) {
  const { coach } = useCoach()
  const id = s.id
  const [text, setText] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const scroller = useRef<HTMLDivElement>(null)

  // The prototype has no real viewers: a few arrive, leave and write, so the studio can be seen working.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const sim = setInterval(() => {
      // Read from the store each time, so a message the coach just wrote is never lost.
      patchLivestream(coach, id, (cur) => {
        const viewers = Math.max(1, cur.viewers + Math.round((Math.random() - 0.35) * 6))
        const msg: ChatMessage[] = Math.random() < 0.7 ? [{ id: uid("m"), who: VIEWERS[Math.floor(Math.random() * VIEWERS.length)], text: VIEWER_LINES[Math.floor(Math.random() * VIEWER_LINES.length)] }] : []
        return { viewers, peak: Math.max(cur.peak, viewers), chat: [...cur.chat, ...msg].slice(-60) }
      })
    }, 4500)
    return () => {
      clearInterval(tick)
      clearInterval(sim)
    }
  }, [coach, id])
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [s.chat.length])

  const secs = Math.max(0, Math.floor((now - (s.startedAt ?? now)) / 1000))
  const clock = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
  const end = () => {
    patch({ state: "ended", minutes: Math.max(1, Math.round(secs / 60)), recording: "processing", viewers: 0, startedAt: undefined })
    toast("Livestream ended. The recording is being made.")
  }
  const send = () => {
    if (!text.trim()) return
    patch({ chat: [...s.chat, { id: uid("m"), who: coach.coachName, text: text.trim(), coach: true }] })
    setText("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid content-start gap-3">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-neutral-950 text-white">
          <Video className="size-10 opacity-30" />
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
          </span>
          <span className="absolute top-3 right-3 rounded bg-black/60 px-2 py-0.5 text-xs tabular-nums">{clock}</span>
          <span className="absolute bottom-3 left-3 text-xs text-white/70">Your OBS picture shows here, as students see it.</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm tabular-nums">
            <Users className="size-4 text-muted-foreground" /> {s.viewers} watching
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">Most at once: {s.peak}</span>
          <AdminButton className="ml-auto" onClick={end} hierarchy="danger">
            End the livestream
          </AdminButton>
        </div>
      </section>
      <aside className="grid h-[28rem] grid-rows-[auto_minmax(0,1fr)_auto] rounded-xl border bg-card">
        <h2 className="border-b px-4 py-3 text-sm font-medium">Chat</h2>
        <div ref={scroller} className="grid content-start gap-2 overflow-y-auto p-4">
          {s.chat.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>}
          {s.chat.map((m) => (
            <p key={m.id} className="text-sm">
              <span className={cn("font-medium", m.coach && "text-primary")}>{m.who}</span> <span className="text-muted-foreground">{m.text}</span>
            </p>
          ))}
        </div>
        <form className="flex gap-2 border-t p-3" onSubmit={(e) => (e.preventDefault(), send())}>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write to everyone…" aria-label="Message" />
          <AdminButton type="submit"  aria-label="Send" disabled={!text.trim()} iconOnly>
            <Send />
          </AdminButton>
        </form>
      </aside>
    </div>
  )
}

/** After: how it went, the recording, and putting it into a course. */
function After({ s }: { s: Livestream }) {
  const { coach, base } = useCoach()
  const router = useRouter()
  const catalog = useCatalog(coach)
  const [courseId, setCourseId] = useState(catalog.courses[0]?.id ?? "")
  const course = catalog.courses.find((c) => c.id === courseId)
  const [moduleId, setModuleId] = useState("")
  const moduleOf = course?.modules.find((m) => m.id === moduleId) ?? course?.modules[0]

  // The recording is made after the stream ends: a few seconds here.
  useEffect(() => {
    if (s.recording !== "processing") return
    const t = setTimeout(() => patchLivestream(coach, s.id, { recording: "ready" }), 3500)
    return () => clearTimeout(t)
  }, [s.recording, s.id, coach])

  const save = () => {
    if (!course || !moduleOf) return
    const lesson: Lesson = { id: uid("l"), title: s.title, minutes: s.minutes ?? 0, status: "draft", video: `${s.title}.mp4`, chapters: [], downloads: [] }
    saveCatalog(coach, (c) => ({ ...c, courses: c.courses.map((x) => (x.id === course.id ? { ...x, modules: x.modules.map((m) => (m.id === moduleOf.id ? { ...m, lessons: [...m.lessons, lesson] } : m)) } : x)) }))
    toast.success(`Saved as a draft lesson in ${course.title}.`, { action: { label: "Open", onClick: () => router.push(`${base}/content/${course.id}`) } })
  }
  const already = course ? allLessons(course).some((l) => l.video === `${s.title}.mp4`) : false

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid content-start gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Length" value={`${s.minutes ?? 0} min`} />
          <Stat label="Most watching at once" value={String(s.peak)} />
          <Stat label="Chat messages" value={String(s.chat.length)} />
        </div>
        <div className="grid gap-4 rounded-xl border bg-card p-5">
          <h2 className="font-medium">Recording</h2>
          {s.recording === "processing" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <span className="size-2 animate-pulse rounded-full bg-amber-500" /> Making the recording. This takes a minute or two.
            </p>
          ) : (
            <>
              <div className="relative grid aspect-video max-w-xl place-items-center overflow-hidden rounded-lg bg-neutral-900 text-white">
                <span className="grid size-12 place-items-center rounded-full bg-black/50">
                  <Play />
                </span>
                <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-xs tabular-nums">{s.minutes} min</span>
              </div>
              <p className="text-sm text-muted-foreground">Ready. Students can watch it at the same link as the livestream.</p>
              <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                <Field label="Add it to a course as a lesson" className="min-w-48">
                  <SelectOptions value={courseId} onChange={(e) => (setCourseId(e.target.value), setModuleId(""))} className="h-8 rounded-lg border bg-background px-2 text-sm" aria-label="Course">
                    {catalog.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </SelectOptions>
                </Field>
                <Field label="Module" className="min-w-40">
                  <SelectOptions value={moduleOf?.id ?? ""} onChange={(e) => setModuleId(e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm" aria-label="Module">
                    {(course?.modules ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </SelectOptions>
                </Field>
                <AdminButton onClick={save} disabled={!moduleOf || already} hierarchy="secondary">
                  {already ? "Already in this course" : "Save as a lesson"}
                </AdminButton>
              </div>
            </>
          )}
        </div>
      </section>
      <aside className="grid content-start gap-3 rounded-xl border bg-card p-5">
        <h2 className="font-medium">Chat replay</h2>
        {s.chat.length === 0 && <p className="text-sm text-muted-foreground">Nobody wrote in the chat.</p>}
        {s.chat.map((m) => (
          <p key={m.id} className="text-sm">
            <span className={cn("font-medium", m.coach && "text-primary")}>{m.who}</span> <span className="text-muted-foreground">{m.text}</span>
          </p>
        ))}
      </aside>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  )
}
