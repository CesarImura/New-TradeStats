"use client"

import { useMemo, useState } from "react"
import { Download, Mail, Plus, Users, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GROUPS, STUDENTS, tierFor, type Student } from "@/lib/data/people"
import { EmptyState, PageHeader } from "../kit"
import { AdminButton, AdminFilter, AdminSearch, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, CellPerson, CellProgress, CellStack, StatPanel, Tag } from "../ui"
import { SetupTip } from "../setup-checklist"
import { ImportDialog } from "./import-dialog"
import { MessageDialog } from "./student-message"
import { StudentProfile } from "./student-profile"

export { MessageDialog } from "./student-message"

type Filter = "all" | "help" | "invited" | "paused"
const PAGE = 8

/** Students (Figma 518:7152, 01 List, 02 Selected, 06 No results): the questions a coach asks as tabs, a table that opens a profile drawer, import, message. */
export function StudentsPage() {
  const { coach } = useCoach()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [tier, setTier] = useState("")
  const [group, setGroup] = useState("")
  const [page, setPage] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [paused, setPaused] = useState<string[]>([])
  const [open, setOpen] = useState<Student | null>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<Student[] | null>(null)

  const rows = useMemo(
    () =>
      STUDENTS.filter((s) => {
        if (q && !`${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())) return false
        if (filter === "help" && s.health === "green") return false
        if (filter === "paused" && !paused.includes(s.id)) return false
        if (filter === "invited" && !s.joined.startsWith("invited")) return false
        if (tier && tierFor(coach, s.tier).id !== tier) return false
        if (group && s.group !== group) return false
        return true
      }).sort((a, b) => rank(a) - rank(b)),
    [q, filter, tier, group, coach, paused],
  )
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const at = Math.min(page, pages - 1)
  const shown = rows.slice(at * PAGE, at * PAGE + PAGE)
  const counts = {
    all: STUDENTS.length,
    help: STUDENTS.filter((s) => s.health !== "green").length,
    invited: STUDENTS.filter((s) => s.joined.startsWith("invited")).length,
    paused: paused.length,
  }
  const joinedThisMonth = STUDENTS.filter((s) => /Oct 2026|Sep 2026/.test(s.joined)).length
  const onPage = shown.filter((r) => picked.includes(r.id)).length
  const selected = STUDENTS.filter((s) => picked.includes(s.id))
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  /** Changing what is shown goes back to the first page and keeps the selection only for what is still listed. */
  const refine = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(0)
  }
  const filtering = !!(q || tier || group || filter !== "all")
  const reset = () => {
    setQ("")
    setTier("")
    setGroup("")
    setFilter("all")
    setPage(0)
  }
  const label = (n: number) => `${n} ${n === 1 ? "student" : "students"}`

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Students"
        text={`${coach.name} · ${STUDENTS.length} students · ${joinedThisMonth} joined this month`}
        actions={
          <>
            <AdminButton onClick={() => toast("Export started", { description: "students.csv with the columns you see." })} hierarchy="secondary">
              <Download /> Export
            </AdminButton>
            <AdminButton onClick={() => setImporting(true)}>
              <Plus /> Import or invite
            </AdminButton>
          </>
        }
      />
      <SetupTip task="invite" />

      <StatPanel
        stats={[
          { label: "Active this week", value: STUDENTS.filter((s) => s.activeDays > 0 && !s.joined.startsWith("invited")).length, delta: `${Math.round((STUDENTS.filter((s) => s.activeDays > 0).length / Math.max(STUDENTS.length, 1)) * 100)}% of all students` },
          { label: "Need help", value: counts.help, delta: "Rules broken or stuck" },
          { label: "Payment issues", value: STUDENTS.filter((s) => s.reason?.toLowerCase().includes("payment")).length, delta: "Retrying automatically" },
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
              {coach.tiers.map((t) => (
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
              { id: "help", label: "Needs help", count: counts.help },
              { id: "invited", label: "Invited", count: counts.invited },
              { id: "paused", label: "Paused", count: counts.paused },
            ]}
          />
          <div className="flex-1" />
          <AdminSearch value={q} onChange={refine(setQ)} placeholder="Search students" hint="⌘K" />
          <AdminFilter label="Tier" value={tier} onValueChange={refine(setTier)} options={[{ value: "", label: "All tiers" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
          <AdminFilter label="Group" value={group} onValueChange={refine(setGroup)} options={[{ value: "", label: "All groups" }, ...GROUPS.map((g) => ({ value: g.name, label: g.name }))]} />
        </AdminToolbar>
      )}

      {rows.length === 0 ? (
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
                Showing {shown.length} of {rows.length}
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
            <AdminTh width={216}>Tier and group</AdminTh>
            <AdminTh width={166}>Course progress</AdminTh>
            <AdminTh width={116} align="end">Rules kept</AdminTh>
            <AdminTh width={216}>Status</AdminTh>
            <AdminTh width={130} align="end">Last active</AdminTh>
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
                    <button type="button" onClick={(e) => (e.stopPropagation(), setOpen(s))} className="block w-full min-w-0 rounded-a-xs text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus" aria-label={`Open ${s.name}`}>
                      <CellPerson initials={s.initials} name={s.name} subtitle={s.email} />
                    </button>
                  </AdminTd>
                  <AdminTd>
                    <CellStack title={tierFor(coach, s.tier).name} subtitle={s.group ?? "No group"} />
                  </AdminTd>
                  <AdminTd>
                    <CellProgress label={`${s.name} course progress`} value={s.progress} />
                  </AdminTd>
                  <AdminTd align="end">{s.broker ? `${s.rules}%` : <span className="text-a-text-3">—</span>}</AdminTd>
                  <AdminTd>
                    <Tag tone={invited ? "neutral" : s.health === "red" ? "danger" : s.health === "amber" ? "warning" : "success"} dot className="max-w-full">
                      <span className="truncate">{s.reason ?? "All good"}</span>
                    </Tag>
                  </AdminTd>
                  <AdminTd align="end" className="whitespace-nowrap">{s.lastActive === "never" ? <span className="text-a-text-3">—</span> : s.lastActive}</AdminTd>
                </AdminTr>
              )
            })}
          </tbody>
        </AdminTable>
      )}

      <StudentProfile student={open} paused={!!open && paused.includes(open.id)} onOpenChange={(o) => !o && setOpen(null)} onMessage={(s) => setMessage([s])} onPause={(s) => { const on = paused.includes(s.id); setPaused((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id])); toast(on ? `${s.name} has access again` : `Access paused for ${s.name}`, { description: on ? "Everything is back as it was." : "Keeps the account and the journal. Nothing is deleted." }) }} />
      <ImportDialog open={importing} onOpenChange={setImporting} />
      <MessageDialog to={message} onClose={() => setMessage(null)} />
    </div>
  )
}

const rank = (s: Student) => (s.health === "red" ? 0 : s.health === "amber" ? 1 : 2)
