"use client"

import { useEffect, useRef, useState } from "react"
import { ChartCandlestick, Check, Inbox, Mic, Plus, Search, Send, Settings, Sparkles, Square, Trash2, Video, X } from "@/components/icons"
import { toast } from "sonner"
import { TradeChart } from "@/components/charts/trade-chart"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { addFeedback, allTrades, useFeedback } from "@/lib/data/feedback"
import { STUDENTS, tierFor } from "@/lib/data/people"
import { STRATEGIES, TAGS, fmtPnl, fmtR } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { Empty, Mono, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"
import { AdminButton, StatPanel, Tag } from "../ui"

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
  const [openId, setOpenId] = useState<string | null>(null)
  const open = trades.find((t) => t.id === openId) ?? null

  return (
    <Page>
      <PageHeader
        title="Journal & feedback"
        text="Journal, rules and feedback requests · 312 entries in the last 30 days"
        actions={
          <AdminButton hierarchy="secondary" onClick={() => setTab("rules")}>
            <Settings /> Journal rules
          </AdminButton>
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
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList>
          <TabsTrigger value="requests">
            Requests <span className="text-muted-foreground tabular-nums">{waiting.length}</span>
          </TabsTrigger>
          <TabsTrigger value="answered">
            Answered <span className="text-muted-foreground tabular-nums">{answered.length}</span>
          </TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {waiting.length === 0 ? (
            <Empty icon={Inbox} title="Nothing waiting" text={`When a ${coach.wording.student.toLowerCase()} presses “Please review” on a trade, it lands here.`} />
          ) : (
            <RequestsTable trades={waiting} onOpen={setOpenId} />
          )}
        </TabsContent>

        <TabsContent value="answered">
          {answered.length === 0 ? <Empty icon={Inbox} title="Nothing answered yet" text="Feedback you send shows up here." /> : <RequestsTable trades={answered} onOpen={setOpenId} answered />}
        </TabsContent>

        <TabsContent value="rules">
          <JournalRules />
        </TabsContent>
      </Tabs>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full data-[side=right]:w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Feedback</SheetTitle>
            <SheetDescription>Look at the trade, answer, then mark it done.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">{open && <Review key={open.id} trade={open} readOnly={open.review !== "waiting"} onDone={() => setOpenId(null)} />}</div>
        </SheetContent>
      </Sheet>
    </Page>
  )
}

/** Figma 525:7153. One row per request: who, what they asked, the trade, rules, how long it has waited. */
function RequestsTable({ trades, onOpen, answered }: { trades: ReturnType<typeof allTrades>; onOpen: (id: string) => void; answered?: boolean }) {
  const { coach } = useCoach()
  const [q, setQ] = useState("")
  const [tier, setTier] = useState("all")
  const [sort, setSort] = useState("oldest")
  const rows = trades
    .map((t) => {
      const s = STUDENTS.find((x) => x.id === OWNER[t.id])!
      return { t, s, ask: t.thread.find((m) => m.from === "student") }
    })
    .filter(({ s, ask }) => (tier === "all" || s.tier === tier) && `${s.name} ${ask?.text ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  if (sort === "newest") rows.reverse()

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-a-text-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requests" aria-label="Search requests" className="w-56 pl-8" />
        </div>
        <NativeSelect value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier">
          <option value="all">All tiers</option>
          {coach.tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </NativeSelect>
      </div>
      {rows.length === 0 ? (
        <Empty icon={Inbox} title="No requests match" text="Clear the search or the filters." />
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
                      <div className="flex min-w-40 items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{s.initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0">
                          <span className="truncate font-medium">{s.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{tierFor(coach, s.tier).name}</span>
                        </div>
                      </div>
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
                      <AdminButton hierarchy="secondary" size="sm" onClick={() => onOpen(t.id)}>
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

/** ADM-06 · Look at the trade on TradingView, answer with text, voice, video or a TradingView snapshot, mark done. */
function Review({ trade: t, onDone, readOnly }: { trade: ReturnType<typeof allTrades>[number]; onDone?: () => void; readOnly?: boolean }) {
  const { coach } = useCoach()
  const s = STUDENTS.find((x) => x.id === OWNER[t.id])!
  const [text, setText] = useState("")
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [recording, setRecording] = useState<null | "voice" | "video">(null)
  const [secs, setSecs] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const record = (kind: "voice" | "video") => {
    if (recording) {
      if (timer.current) clearInterval(timer.current)
      addFeedback(coach.slug, t.id, { add: { from: "coach", kind: recording, text: `${recording === "voice" ? "Voice note" : "Video"} · 0:${String(Math.max(secs, 3)).padStart(2, "0")}`, when: "just now" } })
      setRecording(null)
      setSecs(0)
      return
    }
    setRecording(kind)
    timer.current = setInterval(() => setSecs((x) => x + 1), 1000)
  }

  const send = () => {
    if (!text.trim()) return
    addFeedback(coach.slug, t.id, { add: { from: "coach", kind: "text", text: text.trim(), when: "just now" } })
    setText("")
  }

  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {s.name} · {t.account} · {t.date} {t.time}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-3 text-xl">
            {t.symbol} {t.side}
            <span className={cn("tabular-nums", t.r >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]")}>
              {fmtR(t.r)} · {fmtPnl(t.pnl)}
            </span>
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <TradeChart trade={t} dark background="#0a0a0a" />
      </div>
      {!readOnly && <p className="-mt-2 text-xs text-muted-foreground">Mark it up with TradingView&apos;s drawing tools on the left, then share a snapshot with “TradingView snapshot” below.</p>}

      <div className="grid gap-2 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="h-auto max-w-full whitespace-normal">{t.setup}</Badge>
          {t.tags.map((g) => (
            <Badge key={g} variant="secondary" className="h-auto max-w-full whitespace-normal">
              {g}
            </Badge>
          ))}
          {t.rulesBroken.map((r) => (
            <Badge key={r} variant="destructive" className="h-auto max-w-full whitespace-normal">
              Broke: {r}
            </Badge>
          ))}
        </div>
        {t.note && <p className="break-words text-muted-foreground">Note: “{t.note}”</p>}
      </div>

      <div className="grid gap-3 border-t pt-4">
        {t.thread.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.from === "coach" && "flex-row-reverse")}>
            <Avatar className="size-7">
              <AvatarFallback className="text-[0.6875rem]">{m.from === "coach" ? coach.mark : s.initials}</AvatarFallback>
            </Avatar>
            <div className={cn("grid max-w-[80%] gap-1 rounded-lg px-3 py-2 text-sm", m.from === "coach" ? "bg-[var(--ts-cta)]/10" : "bg-muted")}>
              {m.kind === "text" ? (
                <p>{m.text}</p>
              ) : m.kind === "chart" ? (
                <a href={m.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline underline-offset-4">
                  <ChartCandlestick className="size-4" /> {m.text}
                </a>
              ) : (
                <span className="flex items-center gap-2">
                  {m.kind === "voice" ? <Mic className="size-4" /> : <Video className="size-4" />} {m.text}
                  <span className="flex h-4 items-end gap-0.5" aria-hidden>
                    {[3, 7, 5, 9, 4, 8, 6, 3, 7, 5].map((h, j) => (
                      <span key={j} className="w-0.5 bg-current opacity-60" style={{ height: `${h * 10}%` }} />
                    ))}
                  </span>
                </span>
              )}
              <span className="text-[0.6875rem] text-muted-foreground">{m.when}</span>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="grid gap-2">
          {recording ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--ts-interactive)]/40 bg-[var(--ts-interactive)]/8 px-3 py-3 text-sm">
              <span className="size-2 animate-pulse rounded-full bg-[var(--ts-interactive)]" />
              Recording {recording === "voice" ? "a voice note" : "your screen and camera"} · 0:{String(secs).padStart(2, "0")}
              <Button size="sm" className="ml-auto" onClick={() => record(recording)}>
                <Square /> Stop and send
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Cancel recording"
                onClick={() => {
                  if (timer.current) clearInterval(timer.current)
                  setRecording(null)
                  setSecs(0)
                }}
              >
                <X />
              </Button>
            </div>
          ) : snapshot !== null ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addFeedback(coach.slug, t.id, { add: { from: "coach", kind: "chart", text: `Marked-up chart · ${t.symbol}`, link: snapshot || "https://www.tradingview.com/x/", when: "just now" } })
                setSnapshot(null)
              }}
            >
              <Input autoFocus value={snapshot} onChange={(e) => setSnapshot(e.target.value)} placeholder="https://www.tradingview.com/x/…" aria-label="TradingView snapshot link" />
              <Button type="submit" size="sm">
                Share
              </Button>
            </form>
          ) : (
            <Textarea rows={3} aria-label="Your answer" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Answer ${s.name.split(" ")[0]}…`} />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setText(AI_DRAFT[t.id] ?? "Solid execution. The entry matched the setup; the exit came early. Write down what made you close.")}>
              <Sparkles /> AI first draft
            </Button>
            <Button variant="outline" size="sm" onClick={() => record("voice")} disabled={!!recording}>
              <Mic /> Voice note
            </Button>
            <Button variant="outline" size="sm" onClick={() => record("video")} disabled={!!recording}>
              <Video /> Short video
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSnapshot(snapshot === null ? "" : null)} disabled={!!recording}>
              <ChartCandlestick /> TradingView snapshot
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" disabled={!text.trim()} onClick={send}>
                <Send /> Send
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (text.trim()) send()
                  addFeedback(coach.slug, t.id, { done: true })
                  toast(`Feedback sent to ${s.name}`, { description: "They get a notification and an e-mail." })
                  onDone?.()
                }}
              >
                <Check /> {text.trim() ? "Send and mark done" : "Mark done"}
              </Button>
            </div>
          </div>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setR((x) => ({ ...x, strategies: [...x.strategies, { id: `s${Date.now()}`, name: "New strategy", rules: ["First rule"], trades: 0 }] }))}
          >
            <Plus /> Strategy
          </Button>
        </div>
        {r.strategies.map((s, i) => (
          <div key={s.id} className="grid gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <Input value={s.name} onChange={(e) => editStrategy(i, { name: e.target.value })} className="h-8 font-medium" aria-label="Strategy name" />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{s.trades} trades</span>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${s.name}`} onClick={() => setR((x) => ({ ...x, strategies: x.strategies.filter((_, j) => j !== i) }))}>
                <Trash2 />
              </Button>
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
                  <Button variant="ghost" size="icon-xs" aria-label="Remove rule" onClick={() => editStrategy(i, { rules: s.rules.filter((_, j) => j !== k) })}>
                    <X />
                  </Button>
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
              <Badge key={g} variant="secondary" className="gap-1 pr-1">
                {g}
                <button aria-label={`Remove ${g}`} onClick={() => setR((x) => ({ ...x, tags: x.tags.filter((y) => y !== g) }))} className="opacity-60 hover:opacity-100">
                  <X className="size-3" />
                </button>
              </Badge>
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
            <Button size="sm" variant="outline" type="submit">
              Add
            </Button>
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
