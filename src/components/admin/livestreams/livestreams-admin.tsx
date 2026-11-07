"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Radio, Video } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { newStreamKey, saveLivestreams, useLivestreams, whenLabel, type Livestream } from "@/lib/data/livestreams"
import { uid } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { Empty, Field, Page, PageHeader } from "../kit"

/** Livestreams: what is live, what is next, and what was recorded. One button to schedule, one place to open each. */
export function LivestreamsAdmin() {
  const { coach, base } = useCoach()
  const streams = useLivestreams(coach)
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const live = streams.filter((s) => s.state === "live")
  const upcoming = streams.filter((s) => s.state === "scheduled").sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const past = streams.filter((s) => s.state === "ended").sort((a, b) => b.startsAt.localeCompare(a.startsAt))

  return (
    <Page>
      <PageHeader
        title="Livestreams"
        text="Go live with OBS, chat with your students, and keep the recording."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Schedule a livestream
          </Button>
        }
      />
      {streams.length === 0 && <Empty icon={Radio} title="No livestreams yet" text="Schedule your first one. You will get the OBS settings on the next screen." action={<Button onClick={() => setCreating(true)}>Schedule a livestream</Button>} />}
      <Group title="Live now" list={live} href={(s) => `${base}/livestreams/${s.id}`} />
      <Group title="Coming up" list={upcoming} href={(s) => `${base}/livestreams/${s.id}`} />
      <Group title="Recordings" list={past} href={(s) => `${base}/livestreams/${s.id}`} />
      <NewStream
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(s) => {
          saveLivestreams(coach, (l) => [...l, s])
          router.push(`${base}/livestreams/${s.id}`)
        }}
      />
    </Page>
  )
}

function Group({ title, list, href }: { title: string; list: Livestream[]; href: (s: Livestream) => string }) {
  if (list.length === 0) return null
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((s) => (
          <Link key={s.id} href={href(s)} className="grid gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-2">
              <StateBadge state={s.state} />
              <span className="text-xs text-muted-foreground">{whenLabel(s.startsAt)}</span>
            </div>
            <span className="grid gap-1">
              <span className="font-medium">{s.title}</span>
              {s.description && <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{s.description}</span>}
            </span>
            <span className="text-xs text-muted-foreground">
              {s.state === "ended" ? `${s.minutes} min · ${s.peak} watched at once${s.recording === "ready" ? " · recording ready" : ""}` : s.state === "live" ? `${s.viewers} watching now` : "Open the studio to connect OBS"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function StateBadge({ state }: { state: Livestream["state"] }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", state === "live" ? "animate-pulse bg-red-500" : state === "scheduled" ? "bg-amber-500" : "bg-muted-foreground/50")} />
      {state === "live" ? "Live now" : state === "scheduled" ? "Scheduled" : "Ended"}
    </Badge>
  )
}

function NewStream({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (s: Livestream) => void }) {
  const [title, setTitle] = useState("")
  const [when, setWhen] = useState("2026-11-12T15:00")
  const [text, setText] = useState("")
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a livestream</DialogTitle>
          <DialogDescription>Students see it on the calendar. You connect OBS on the next screen.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            onCreate({ id: uid("s"), title: title.trim(), description: text.trim() || undefined, startsAt: when, state: "scheduled", tiers: [], key: newStreamKey(), peak: 0, viewers: 0, chat: [] })
            setTitle("")
            setText("")
            onClose()
          }}
        >
          <Field label="Title">
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Live session: London open" />
          </Field>
          <Field label="Starts">
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
          <Field label="What it is about" hint="Optional">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-16" />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim()}>
              <Video /> Create and open
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
