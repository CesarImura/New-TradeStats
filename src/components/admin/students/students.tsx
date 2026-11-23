"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Mail, Plus, Users, X } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { isOfferOnly } from "@/lib/data/access"
import { GROUPS, STUDENTS, tierFor, type Student } from "@/lib/data/people"
import { NOW } from "@/lib/data/schedule"
import { NO_ALERTS, PAYMENT_ALERTS } from "@/lib/data/payment-alerts"
import { EmptyState, PageHeader, useCommunityData } from "../kit"
import { AdminButton, AdminFilter, AdminModal, AdminSearch, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, CellPerson, CellProgress, CellStack, StatPanel, Tag } from "../ui"
import { SetupTip } from "../setup-checklist"
import { useNewPlatform } from "../use-new-platform"
import { ImportDialog } from "./import-dialog"
import { MessageDialog } from "./student-message"
import { StudentProfile } from "./student-profile"

export { MessageDialog } from "./student-message"

type Filter = "all" | "help" | "invited" | "paused"

/** Courses each sample student is enrolled in (Figma Students 01 shows the count next to the tier). */
const COURSES: Record<string, number> = { s1: 3, s2: 2, s3: 1, s4: 1, s5: 1, s6: 3, s7: 2, s8: 2, s9: 1, s10: 1, s11: 3, s12: 1, s13: 3, s14: 2, s15: 2 }
/** The sample students above are set by hand; the generated ones get a steady 1 to 3 from their id. */
const coursesOf = (id: string) => COURSES[id] ?? 1 + ([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3)
const PAGE = 8
const NO_STUDENTS: Student[] = []
const NO_ADDED: Student[] = []

/** Students (Figma 518:7152, 01 List, 02 Selected, 06 No results): the questions a coach asks as tabs, a table that opens a profile drawer, import, message. */
export function StudentsPage() {
  const { coach } = useCoach()
  const fresh = useNewPlatform()
  const [removed, setRemoved] = useState<string[]>([])
  // People brought in by "Import or invite" (kept in the browser like the notes); they join the list as Invited, newest first.
  const [added, setAdded] = useCommunityData(coach.slug, "students-added", NO_ADDED)
  const students = [...added, ...(fresh ? NO_STUDENTS : STUDENTS)].filter((s) => !removed.includes(s.id))
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [tier, setTier] = useState("")
  const [group, setGroup] = useState("")
  // The list opens in Figma's order (Students 01); "At risk first" puts payment and rule problems on top.
  const [sort, setSort] = useState<"default" | "risk">("default")
  const [page, setPage] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  // Figma Students 01 shows 2 paused students: two of the fine ones, picked by position.
  const [paused, setPaused] = useState<string[]>(() => STUDENTS.filter((s) => s.health === "green").filter((_, i) => i === 20 || i === 61).map((s) => s.id))
  const [open, setOpen] = useState<Student | null>(null)
  // ⌘K opens a student with ?open=<id>; it also works when this page is already on screen.
  const openParam = useSearchParams().get("open")
  const [seenParam, setSeenParam] = useState<string | null>(null)
  if (openParam !== seenParam) {
    setSeenParam(openParam)
    const hit = openParam ? students.find((s) => s.id === openParam) : undefined
    if (hit) setOpen(hit)
  }
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<Student[] | null>(null)
  // "Remove student" (Figma Students 02f): the coach confirms, the student leaves the list and can be invited again.
  const [removing, setRemoving] = useState<Student | null>(null)

  const rows = useMemo(
    () =>
      students.filter((s) => {
        if (q && !`${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())) return false
        if (filter === "help" && !atRisk(s)) return false
        if (filter === "paused" && !paused.includes(s.id)) return false
        if (filter === "invited" && !s.joined.startsWith("invited")) return false
        if (tier && tierFor(coach, s.tier).id !== tier) return false
        if (group && s.group !== group) return false
        return true
      }).sort((a, b) => (sort === "risk" ? rank(a) - rank(b) : 0)),
    [q, filter, tier, group, coach, paused, students, sort],
  )
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const at = Math.min(page, pages - 1)
  const shown = rows.slice(at * PAGE, at * PAGE + PAGE)
  const activeNow = students.filter((s) => s.activeDays >= 10 && !s.joined.startsWith("invited")).length
  const counts = {
    all: students.length,
    help: students.filter(atRisk).length,
    invited: students.filter((s) => s.joined.startsWith("invited")).length,
    paused: students.filter((s) => paused.includes(s.id)).length,
  }
  // "This month" is the 30 days up to the prototype clock (joins are written as "5 Nov 2025").
  const joinedThisMonth = students.filter((s) => {
    const days = (NOW.getTime() - new Date(`${s.joined} 12:00`).getTime()) / 86_400_000
    return days > -1 && days <= 30
  }).length
  const onPage = shown.filter((r) => picked.includes(r.id)).length
  const selected = students.filter((s) => picked.includes(s.id))
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  /** Changing what is shown goes back to the first page and keeps the selection only for what is still listed. */
  const refine = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(0)
  }
  const filtering = !!(q || tier || group || filter !== "all" || sort !== "default")
  const reset = () => {
    setQ("")
    setTier("")
    setGroup("")
    setFilter("all")
    setSort("default")
    setPage(0)
  }
  const label = (n: number) => `${n} ${n === 1 ? "student" : "students"}`

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Students"
        text={students.length === 0 ? `${coach.name} · No students yet` : `${coach.name} · ${label(students.length)} · ${joinedThisMonth} joined this month`}
        actions={
          <>
            <AdminButton onClick={() => toast("Export started", { description: "students.csv with the columns you see." })} hierarchy="secondary">
              <Download /> Export
            </AdminButton>
            {/* One primary action per screen: with no students or no matches the empty state button is the primary one. */}
            <AdminButton hierarchy={rows.length === 0 ? "secondary" : undefined} onClick={() => setImporting(true)}>
              <Plus /> Import or invite
            </AdminButton>
          </>
        }
      />
      <SetupTip task="invite" />

      <StatPanel
        stats={[
          { label: "Active this week", value: activeNow, delta: `${Math.round((activeNow / Math.max(students.length, 1)) * 100)}% of all students` },
          { label: "At risk", value: counts.help, delta: "Rules broken or stuck" },
          { label: "Payment issues", value: fresh ? NO_ALERTS.length : PAYMENT_ALERTS.length, delta: "Payments that need you" },
          { label: "Invited", value: counts.invited, delta: "Haven't joined yet" },
        ]}
      />

      {/* While rows are selected the action bar takes the place of the toolbar: the same spot, so the table stays where the eye is. */}
      {picked.length > 0 ? (
        <div role="region" aria-label="Selected students" className="flex min-h-12 flex-wrap items-center gap-2 rounded-a-10 border border-a-border-strong bg-a-raised py-2 pr-2 pl-3.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
          <Checkbox checked={picked.length === rows.length} indeterminate={picked.length < rows.length} onCheckedChange={() => setPicked([])} aria-label="Clear the selection" />
          <span role="status" aria-live="polite" className="t-body-m text-a-text">{picked.length} selected</span>
          {picked.length < rows.length ? (
            <>
              <span aria-hidden className="t-body-m text-a-text-3">·</span>
              <button type="button" onClick={() => setPicked(rows.map((r) => r.id))} className="rounded-a-xs t-body-m text-a-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus">
                Select all {rows.length}
              </button>
            </>
          ) : null}
          <span className="min-w-0 flex-1" />
          <AdminButton hierarchy="secondary" size="md" onClick={() => setMessage(selected)}>
            <Mail /> Send a message
          </AdminButton>
          <DropdownMenu>
            <DropdownMenuTrigger render={<AdminButton hierarchy="secondary" size="md" />}>Move to tier</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {coach.tiers.filter((t) => !isOfferOnly(t)).map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => toast(`${label(picked.length)} move to ${t.name}`, { description: "Upgrades start now, downgrades at the end of the period." })}>
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger render={<AdminButton hierarchy="secondary" size="md" />}>Add to group</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {GROUPS.map((g) => (
                <DropdownMenuItem key={g.id} onClick={() => toast(`${label(picked.length)} added to ${g.name}`)}>
                  {g.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AdminButton hierarchy="secondary" size="md" onClick={() => toast("Export started", { description: `students.csv with ${label(picked.length)}.` })}>
            Export
          </AdminButton>
          <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Clear selection" onClick={() => setPicked([])}>
            <X />
          </AdminButton>
        </div>
      ) : (
        <AdminToolbar>
          <AdminTabs
            label="Students"
            value={filter}
            onChange={(v) => refine(setFilter)(v as Filter)}
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "help", label: "At risk", count: counts.help },
              { id: "invited", label: "Invited", count: counts.invited },
              { id: "paused", label: "Paused", count: counts.paused },
            ]}
          />
          <div className="flex-1" />
          <AdminSearch value={q} onChange={refine(setQ)} placeholder="Search students" hint="⌘K" />
          <AdminFilter label="Tier" value={tier} onValueChange={refine(setTier)} options={[{ value: "", label: "All tiers" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
          <AdminFilter label="Group" value={group} onValueChange={refine(setGroup)} options={[{ value: "", label: "All groups" }, ...GROUPS.map((g) => ({ value: g.name, label: g.name }))]} />
          <AdminFilter label="Sort" value={sort} onValueChange={refine((v: string) => setSort(v as "default" | "risk"))} options={[{ value: "default", label: "Default" }, { value: "risk", label: "At risk first" }]} />
        </AdminToolbar>
      )}

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Import a list or share your link. Everyone who joins shows up here with their progress."
          actions={<AdminButton onClick={() => setImporting(true)}><Plus /> Import or invite</AdminButton>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students match"
          description={q ? `Nobody called “${q}”${tier ? ` in ${coach.tiers.find((t) => t.id === tier)?.name}` : ""}. Clear the search or the filters.` : "Clear the search or the filters."}
          actions={
            <>
              {filtering && <AdminButton hierarchy="secondary" onClick={reset}>Clear filters</AdminButton>}
              <AdminButton onClick={() => setImporting(true)}><Plus /> Invite a student</AdminButton>
            </>
          }
        />
      ) : (
        <AdminTable
          minWidth={1100}
          footer={
            <AdminTableFooter className="py-[10px]">
              <span className="mr-auto tabular-nums">
                Showing {at * PAGE + 1}–{at * PAGE + shown.length} of {rows.length}
              </span>
              <AdminButton hierarchy="secondary" size="md" disabled={at === 0} onClick={() => setPage(at - 1)}>Previous</AdminButton>
              <AdminButton hierarchy="secondary" size="md" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>Next</AdminButton>
            </AdminTableFooter>
          }
        >
          <AdminTableHead>
            <AdminTh width={52}>
              <Checkbox checked={onPage === shown.length && shown.length > 0} indeterminate={onPage > 0 && onPage < shown.length} onCheckedChange={(v) => setPicked((p) => (v ? [...new Set([...p, ...shown.map((r) => r.id)])] : p.filter((id) => !shown.some((r) => r.id === id))))} aria-label="Select all on this page" />
            </AdminTh>
            <AdminTh>Student</AdminTh>
            <AdminTh width={150}>Tier and group</AdminTh>
            <AdminTh width={80}>Courses</AdminTh>
            <AdminTh width={150}>Overall progress</AdminTh>
            <AdminTh width={90}>Rules kept</AdminTh>
            <AdminTh width={120}>Status</AdminTh>
            <AdminTh width={112}>Joined</AdminTh>
            <AdminTh width={96} align="end">Last active</AdminTh>
          </AdminTableHead>
          <tbody>
            {shown.map((s) => {
              const on = picked.includes(s.id)
              const invited = s.joined.startsWith("invited")
              return (
                <AdminTr key={s.id} selected={on} onClick={() => setOpen(s)}>
                  <AdminTd onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={on} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
                  </AdminTd>
                  <AdminTd>
                    <button type="button" onClick={(e) => (e.stopPropagation(), setOpen(s))} className="block w-full min-w-0 rounded-a-xs text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">
                      <span className="sr-only">Open </span>
                      <CellPerson initials={s.initials} name={s.name} subtitle={s.email} />
                    </button>
                  </AdminTd>
                  <AdminTd>
                    <CellStack title={tierFor(coach, s.tier).name} subtitle={s.group ?? "No group"} />
                  </AdminTd>
                  <AdminTd className="tabular-nums text-a-text">{coursesOf(s.id)}</AdminTd>
                  <AdminTd>
                    <CellProgress label={`${s.name} overall progress`} value={s.progress} />
                  </AdminTd>
                  <AdminTd className="text-a-text">{s.broker ? `${s.rules}%` : <span className="text-a-text-3">—</span>}</AdminTd>
                  <AdminTd>
                    <StudentStatus student={s} paused={paused.includes(s.id)} />
                  </AdminTd>
                  <AdminTd className="whitespace-nowrap text-a-text">{invited ? <span className="text-a-text-3">—</span> : s.joined}</AdminTd>
                  <AdminTd align="end" className="whitespace-nowrap">{s.lastActive === "never" ? <span className="text-a-text-3">—</span> : s.lastActive}</AdminTd>
                </AdminTr>
              )
            })}
          </tbody>
        </AdminTable>
      )}

      <StudentProfile student={open} paused={!!open && paused.includes(open.id)} onOpenChange={(o) => !o && setOpen(null)} onMessage={(s) => setMessage([s])} onRemove={(s) => setRemoving(s)} onPause={(s) => { const on = paused.includes(s.id); setPaused((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id])); toast(on ? `${s.name} has access again` : `Access paused for ${s.name}`, { description: on ? "Everything is back as it was." : "Keeps the account and the journal. Nothing is deleted." }) }} />
      <ImportDialog open={importing} onOpenChange={setImporting} existing={students.map((s) => s.email)} onImported={(list) => { setAdded((a) => [...list, ...a]) }} />
      <MessageDialog to={message} onClose={() => setMessage(null)} />
      <AdminModal
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.name ?? "student"}?`}
        subtitle={`${removing?.name.split(" ")[0] ?? "The student"} loses access to the community right away.`}
        className="sm:max-w-[560px]"
        footer={
          <>
            <AdminButton hierarchy="ghost" onClick={() => setRemoving(null)}>Cancel</AdminButton>
            <AdminButton
              hierarchy="danger"
              onClick={() => {
                if (!removing) return
                const gone = removing
                setRemoved((r) => [...r, gone.id])
                setRemoving(null)
                setOpen(null)
                toast(`${gone.name} removed`, { action: { label: "Undo", onClick: () => setRemoved((r) => r.filter((x) => x !== gone.id)) } })
              }}>
              Remove student
            </AdminButton>
          </>
        }>
        <p className="t-body-m text-a-text-2">
          {removing?.offer
            ? `${removing.name.split(" ")[0]} paid ${removing.offer.paidCount} of ${removing.offer.plan} instalments on ${removing.offer.name}. The remaining €${((removing.offer.plan - removing.offer.paidCount) * removing.offer.each).toLocaleString("en")} will not be collected and the payment link stops working. You can invite ${removing.name.split(" ")[0]} again later.`
            : `Nothing else is deleted. You can invite ${removing?.name.split(" ")[0] ?? "the student"} again later.`}
        </p>
      </AdminModal>
    </div>
  )
}

/** A failed payment, a failed instalment or a dispute: the five people of the payment alerts (Sales · 01c). */
const paymentIssue = (s: Student) => s.health === "red" || !!s.offer?.failed
/** Worth a look but not a payment problem or a student who has not joined (those have their own status). */
const atRisk = (s: Student) => s.health !== "green" && !s.joined.startsWith("invited") && !paymentIssue(s)
const rank = (s: Student) => (s.health === "red" ? 0 : s.health === "amber" ? 1 : 2)

/** The six standard statuses (Figma Students 01): what the coach should do about a student, in one word or two. */
function StudentStatus({ student: s, paused }: { student: Student; paused: boolean }) {
  if (paused) return <Tag>Paused</Tag>
  if (s.joined.startsWith("invited")) return <Tag>Invited</Tag>
  if (paymentIssue(s)) return <Tag tone="danger">Payment issue</Tag>
  if (s.health !== "green") return <Tag tone="warning">At risk</Tag>
  return <Tag tone="success">{s.progress >= 100 ? "Completed" : "Active"}</Tag>
}
