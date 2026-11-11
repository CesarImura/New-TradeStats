"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Play, RefreshCw, Send, Video } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { uid } from "@/lib/data/learning"
import { STREAM_SERVER, lengthLabel, newStreamKey, patchLivestream, useLivestreams, whenLabel, type ChatMessage, type Livestream } from "@/lib/data/livestreams"
import { cn } from "@/lib/utils"
import { AdminButton, AdminVideoPlayer, Metric, Panel, StepIndicator, Tag, adminControl } from "../ui"
import { SaveLessonModal } from "./livestreams-admin"

const copy = (text: string, what: string) => navigator.clipboard?.writeText(text).then(() => toast(`${what} copied`), () => toast.error("Couldn't copy. Select it and copy by hand."))
const who = (s: Livestream, tiers: { id: string; name: string }[]) => (s.tiers.length === 0 ? "Everyone" : s.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
const GRADIENT = "linear-gradient(150deg, var(--admin-color-bg-raised), var(--admin-color-bg-page))"

/** One livestream, from before to after (Figma 533:7152, 03 Connect OBS, 04 Live, 05 Ended): connect OBS, go live and chat, then keep the recording. */
export function StreamStudio({ id }: { id: string }) {
  const { coach, base } = useCoach()
  const streams = useLivestreams(coach)
  const s = streams.find((x) => x.id === id)
  if (!s)
    return (
      <div className="grid place-items-center gap-3 py-24 text-center">
        <p className="t-heading-m text-a-text">This livestream no longer exists</p>
        <AdminButton nativeButton={false} render={<Link href={`${base}/livestreams`} />} hierarchy="secondary">Back to Livestreams</AdminButton>
      </div>
    )
  const patch = (p: Partial<Livestream>) => patchLivestream(coach, s.id, p)
  return s.state === "scheduled" ? <Before s={s} patch={patch} /> : s.state === "live" ? <Live s={s} patch={patch} /> : <After s={s} />
}

function Shell({ s, sub, right, children }: { s: Livestream; sub: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  const { base } = useCoach()
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <AdminButton nativeButton={false} render={<Link href={`${base}/livestreams`} />} hierarchy="secondary" size="xl" iconOnly aria-label="Back to Livestreams"><ArrowLeft /></AdminButton>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h1 className="truncate t-heading-xl text-a-text">{s.title}</h1>
          <p className="truncate t-body-m text-a-text-2">{sub}</p>
        </div>
        {right && <div className="flex flex-wrap items-center gap-3">{right}</div>}
      </header>
      {children}
    </div>
  )
}

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
  const go = () => (patch({ state: "live", startedAt: Date.now(), viewers: 3, peak: 3, chat: [] }), toast.success("You are live. Students can watch now."))

  return (
    <Shell
      s={s}
      sub={`${whenLabel(s.startsAt).replace(",", " ·")} · ${who(s, coach.tiers)}`}
      right={
        <>
          <Tag tone={conn === "ok" ? "success" : "warning"} dot>{conn === "ok" ? "OBS connected" : conn === "checking" ? "Looking for OBS" : "Waiting for OBS"}</Tag>
          <AdminButton disabled={conn !== "ok"} onClick={go}><Play /> Go live</AdminButton>
        </>
      }>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,784fr)_minmax(0,400fr)]">
        <div className="grid min-h-[260px] place-items-center rounded-a-lg border border-a-border p-6 text-center lg:min-h-[428px]" style={{ background: conn === "ok" ? GRADIENT : undefined }} role="status">
          <div className="grid gap-1">
            <p className="t-heading-s text-a-text">{conn === "ok" ? "OBS is sending video" : "Looking for OBS…"}</p>
            <p className="t-caption text-a-text-2">{conn === "ok" ? "Press Go live when you are ready." : "Available once OBS is connected."}</p>
          </div>
        </div>
        <Panel className="gap-5">
          <h2 className="t-heading-s text-a-text">Connect OBS</h2>
          <ol className="flex flex-col gap-5">
            <li className="grid gap-2">
              <span className="flex items-center gap-2.5 t-body-m text-a-text"><StepIndicator step={1} />Open the stream settings in OBS</span>
              <span className="t-caption text-a-text-2">Settings, then Stream. Choose “Custom…” as the service.</span>
            </li>
            <li className="grid gap-2">
              <span className="flex items-center gap-2.5 t-body-m text-a-text"><StepIndicator step={2} />Paste these two lines</span>
              <div className="grid gap-1.5">
                <label htmlFor="obs-server" className="t-caption text-a-text">Server</label>
                <div className="flex items-center gap-2">
                  <input id="obs-server" readOnly value={STREAM_SERVER} className={cn(adminControl, "h-11 min-w-0 flex-1 truncate")} />
                  <AdminButton hierarchy="secondary" size="md" aria-label="Copy the server" onClick={() => copy(STREAM_SERVER, "Server")}>Copy</AdminButton>
                </div>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="obs-key" className="t-caption text-a-text">Stream key</label>
                <div className="flex items-center gap-2">
                  <span className="relative min-w-0 flex-1">
                    <input id="obs-key" readOnly type={show ? "text" : "password"} value={s.key} className={cn(adminControl, "h-11 pr-10")} />
                    <button type="button" aria-label={show ? "Hide the key" : "Show the key"} onClick={() => setShow(!show)} className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-a-sm text-a-icon outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                  </span>
                  <AdminButton hierarchy="secondary" size="md" aria-label="Copy the key" onClick={() => copy(s.key, "Stream key")}>Copy</AdminButton>
                </div>
                <p className="flex items-center gap-2 t-caption text-a-text-3">
                  <span className="min-w-0 flex-1">Keep it private. Anyone with it can stream as you.</span>
                  <button type="button" onClick={() => (patch({ key: newStreamKey() }), setConn("waiting"), toast("New key made. Paste it into OBS again."))} className="flex shrink-0 items-center gap-1 rounded-a-xs text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus" title="Make a new key (the old one stops working)"><RefreshCw className="size-3" /> New key</button>
                </p>
              </div>
            </li>
            <li className="grid gap-2">
              <span className="flex items-center gap-2.5 t-body-m text-a-text"><StepIndicator step={3} />Press “Start Streaming” in OBS</span>
              <span className="t-caption text-a-text-2">Students see you the moment you go live.</span>
            </li>
          </ol>
          <hr className="m-0 h-px border-0 bg-a-border-subtle" />
          <AdminButton hierarchy="secondary" className="w-fit" disabled={conn === "checking"} onClick={check}>
            <RefreshCw /> {conn === "checking" ? "Checking…" : "Check the connection"}
          </AdminButton>
        </Panel>
      </div>
    </Shell>
  )
}

const VIEWER_LINES = ["Hi everyone", "Sound is good", "Can you zoom in on the chart?", "What is your stop here?", "Thanks for this", "Is this the 5 minute?", "Great level", "Will you share the recording?"]
const VIEWERS = ["Alex", "Dana", "Sam", "Priya", "Leo", "Maya"]

function ChatList({ chat, className }: { chat: ChatMessage[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {chat.map((m) => (
        <li key={m.id} className="flex items-start gap-3 px-4 py-2">
          <Avatar className="size-8 shrink-0"><AvatarFallback>{m.who.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <div className="grid min-w-0 t-body-m">
            <span className={cn("t-caption", m.coach ? "text-a-text-accent" : "text-a-text-2")}>{m.who}</span>
            <span className="text-a-text [overflow-wrap:anywhere]">{m.text}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

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
  const clock = `${String(Math.floor(secs / 3600)).padStart(2, "0")}:${String(Math.floor(secs / 60) % 60).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
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
    <Shell
      s={s}
      sub={`Started ${hhmm(s.startedAt ?? now)} · ${clock}`}
      right={
        <>
          <Tag tone="danger" dot>Live</Tag>
          <span className="t-body-m text-a-text tabular-nums">{s.viewers} watching</span>
          <AdminButton hierarchy="danger" onClick={end}>End livestream</AdminButton>
        </>
      }>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,804fr)_minmax(0,380fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <AdminVideoPlayer live liveLabel={clock} seconds={0} resetKey={`live:${s.id}`} background={GRADIENT} className="aspect-video">
            <Video aria-hidden className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-a-text opacity-20" />
            <span className="absolute top-3 left-3 rounded-a-sm bg-a-scrim px-2 py-1 t-caption text-a-text-2">Your OBS picture shows here, as students see it.</span>
          </AdminVideoPlayer>
          <div className="grid grid-cols-3 overflow-hidden rounded-a-lg border border-a-border bg-a-panel [&>*+*]:border-l [&>*+*]:border-a-border">
            <Metric label="Watching now" value={s.viewers} />
            <Metric label="Most watching at once" value={s.peak} />
            <Metric label="Chat messages" value={s.chat.length} />
          </div>
        </div>
        <aside className="flex h-[600px] max-h-[80svh] flex-col overflow-hidden rounded-a-lg border border-a-border bg-a-panel">
          <div className="flex items-center justify-between border-b border-a-border px-4 py-3.5">
            <h2 className="t-heading-s text-a-text">Chat</h2>
            <span className="t-caption text-a-text-2 tabular-nums">{s.chat.length}</span>
          </div>
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto py-1">
            {s.chat.length === 0 && <p className="px-4 py-3 t-body-m text-a-text-2">No messages yet. Say hello.</p>}
            <ChatList chat={s.chat} />
          </div>
          <form className="flex items-center gap-2 border-t border-a-border p-3" onSubmit={(e) => (e.preventDefault(), send())}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write to everyone…" aria-label="Message" className={cn(adminControl, "h-11 min-w-0 flex-1")} />
            <AdminButton type="submit" hierarchy="secondary" size="md" disabled={!text.trim()}><Send /> Send</AdminButton>
          </form>
        </aside>
      </div>
    </Shell>
  )
}

/** After: how it went, the recording, and putting it into a course. */
function After({ s }: { s: Livestream }) {
  const { coach } = useCoach()
  const [saving, setSaving] = useState<Livestream | null>(null)
  // The recording is made after the stream ends: a few seconds here.
  useEffect(() => {
    if (s.recording !== "processing") return
    const t = setTimeout(() => patchLivestream(coach, s.id, { recording: "ready" }), 3500)
    return () => clearTimeout(t)
  }, [s.recording, s.id, coach])

  return (
    <Shell s={s} sub={`${whenLabel(s.startsAt).replace(",", " ·")} · ${lengthLabel(s.minutes ?? 0)}`} right={<Tag dot>Ended</Tag>}>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,804fr)_minmax(0,380fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="t-heading-s text-a-text">Recording</h2>
              <AdminButton hierarchy="secondary" size="md" disabled={s.recording === "processing" || !!s.lesson} onClick={() => setSaving(s)}>{s.lesson ? `Lesson in ${s.lesson}` : "Save as a lesson"}</AdminButton>
            </div>
            {s.recording === "processing" ? (
              <p className="flex items-center gap-2 t-body-m text-a-text-2" role="status">
                <span className="size-2 animate-pulse rounded-full bg-a-warning-fill" /> Making the recording. This takes a minute or two.
              </p>
            ) : (
              <>
                <AdminVideoPlayer seconds={Math.max(60, (s.minutes ?? 0) * 60)} resetKey={s.id} resumeKey={`livestream:${s.id}`} background={GRADIENT} className="aspect-video" />
                <p className="t-caption text-a-text-2">Ready. Students can watch it at the same link as the livestream.</p>
              </>
            )}
          </Panel>
          <div className="grid grid-cols-3 overflow-hidden rounded-a-lg border border-a-border bg-a-panel [&>*+*]:border-l [&>*+*]:border-a-border">
            <Metric label="Length" value={lengthLabel(s.minutes ?? 0)} />
            <Metric label="Most watching at once" value={s.peak} />
            <Metric label="Chat messages" value={s.chat.length} />
          </div>
        </div>
        <aside className="flex max-h-[640px] flex-col overflow-hidden rounded-a-lg border border-a-border bg-a-panel">
          <div className="flex items-center justify-between border-b border-a-border px-4 py-3.5">
            <h2 className="t-heading-s text-a-text">Chat replay</h2>
            <span className="t-caption text-a-text-2 tabular-nums">{s.chat.length}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {s.chat.length === 0 && <p className="px-4 py-3 t-body-m text-a-text-2">Nobody wrote in the chat.</p>}
            <ChatList chat={s.chat} />
          </div>
        </aside>
      </div>
      <SaveLessonModal stream={saving} onClose={() => setSaving(null)} />
    </Shell>
  )
}
