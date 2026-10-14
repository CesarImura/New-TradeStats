"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ChevronDown, Copy, Lock, Plus, Search, Star, X } from "@/components/icons"
import { toast } from "sonner"
import { ChartCard } from "@/components/admin/charts/charts-admin"
import { useCommunityData } from "@/components/admin/kit"
import { TradingViewChart } from "@/components/charts/tradingview"
import { useCoach } from "@/components/coach/coach-provider"
import { useStudentTier } from "@/components/courses/shared"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { allTrades, useFeedback } from "@/lib/data/feedback"
import { fmt, useMarket, type Book, type SymbolMeta } from "@/lib/data/market-sim"
import { EVENTS, MARKET_SESSIONS, NOW_HOUR } from "@/lib/data/sample"
import { ACCOUNTS, COACH_CHARTS, chartDefaults, fmtPnl, fmtPrice, fmtR, MARKETS, tvSymbol, type ChartSettings, type CoachChart, type Market } from "@/lib/data/trades"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

type Sym = { tv: string; name: string }
type Mkt = Book & { meta: SymbolMeta }

const MINE: Sym[] = []
const POSITIONS = [{ account: "Funded 50K", tv: "CAPITALCOM:US100", name: "NQ", side: "long" as const, size: 1, entry: 30512, stop: 30470, target: 30640 }]
const ORDERS = [
  { account: "Tradovate · Live", name: "ES", type: "Limit buy", price: 7780, size: 2 },
  { account: "Funded 50K", name: "NQ", type: "Stop", price: 30470, size: 1 },
]

/**
 * STU-32 · The trading screen, like Hyperliquid or Nado: market bar on top,
 * the TradingView chart, order book and trades beside it, and positions,
 * orders and trade history underneath. Nothing is bought or sold here:
 * the broker connection is read-only. STU-33 the coach's charts are a tab
 * at the bottom.
 */
export function StudentCharts() {
  const { coach, theme, base } = useCoach()
  const tier = useStudentTier()
  const picked = (coach as { setup?: { markets?: Market[] } }).setup?.markets?.join() ?? ""
  const defaults = useMemo(() => chartDefaults(picked ? (picked.split(",") as Market[]) : undefined), [picked])
  const s = useStored<ChartSettings>(`${coach.slug}:charts`, defaults)
  const shared = useStored<CoachChart[]>(`${coach.slug}:coach-charts`, COACH_CHARTS)
  const [mine, setMine] = useCommunityData(coach.slug, "my-watchlist", MINE)
  const [symbol, setSymbol] = useState<Sym>(s.watchlist[0] ?? { tv: "CAPITALCOM:US100", name: "NQ" })
  const [open, setOpen] = useState<CoachChart | null>(null)
  const [side, setSide] = useState<"book" | "trades">("book")
  const market = useMarket(symbol.tv)

  const allowed = s.tiers.length === 0 || s.tiers.includes(tier)
  const visible = shared.filter((c) => !c.archived && (c.tiers.length === 0 || c.tiers.includes(tier))).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  const dark = theme.mode === "dark"
  const bg = theme.palettes[theme.mode].card

  if (!allowed) {
    const needed = coach.tiers.find((t) => s.tiers.includes(t.id))
    return (
      <div className="flex flex-col page-gap">
        <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.charts}</h1>
        <div className="grid place-items-center gap-3 rounded-(--radius) border border-dashed px-6 py-16 text-center">
          <Lock className="size-7 text-muted-foreground" />
          <p className="font-medium">
            {coach.wording.charts} is part of {needed?.name}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">Full charts, {coach.coachName}&apos;s watchlist and marked-up levels every week.</p>
          <Button onClick={() => toast(`Upgrade to ${needed?.name}`, { description: "Opens the plan change with the price difference." })}>Upgrade to {needed?.name}</Button>
        </div>
      </div>
    )
  }

  const panel = "overflow-hidden rounded-(--radius) border bg-card"
  const tall = "h-[min(68svh,600px)] min-h-[420px]"

  return (
    <div className="flex flex-col gap-2">
      <h1 className="sr-only">{coach.wording.charts}</h1>
      <MarketBar symbol={symbol} market={market} watchlist={s.watchlist} mine={mine} setMine={setMine} onPick={setSymbol} />

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className={cn(panel, tall)}>
          <TradingViewChart symbol={symbol.tv} interval={s.interval} style={s.style} studies={s.indicators} dark={dark} background={bg} symbolChange={false} className="size-full" />
        </div>

        <div className={cn(panel, tall, "flex flex-col")}>
          <div className="grid grid-cols-2 gap-1 border-b p-1">
            {(["book", "trades"] as const).map((t) => (
              <button key={t} onClick={() => setSide(t)} className={cn("rounded-(--r-inner) py-1.5 text-sm text-muted-foreground", side === t && "bg-muted text-foreground")}>
                {t === "book" ? "Order book" : "Trades"}
              </button>
            ))}
          </div>
          {side === "book" ? <OrderBook market={market} /> : <Tape market={market} />}
        </div>
      </div>

      <BottomPanel symbol={symbol} market={market} charts={visible} onOpenChart={setOpen} />

      <p className="px-1 text-xs text-muted-foreground">
        Nothing is bought or sold here: {coach.name} only reads your trades from your broker.{" "}
        <Link href={`${base}/journal`} className="underline underline-offset-4">
          Open {coach.wording.journal}
        </Link>
      </p>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-3xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.title}</DialogTitle>
                <DialogDescription>
                  {open.symbol.name} · {coach.coachName} · {open.when}
                </DialogDescription>
              </DialogHeader>
              <div className="h-[420px] overflow-hidden rounded-(--radius) border">
                <TradingViewChart symbol={open.symbol.tv} interval={s.interval} style={s.style} studies={s.indicators} dark={dark} background={bg} className="size-full" />
              </div>
              <p className="text-sm text-muted-foreground">{open.note}</p>
              <div className="flex flex-wrap gap-1.5">
                {open.levels.map((l) => (
                  <span key={l.label} className="rounded-(--r-chip) border px-2 py-0.5 text-xs tabular-nums">
                    {l.label} {fmtPrice(l.at)}
                  </span>
                ))}
              </div>
              <DialogFooter>
                {open.link && (
                  <Button variant="outline" onClick={() => window.open(open.link, "_blank", "noreferrer")}>
                    <Copy /> Copy on TradingView
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSymbol(open.symbol)
                    setOpen(null)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  <Star /> Open {open.symbol.name}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Market bar

function MarketBar({ symbol, market, watchlist, mine, setMine, onPick }: { symbol: Sym; market: Mkt; watchlist: Sym[]; mine: Sym[]; setMine: (f: (m: Sym[]) => Sym[]) => void; onPick: (s: Sym) => void }) {
  const { coach } = useCoach()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const m = market.meta
  const up = market.price >= market.prev
  const change = m.mid * (m.dayChange / 100)
  const session = MARKET_SESSIONS.find((x) => NOW_HOUR >= x.open && NOW_HOUR < x.close)
  const nextSession = MARKET_SESSIONS.find((x) => x.open > NOW_HOUR)
  const news = EVENTS.find((e) => e.kind === "news" && e.impact === "high")
  const search = MARKETS.flatMap((x) => x.symbols).filter((x) => `${x.name} ${x.tv}`.toLowerCase().includes(q.toLowerCase()))
  const pick = (x: Sym) => {
    onPick(x)
    setOpen(false)
    setQ("")
  }

  const stats = [
    { label: "24h change", value: `${change >= 0 ? "+" : "−"}${fmt(Math.abs(change), m.decimals)} (${m.dayChange >= 0 ? "+" : ""}${m.dayChange.toFixed(2)}%)`, cls: m.dayChange >= 0 ? "text-profit" : "text-loss" },
    { label: "24h high", value: fmt(m.mid * 1.006, m.decimals) },
    { label: "24h low", value: fmt(m.mid * 0.991, m.decimals) },
    { label: "24h volume", value: m.volume },
    { label: "Session", value: session ? `${session.name} open` : `${nextSession?.name} at ${String(nextSession?.open).padStart(2, "0")}:00` },
    { label: "Next red news", value: news ? `${news.title} · ${news.day} ${news.time}` : "–", cls: "text-loss" },
  ]

  return (
    <div className="flex items-stretch overflow-x-auto rounded-(--radius) border bg-card [scrollbar-width:none]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex shrink-0 items-center gap-2 border-r px-4 py-3 text-left hover:bg-muted">
          <span className="font-heading text-lg">{symbol.name}</span>
          <span className="rounded-(--r-chip) bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">{symbol.tv.split(":")[1]}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-0 p-0">
          <div className="relative border-b p-2">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbols" className="pl-8" />
          </div>
          <div className="grid max-h-80 overflow-y-auto p-1">
            {!q ? (
              <>
                <span className="eyebrow px-2 pt-2 pb-1">{coach.coachName}&apos;s watchlist</span>
                {watchlist.map((w) => (
                  <SymbolRow key={w.tv} w={w} active={w.tv === symbol.tv} onPick={pick} />
                ))}
                {mine.length > 0 && <span className="eyebrow px-2 pt-3 pb-1">Mine</span>}
                {mine.map((w) => (
                  <SymbolRow key={w.tv} w={w} active={w.tv === symbol.tv} onPick={pick} onRemove={() => setMine((l) => l.filter((x) => x.tv !== w.tv))} />
                ))}
              </>
            ) : (
              search.map((w) => {
                const saved = mine.some((x) => x.tv === w.tv) || watchlist.some((x) => x.tv === w.tv)
                return <SymbolRow key={w.tv} w={w} active={w.tv === symbol.tv} onPick={pick} onAdd={saved ? undefined : () => setMine((l) => [...l, w])} />
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className={cn("flex shrink-0 items-center border-r px-4 font-heading text-xl tabular-nums transition-colors", up ? "text-profit" : "text-loss")}>{fmt(market.price, m.decimals)}</div>
      {stats.map((x) => (
        <div key={x.label} className="grid shrink-0 content-center gap-0.5 px-4 py-2">
          <span className="text-[0.7rem] text-muted-foreground">{x.label}</span>
          <span className={cn("text-sm whitespace-nowrap tabular-nums", x.cls)}>{x.value}</span>
        </div>
      ))}
    </div>
  )
}

function SymbolRow({ w, active, onPick, onRemove, onAdd }: { w: Sym; active: boolean; onPick: (w: Sym) => void; onRemove?: () => void; onAdd?: () => void }) {
  return (
    <div className={cn("group flex items-center rounded-(--r-inner) text-sm hover:bg-muted", active && "bg-muted")}>
      <button onClick={() => onPick(w)} className="flex flex-1 items-center justify-between gap-2 px-2 py-1.5 text-left">
        <span className="font-medium">{w.name}</span>
        <span className="text-xs text-muted-foreground">{w.tv}</span>
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${w.name}`} className="px-2 opacity-0 group-hover:opacity-60 hover:opacity-100">
          <X className="size-3.5" />
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} aria-label={`Add ${w.name} to my watchlist`} className="px-2 opacity-60 hover:opacity-100">
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  )
}

// ---------- Order book and trades

function BookRow({ l, ask, max, decimals }: { l: Book["asks"][number]; ask: boolean; max: number; decimals: number }) {
  return (
    <div className="relative grid grid-cols-3 px-3 py-[3px] text-xs tabular-nums">
      <span className={cn("absolute inset-y-0 right-0", ask ? "bg-loss/12" : "bg-profit/12")} style={{ width: `${(l.total / max) * 100}%` }} />
      <span className={cn("relative", ask ? "text-loss" : "text-profit")}>{fmt(l.price, decimals)}</span>
      <span className="relative text-right">{l.size.toFixed(2)}</span>
      <span className="relative text-right text-muted-foreground">{l.total.toFixed(2)}</span>
    </div>
  )
}

function OrderBook({ market }: { market: Mkt }) {
  const d = market.meta.decimals
  const max = Math.max(...market.asks.map((a) => a.total), ...market.bids.map((b) => b.total))
  const spread = market.asks.at(-1)!.price - market.bids[0].price
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-3 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
        {market.asks.map((l) => (
          <BookRow key={`a${l.price}`} l={l} ask max={max} decimals={d} />
        ))}
      </div>
      <div className="flex items-center justify-between border-y px-3 py-2">
        <span className={cn("flex items-center gap-1 font-heading text-base tabular-nums", market.price >= market.prev ? "text-profit" : "text-loss")}>
          {fmt(market.price, d)} {market.price >= market.prev ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">Spread {fmt(spread, d)}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {market.bids.map((l) => (
          <BookRow key={`b${l.price}`} l={l} ask={false} max={max} decimals={d} />
        ))}
      </div>
    </div>
  )
}

function Tape({ market }: { market: Mkt }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-3 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {market.trades.map((t) => (
          <div key={t.id} className="grid grid-cols-3 px-3 py-[3px] text-xs tabular-nums">
            <span className={t.side === "buy" ? "text-profit" : "text-loss"}>{fmt(t.price, market.meta.decimals)}</span>
            <span className="text-right">{t.size.toFixed(2)}</span>
            <span className="text-right text-muted-foreground">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Positions, orders, history, accounts, coach's charts

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b">
        {cols.map((h, i) => (
          <th key={i} className="px-3 py-2 text-left text-[0.7rem] font-normal text-muted-foreground">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function BottomPanel({ symbol, market, charts, onOpenChart }: { symbol: Sym; market: Mkt; charts: CoachChart[]; onOpenChart: (c: CoachChart) => void }) {
  const { coach, theme } = useCoach()
  const store = useFeedback(coach.slug)
  const [tab, setTab] = useState("positions")
  const history = allTrades(store)
  const tabs = [
    ["positions", `Positions (${POSITIONS.length})`],
    ["orders", `Open orders (${ORDERS.length})`],
    ["history", "Trade history"],
    ["accounts", "Accounts"],
    ["coach", `${coach.coachName}'s charts (${charts.length})`],
  ]
  const td = "px-3 py-2 text-sm tabular-nums whitespace-nowrap"
  return (
    <div className="overflow-hidden rounded-(--radius) border bg-card">
      <div className="flex overflow-x-auto border-b [scrollbar-width:none]">
        {tabs.map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={cn("shrink-0 border-b-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground", tab === id && "border-primary text-foreground")}>
            {l}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        {tab === "positions" && (
          <table className="w-full">
            <TableHead cols={["Market", "Account", "Size", "Entry", "Mark", "Stop / target", "Result"]} />
            <tbody>
              {POSITIONS.map((p) => {
                const mark = p.tv === symbol.tv ? market.price : p.entry + 22
                const pnl = (mark - p.entry) * (p.side === "long" ? 1 : -1) * p.size * 20
                return (
                  <tr key={p.name}>
                    <td className={td}>
                      <span className="font-medium">{p.name}</span> <span className={p.side === "long" ? "text-profit" : "text-loss"}>{p.side}</span>
                    </td>
                    <td className={cn(td, "text-muted-foreground")}>{p.account}</td>
                    <td className={td}>{p.size}</td>
                    <td className={td}>{fmtPrice(p.entry)}</td>
                    <td className={td}>{fmtPrice(mark)}</td>
                    <td className={cn(td, "text-muted-foreground")}>
                      {fmtPrice(p.stop)} / {fmtPrice(p.target)}
                    </td>
                    <td className={cn(td, pnl >= 0 ? "text-profit" : "text-loss")}>
                      {fmtPnl(Math.round(pnl))} · {fmtR((mark - p.entry) / (p.entry - p.stop))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {tab === "orders" && (
          <table className="w-full">
            <TableHead cols={["Market", "Account", "Type", "Price", "Size"]} />
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.name + o.type}>
                  <td className={cn(td, "font-medium")}>{o.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{o.account}</td>
                  <td className={td}>{o.type}</td>
                  <td className={td}>{fmtPrice(o.price)}</td>
                  <td className={td}>{o.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "history" && (
          <table className="w-full">
            <TableHead cols={["Time", "Market", "Setup", "Entry", "Exit", "Result", ""]} />
            <tbody>
              {history.map((t) => (
                <tr key={t.id} className={cn(tvSymbol(t.symbol) === symbol.tv && "bg-muted/50")}>
                  <td className={cn(td, "text-muted-foreground")}>
                    {t.date} {t.time}
                  </td>
                  <td className={td}>
                    <span className="font-medium">{t.symbol}</span> <span className={t.side === "long" ? "text-profit" : "text-loss"}>{t.side}</span>
                  </td>
                  <td className={cn(td, "text-muted-foreground")}>{t.setup}</td>
                  <td className={td}>{fmtPrice(t.entry)}</td>
                  <td className={td}>{fmtPrice(t.exit)}</td>
                  <td className={cn(td, t.r >= 0 ? "text-profit" : "text-loss")}>
                    {fmtR(t.r)} · {fmtPnl(t.pnl)}
                  </td>
                  <td className={cn(td, "text-xs text-muted-foreground")}>{t.review === "waiting" ? "Review asked" : t.thread.some((x) => x.from === "coach") ? "Feedback" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "accounts" && (
          <table className="w-full">
            <TableHead cols={["Account", "Broker", "Balance", "Synced"]} />
            <tbody>
              {ACCOUNTS.map((a) => (
                <tr key={a.id}>
                  <td className={cn(td, "font-medium")}>{a.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{a.broker} · read-only</td>
                  <td className={td}>€{a.balance.toLocaleString("en")}</td>
                  <td className={cn(td, "text-muted-foreground")}>{a.synced}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "coach" && (
          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            {charts.length === 0 && <p className="p-4 text-sm text-muted-foreground">{coach.coachName} hasn&apos;t shared a chart yet.</p>}
            {charts.map((c) => (
              <ChartCard key={c.id} chart={c} onOpen={() => onOpenChart(c)} tierNames="" dark={theme.mode === "dark"} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
