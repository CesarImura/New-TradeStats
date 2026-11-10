"use client"

import { useState } from "react"
import { ExternalLink, Inbox, Plus, Settings, Trash2, X } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { allTrades, useFeedback } from "@/lib/data/feedback"
import { STUDENTS, tierFor } from "@/lib/data/people"
import { STRATEGIES, TAGS, fmtR } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { EmptyState, Mono, Page, PageHeader, SettingRow, useCommunityData } from "../kit"
import { AnswerPage } from "./journal-answer"
import { AdminButton, AdminFilter, AdminSearch, AdminTabs, AdminToolbar, CellPerson, StatPanel, Tag } from "../ui"

/** Who sent which sample trade. In the prototype every student shares the same sample journal. */
const OWNER: Record<string, string> = { t1: "s2", t2: "s5", t3: "s4", t4: "s1", t5: "s6", t6: "s7", t7: "s1" }
const AI_DRAFT: Record<string, string> = {
  t1: "The stop under the range low was fine. The problem is the entry: you bought 30 points above the range after the first push, so the stop had to be wide and the size small. Wait for the retest of the range high, or skip it.",
  t4: "Good read and a clean entry. Closing early before CPI talk is a valid reason, but then write it down as a rule before the trade, not during it. Next time: half off at 1R, rest to target.",
}

/** ADM-05 feedback requests, ADM-06 give feedback, ADM-16 journal rules. */
export function JournalAdmin() {
  const { coach } = useCoach()
  const store = useFeedback(coach.slug)
  const trades = allTrades(store)
  const waiting = trades.filter((t) => t.review === "waiting").sort((a, b) => a.id.localeCompare(b.id))
  const answered = trades.filter((t) => t.review === "answered")
  const [tab, setTab] = useState("requests")
  const [q, setQ] = useState("")
  const [tier, setTier] = useState("all")
  const [sort, setSort] = useState("oldest")
  const [openId, setOpenId] = useState<string | null>(null)
  const open = trades.find((t) => t.id === openId) ?? null

  if (open) {
    const queue = trades.filter((x) => x.review === "waiting" && x.id !== open.id)
    const go = () => setOpenId(queue[0]?.id ?? null)
    return <AnswerPage key={open.id} trade={open} student={STUDENTS.find((x) => x.id === OWNER[open.id])!} aiDraft={AI_DRAFT[open.id] ?? "Solid execution. The entry matched the setup; the exit came early. Write down what made you close."} readOnly={open.review !== "waiting"} hasNext={queue.length > 0} onBack={() => setOpenId(null)} onNext={go} onSkip={go} />
  }

  return (
    <Page>
      <PageHeader
        title="Journal & feedback"
        text="Journal, rules and feedback requests · 312 entries in the last 30 days"
        actions={
          tab === "rules" ? (
            <AdminButton hierarchy="secondary" nativeButton={false} render={<a href={`/c/${coach.slug}/journal`} target="_blank" rel="noreferrer" />}>
              <ExternalLink /> Preview as student
            </AdminButton>
          ) : (
            <AdminButton hierarchy="secondary" onClick={() => setTab("rules")}>
              <Settings /> Journal rules
            </AdminButton>
          )
        }
      />
      <StatPanel
        stats={[
          { label: "Waiting for you", value: waiting.length, delta: waiting.length ? "Oldest 2 days" : "Nothing waiting" },
          { label: "Answered this week", value: answered.length, delta: "Median reply 6 h" },
          { label: "Rules kept", value: "84%", delta: "+3 pp vs last 30 days", tone: "success" },
          { label: "Journaling students", value: 121, delta: "60% of active students" },
        ]}
      />
      <AdminToolbar>
        <AdminTabs
          label="Journal"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "requests", label: "Requests", count: waiting.length },
            { id: "answered", label: "Answered", count: answered.length },
            { id: "rules", label: "Rules" },
          ]}
        />
        {tab !== "rules" && (
          <>
            <div className="flex-1" />
            <AdminSearch value={q} onChange={setQ} placeholder="Search requests" hint="⌘K" />
            <AdminFilter label="Tier" ariaLabel="Tier" value={tier} onValueChange={setTier} options={[{ value: "all", label: "All tiers" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
            <AdminFilter label="Sort" ariaLabel="Sort" value={sort} onValueChange={setSort} options={[{ value: "oldest", label: "Oldest first" }, { value: "newest", label: "Newest first" }]} />
          </>
        )}
      </AdminToolbar>

      {tab === "requests" &&
        (waiting.length === 0 ? (
          <EmptyState icon={Inbox} title="Nothing waiting" description={`When a ${coach.wording.student.toLowerCase()} presses “Please review” on a trade, it lands here.`} />
        ) : (
          <RequestsTable trades={waiting} onOpen={setOpenId} q={q} tier={tier} sort={sort} />
        ))}
      {tab === "answered" &&
        (answered.length === 0 ? <EmptyState icon={Inbox} title="Nothing answered yet" description="Feedback you send shows up here." /> : <RequestsTable trades={answered} onOpen={setOpenId} answered q={q} tier={tier} sort={sort} />)}
      {tab === "rules" && <JournalRules />}

    </Page>
  )
}

/** Figma 525:7153. One row per request: who, what they asked, the trade, rules, how long it has waited. */
function RequestsTable({ trades, onOpen, answered, q, tier, sort }: { trades: ReturnType<typeof allTrades>; onOpen: (id: string) => void; answered?: boolean; q: string; tier: string; sort: string }) {
  const { coach } = useCoach()
  const rows = trades
    .map((t) => {
      const s = STUDENTS.find((x) => x.id === OWNER[t.id])!
      return { t, s, ask: t.thread.find((m) => m.from === "student") }
    })
    .filter(({ s, ask }) => (tier === "all" || s.tier === tier) && `${s.name} ${ask?.text ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  if (sort === "newest") rows.reverse()

  return (
    <div className="grid gap-4">
      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests match" description="Clear the search or the filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead className="hidden lg:table-cell">Rules</TableHead>
                  <TableHead className="text-right">{answered ? "Answered" : "Waiting"}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ t, s, ask }) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <CellPerson initials={s.initials} name={s.name} subtitle={tierFor(coach, s.tier).name} className="min-w-40" />
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-normal">{ask ? `“${ask.text}”` : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="t-mono-data">{t.symbol} · {t.side}</span>{" "}
                      <span className={cn("tabular-nums", t.r >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]")}>{fmtR(t.r)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {t.rulesBroken.length ? <Tag tone="danger" dot className="max-w-48"><span className="truncate">Broke {t.rulesBroken[0]}</span></Tag> : t.r >= 0 ? <Tag tone="success" dot>All rules kept</Tag> : <span className="text-a-text-3">—</span>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">{ask?.when}</TableCell>
                    <TableCell className="text-right">
                      <AdminButton hierarchy="secondary" size="md" onClick={() => onOpen(t.id)}>
                        {answered ? "Open" : "Answer"}
                      </AdminButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="border-t border-a-border-subtle px-4 py-3 t-caption text-a-text-2">
            {rows.length} {rows.length === 1 ? "request" : "requests"} · students get a notification and an e-mail when you answer
          </p>
        </div>
      )}
    </div>
  )
}

type Rules = { strategies: typeof STRATEGIES; required: Record<string, boolean>; tags: string[]; tiers: Record<string, boolean> }
const DEFAULT_RULES: Rules = {
  strategies: STRATEGIES,
  required: { setup: true, stop: true, screenshot: false, note: false, emotion: false },
  tags: TAGS,
  tiers: {},
}
const REQUIRED = [
  { id: "setup", label: "Setup", text: "Which strategy the trade was" },
  { id: "stop", label: "Stop and target", text: "Planned before the trade" },
  { id: "note", label: "A note", text: "One line on why" },
  { id: "emotion", label: "How they felt", text: "Calm, rushed, angry, bored" },
  { id: "screenshot", label: "Screenshot", text: "Only for trades without a broker sync" },
]

/** ADM-16 · Strategies with their rules, required fields and tags, per tier. */
function JournalRules() {
  const { coach } = useCoach()
  const [r, setR] = useCommunityData(coach.slug, "journal-rules", DEFAULT_RULES)
  const [newTag, setNewTag] = useState("")
  const editStrategy = (i: number, patch: Partial<Rules["strategies"][number]>) => setR((x) => ({ ...x, strategies: x.strategies.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        <div className="flex items-center justify-between">
          <div className="grid gap-0.5">
            <h2 className="font-medium">Strategies and their rules</h2>
            <p className="text-sm text-muted-foreground">Students pick one per trade. The journal shows how well each rule is kept.</p>
          </div>
          <AdminButton
            
            
            onClick={() => setR((x) => ({ ...x, strategies: [...x.strategies, { id: `s${Date.now()}`, name: "New strategy", rules: ["First rule"], trades: 0 }] }))} hierarchy="secondary" size="md">
            <Plus /> Strategy
          </AdminButton>
        </div>
        {r.strategies.map((s, i) => (
          <div key={s.id} className="grid gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <Input value={s.name} onChange={(e) => editStrategy(i, { name: e.target.value })} className="h-8 font-medium" aria-label="Strategy name" />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{s.trades} trades</span>
              <AdminButton aria-label={`Delete ${s.name}`} onClick={() => setR((x) => ({ ...x, strategies: x.strategies.filter((_, j) => j !== i) }))} hierarchy="ghost" size="md" iconOnly>
                <Trash2 />
              </AdminButton>
            </div>
            <div className="grid gap-1.5 pl-1">
              {s.rules.map((rule, k) => (
                <div key={k} className="flex items-center gap-2">
                  <Mono className="w-5 text-muted-foreground">{String(k + 1).padStart(2, "0")}</Mono>
                  <Input
                    value={rule}
                    onChange={(e) => editStrategy(i, { rules: s.rules.map((x, j) => (j === k ? e.target.value : x)) })}
                    className="h-7 text-sm"
                    aria-label={`Rule ${k + 1}`}
                  />
                  <AdminButton aria-label="Remove rule" onClick={() => editStrategy(i, { rules: s.rules.filter((_, j) => j !== k) })} hierarchy="ghost" size="md" iconOnly>
                    <X />
                  </AdminButton>
                </div>
              ))}
              <button onClick={() => editStrategy(i, { rules: [...s.rules, ""] })} className="justify-self-start pl-7 text-xs text-muted-foreground hover:text-foreground">
                + Add a rule
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid content-start gap-6">
        <div className="grid gap-1">
          <h2 className="font-medium">Required for every trade</h2>
          <div className="divide-y rounded-lg border bg-card px-3">
            {REQUIRED.map((f) => (
              <SettingRow key={f.id} label={f.label} text={f.text}>
                <Switch checked={!!r.required[f.id]} onCheckedChange={(v) => setR((x) => ({ ...x, required: { ...x.required, [f.id]: v } }))} />
              </SettingRow>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <h2 className="font-medium">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {r.tags.map((g) => (
              <Tag key={g} className="gap-1 pr-1">
                {g}
                <button aria-label={`Remove ${g}`} onClick={() => setR((x) => ({ ...x, tags: x.tags.filter((y) => y !== g) }))} className="opacity-60 hover:opacity-100">
                  <X className="size-3" />
                </button>
              </Tag>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (newTag.trim()) setR((x) => ({ ...x, tags: [...x.tags, newTag.trim()] }))
              setNewTag("")
            }}
          >
            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag" className="h-8" />
            <AdminButton type="submit" hierarchy="secondary" size="lg">
              Add
            </AdminButton>
          </form>
        </div>

        <div className="grid gap-1">
          <h2 className="font-medium">Who gets the journal</h2>
          <div className="divide-y rounded-lg border bg-card px-3">
            {coach.tiers.map((t) => (
              <SettingRow key={t.id} label={t.name} text={r.tiers[t.id] === false ? "No journal" : "Journal, rules and feedback requests"}>
                <Switch checked={r.tiers[t.id] !== false} onCheckedChange={(v) => setR((x) => ({ ...x, tiers: { ...x.tiers, [t.id]: v } }))} />
              </SettingRow>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
