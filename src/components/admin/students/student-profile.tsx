"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DEMO_ADMIN } from "@/lib/data/account"
import { GROUPS, tierFor, type Student } from "@/lib/data/people"
import { COURSES } from "@/lib/data/sample"
import { NO_QUESTIONS, useOnboardingSettings, useStudentStart } from "@/lib/data/student-start"
import { TRADES } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { AdminButton, AdminDrawer, AdminProgress, AdminUnderlineTabs, Callout, Metric, StepIndicator, adminControl } from "../ui"

/** The prototype's one student who really goes through onboarding (the others are sample data). */
const DEMO_STUDENT_ID = "s1"
const NO_NOTES: Record<string, Student["notes"]> = {}
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "notes", label: "Notes" },
] as const
type Tab = (typeof TABS)[number]["id"]

const Label = ({ children }: { children: React.ReactNode }) => <h3 className="t-mono-label text-a-text-2">{children}</h3>
const Rule = () => <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />

/** A label on the left and its value on the right (Figma 'Row / …'). With `options` the value opens a menu, so the row stays plain at rest. */
function Row({ label, value, options }: { label: string; value: string; options?: { label: string; onSelect: () => void }[] }) {
  return (
    <div className="flex items-center gap-2 t-body-m">
      <span className="text-a-text-2">{label}</span>
      <span aria-hidden className="h-px min-w-px flex-1" />
      {options ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" className="-mx-1.5 min-w-0 truncate rounded-a-xs px-1.5 text-right text-a-text outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:inline-flex pointer-coarse:min-h-10 pointer-coarse:items-center" aria-label={`Change ${label.toLowerCase()}, now ${value}`} />}>{value}</DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {options.map((o) => (
              <DropdownMenuItem key={o.label} onClick={o.onSelect}>{o.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="min-w-0 truncate text-right text-a-text">{value}</span>
      )}
    </div>
  )
}

/** What the student answered in the short profile at the start, with the coach's own questions. */
function OnboardingAnswers() {
  const { coach } = useCoach()
  const { profile: p } = useStudentStart(coach.slug)
  const settings = useOnboardingSettings(coach.slug)
  const rows: [string, string][] = [
    ["Trading for", p.experience],
    ["Markets", p.markets.join(", ")],
    ["Goal", p.goal],
    ...(settings.custom ?? NO_QUESTIONS).map((c): [string, string] => [c.text, p.answers?.[c.id] ?? ""]),
  ]
  const answered = rows.filter(([, v]) => v.trim())
  if (!answered.length) return null
  return (
    <>
      <Rule />
      <section className="flex flex-col gap-2.5">
        <Label>Said when they joined</Label>
        {answered.map(([q, a]) => (
          <div key={q} className="grid gap-0.5 t-body-m">
            <span className="text-a-text-2">{q}</span>
            <span className="text-a-text">{a}</span>
          </div>
        ))}
      </section>
    </>
  )
}

/** Twelve weeks of lessons and trades. The three busiest weeks carry the accent, the rest stay quiet (Figma 'Weekly activity chart'). Numbers are sample data, steady per student. */
function WeeklyActivity({ s }: { s: Student }) {
  const weeks = useMemo(() => {
    const seed = [...s.id].reduce((n, c) => n + c.charCodeAt(0), 0) + s.trades30 + s.activeDays
    const out = Array.from({ length: 12 }, (_, i) => {
      const wave = ((seed * (i + 3) * 7919) % 11) / 11
      const lessons = Math.round(wave * 4 + (s.progress / 100) * 3)
      const trades = Math.round(((((seed + i) * 104729) % 13) / 13) * (s.trades30 / 4 + 2))
      return { lessons, trades, total: lessons + trades }
    })
    const top = [...out].sort((a, b) => b.total - a.total).slice(0, 3).map((w) => w.total)
    return out.map((w) => ({ ...w, hot: w.total > 0 && w.total >= Math.min(...top) }))
  }, [s])
  const max = Math.max(4, ...weeks.map((w) => w.total))
  const ceil = Math.ceil(max / 2) * 2
  return (
    <section className="flex flex-col gap-4" aria-label="Lessons and trades per week">
      <Label>Lessons and trades per week</Label>
      <div className="flex gap-3">
        <div aria-hidden className="flex h-[125px] shrink-0 flex-col justify-between text-right t-micro text-a-text-3 tabular-nums">
          <span>{ceil}</span>
          <span>{ceil / 2}</span>
          <span>0</span>
        </div>
        <ul className="grid min-w-0 flex-1 grid-cols-12 gap-2">
          {weeks.map((w, i) => (
            <li key={i} className="flex min-w-0 flex-col items-center gap-1" title={`${12 - i === 1 ? "This week" : `${12 - i - 1} weeks ago`}: ${w.lessons} lessons, ${w.trades} trades`}>
              <span className="flex h-[125px] w-full items-end border-b border-a-border-subtle">
                <span className={cn("block w-full rounded-t-a-xs transition-colors duration-300", w.hot ? "bg-a-accent-strong" : "bg-a-track")} style={{ height: `${Math.max(2, (w.total / ceil) * 100)}%` }} />
              </span>
              <span className="t-micro text-a-text-3 tabular-nums">{i + 1}</span>
              <span className="sr-only">{`${w.lessons} lessons, ${w.trades} trades`}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Students · 03 Profile, 07 Activity, 08 Notes (Figma 556:32726): everything about one student, in the drawer. Their name and money first, then what needs the coach, then the details. */
export function StudentProfile({ student: s, paused = false, onOpenChange, onMessage, onPause }: { student: Student | null; paused?: boolean; onOpenChange: (o: boolean) => void; onMessage: (s: Student) => void; onPause: (s: Student) => void }) {
  const { coach } = useCoach()
  const [notes, setNotes] = useCommunityData(coach.slug, "student-notes", NO_NOTES)
  const [tab, setTab] = useState<Tab>("overview")
  const [draft, setDraft] = useState("")
  // The pieces below follow the student on screen; while the drawer closes `last` keeps them so the content does not blink out.
  const [last, setLast] = useState<Student | null>(s)
  if (s && s !== last) {
    setLast(s)
    setDraft("")
  }
  const shown = s ?? last
  // Every time it opens it starts on the overview, even for the same student.
  const open = !!s
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setTab("overview")
  }

  const first = shown?.name.split(" ")[0] ?? ""
  const tier = shown ? tierFor(coach, shown.tier) : null
  const mine = shown ? [...(notes[shown.id] ?? []), ...shown.notes] : []
  const price = (id: string) => {
    const t = coach.tiers.find((x) => x.id === id)
    return t ? `${t.price}/${t.cadence === "quarter" ? "qtr" : "mo"}` : ""
  }
  const invited = !!shown?.joined.startsWith("invited")
  const failed = shown?.reason?.toLowerCase().includes("payment")
  const addNote = () => {
    if (!shown || !draft.trim()) return
    setNotes((n) => ({ ...n, [shown.id]: [{ by: "you", when: "just now", text: draft.trim() }, ...(n[shown.id] ?? [])] }))
    setDraft("")
    toast("Note added", { description: `Only your team sees it.` })
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Student"
      className="sm:data-[side=right]:w-[540px]"
      bodyClassName="gap-5"
      footer={
        shown && (
          <div className="flex w-full flex-wrap items-center gap-2">
            <AdminButton hierarchy={paused ? "secondary" : "danger"} onClick={() => onPause(shown)}>{paused ? "Resume access" : "Pause access"}</AdminButton>
            <span aria-hidden className="h-px min-w-px flex-1" />
            <AdminButton hierarchy="secondary" onClick={() => toast(`Opening ${first}'s journal`, { description: "Read-only: you see it as they do." })}>Open journal</AdminButton>
            <AdminButton className="max-sm:order-first max-sm:w-full" onClick={() => onMessage(shown)}>Send a message</AdminButton>
          </div>
        )
      }>
      {shown && tier && (
        <>
          <div className="flex items-center gap-3.5">
            <Avatar className="size-10 border border-a-border bg-a-track">
              <AvatarFallback className="bg-transparent t-body-m text-a-text">{shown.initials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 gap-0.5">
              <h2 className="t-heading-l truncate text-a-text">{shown.name}</h2>
              <p className="truncate t-body-m text-a-text-2">
                {shown.email} · {invited ? "invited" : "joined"} {shown.joined.replace(/^invited\s*/, "").replace(/ 20\d\d$/, "")}
              </p>
            </div>
          </div>

          <div className="flex items-stretch gap-2 sm:gap-4">
            {[
              ["Progress", `${shown.progress}%`],
              ["Rules kept", shown.broker ? `${shown.rules}%` : "—"],
              ["Paid so far", `€${shown.paid.toLocaleString("en")}`],
            ].map(([label, value], i) => (
              <div key={label} className="contents">
                {i > 0 && <span aria-hidden className="w-px bg-a-border" />}
                {/* On a phone the three share 300px: smaller padding and value, and the label may wrap instead of being cut. */}
                <Metric className="flex-1 px-3 max-sm:gap-1 sm:px-5 max-sm:[&>span:first-child]:min-h-7 max-sm:[&>span:first-child]:whitespace-normal max-sm:[&>span:nth-child(2)]:t-heading-l max-sm:[&>span:nth-child(2)]:whitespace-nowrap" label={label} value={value} />
              </div>
            ))}
          </div>

          {shown.reason && (
            <Callout
              tone={shown.health === "red" ? "danger" : "warning"}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger render={<AdminButton hierarchy="secondary" size="md" />}>Review</DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {failed ? (
                      <>
                        <DropdownMenuItem onClick={() => toast("Payment link sent", { description: `${first} gets an e-mail to update the card.` })}>Send payment link</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast("Retrying the payment", { description: "You'll see the result here." })}>Retry now</DropdownMenuItem>
                      </>
                    ) : invited ? (
                      <>
                        <DropdownMenuItem onClick={() => toast("Invite sent again", { description: `${first} gets a new e-mail.` })}>Send the invite again</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMessage(shown)}>Send a message</DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onMessage(shown)}>Send a message</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast(`Opening ${first}'s journal`)}>Open journal</DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => toast("Marked as reviewed", { description: "It stays in the history." })}>Mark as reviewed</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }>
              {failed ? `${shown.reason} · retrying Wed 14 Oct` : shown.reason}
            </Callout>
          )}

          <AdminUnderlineTabs label="Student" tabs={TABS} value={tab} onChange={setTab} />

          {tab === "overview" && (
            <>
              <section className="flex flex-col gap-2 rounded-a-10 border border-a-accent-strong bg-a-accent-soft px-4 py-3.5">
                <h3 className="t-mono-label text-a-text-accent">AI briefing · only you see this</h3>
                <p className="t-body-m text-a-text">
                  {first} has logged {shown.trades30} trades in 30 days and kept {shown.broker ? `${shown.rules}% of the rules` : "no rules yet, no broker connected"}. {shown.reason ? `${shown.reason}.` : "Nothing needs you this week."} {TRADES.filter((t) => t.review === "waiting").length > 0 && shown.id === DEMO_STUDENT_ID ? `${TRADES.filter((t) => t.review === "waiting").length} trades wait for your review.` : ""}
                </p>
              </section>

              <section className="flex flex-col gap-2.5">
                <Label>Tier and group</Label>
                <Row label="Tier" value={`${tier.name} · ${price(tier.id)}`} options={coach.tiers.map((t) => ({ label: `${t.name} · ${price(t.id)}`, onSelect: () => toast(`${shown.name} moves to ${t.name}`, { description: "Upgrades start now, downgrades at the end of the period." }) }))} />
                <Row label="Group" value={shown.group ?? "No group"} options={[{ label: "No group", onSelect: () => toast("Removed from the group") }, ...GROUPS.map((g) => ({ label: g.name, onSelect: () => toast(`Added to ${g.name}`, { description: "What a group unlocks starts on its start date." }) }))]} />
                <Row label="Next payment" value={failed ? "14 Oct" : "1 Nov"} />
                <Row label="Extra access" value={shown.coach ?? "Nobody"} options={[{ label: "Add a course for free", onSelect: () => toast("Pick a course to unlock for this student") }]} />
              </section>
              <Rule />
              <section className="flex flex-col gap-2.5">
                <Label>Course progress</Label>
                {COURSES.map((c, i) => {
                  const locked = c.locked && tier.id !== "vip"
                  const v = locked ? 0 : Math.max(0, Math.min(100, shown.progress + (i === 0 ? 0 : i === 1 ? -32 : -62)))
                  return (
                    <div key={c.id} className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{c.title}</span>
                        <span className="t-caption text-a-text-2 tabular-nums">{locked ? "No access" : `${v}%`}</span>
                      </div>
                      <AdminProgress label={`${c.title} progress`} value={v} />
                    </div>
                  )
                })}
              </section>
              <Rule />
              <section className="flex flex-col gap-2.5">
                <Label>Connected</Label>
                <Row label="Broker" value={shown.broker ? "Syncs automatically" : "Not connected"} />
                <Row label="Discord" value={shown.discord ? "Linked" : "Not linked"} />
              </section>
              {shown.id === DEMO_STUDENT_ID && <OnboardingAnswers />}
            </>
          )}

          {tab === "activity" && (
            <>
              <section className="flex flex-col gap-4">
                <Label>Recent activity</Label>
                {shown.history.length === 0 ? (
                  <p className="t-body-m text-a-text-2">Nothing yet. {first} hasn&apos;t done anything on the platform.</p>
                ) : (
                  <ol className="flex flex-col gap-4">
                    {shown.history.map((h, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <StepIndicator step={i + 1} state={/fail|declin|broke/i.test(h.text) ? "error" : "success"} />
                        <div className="grid min-w-0 t-body-m">
                          <span className="text-a-text">{h.text}</span>
                          <span className="text-a-text-2">{h.when}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <Rule />
              {shown.activeDays === 0 && shown.trades30 === 0 && shown.progress === 0 ? (
                <section className="flex flex-col gap-2.5">
                  <Label>Lessons and trades per week</Label>
                  <p className="t-body-m text-a-text-2">{invited ? `${first} hasn't joined yet.` : "Nothing in the last 12 weeks."}</p>
                </section>
              ) : (
                <WeeklyActivity s={shown} />
              )}
            </>
          )}

          {tab === "notes" && (
            <>
              <section className="flex flex-col gap-2.5">
                <Label>Private note</Label>
                <div className="relative">
                  <textarea
                    aria-label={`Private note about ${first}`}
                    rows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && (e.preventDefault(), addNote())}
                    placeholder="Only your team sees this"
                    className={cn(adminControl, "block h-[72px] resize-none py-2.5 pr-24")}
                  />
                  <AdminButton size="md" onClick={addNote} disabled={!draft.trim()} className="absolute right-2 bottom-2 motion-safe:transition-opacity">Add note</AdminButton>
                </div>
              </section>
              <Rule />
              <section className="flex flex-col gap-3.5">
                <Label>Pinned notes</Label>
                {mine.length === 0 ? (
                  <p className="t-body-m text-a-text-2">No notes yet. Write the first one above.</p>
                ) : (
                  mine.map((n, i) => (
                    <div key={`${n.when}-${i}`} className="grid t-body-m">
                      <span className="text-a-text-2">
                        {n.when} · {n.by === DEMO_ADMIN.name.split(" ")[0] ? "you" : n.by}
                      </span>
                      <p className="text-a-text">{n.text}</p>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </>
      )}
    </AdminDrawer>
  )
}
