"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Play, Send, Users, Video } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uid } from "@/lib/data/learning"
import { patchLivestream, useLivestreams, whenLabel, type Livestream } from "@/lib/data/livestreams"
import { cn } from "@/lib/utils"

const card = { boxShadow: "var(--card-shadow)" }

/** What students can open: what is live, what is next and what was recorded. */
export function LiveList() {
  const { coach, base } = useCoach()
  const streams = useLivestreams(coach)
  const order = { live: 0, scheduled: 1, ended: 2 }
  const list = [...streams].sort((a, b) => order[a.state] - order[b.state] || a.startsAt.localeCompare(b.startsAt))
  return (
    <div className="flex flex-col page-gap">
      <div className="grid gap-1">
        <span className="eyebrow">{coach.name}</span>
        <h1 className="text-3xl leading-tight">Livestreams</h1>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((s) => (
          <Link key={s.id} href={`${base}/live/${s.id}`} className="grid gap-1.5 rounded-(--radius) bg-card p-[calc(1.25rem*var(--density,1))] text-card-foreground" style={card}>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", s.state === "live" ? "animate-pulse bg-red-500" : s.state === "scheduled" ? "bg-amber-500" : "bg-muted-foreground/50")} />
              {s.state === "live" ? "Live now" : s.state === "scheduled" ? whenLabel(s.startsAt) : "Recording"}
            </span>
            <span className="font-heading text-lg">{s.title}</span>
            {s.description && <span className="line-clamp-2 text-sm text-muted-foreground">{s.description}</span>}
          </Link>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No livestreams yet.</p>}
      </div>
    </div>
  )
}

/** One livestream, as a student sees it: before (when it starts), live (the stream and the chat), after (the recording). */
export function LiveWatch({ id }: { id: string }) {
  const { coach, base } = useCoach()
  const streams = useLivestreams(coach)
  const s = streams.find((x) => x.id === id)
  const [text, setText] = useState("")
  if (!s)
    return (
      <div className="grid place-items-center gap-3 py-24 text-center">
        <p className="font-heading text-2xl">This livestream isn&apos;t available</p>
        <Button variant="outline" nativeButton={false} render={<Link href={`${base}/live`} />}>
          All livestreams
        </Button>
      </div>
    )
  const send = () => {
    if (!text.trim()) return
    patchLivestream(coach, s.id, { chat: [...s.chat, { id: uid("m"), who: "Alex", text: text.trim() }] })
    setText("")
  }

  return (
    <div className="flex flex-col page-gap">
      <Link href={`${base}/live`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Livestreams
      </Link>
      <div className="grid gap-1">
        <span className="eyebrow">{coach.coachName}</span>
        <h1 className="text-3xl leading-tight">{s.title}</h1>
        {s.description && <p className="max-w-[60ch] text-muted-foreground">{s.description}</p>}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Screen s={s} />
        {s.state !== "scheduled" && (
          <aside className="grid h-80 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-(--radius) bg-card text-card-foreground lg:h-auto" style={card}>
            <h2 className="px-4 py-3 text-sm font-medium">{s.state === "live" ? "Live chat" : "Chat replay"}</h2>
            <div className="grid content-start gap-2 overflow-y-auto px-4 pb-3">
              {s.chat.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
              {s.chat.map((m) => (
                <p key={m.id} className="text-sm">
                  <span className={cn("font-medium", m.coach && "text-primary")}>{m.who}</span> <span className="text-muted-foreground">{m.text}</span>
                </p>
              ))}
            </div>
            {s.state === "live" && (
              <form className="flex gap-2 p-3" onSubmit={(e) => (e.preventDefault(), send())}>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something…" aria-label="Message" />
                <Button type="submit" size="icon" aria-label="Send" disabled={!text.trim()}>
                  <Send />
                </Button>
              </form>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

function Screen({ s }: { s: Livestream }) {
  if (s.state === "scheduled")
    return (
      <div className="grid aspect-video place-items-center rounded-(--radius) bg-card p-6 text-center text-card-foreground" style={card}>
        <div className="grid justify-items-center gap-2">
          <Clock className="size-8 text-muted-foreground" />
          <p className="font-heading text-xl">Starts {whenLabel(s.startsAt)}</p>
          <p className="text-sm text-muted-foreground">Come back then. This page turns into the livestream by itself.</p>
        </div>
      </div>
    )
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-(--radius) bg-neutral-950 text-white" style={card}>
      {s.state === "live" ? <Video className="size-10 opacity-30" /> : <span className="grid size-14 place-items-center rounded-full bg-black/50"><Play /></span>}
      {s.state === "live" ? (
        <>
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
          </span>
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs tabular-nums">
            <Users className="size-3" /> {s.viewers}
          </span>
        </>
      ) : s.recording === "ready" ? (
        <span className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-0.5 text-xs tabular-nums">{s.minutes} min</span>
      ) : (
        <span className="absolute bottom-3 left-3 text-xs text-white/70">The recording is being made. Check back soon.</span>
      )}
    </div>
  )
}
