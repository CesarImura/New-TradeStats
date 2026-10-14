"use client"

import { useState } from "react"
import Link from "next/link"
import { Medal, Plus, Trophy } from "lucide-react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BADGES, COMPETITIONS, LEVELS, POINTS, RANK_METRICS } from "@/lib/data/people"
import { LEADERBOARD } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Field, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"

export type RankingSetup = { metric: string; period: string; nicknames: boolean; optOut: boolean; competitions: typeof COMPETITIONS; points: typeof POINTS }
export const DEFAULT_RANKING: RankingSetup = { metric: "discipline", period: "month", nicknames: true, optOut: true, competitions: COMPETITIONS, points: POINTS }

/** ADM-53 ranking and competitions, ADM-54 points, levels and badges. */
export function RankingAdmin() {
  const { coach, base } = useCoach()
  const [r, setR] = useCommunityData(coach.slug, "ranking", DEFAULT_RANKING)
  const [creating, setCreating] = useState(false)
  const set = (p: Partial<RankingSetup>) => setR((x) => ({ ...x, ...p }))

  return (
    <Page>
      <PageHeader
        title="Ranking"
        text="Leaderboards and competitions that reward the right things: discipline and consistency, not only profit."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> New competition
          </Button>
        }
      />
      {!coach.modules.ranking && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ts-orange)]/40 bg-[var(--ts-orange)]/8 px-4 py-3 text-sm">
          <Trophy className="size-4 text-[var(--ts-orange)]" />
          <span className="flex-1">Ranking is switched off, so students don&apos;t see it yet.</span>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`${base}/design`} />}>
            Switch on in Design
          </Button>
        </div>
      )}
      <Tabs defaultValue="leaderboard" className="gap-5">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="points">Points & badges</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="grid content-start gap-1">
            <h2 className="font-medium">What ranks students</h2>
            <div className="mt-2 grid gap-2">
              {RANK_METRICS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => set({ metric: m.id })}
                  className={cn("grid gap-0.5 rounded-lg border bg-card px-3 py-2.5 text-left", r.metric === m.id && "border-[var(--ts-orange)]")}
                >
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.text}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 divide-y rounded-lg border bg-card px-3">
              <SettingRow label="Period">
                <NativeSelect value={r.period} onChange={(e) => set({ period: e.target.value })}>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="all">All time</option>
                </NativeSelect>
              </SettingRow>
              <SettingRow label="Nicknames instead of real names">
                <Switch checked={r.nicknames} onCheckedChange={(v) => set({ nicknames: v })} />
              </SettingRow>
              <SettingRow label="Students can opt out" text="They still see their own position">
                <Switch checked={r.optOut} onCheckedChange={(v) => set({ optOut: v })} />
              </SettingRow>
            </div>
          </section>
          <section className="grid content-start gap-2">
            <h2 className="font-medium">
              Now · {RANK_METRICS.find((m) => m.id === r.metric)?.name}
            </h2>
            <div className="divide-y rounded-lg border bg-card">
              {LEADERBOARD.filter((l) => !l.me).map((l) => (
                <div key={l.rank} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className={cn("w-6 text-center tabular-nums", l.rank <= 3 && "text-[var(--ts-yellow)]")}>{l.rank}</span>
                  <span className="flex-1">{r.nicknames ? l.name : l.name.replace(".", "")}</span>
                  <span className="tabular-nums">{l.score}</span>
                </div>
              ))}
            </div>
          </section>
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
                        <Badge variant={c.status === "running" ? "secondary" : "outline"} className="font-normal capitalize">
                          {c.status}
                        </Badge>
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
                  <Medal className="size-4 text-[var(--ts-yellow)]" />
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
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onCreate({ id: `c${Date.now()}`, name: name.trim(), metric, start, end, prize: prize || "Bragging rights", entrants: 0, status: "scheduled" })
              onOpenChange(false)
              setName("")
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
