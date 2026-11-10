"use client"

import { useState } from "react"
import Link from "next/link"
import { Medal, Plus, Trophy } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AdminButton, Panel, PanelHeader, Tag } from "@/components/admin/ui"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BADGES, COMPETITIONS, LEVELS, POINTS, RANK_METRICS } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"

export type RankingSetup = { metric: string; period: string; nicknames: boolean; optOut: boolean; competitions: typeof COMPETITIONS; points: typeof POINTS }
export const DEFAULT_RANKING: RankingSetup = { metric: "discipline", period: "month", nicknames: true, optOut: true, competitions: COMPETITIONS, points: POINTS }

/** Admin leaderboard rows (Figma 537:7990): full names, tier, points, rules kept, move. */
const BOARD = [
  { rank: 1, name: "Sara Kowalski", initials: "SK", tier: "Trading Desk", points: 2410, rules: 96, change: 3 },
  { rank: 2, name: "Jonas Weber", initials: "JW", tier: "Inner Circle", points: 2180, rules: 91, change: -1 },
  { rank: 3, name: "Mia Sørensen", initials: "MS", tier: "Trading Desk", points: 1960, rules: 88, change: 5 },
  { rank: 4, name: "Lena Ito", initials: "LI", tier: "1:1 VIP", points: 1720, rules: 93, change: 0 },
  { rank: 5, name: "Alex Moreau", initials: "AM", tier: "Trading Desk", points: 1604, rules: 74, change: -2 },
  { rank: 6, name: "Priya Nair", initials: "PN", tier: "Inner Circle", points: 1511, rules: 90, change: 1 },
]

/** ADM-53 ranking and competitions, ADM-54 points, levels and badges. */
export function RankingAdmin() {
  const { coach, base } = useCoach()
  const [r, setR] = useCommunityData(coach.slug, "ranking", DEFAULT_RANKING)
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState("leaderboard")
  const set = (p: Partial<RankingSetup>) => setR((x) => ({ ...x, ...p }))

  return (
    <Page>
      <PageHeader
        title="Ranking"
        text="Leaderboard, competitions, points and badges"
        actions={
          <AdminButton hierarchy="primary" onClick={() => setCreating(true)}>
            <Plus /> New competition
          </AdminButton>
        }
      />
      {!coach.modules.ranking && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ts-interactive)]/40 bg-[var(--ts-interactive)]/8 px-4 py-3 text-sm">
          <Trophy className="size-4 text-[var(--ts-interactive)]" />
          <span className="flex-1">Ranking is switched off, so students don&apos;t see it yet.</span>
          <AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={`${base}/design`} />}>
            Switch on in Design
          </AdminButton>
        </div>
      )}
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-5">
        <div className="flex flex-wrap items-center gap-2">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="points">Points & badges</TabsTrigger>
        </TabsList>
        {tab === "leaderboard" && (
          <>
            <div className="flex-1" />
            <div role="group" aria-label="Period" className="flex items-center gap-2">
              {([["week", "This week"], ["month", "This month"], ["all", "All time"]] as const).map(([id, label]) => (
                <AdminButton key={id} type="button" hierarchy={r.period === id ? "secondary" : "ghost"} size="lg" aria-pressed={r.period === id} onClick={() => set({ period: id })}>
                  {label}
                </AdminButton>
              ))}
            </div>
          </>
        )}
        </div>

        <TabsContent value="leaderboard" className="grid gap-6">
          <Panel>
            <PanelHeader
              title={`Now · ${RANK_METRICS.find((m) => m.id === r.metric)?.name}`}
              description="Ranks by points: lessons, journal entries and rules kept. Students can opt out."
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Tier</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Rules kept</TableHead>
                    <TableHead className="text-right">Move</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BOARD.map((l) => (
                    <TableRow key={l.rank}>
                      <TableCell className={cn("tabular-nums", l.rank <= 3 && "text-a-accent-strong")}>{l.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="text-[10px]">{l.initials}</AvatarFallback>
                          </Avatar>
                          {r.nicknames ? l.name : l.name.replace(".", "")}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-a-text-2 md:table-cell">{l.tier}</TableCell>
                      <TableCell className="text-right tabular-nums">{l.points.toLocaleString("en")}</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">{l.rules}%</TableCell>
                      <TableCell className="text-right">
                        {l.change === 0 ? <Tag>–</Tag> : <Tag tone={l.change > 0 ? "success" : "danger"}>{l.change > 0 ? `+${l.change}` : l.change}</Tag>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="grid content-start gap-2 p-4">
              <h2 className="t-heading-m">What ranks students</h2>
              <div role="radiogroup" aria-label="What ranks students" className="mt-1 grid gap-2">
                {RANK_METRICS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => set({ metric: m.id })}
                    role="radio"
                    aria-checked={r.metric === m.id}
                    type="button"
                    className={cn("grid gap-0.5 rounded-a-md border border-a-border-subtle px-3 py-2.5 text-left transition-colors duration-300 hover:bg-a-hover", r.metric === m.id && "border-a-border-strong bg-a-selected")}
                  >
                    <span className="t-body-m">{m.name}</span>
                    <span className="t-caption text-a-text-2">{m.text}</span>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel className="divide-y divide-a-border-subtle self-start px-4">
              <SettingRow label="Nicknames instead of real names">
                <Switch checked={r.nicknames} onCheckedChange={(v) => set({ nicknames: v })} />
              </SettingRow>
              <SettingRow label="Students can opt out" text="They still see their own position">
                <Switch checked={r.optOut} onCheckedChange={(v) => set({ optOut: v })} />
              </SettingRow>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="competitions">
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Competition</TableHead>
                  <TableHead>Ranks by</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead className="text-right">Entrants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.competitions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {c.name}
                        <Tag tone={c.status === "running" ? "success" : "neutral"} className="capitalize">
                          {c.status}
                        </Tag>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{RANK_METRICS.find((m) => m.id === c.metric)?.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.start} – {c.end}
                    </TableCell>
                    <TableCell className="whitespace-normal">{c.prize}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.entrants}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="points" className="grid gap-6 lg:grid-cols-3">
          <section className="grid content-start gap-2">
            <h2 className="font-medium">Points</h2>
            <div className="divide-y rounded-lg border bg-card px-3">
              {r.points.map((p, i) => (
                <SettingRow key={p.action} label={p.action}>
                  <Input
                    type="number"
                    value={p.points}
                    onChange={(e) => set({ points: r.points.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) } : x)) })}
                    className="h-7 w-16 text-right tabular-nums"
                    aria-label={`Points for ${p.action}`}
                  />
                </SettingRow>
              ))}
            </div>
          </section>
          <section className="grid content-start gap-2">
            <h2 className="font-medium">Levels</h2>
            <div className="divide-y rounded-lg border bg-card">
              {LEVELS.map((l, i) => (
                <div key={l.name} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="grid size-6 place-items-center rounded-md bg-muted text-xs tabular-nums">{i + 1}</span>
                  <span className="flex-1">{l.name}</span>
                  <span className="text-muted-foreground tabular-nums">from {l.from}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="grid content-start gap-2">
            <h2 className="font-medium">Badges</h2>
            <div className="divide-y rounded-lg border bg-card">
              {BADGES.map((b) => (
                <div key={b.name} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <Medal className="size-4 text-[var(--ts-cta)]" />
                  <span className="flex-1">{b.name}</span>
                  <span className="text-muted-foreground tabular-nums">{b.earned} earned</span>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
      <NewCompetition
        open={creating}
        onOpenChange={setCreating}
        onCreate={(c) => {
          set({ competitions: [c, ...r.competitions] })
          toast(`${c.name} scheduled`, { description: "Students see it in Ranking and get a notification." })
        }}
      />
    </Page>
  )
}

function NewCompetition({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (c: (typeof COMPETITIONS)[number]) => void }) {
  const [name, setName] = useState("")
  const [metric, setMetric] = useState("consistency")
  const [start, setStart] = useState("1 Nov")
  const [end, setEnd] = useState("30 Nov")
  const [prize, setPrize] = useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New competition</DialogTitle>
          <DialogDescription>Only verified broker trades count. Amounts are never shown, only percentages and scores.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="November discipline cup" />
          </Field>
          <Field label="Ranks by">
            <NativeSelect value={metric} onChange={(e) => setMetric(e.target.value)}>
              {RANK_METRICS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Ends">
              <Input value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <Field label="Prize">
            <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="A free month of Trading Desk" />
          </Field>
        </div>
        <DialogFooter>
          <AdminButton hierarchy="primary"
            disabled={!name.trim()}
            onClick={() => {
              onCreate({ id: `c${Date.now()}`, name: name.trim(), metric, start, end, prize: prize || "Bragging rights", entrants: 0, status: "scheduled" })
              onOpenChange(false)
              setName("")
            }}
          >
            Create
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
