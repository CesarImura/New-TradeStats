"use client"

import { useMemo, useState } from "react"
import { Download, FileUp, Mail, MoreHorizontal, Search, Send, Users } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { GROUPS, STUDENTS, tierFor, type Student } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Empty, Field, HealthDot, NativeSelect, Page, PageHeader } from "../kit"
import { ImportDialog } from "./import-dialog"
import { StudentProfile } from "./student-profile"

type Filter = "all" | "help" | "new" | "invited"

/** ADM-02 students list, with import (ADM-03), profile (ADM-04) and messages (ADM-55). */
export function StudentsPage() {
  const { coach } = useCoach()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [tier, setTier] = useState("")
  const [group, setGroup] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  const [open, setOpen] = useState<Student | null>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<Student[] | null>(null)

  const rows = useMemo(
    () =>
      STUDENTS.filter((s) => {
        if (q && !`${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())) return false
        if (filter === "help" && s.health === "green") return false
        if (filter === "new" && !/Oct 2026|Sep 2026/.test(s.joined)) return false
        if (filter === "invited" && !s.joined.startsWith("invited")) return false
        if (tier && tierFor(coach, s.tier).id !== tier) return false
        if (group && s.group !== group) return false
        return true
      }).sort((a, b) => rank(a) - rank(b)),
    [q, filter, tier, group, coach],
  )
  const all = rows.length > 0 && rows.every((r) => picked.includes(r.id))
  const counts = {
    all: STUDENTS.length,
    help: STUDENTS.filter((s) => s.health !== "green").length,
    new: STUDENTS.filter((s) => /Oct 2026|Sep 2026/.test(s.joined)).length,
    invited: STUDENTS.filter((s) => s.joined.startsWith("invited")).length,
  }
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const selected = STUDENTS.filter((s) => picked.includes(s.id))

  return (
    <Page wide>
      <PageHeader
        title="Students"
        text={`Everyone in ${coach.name}. Students who need you come first: failed payments, broken rules, nobody heard from them.`}
        guide="Managing students · 2 min"
        actions={
          <>
            <Button variant="outline" onClick={() => toast("Export started", { description: "students.csv with the columns you see." })}>
              <Download /> Export
            </Button>
            <Button onClick={() => setImporting(true)}>
              <FileUp /> Import or invite
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {(
              [
                ["all", "All"],
                ["help", "Needs help"],
                ["new", "New"],
                ["invited", "Invited"],
              ] as const
            ).map(([id, label]) => (
              <TabsTrigger key={id} value={id}>
                {label} <span className="text-muted-foreground tabular-nums">{counts[id]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or e-mail" className="pl-8" aria-label="Search students" />
        </div>
        <NativeSelect value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier">
          <option value="">All tiers</option>
          {coach.tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group">
          <option value="">All groups</option>
          {GROUPS.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {picked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ts-cta)]/30 bg-[var(--ts-cta)]/6 px-3 py-2 text-sm">
          <span className="tabular-nums">{picked.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => setMessage(selected)}>
            <Mail /> Message
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>Move to tier</DropdownMenuTrigger>
            <DropdownMenuContent>
              {coach.tiers.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => toast(`${picked.length} students move to ${t.name}`, { description: "Upgrades start now, downgrades at the end of the period." })}>
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>Add to group</DropdownMenuTrigger>
            <DropdownMenuContent>
              {GROUPS.map((g) => (
                <DropdownMenuItem key={g.id} onClick={() => toast(`${picked.length} students added to ${g.name}`)}>
                  {g.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setPicked([])}>
            Clear
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <Empty icon={Users} title="No students match" text="Clear the search or the filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-3">
                  <Checkbox checked={all} onCheckedChange={(v) => setPicked(v ? rows.map((r) => r.id) : [])} aria-label="Select all" />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Tier and group</TableHead>
                <TableHead className="hidden lg:table-cell">Progress</TableHead>
                <TableHead className="hidden md:table-cell">Active</TableHead>
                <TableHead className="hidden xl:table-cell">Journal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setOpen(s)} data-state={picked.includes(s.id) ? "selected" : undefined}>
                  <TableCell className="pl-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={picked.includes(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-44 items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{s.initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid min-w-0">
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{s.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="grid">
                      <span>{tierFor(coach, s.tier).name}</span>
                      <span className="text-xs text-muted-foreground">{s.group ?? "No group"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex w-32 items-center gap-2">
                      <Progress value={s.progress} className="flex-1" />
                      <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">{s.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="grid">
                      <span>{s.lastActive}</span>
                      <ActivityDots days={s.activeDays} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {s.broker ? `${s.trades30} trades · ${s.rules}% rules` : <span className="text-muted-foreground">No broker</span>}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <HealthDot health={s.health} />
                      <span className={cn("max-w-48 truncate", s.health === "green" && "text-muted-foreground")}>{s.reason ?? "All good"}</span>
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setOpen(s)}>Open profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMessage([s])}>Send a message</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast(`Viewing the platform as ${s.name}`, { description: "Opens the student side with their tier and group." })}>
                          View the platform as {s.name.split(" ")[0]}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => toast(`${s.name}'s access paused`)}>
                          Pause access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <StudentProfile student={open} onOpenChange={(o) => !o && setOpen(null)} onMessage={(s) => setMessage([s])} />
      <ImportDialog open={importing} onOpenChange={setImporting} />
      <MessageDialog to={message} onClose={() => setMessage(null)} />
    </Page>
  )
}

const rank = (s: Student) => (s.health === "red" ? 0 : s.health === "amber" ? 1 : 2)

/** Last 14 days, one dot per day the student was active. */
function ActivityDots({ days }: { days: number }) {
  return (
    <span className="mt-1 flex gap-0.5" aria-label={`Active ${days} of the last 14 days`}>
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className={cn("h-1.5 w-1 rounded-[1px] bg-white/10", i >= 14 - days && "bg-[var(--ts-cta)]/80")} />
      ))}
    </span>
  )
}

/** ADM-55. One student or a selection, by e-mail and in the platform. */
export function MessageDialog({ to, onClose }: { to: Student[] | null; onClose: () => void }) {
  const { coach } = useCoach()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [email, setEmail] = useState(true)
  const names = to?.map((s) => s.name.split(" ")[0]).join(", ")
  return (
    <Dialog open={!!to} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message {to?.length === 1 ? to[0].name : `${to?.length} students`}</DialogTitle>
          <DialogDescription>{to && to.length > 1 ? names : "Arrives in their notifications"}{email ? " and by e-mail" : ""}, from {coach.coachName}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick check-in" />
          </Field>
          <Field label="Message" hint="{first} becomes their first name">
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Hi {first},\n\n"} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={email} onCheckedChange={(v) => setEmail(!!v)} /> Also send by e-mail
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!body.trim()}
            onClick={() => {
              toast(`Message sent to ${to?.length === 1 ? to[0].name : `${to?.length} students`}`)
              setSubject("")
              setBody("")
              onClose()
            }}
          >
            <Send /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

