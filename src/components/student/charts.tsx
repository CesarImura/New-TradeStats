"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, ExternalLink, Lock, MessageCircle, NotebookPen, Pin, Plus, Search, Sparkles, X } from "@/components/icons"
import { toast } from "sonner"
import { useCommunityData } from "@/components/admin/kit"
import { TradingViewChart } from "@/components/charts/tradingview"
import { useCoach } from "@/components/coach/coach-provider"
import { useStudentTier } from "@/components/courses/shared"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { allTrades, useFeedback } from "@/lib/data/feedback"
import { COACH_CHARTS, chartDefaults, fmtPnl, fmtPrice, fmtR, MARKETS, tvSymbol, type ChartSettings, type CoachChart, type Market } from "@/lib/data/trades"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { OwnTitle } from "@/components/student/own-title"

type Sym = { tv: string; name: string }
type Level = CoachChart["levels"][number]

const MINE: Sym[] = []

/** Colour and word for each kind of level: support in profit, resistance in loss, targets in the brand colour. */
const LEVEL_KIND: Record<Level["kind"], { label: string; dot: string; text: string }> = {
  support: { label: "Support", dot: "bg-profit", text: "text-profit" },
  resistance: { label: "Resistance", dot: "bg-loss", text: "text-loss" },
  target: { label: "Target", dot: "bg-primary", text: "text-primary" },
}

/**
 * Charts: one chart with the coach's view on it. The coach's game plan (their
 * charts, pinned first) on the left, the TradingView chart of the selected
 * plan's symbol in the middle with the coach's levels as a legend, the
 * student's own trades on that symbol, and the coach's note. Nothing is bought
 * or sold here: the broker connection is read-only, and traders already have
 * order entry at their broker.
 */
export function StudentCharts() {
  const { coach, theme, base, preview } = useCoach()
  const tier = useStudentTier()
  const store = useFeedback(coach.slug)
  const picked = (coach as { setup?: { markets?: Market[] } }).setup?.markets?.join() ?? ""
  const defaults = useMemo(() => chartDefaults(picked ? (picked.split(",") as Market[]) : undefined), [picked])
  const s = useStored<ChartSettings>(`${coach.slug}:charts`, defaults)
  const shared = useStored<CoachChart[]>(`${coach.slug}:coach-charts`, COACH_CHARTS)
  const [mine, setMine] = useCommunityData(coach.slug, "my-watchlist", MINE)
  // undefined: the first plan; null: none (a symbol was picked on its own).
  const [planId, setPlanId] = useState<string | null | undefined>(undefined)
  const [own, setOwn] = useState<Sym | null>(null)

  const allowed = s.tiers.length === 0 || s.tiers.includes(tier)
  const hasTier = (c: CoachChart) => c.tiers.length === 0 || c.tiers.includes(tier)
  const plans = shared.filter((c) => !c.archived).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  const firstOpen = plans.find(hasTier)
  const plan = planId === undefined ? firstOpen : planId === null ? undefined : plans.find((c) => c.id === planId && hasTier(c))
  const symbol: Sym = plan?.symbol ?? own ?? s.watchlist[0] ?? { tv: "CAPITALCOM:US100", name: "NQ" }
  const dark = theme.mode === "dark"
  const bg = theme.palettes[theme.mode].card

  const tierName = (c: CoachChart) => coach.tiers.find((t) => c.tiers.includes(t.id))?.name ?? "a higher plan"
  const upgrade = (name?: string) => toast(`Upgrade to ${name}`, { description: "Opens the plan change with the price difference." })

  if (!allowed) {
    const needed = coach.tiers.find((t) => s.tiers.includes(t.id))
    return (
      <div className="flex flex-col page-gap">
        <OwnTitle><h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.charts}</h1></OwnTitle>
        <div className="grid place-items-center gap-3 rounded-(--radius) border border-dashed px-6 py-16 text-center">
          <Lock className="size-7 text-muted-foreground" />
          <p className="font-medium">
            {coach.wording.charts} is part of {needed?.name}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">Full charts, {coach.coachName}&apos;s watchlist and marked-up levels every week.</p>
          <Button onClick={() => upgrade(needed?.name)}>Upgrade to {needed?.name}</Button>
        </div>
      </div>
    )
  }

  const panel = "overflow-hidden rounded-(--radius) border bg-card"
  const askHref = coach.modules.community ? `${base}/community` : coach.modules.ai ? `${base}/ai` : null

  return (
    <div className="flex size-full min-h-0 flex-col gap-3">
      <h1 className="sr-only">{coach.wording.charts}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <SymbolSwitcher
          symbol={symbol}
          watchlist={s.watchlist}
          mine={mine}
          setMine={setMine}
          onPick={(x) => {
            setOwn(x)
            setPlanId(null)
          }}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link href={`${base}/journal?new=1`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <NotebookPen /> Log a trade
          </Link>
          {askHref && (
            <Link href={askHref} className={buttonVariants({ size: "sm" })}>
              {coach.modules.community ? <MessageCircle /> : <Sparkles />} Ask {coach.coachName}
            </Link>
          )}
        </div>
      </div>

      {plans.length === 0 && (
        <p className="rounded-(--radius) border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No game plan yet: {coach.coachName} hasn&apos;t shared levels this week.
        </p>
      )}

      <div className={cn("grid min-h-0 flex-1 gap-3", plans.length > 0 && "lg:grid-cols-[260px_minmax(0,1fr)]")}>
        {plans.length > 0 && (
          <aside className="flex min-w-0 flex-col gap-2" aria-label={`${coach.coachName}'s game plan`}>
            <span className="eyebrow px-1">{coach.coachName}&apos;s game plan</span>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {plans.map((c) =>
                hasTier(c) ? (
                  <PlanRow key={c.id} chart={c} active={plan?.id === c.id} onSelect={() => setPlanId(c.id)} />
                ) : (
                  <PlanRow key={c.id} chart={c} locked={tierName(c)} onSelect={() => upgrade(tierName(c))} />
                ),
              )}
            </div>
          </aside>
        )}

        <div className="flex min-w-0 flex-col gap-3">
          <div className={cn(panel, "h-[min(60svh,560px)] min-h-[340px]")}>
            <TradingViewChart symbol={symbol.tv} interval={s.interval} style={s.style} studies={s.indicators} dark={dark} background={bg} symbolChange={false} className="size-full" />
          </div>
          {preview && <p className="px-1 text-xs text-muted-foreground">The free TradingView chart keeps its own candle colours.</p>}

          <div className="grid items-start gap-3 md:grid-cols-2">
            <div className="grid min-w-0 gap-3">
              <section className={cn(panel, "grid gap-2 p-4")}>
                <h2 className="text-sm font-medium">Levels{plan ? ` · ${plan.symbol.name}` : ""}</h2>
                {plan && plan.levels.length > 0 ? (
                  <ul className="grid gap-1.5">
                    {[...plan.levels]
                      .sort((a, b) => b.at - a.at)
                      .map((l) => (
                        <li key={l.label} className="flex items-center gap-2 text-sm">
                          <span className={cn("size-2 shrink-0 rounded-(--r-dot)", LEVEL_KIND[l.kind].dot)} />
                          <span className="min-w-0 flex-1 truncate">{l.label}</span>
                          <span className={cn("text-xs", LEVEL_KIND[l.kind].text)}>{LEVEL_KIND[l.kind].label}</span>
                          <span className="w-20 text-right tabular-nums">{fmtPrice(l.at)}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{plan ? "No levels on this plan." : `Pick one of ${coach.coachName}'s plans to see its levels.`}</p>
                )}
                <p className="text-xs text-muted-foreground">Levels are drawn on the chart with the full TradingView integration</p>
                {plan?.link && (
                  <a href={plan.link} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    <ExternalLink className="size-3.5" /> {coach.coachName}&apos;s layout on TradingView
                  </a>
                )}
              </section>

              <MyTrades symbol={symbol} store={store} />
            </div>

            <section className={cn(panel, "grid gap-2 p-4")}>
              <h2 className="text-sm font-medium">{plan ? `${coach.coachName}'s note` : "No plan selected"}</h2>
              {plan ? (
                <>
                  <p className="text-sm">{plan.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.title} · {coach.coachName} · {plan.when}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {plans.length === 0 ? `${coach.coachName} hasn't shared a note yet.` : `Pick one of ${coach.coachName}'s plans to read the note.`}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Game plan

function PlanRow({ chart: c, active, locked, onSelect }: { chart: CoachChart; active?: boolean; locked?: string; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "grid min-w-52 content-start gap-0.5 rounded-(--radius) border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted lg:min-w-0",
        active && "border-primary bg-muted",
        locked && "text-muted-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        {locked ? <Lock className="size-3.5 shrink-0" /> : c.pinned && <Pin className="size-3.5 shrink-0 text-primary" />}
        <span className="truncate text-sm font-medium">{c.title}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {c.symbol.name} · {c.when}
        {locked ? ` · Part of ${locked}` : ""}
      </span>
    </button>
  )
}

// ---------- My trades on this symbol

function MyTrades({ symbol, store }: { symbol: Sym; store: ReturnType<typeof useFeedback> }) {
  const { coach, base } = useCoach()
  const trades = allTrades(store).filter((t) => tvSymbol(t.symbol) === symbol.tv)
  return (
    <section className="grid gap-2 overflow-hidden rounded-(--radius) border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">My trades · {symbol.name}</h2>
        <Link href={`${base}/journal`} className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          All trades <ArrowRight className="size-3" />
        </Link>
      </div>
      {trades.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trades on {symbol.name} in your {coach.wording.journal.toLowerCase()} yet.</p>
      ) : (
        <ul className="grid gap-1.5">
          {trades.slice(0, 5).map((t) => (
            <li key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 text-xs tabular-nums">
              <span className="text-muted-foreground">{t.date}</span>
              <span className="truncate">
                <span className="text-muted-foreground">{t.side}</span> {fmtPrice(t.entry)} → {fmtPrice(t.exit)}
              </span>
              <span className={cn("text-right", t.pnl >= 0 ? "text-profit" : "text-loss")}>
                {fmtR(t.r)} · {fmtPnl(t.pnl)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------- Symbol switcher

function SymbolSwitcher({ symbol, watchlist, mine, setMine, onPick }: { symbol: Sym; watchlist: Sym[]; mine: Sym[]; setMine: (f: (m: Sym[]) => Sym[]) => void; onPick: (s: Sym) => void }) {
  const { coach } = useCoach()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const search = MARKETS.flatMap((x) => x.symbols).filter((x) => `${x.name} ${x.tv}`.toLowerCase().includes(q.toLowerCase()))
  const pick = (x: Sym) => {
    onPick(x)
    setOpen(false)
    setQ("")
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 rounded-(--radius) border bg-card px-3 py-2 text-left hover:bg-muted">
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
