"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CandlestickChart, Check, Link2, Loader2, MessageSquareReply, Mic, Plus, RefreshCw, Search, Send, Sparkles, Video } from "@/components/icons"
import { toast } from "sonner"
import { useCommunityData } from "@/components/admin/kit"
import { TradeChart } from "@/components/charts/trade-chart"
import { useCoach } from "@/components/coach/coach-provider"
import { AiMark } from "@/components/courses/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { aiTradeAnswer } from "@/lib/data/ai"
import { addFeedback, allTrades, useFeedback } from "@/lib/data/feedback"
import { AI_INSIGHT, DEMO_STUDENT, EQUITY, JOURNAL_DAYS, RULES, SETUPS } from "@/lib/data/sample"
import { ACCOUNTS, BROKERS, STRATEGIES, fmtPnl, fmtR } from "@/lib/data/trades"
import { cn } from "@/lib/utils"

type T = ReturnType<typeof allTrades>[number]
const equityConfig = { v: { label: "Equity", color: "var(--primary)" } } satisfies ChartConfig

/** STU-13 journal, STU-14 connect broker, STU-15 trade detail, STU-16 analytics, STU-28 my feedback. */
export function StudentJournal() {
  const { coach } = useCoach()
  const store = useFeedback(coach.slug)
  const trades = allTrades(store)
  const params = useSearchParams()
  const [broker, setBroker] = useCommunityData(coach.slug, "broker", { connected: true, accounts: ACCOUNTS.map((a) => a.id) })
  const [connecting, setConnecting] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  // "?new=1" (from Charts → Log a trade) opens the form straight away.
  const [adding, setAdding] = useState(() => !!params.get("new"))
  const [tab, setTab] = useState("dashboard")
  const unread = trades.filter((t) => t.thread.at(-1)?.from === "coach").length

  if (!broker.connected)
    return (
      <div className="flex flex-col page-gap">
        <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.journal}</h1>
        <Card className="items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-(--r-inner) bg-primary text-primary-foreground">
            <Link2 className="size-6" />
          </span>
          <div className="grid max-w-md gap-1">
            <p className="text-lg">Connect your broker</p>
            <p className="text-sm text-muted-foreground">
              Your trades come in by themselves: entries, exits, stops and results. {coach.coachName} can only read them, never trade.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setConnecting(true)}>Connect broker</Button>
            <Button variant="outline" onClick={() => setAdding(true)}>
              Add trades by hand
            </Button>
          </div>
        </Card>
        <ConnectBroker open={connecting} onOpenChange={setConnecting} onDone={() => setBroker({ connected: true, accounts: ACCOUNTS.map((a) => a.id) })} />
        <NewTrade open={adding} onOpenChange={setAdding} />
      </div>
    )

  return (
    <div className="flex flex-col page-gap">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">
            {ACCOUNTS.length} accounts · synced {ACCOUNTS[0].synced}
          </span>
          <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.journal}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConnecting(true)}>
            <Plus /> Account
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus /> Trade
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback {unread > 0 && <span className="rounded-full bg-primary px-1.5 text-[0.65rem] text-primary-foreground tabular-nums">{unread}</span>}
          </TabsTrigger>
          <TabsTrigger value="strategies">Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Dashboard trades={trades} onOpen={setOpen} />
        </TabsContent>
        <TabsContent value="trades">
          <TradeList trades={trades} onOpen={setOpen} />
        </TabsContent>
        <TabsContent value="feedback">
          <MyFeedback trades={trades} onOpen={setOpen} />
        </TabsContent>
        <TabsContent value="strategies">
          <Strategies />
        </TabsContent>
      </Tabs>

      <TradeDetail trade={trades.find((t) => t.id === open) ?? null} onClose={() => setOpen(null)} />
      <ConnectBroker open={connecting} onOpenChange={setConnecting} onDone={() => toast("Account added")} />
      <NewTrade open={adding} onOpenChange={setAdding} />
    </div>
  )
}

function Stat({ label, value, tone, sub }: { label: string; value: string; tone?: "profit" | "loss"; sub?: string }) {
  return (
    <Card size="sm" className="gap-1 px-4">
      <span className="eyebrow">{label}</span>
      <span className={cn("font-heading text-2xl tabular-nums", tone === "profit" && "text-profit", tone === "loss" && "text-loss")}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Card>
  )
}

function Dashboard({ trades, onOpen }: { trades: T[]; onOpen: (id: string) => void }) {
  const { coach, base } = useCoach()
  const pnl = trades.reduce((n, t) => n + t.pnl, 0)
  const wins = trades.filter((t) => t.r > 0).length
  const exp = trades.reduce((n, t) => n + t.r, 0) / trades.length
  const kept = Math.round((RULES.reduce((n, r) => n + r.kept, 0) / RULES.reduce((n, r) => n + r.total, 0)) * 100)
  const data = EQUITY.map((v, i) => ({ d: i + 1, v }))

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Result · 30 days" value={fmtPnl(pnl)} tone={pnl >= 0 ? "profit" : "loss"} sub={`${trades.length} trades`} />
        <Stat label="Win rate" value={`${Math.round((wins / trades.length) * 100)}%`} sub={`${wins} of ${trades.length}`} />
        <Stat label="Expectancy" value={fmtR(exp)} tone={exp >= 0 ? "profit" : "loss"} sub="Average per trade" />
        <Stat label="Rules kept" value={`${kept}%`} sub="Your coach's rules" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="gap-2 px-5">
          <span className="eyebrow">Equity · last 20 days</span>
          <ChartContainer config={equityConfig} className="aspect-auto h-56 w-full">
            <AreaChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="d" tickLine={false} axisLine={false} tickFormatter={(d) => (d % 5 === 0 ? `Day ${d}` : "")} />
              <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v) => <span className="font-mono tabular-nums">{fmtPnl(Number(v))}</span>} />} />
              <Area dataKey="v" type="monotone" stroke="var(--color-v)" strokeWidth={2} fill="url(#eq)" />
            </AreaChart>
          </ChartContainer>
        </Card>
        <Card className="gap-3 px-5">
          <span className="eyebrow">Last 4 weeks</span>
          <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1.5 text-xs">
            <span />
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
              <span key={d} className="text-center text-muted-foreground">
                {d}
              </span>
            ))}
            {JOURNAL_DAYS.map((w, i) => (
              <div key={i} className="contents">
                <span className="pr-1 text-muted-foreground">W{i + 1}</span>
                {w.map((v, j) => (
                  <span
                    key={j}
                    title={v ? fmtPnl(v) : "No trades"}
                    className="grid aspect-square place-items-center rounded-(--r-bar) text-[0.6rem] tabular-nums"
                    style={{ background: v === 0 ? "var(--muted)" : `color-mix(in oklab, ${v > 0 ? "var(--profit)" : "var(--loss)"} ${Math.min(90, 25 + Math.abs(v) / 6)}%, transparent)` }}
                  >
                    {v ? (v > 0 ? "+" : "−") + Math.abs(Math.round(v / 10)) * 10 : ""}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 px-5">
          <span className="eyebrow">Rules · 30 days</span>
          {RULES.map((r) => (
            <div key={r.rule} className="grid gap-1">
              <span className="flex justify-between gap-2 text-sm">
                <span className="truncate">{r.rule}</span>
                <span className="text-muted-foreground tabular-nums">
                  {r.kept}/{r.total}
                </span>
              </span>
              <Progress value={(r.kept / r.total) * 100} />
            </div>
          ))}
        </Card>
        <Card className="gap-3 px-5">
          <span className="eyebrow">By setup</span>
          {SETUPS.map((s) => (
            <div key={s.name} className="flex items-center gap-3 text-sm">
              <span className="flex-1 truncate">{s.name}</span>
              <span className="w-12 text-right text-muted-foreground tabular-nums">{s.win}%</span>
              <span className={cn("w-14 text-right tabular-nums", s.r >= 0 ? "text-profit" : "text-loss")}>{fmtR(s.r)}</span>
            </div>
          ))}
        </Card>
        <Card className="gap-2 px-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Your week</span>
            <AiMark />
          </div>
          <p className="text-lg leading-snug">{AI_INSIGHT.title}</p>
          <p className="text-sm text-muted-foreground">{AI_INSIGHT.text} The lesson “{AI_INSIGHT.lesson}” covers exactly this.</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`${base}/courses`} />}>
              Open lesson
            </Button>
            {coach.modules.ai && (
              <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={`${base}/ai`} />}>
                <Sparkles /> Ask {coach.wording.ai}
              </Button>
            )}
          </div>
        </Card>
      </div>
      <Card className="gap-1 px-0">
        <span className="eyebrow px-5">Latest trades</span>
        <TradeRows trades={trades.slice(0, 4)} onOpen={onOpen} />
      </Card>
    </div>
  )
}

function TradeRows({ trades, onOpen }: { trades: T[]; onOpen: (id: string) => void }) {
  return (
    <div className="divide-y">
      {trades.map((t) => (
        <button key={t.id} onClick={() => onOpen(t.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-muted/60">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">
            {t.date}
            <span className="block">{t.time}</span>
          </span>
          <span className="w-28 shrink-0 font-medium">
            {t.symbol} <span className="font-normal text-muted-foreground">{t.side}</span>
          </span>
          <span className="hidden flex-1 truncate text-muted-foreground sm:block">{t.setup}</span>
          <span className="flex flex-1 justify-end gap-1.5 sm:flex-none">
            {t.rulesBroken.length > 0 && <Badge variant="destructive">Rule</Badge>}
            {t.review === "waiting" && <Badge variant="outline">Waiting for review</Badge>}
            {t.thread.at(-1)?.from === "coach" && <Badge>Feedback</Badge>}
          </span>
          <span className={cn("w-14 text-right tabular-nums", t.r >= 0 ? "text-profit" : "text-loss")}>{fmtR(t.r)}</span>
          <span className="hidden w-20 text-right text-muted-foreground tabular-nums md:block">{fmtPnl(t.pnl)}</span>
        </button>
      ))}
    </div>
  )
}

function TradeList({ trades, onOpen }: { trades: T[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState("all")
  const shown = trades.filter(
    (t) =>
      (!q || `${t.symbol} ${t.setup} ${t.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) &&
      (filter === "all" || (filter === "wins" ? t.r > 0 : filter === "losses" ? t.r < 0 : t.rulesBroken.length > 0)),
  )
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Symbol, setup or tag" className="pl-8" />
        </div>
        {[
          ["all", "All"],
          ["wins", "Wins"],
          ["losses", "Losses"],
          ["rules", "Broke a rule"],
        ].map(([id, l]) => (
          <Button key={id} size="sm" variant={filter === id ? "secondary" : "ghost"} onClick={() => setFilter(id)}>
            {l}
          </Button>
        ))}
      </div>
      <Card className="gap-0 px-0 py-0">
        {shown.length ? <TradeRows trades={shown} onOpen={onOpen} /> : <p className="p-8 text-center text-sm text-muted-foreground">No trades match.</p>}
      </Card>
    </div>
  )
}

function MyFeedback({ trades, onOpen }: { trades: T[]; onOpen: (id: string) => void }) {
  const { coach } = useCoach()
  const answered = trades.filter((t) => t.thread.some((m) => m.from === "coach"))
  const waiting = trades.filter((t) => t.review === "waiting")
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        {answered.length === 0 && <p className="rounded-(--radius) border border-dashed p-8 text-center text-sm text-muted-foreground">No feedback yet. Open a trade and press “Please review”.</p>}
        {answered.map((t) => {
          const last = [...t.thread].reverse().find((m) => m.from === "coach")!
          return (
            <Card key={t.id} className="gap-2 px-5">
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[0.6rem]">{coach.mark}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{coach.coachName}</span>
                <span className="text-xs text-muted-foreground">on your {t.symbol} {t.side} · {last.when}</span>
              </div>
              <p className="text-sm">
                {last.kind !== "text" && (last.kind === "voice" ? <Mic className="mr-1 inline size-4" /> : <Video className="mr-1 inline size-4" />)}
                {last.text}
              </p>
              <Button size="sm" variant="outline" className="justify-self-start" onClick={() => onOpen(t.id)}>
                Open trade
              </Button>
            </Card>
          )
        })}
      </div>
      <Card className="gap-2 px-5">
        <span className="eyebrow">Waiting for {coach.coachName}</span>
        {waiting.length === 0 && <p className="text-sm text-muted-foreground">Nothing waiting.</p>}
        {waiting.map((t) => (
          <button key={t.id} onClick={() => onOpen(t.id)} className="flex justify-between gap-2 py-1 text-left text-sm hover:underline">
            <span>
              {t.symbol} {t.side} · {t.date}
            </span>
            <span className={cn("tabular-nums", t.r >= 0 ? "text-profit" : "text-loss")}>{fmtR(t.r)}</span>
          </button>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">Usually answered within a day.</p>
      </Card>
    </div>
  )
}

function Strategies() {
  const { coach } = useCoach()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {STRATEGIES.map((s, i) => {
        const setup = SETUPS[i]
        return (
          <Card key={s.id} className="gap-3 px-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-lg">{s.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.trades} trades · {setup?.win}% win
              </span>
            </div>
            <ol className="grid gap-1.5 text-sm">
              {s.rules.map((r, k) => (
                <li key={r} className="flex gap-2">
                  <span className="text-muted-foreground tabular-nums">{k + 1}.</span>
                  {r}
                </li>
              ))}
            </ol>
            <span className="text-xs text-muted-foreground">From {coach.coachName}&apos;s playbook</span>
          </Card>
        )
      })}
    </div>
  )
}

/** STU-15 · The trade on the chart, notes and tags, "Please review" and the coach's answers. */
function TradeDetail({ trade: t, onClose }: { trade: T | null; onClose: () => void }) {
  const { coach, base, theme } = useCoach()
  const [ask, setAsk] = useState("")
  const [ai, setAi] = useState(false)
  if (!t) return <Sheet open={false} onOpenChange={() => onClose()} />
  const reply = aiTradeAnswer(t)

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle className="flex flex-wrap items-baseline gap-x-3 text-xl">
            {t.symbol} {t.side}
            <span className={cn("tabular-nums", t.r >= 0 ? "text-profit" : "text-loss")}>
              {fmtR(t.r)} · {fmtPnl(t.pnl)}
            </span>
          </SheetTitle>
          <SheetDescription>
            {t.account} · {t.date} {t.time} · {t.size}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
          <div className="overflow-hidden rounded-(--radius) border bg-background">
            <TradeChart trade={t} dark={theme.mode === "dark"} background={theme.palettes[theme.mode].background} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{t.setup}</Badge>
            {t.tags.map((g) => (
              <Badge key={g} variant="secondary">
                {g}
              </Badge>
            ))}
            {t.rulesBroken.map((r) => (
              <Badge key={r} variant="destructive">
                Broke: {r}
              </Badge>
            ))}
          </div>
          {t.note && <p className="text-sm text-muted-foreground">Your note: “{t.note}”</p>}

          {coach.modules.ai && (
            <div className="grid gap-2 rounded-(--radius) border p-3">
              {ai ? (
                <>
                  <AiMark className="justify-self-start" />
                  <p className="text-sm">{reply.text}</p>
                </>
              ) : (
                <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setAi(true)}>
                  <Sparkles /> Ask {coach.wording.ai} about this trade
                </Button>
              )}
            </div>
          )}

          <div className="grid gap-3 border-t pt-4">
            <span className="eyebrow">Feedback from {coach.coachName}</span>
            {t.thread.length === 0 && <p className="text-sm text-muted-foreground">Want {coach.coachName}&apos;s eyes on this one? Ask for a review.</p>}
            {t.thread.map((m, i) => (
              <div key={i} className={cn("flex gap-2.5", m.from === "student" && "flex-row-reverse")}>
                <Avatar className="size-7">
                  <AvatarFallback className="text-[0.6rem]">{m.from === "coach" ? coach.mark : DEMO_STUDENT.initials}</AvatarFallback>
                </Avatar>
                <div className={cn("grid max-w-[80%] gap-1 rounded-(--r-inner) px-3 py-2 text-sm", m.from === "coach" ? "bg-muted" : "bg-primary text-primary-foreground")}>
                  <p className="flex items-center gap-1.5">
                    {m.kind === "voice" && <Mic className="size-4" />}
                    {m.kind === "video" && <Video className="size-4" />}
                    {m.kind === "chart" && <CandlestickChart className="size-4" />}
                    {m.kind === "chart" ? (
                      <a href={m.link} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        {m.text} · open in TradingView
                      </a>
                    ) : (
                      m.text
                    )}
                  </p>
                  <span className="text-[0.7rem] opacity-70">{m.when}</span>
                </div>
              </div>
            ))}
            {t.review !== "waiting" ? (
              <div className="grid gap-2">
                <Textarea rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={`What should ${coach.coachName} look at?`} />
                <Button
                  className="justify-self-end"
                  onClick={() => {
                    addFeedback(coach.slug, t.id, { asked: true, done: false, add: { from: "student", kind: "text", text: ask.trim() || "Please review this trade.", when: "just now" } })
                    setAsk("")
                    toast(`Sent to ${coach.coachName}`, { description: "You get a notification when the feedback is there." })
                  }}
                >
                  <MessageSquareReply /> Please review
                </Button>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Send className="size-4" /> Waiting for {coach.coachName}. Usually within a day.
              </p>
            )}
          </div>
          <Link href={`${base}/charts`} className="text-sm text-muted-foreground underline underline-offset-4">
            Open {t.symbol} in {coach.wording.charts}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** STU-14 · Pick the broker, connect, first sync. */
function ConnectBroker({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [q, setQ] = useState("")
  const [pick, setPick] = useState<string | null>(null)
  const [sync, setSync] = useState(0)
  const broker = BROKERS.find((b) => b.id === pick)

  useEffect(() => {
    if (!pick || !open) return
    const id = setInterval(() => setSync((s) => Math.min(100, s + 9)), 160)
    return () => clearInterval(id)
  }, [pick, open])

  const close = () => {
    onOpenChange(false)
    setTimeout(() => {
      setPick(null)
      setSync(0)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{broker ? `Connecting ${broker.name}` : "Connect your broker"}</DialogTitle>
          <DialogDescription>{broker ? "Getting your last 90 days of trades." : "Read-only. Nobody can place trades through this."}</DialogDescription>
        </DialogHeader>
        {!broker ? (
          <div className="grid gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brokers and prop firms" autoFocus />
            <div className="grid max-h-72 gap-0.5 overflow-y-auto">
              {BROKERS.filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase())).map((b) => (
                <button key={b.id} onClick={() => setPick(b.id)} className="flex items-center justify-between rounded-(--r-inner) px-3 py-2 text-left text-sm hover:bg-muted">
                  <span>{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.note}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <Progress value={sync} />
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {sync < 100 ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4 text-profit" />}
              {sync < 100 ? `${Math.round(sync * 0.47)} trades found…` : "47 trades imported"}
            </span>
          </div>
        )}
        <DialogFooter>
          {broker && (
            <Button
              disabled={sync < 100}
              onClick={() => {
                onDone()
                close()
              }}
            >
              <RefreshCw /> Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewTrade({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { coach } = useCoach()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a trade</DialogTitle>
          <DialogDescription>For trades your broker doesn&apos;t sync. {coach.coachName} sees them marked as entered by hand.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Symbol", "NQ"],
            ["Side", "Long"],
            ["Entry", "20,180.00"],
            ["Exit", "20,220.00"],
            ["Stop", "20,150.00"],
            ["Target", "20,250.00"],
          ].map(([l, p]) => (
            <div key={l} className="grid gap-1.5">
              <Label className="text-[0.8rem]">{l}</Label>
              <Input placeholder={p} />
            </div>
          ))}
          <div className="col-span-2 grid gap-1.5">
            <Label className="text-[0.8rem]">Setup</Label>
            <select className="h-9 rounded-(--r-inner) border bg-transparent px-2 text-sm">
              {STRATEGIES.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label className="text-[0.8rem]">Why you took it</Label>
            <Textarea rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false)
              toast("Trade saved")
            }}
          >
            Save trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
