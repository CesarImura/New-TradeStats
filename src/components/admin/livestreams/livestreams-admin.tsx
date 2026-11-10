"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Plus, Radio, Video } from "@/components/icons"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { newStreamKey, saveLivestreams, useLivestreams, whenLabel, type Livestream } from "@/lib/data/livestreams"
import { uid } from "@/lib/data/learning"
import { Empty, Field, Page, PageHeader } from "../kit"
import { AdminButton, AdminSearch, AdminTabs, AdminToolbar, Panel, Tag } from "../ui"

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
          <>
            {streams[0] && (
              <AdminButton hierarchy="secondary" nativeButton={false} render={<Link href={`${base}/livestreams/${streams[0].id}`} />}>
                <Radio /> Open studio
              </AdminButton>
            )}
            <AdminButton onClick={() => setCreating(true)}>
              <Plus /> Schedule a livestream
            </AdminButton>
          </>
        }
      />
      {streams.length === 0 && <Empty icon={Radio} title="No livestreams yet" text="Schedule your first one. You will get the OBS settings on the next screen." action={<Button onClick={() => setCreating(true)}>Schedule a livestream</Button>} />}
      {streams.length > 0 && <Streams live={live} upcoming={upcoming} past={past} base={base} tiers={coach.tiers} />}
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

function Streams({ live, upcoming, past, base, tiers }: { live: Livestream[]; upcoming: Livestream[]; past: Livestream[]; base: string; tiers: { id: string; name: string }[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<"upcoming" | "live" | "past">(live.length ? "live" : upcoming.length ? "upcoming" : "past")
  const [q, setQ] = useState("")
  const next = live[0] ?? upcoming[0]
  const list = (tab === "upcoming" ? upcoming : tab === "live" ? live : past).filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()))
  const who = (s: Livestream) => (s.tiers.length === 0 ? "Everyone" : s.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))
  return (
    <>
      {next && (
        <Panel className="flex-col gap-0 overflow-hidden p-0 md:flex-row">
          <div aria-hidden className="h-28 shrink-0 bg-a-raised md:h-auto md:w-72" />
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-col gap-1.5">
              <span className="t-mono-label text-a-text-accent">{next.state === "live" ? "Live now" : "Next live"}</span>
              <h2 className="t-heading-xl [overflow-wrap:anywhere]">{next.title}</h2>
              <p className="t-body-m text-a-text-2">{whenLabel(next.startsAt)} · {who(next)}</p>
            </div>
            <dl className="flex flex-wrap gap-x-10 gap-y-3">
              <div className="flex flex-col gap-1">
                <dt className="t-mono-label-s text-a-text-2">{next.state === "live" ? "Watching now" : "Said they'll join"}</dt>
                <dd className="t-data-m tabular-nums">{next.state === "live" ? next.viewers : 41}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="t-mono-label-s text-a-text-2">Last live</dt>
                <dd className="t-data-m tabular-nums">{past[0] ? `${past[0].peak} watching` : "None yet"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <AdminButton nativeButton={false} render={<Link href={`${base}/livestreams/${next.id}`} />}>
                Open studio <ArrowRight />
              </AdminButton>
              <AdminButton hierarchy="secondary" onClick={() => toast("Link copied")}>Copy the link</AdminButton>
            </div>
          </div>
        </Panel>
      )}
      <AdminToolbar>
        <AdminTabs
          label="Livestreams"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "upcoming", label: "Coming up", count: upcoming.length },
            { id: "live", label: "Live now", count: live.length },
            { id: "past", label: "Recordings", count: past.length },
          ]}
        />
        <div className="flex-1" />
        <AdminSearch value={q} onChange={setQ} placeholder="Search livestreams" hint="⌘K" />
      </AdminToolbar>
      <div className="overflow-x-auto rounded-a-lg border border-a-border bg-a-panel">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Livestream</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead className="hidden md:table-cell">Who can watch</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`${base}/livestreams/${s.id}`)}>
                <TableCell className="max-w-72 pl-5">
                  <Link href={`${base}/livestreams/${s.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium">{s.title}</Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-a-text-2">{whenLabel(s.startsAt)}</TableCell>
                <TableCell className="hidden text-a-text-2 md:table-cell">{who(s)}</TableCell>
                <TableCell><StateBadge state={s.state} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.length === 0 && <p className="px-4 py-8 text-center t-body-m text-a-text-2">{q ? "No livestreams match." : tab === "live" ? "Nothing live right now." : "Nothing here yet."}</p>}
      </div>
    </>
  )
}

export function StateBadge({ state }: { state: Livestream["state"] }) {
  return (
    <Tag tone={state === "live" ? "danger" : state === "scheduled" ? "accent" : "neutral"} dot>
      {state === "live" ? "Live now" : state === "scheduled" ? "Scheduled" : "Ended"}
    </Tag>
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
