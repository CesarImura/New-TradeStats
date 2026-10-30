"use client"

import { useEffect, useState } from "react"
import { Chip, Label, Legend, MiniStats, Num, Panel, Rolling, Seg, StepChart, WCard } from "@/components/widgets/instrument"
import { Bars, Drop, Heat, Spark, SPLIT, SPREAD_ROWS, useFitRows, useFrame, useMore } from "@/components/widgets/kit"
import type { WidgetProps } from "@/components/widgets/shared"
import { BarChart3, FileSpreadsheet, LayoutGrid, LineChart, Sigma, Wallet } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * New journal widgets for the library (prototype only): tables and charts
 * built on the same card, type sizes and colour rules as the others. Profit
 * and loss are text and thin marks only; the accent marks one thing.
 */

const signed = (n: number, unit = "€") => `${n > 0 ? "+" : n < 0 ? "−" : ""}${unit}${Math.abs(n).toLocaleString("en")}`
const r = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}R`
const tone = (n: number) => ({ color: n >= 0 ? "var(--profit-text)" : "var(--loss-text)" })

const TRADES = [
  { id: 1, day: "Mon 12", time: "09:42", sym: "NQ", side: "Long", size: 2, r: 1.8, pl: 360 },
  { id: 2, day: "Mon 12", time: "10:15", sym: "ES", side: "Short", size: 1, r: -0.6, pl: -120 },
  { id: 3, day: "Tue 13", time: "09:35", sym: "NQ", side: "Long", size: 2, r: 2.4, pl: 480 },
  { id: 4, day: "Tue 13", time: "14:31", sym: "CL", side: "Short", size: 1, r: -1, pl: -200 },
  { id: 5, day: "Wed 14", time: "09:51", sym: "NQ", side: "Short", size: 2, r: 0.9, pl: 180 },
  { id: 6, day: "Wed 14", time: "11:20", sym: "ES", side: "Long", size: 1, r: -1, pl: -200 },
  { id: 7, day: "Thu 15", time: "09:33", sym: "NQ", side: "Long", size: 3, r: 1.2, pl: 360 },
  { id: 8, day: "Thu 15", time: "15:05", sym: "GC", side: "Long", size: 1, r: 0.5, pl: 100 },
  { id: 9, day: "Fri 16", time: "09:40", sym: "ES", side: "Short", size: 1, r: -0.4, pl: -80 },
  { id: 10, day: "Fri 16", time: "10:02", sym: "NQ", side: "Long", size: 2, r: 3.1, pl: 620 },
  { id: 11, day: "Fri 16", time: "13:44", sym: "CL", side: "Long", size: 1, r: -1, pl: -200 },
]

type SortKey = "time" | "pl" | "r"

/** A sortable header cell: click to sort by it, again to flip. */
function SortHead({ k, sort, dir, onSort, children, right }: { k: SortKey; sort: SortKey; dir: 1 | -1; onSort: (k: SortKey) => void; children: React.ReactNode; right?: boolean }) {
  const on = sort === k
  return (
    <th className={cn("h-8 px-2 font-medium", right ? "text-right" : "text-left")} aria-sort={on ? (dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 rounded-sm transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-(--brand-mark)", on && "text-foreground")}>
        {children}
        <span aria-hidden className={cn("text-[0.625rem]", !on && "opacity-0")}>
          {dir === 1 ? "▲" : "▼"}
        </span>
      </button>
    </th>
  )
}

export function RecentTrades({ variant = "table" }: WidgetProps) {
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const [sort, setSort] = useState<SortKey>("time")
  const [dir, setDir] = useState<1 | -1>(-1)
  const [page, setPage] = useState(0)
  // Rows per page follow the card's height; Detail sets it until measured.
  const [body, fit] = useFitRows<HTMLDivElement>(variant === "list" ? 37 : 32, { item: "li, tbody tr" })
  const per = Math.min(TRADES.length, fit ?? (detailed ? 6 : standard ? 4 : 3))
  const sorted = [...TRADES].sort((a, b) => dir * (sort === "time" ? (a.day + a.time).localeCompare(b.day + b.time) : sort === "pl" ? a.pl - b.pl : a.r - b.r))
  const pages = Math.ceil(sorted.length / per)
  // A resize can leave the page past the end.
  const at = Math.min(page, pages - 1)
  const rows = sorted.slice(at * per, at * per + per)
  const onSort = (k: SortKey) => {
    if (k === sort) setDir(dir === 1 ? -1 : 1)
    else {
      setSort(k)
      setDir(-1)
    }
    setPage(0)
  }
  const total = TRADES.reduce((a, t) => a + t.pl, 0)
  const wins = TRADES.filter((t) => t.pl > 0).length

  if (variant === "list") {
    return (
      <WCard
        icon={FileSpreadsheet}
        title="Recent trades"
        meta={`This week · ${TRADES.length} trades`}
        chip={<Chip tone={total >= 0 ? "profit" : "loss"}>{signed(total)}</Chip>}
        footnote={per < TRADES.length ? `Latest ${per} of ${TRADES.length}` : undefined}
        action={{ label: "Open journal", href: "journal" }}
        bands
      >
        <div ref={body} className="min-h-0 flex-1 overflow-hidden">
        <ul className="grid">
          {sorted.slice(0, per).map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2" style={{ borderColor: "var(--w-hair, var(--border))" }}>
              <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{t.time}</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{t.sym}</span> <span className="text-muted-foreground">{t.side.toLowerCase()}</span>
              </span>
              {standard && <span className="text-xs text-muted-foreground tabular-nums">{r(t.r)}</span>}
              <span className="w-16 text-right tabular-nums" style={tone(t.pl)}>
                {signed(t.pl)}
              </span>
            </li>
          ))}
        </ul>
        </div>
      </WCard>
    )
  }

  return (
    <WCard
      icon={FileSpreadsheet}
      title="Recent trades"
      meta={`This week · ${wins} of ${TRADES.length} won`}
      chip={<Chip tone={total >= 0 ? "profit" : "loss"}>{signed(total)}</Chip>}
      action={{ label: "Open journal", href: "journal" }}
      footnote={pages > 1 ? `Page ${at + 1} of ${pages}` : undefined}
      bands
    >
      <div ref={body} className="-mx-1 min-h-0 min-w-0 flex-1 overflow-hidden">
        <table className="w-full text-[0.8125rem] tabular-nums">
          <thead className="text-[0.6875rem] text-muted-foreground">
            <tr className="border-b" style={{ borderColor: "var(--w-hair, var(--border))" }}>
              <SortHead k="time" sort={sort} dir={dir} onSort={onSort}>
                Time
              </SortHead>
              {/* Wide: the day gets its own column instead of sitting before the time. */}
              <th className="hidden h-8 px-2 text-left font-medium @[36rem]:table-cell">Day</th>
              <th className="h-8 px-2 text-left font-medium">Symbol</th>
              {standard && <th className="hidden h-8 px-2 text-left font-medium @[22rem]:table-cell">Side</th>}
              {standard && <th className="hidden h-8 px-2 text-right font-medium @[26rem]:table-cell">Size</th>}
              <SortHead k="r" sort={sort} dir={dir} onSort={onSort} right>
                R
              </SortHead>
              <SortHead k="pl" sort={sort} dir={dir} onSort={onSort} right>
                P&amp;L
              </SortHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="h-8 border-b transition-colors duration-150 last:border-b-0 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]" style={{ borderColor: "var(--w-hair, var(--border))" }}>
                <td className="px-2 whitespace-nowrap text-muted-foreground">
                  {detailed && <span className="mr-1 @[36rem]:hidden">{t.day}</span>}
                  {t.time}
                </td>
                <td className="hidden px-2 whitespace-nowrap text-muted-foreground @[36rem]:table-cell">{t.day}</td>
                <td className="px-2 font-medium">{t.sym}</td>
                {standard && <td className="hidden px-2 text-muted-foreground @[22rem]:table-cell">{t.side}</td>}
                {standard && <td className="hidden px-2 text-right text-muted-foreground @[26rem]:table-cell">{t.size}</td>}
                <td className="px-2 text-right" style={tone(t.r)}>
                  {r(t.r)}
                </td>
                <td className="px-2 text-right" style={tone(t.pl)}>
                  {signed(t.pl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex shrink-0 items-center justify-end gap-1" role="navigation" aria-label="Trade pages">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              aria-current={i === at ? "page" : undefined}
              className={cn("grid size-6 place-items-center rounded-md text-xs tabular-nums transition-[color,background-color,scale] duration-150 ease-out outline-none active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-(--brand-mark)", i === at ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </WCard>
  )
}

const POSITIONS = [
  { sym: "NQ", side: "Long", size: 2, entry: 18452.25, stop: 18420, tick: 5 },
  { sym: "ES", side: "Short", size: 1, entry: 5241.5, stop: 5250, tick: 12.5 },
  { sym: "GC", side: "Long", size: 1, entry: 2381.4, stop: 2374, tick: 10 },
]

/** Prices that drift a little every couple of seconds, so the P&L moves like a live account. */
function useDrift(n: number) {
  // Starts off zero, so the first paint already looks like an open account.
  const [d, setD] = useState<number[]>(() => Array.from({ length: n }, (_, i) => [6, -3, 4, 2, -5][i % 5]))
  useEffect(() => {
    const id = setInterval(() => setD((x) => x.map((v, i) => Math.max(-14, Math.min(18, v + Math.round(Math.sin(Date.now() / 900 + i * 2) * 3))))), 1600)
    return () => clearInterval(id)
  }, [])
  return d
}

export function OpenPositions({ variant = "table" }: WidgetProps) {
  const standard = useMore("standard")
  const { fixed } = useFrame()
  const drift = useDrift(POSITIONS.length)
  const rows = POSITIONS.map((p, i) => {
    const ticks = (p.side === "Long" ? 1 : -1) * drift[i]
    return { ...p, pl: ticks * p.tick * p.size, ticks }
  })
  const open = rows.reduce((a, p) => a + p.pl, 0)
  // As many rows as the card holds; positions that don't fit are counted in the foot.
  const [body, fit] = useFitRows<HTMLDivElement>(36, { item: "tbody tr" })
  const shown = fit === undefined ? rows : rows.slice(0, fit)
  const hidden = rows.length - shown.length

  if (variant === "cards") {
    return (
      <WCard icon={Wallet} title="Open positions" meta={`${rows.length} open · live`} chip={<Chip tone={open >= 0 ? "profit" : "loss"}>{signed(open)}</Chip>}>
        {/* In a cell that sets the height the cards share it (a tall, narrow card stacks them), and each shows how far it is from its stop. */}
        <div className="grid grid-cols-3 gap-2 [@container_card_(max-aspect-ratio:6/5)]:grid-cols-1 [@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:flex-1 [@container_card_(min-height:0px)]:auto-rows-fr">
          {rows.map((p) => (
            <Panel key={p.sym} className="min-h-0 min-w-0 gap-1 overflow-hidden p-2.5" pad={false}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{p.sym}</span>
                <span className="text-xs text-muted-foreground">
                  {p.side} {p.size}
                </span>
              </span>
              <span className="text-xl leading-7 font-medium tabular-nums transition-colors duration-300" style={tone(p.pl)}>
                <Rolling value={signed(p.pl)} />
              </span>
              {standard && <span className="text-xs text-muted-foreground tabular-nums">Stop {p.stop}</span>}
              {fixed && (
                <Drop level={3}>
                  {/* How far the stop is: named, so the bar reads without a legend. */}
                  <span className="mt-auto grid gap-1.5">
                    <span className="flex items-baseline justify-between text-[0.6875rem] leading-4 text-muted-foreground tabular-nums">
                      <span>Room to stop</span>
                      <span className="text-foreground">{Math.max(0, Math.abs(p.entry - p.stop) + p.ticks * 0.25).toFixed(1)} pts</span>
                    </span>
                    <span className="r-bar relative h-1.5 shrink-0 overflow-hidden" style={{ background: "var(--muted)" }}>
                      <i className="r-bar absolute inset-y-0 left-0 w-full origin-left transition-transform duration-300 ease-out" style={{ transform: `scaleX(${Math.min(100, (Math.max(0, Math.abs(p.entry - p.stop) + p.ticks * 0.25) / (Math.abs(p.entry - p.stop) * 2)) * 100) / 100})`, background: "var(--w-accent, var(--primary))" }} />
                    </span>
                  </span>
                </Drop>
              )}
            </Panel>
          ))}
        </div>
      </WCard>
    )
  }

  return (
    <WCard
      icon={Wallet}
      title="Open positions"
      meta={`${rows.length} open · updates live`}
      chip={<Chip tone={open >= 0 ? "profit" : "loss"}>{signed(open)}</Chip>}
      footnote={hidden > 0 ? `${hidden} more open` : undefined}
      action={hidden > 0 ? { label: "All positions", href: "journal" } : undefined}
      bands={hidden > 0}
    >
      <div ref={body} className="min-h-0 flex-1 overflow-hidden">
      <table className="w-full text-[0.8125rem] tabular-nums">
        <thead className="text-[0.6875rem] text-muted-foreground">
          <tr className="border-b" style={{ borderColor: "var(--w-hair, var(--border))" }}>
            <th className="h-8 text-left font-medium">Symbol</th>
            <th className="h-8 text-left font-medium">Side</th>
            {standard && <th className="hidden h-8 text-right font-medium @[22rem]:table-cell">Entry</th>}
            {standard && <th className="hidden h-8 text-right font-medium @[28rem]:table-cell">Stop</th>}
            <th className="h-8 text-right font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.sym} className="h-9 border-b transition-colors duration-150 last:border-b-0 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]" style={{ borderColor: "var(--w-hair, var(--border))" }}>
              <td className="font-medium">{p.sym}</td>
              <td className="text-muted-foreground">
                {p.side} {p.size}
              </td>
              {standard && <td className="hidden text-right text-muted-foreground @[22rem]:table-cell">{p.entry.toLocaleString("en")}</td>}
              {standard && <td className="hidden text-right text-muted-foreground @[28rem]:table-cell">{p.stop.toLocaleString("en")}</td>}
              <td className="text-right transition-colors duration-300" style={tone(p.pl)}>
                <Rolling value={signed(p.pl)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        {/* Room under the rows (a tall cell): how far each position is from its stop, so the height carries information, not a blank band. */}
        {fixed && hidden === 0 && (
          <Drop level={3}>
            <div className="mt-4 grid gap-2 border-t pt-3" style={{ borderColor: "var(--w-hair, var(--border))" }}>
              <Label>Room to stop</Label>
              {shown.map((p) => {
                const risk = Math.abs(p.entry - p.stop)
                const room = Math.max(0, risk + p.ticks * 0.25)
                return (
                  <div key={p.sym} className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-xs tabular-nums">
                    <span className="font-medium">{p.sym}</span>
                    <span className="r-bar relative h-1.5 overflow-hidden" style={{ background: "var(--muted)" }}>
                      <i className="r-bar absolute inset-y-0 left-0 w-full origin-left transition-transform duration-300 ease-out" style={{ transform: `scaleX(${Math.min(100, (room / (risk * 2)) * 100) / 100})`, background: room < risk / 2 ? "var(--loss)" : "var(--w-accent, var(--primary))" }} />
                    </span>
                    <span className="text-right text-muted-foreground">{room.toFixed(1)} pts</span>
                  </div>
                )
              })}
            </div>
          </Drop>
        )}
      </div>
    </WCard>
  )
}

const BUCKETS = ["−2", "−1.5", "−1", "−0.5", "+0.5", "+1", "+2", "+3"]
const COUNTS = [1, 2, 9, 4, 6, 7, 5, 2]

export function RDistribution({ variant = "histogram" }: WidgetProps) {
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const total = COUNTS.reduce((a, b) => a + b, 0)
  const mostIdx = COUNTS.indexOf(Math.max(...COUNTS))
  if (variant === "summary") {
    return (
      <WCard icon={BarChart3} title="R distribution" meta={`Last ${total} trades`}>
        <Num value="+0.42R" caption="average per trade" />
        <MiniStats
          items={[
            { label: "Losses at −1R", value: `${COUNTS[2]}` },
            { label: "Wins ≥ 2R", value: `${COUNTS[6] + COUNTS[7]}`, tone: "profit" },
            ...(standard ? [{ label: "Largest", value: "+3.1R", tone: "accent" as const }] : []),
          ]}
        />
      </WCard>
    )
  }
  return (
    <WCard icon={BarChart3} title="R distribution" meta={`Last ${total} trades · in R multiples`} chip={<Chip>avg +0.42R</Chip>} bodyClassName={SPLIT}>
      <div data-main className="flex min-h-min flex-1 flex-col">
        <Bars values={COUNTS} labels={BUCKETS} active={mostIdx} className="min-h-24 flex-1 [@container_card_(min-width:34rem)]:min-h-36" format={(v) => `${v} trades`} />
      </div>
      {standard && (
        <Legend
          items={[
            { label: "Most common", value: `${BUCKETS[mostIdx]}R · ${COUNTS[mostIdx]} trades` },
            ...(detailed ? [{ label: "Losses kept at −1R or better", value: `${Math.round(((COUNTS[2] + COUNTS[3]) / (COUNTS[0] + COUNTS[1] + COUNTS[2] + COUNTS[3])) * 100)}%` }] : []),
          ]}
        />
      )}
    </WCard>
  )
}

const INSTRUMENTS = [
  { sym: "NQ", name: "Nasdaq", pl: 1940, n: 21 },
  { sym: "ES", name: "S&P 500", pl: 380, n: 12 },
  { sym: "GC", name: "Gold", pl: 160, n: 4 },
  { sym: "CL", name: "Crude", pl: -620, n: 7 },
]

export function PnlByInstrument({ variant = "bars" }: WidgetProps) {
  const standard = useMore("standard")
  const max = Math.max(...INSTRUMENTS.map((x) => Math.abs(x.pl)))
  const [hover, setHover] = useState<string>()
  return (
    <WCard icon={LayoutGrid} title="P&L by instrument" meta="This month" chip={<Chip tone="neutral">{INSTRUMENTS.length} markets</Chip>}>
      {variant === "table" ? (
        <table className="w-full text-[0.8125rem] tabular-nums">
          <thead className="text-[0.6875rem] text-muted-foreground">
            <tr className="border-b" style={{ borderColor: "var(--w-hair, var(--border))" }}>
              <th className="h-8 text-left font-medium">Market</th>
              <th className="h-8 text-right font-medium">Trades</th>
              {standard && <th className="h-8 text-right font-medium">Avg</th>}
              <th className="h-8 text-right font-medium">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {INSTRUMENTS.map((x) => (
              <tr key={x.sym} className="h-8 border-b last:border-b-0" style={{ borderColor: "var(--w-hair, var(--border))" }}>
                <td>
                  <span className="font-medium">{x.sym}</span> <span className="text-muted-foreground">{x.name}</span>
                </td>
                <td className="text-right text-muted-foreground">{x.n}</td>
                {standard && <td className="text-right text-muted-foreground">{signed(Math.round(x.pl / x.n))}</td>}
                <td className="text-right" style={tone(x.pl)}>
                  {signed(x.pl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // Thin bars from a centre line: profit right, loss left. The hovered market takes the accent. Whole rows; in a taller cell they spread over it.
        <ul className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start gap-2.5 overflow-hidden *:w-full", SPREAD_ROWS)} onPointerLeave={() => setHover(undefined)}>
          {INSTRUMENTS.map((x) => (
            <li key={x.sym} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-3" onPointerEnter={() => setHover(x.sym)}>
              <span className="font-medium">{x.sym}</span>
              <span className="relative h-2">
                <span className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--w-hair, var(--border))" }} />
                <span
                  className="absolute inset-y-0 rounded-full transition-colors duration-150"
                  style={{
                    left: x.pl >= 0 ? "50%" : `${50 - (Math.abs(x.pl) / max) * 50}%`,
                    width: `${(Math.abs(x.pl) / max) * 50}%`,
                    background: hover === x.sym ? "var(--w-accent, var(--primary))" : x.pl >= 0 ? "var(--profit)" : "var(--loss)",
                    opacity: hover && hover !== x.sym ? 0.45 : 1,
                  }}
                />
              </span>
              <span className="text-right tabular-nums" style={tone(x.pl)}>
                {signed(x.pl)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {standard && variant !== "table" && <Label>{hover ? `${INSTRUMENTS.find((x) => x.sym === hover)!.n} trades in ${hover}` : "Hover a market for its trade count"}</Label>}
    </WCard>
  )
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const BY_DAY = [420, 610, -180, 290, -340]

export function PnlByWeekday({ variant = "bars" }: WidgetProps) {
  const standard = useMore("standard")
  const best = BY_DAY.indexOf(Math.max(...BY_DAY))
  const worst = BY_DAY.indexOf(Math.min(...BY_DAY))
  if (variant === "heatmap") {
    return (
      <WCard icon={Sigma} title="P&L by weekday" meta="Last 4 weeks · each cell a day" bodyClassName={SPLIT}>
        <div data-main className="flex min-h-min flex-1 flex-col">
          <Heat
            rows={[
              [120, 260, -80, 90, -140],
              [80, 140, -60, 120, -90],
              [150, 110, 20, -40, -60],
              [70, 100, -60, 120, -50],
            ]}
            labels={["Mon", "Tue", "Wed", "Thu", "Fri"]}
            rowLabels={["Wk 1", "Wk 2", "Wk 3", "Wk 4"]}
            // A cell that sets the height: the days keep a calm shape (the grid's width follows the height) instead of stretching into bars.
            className="[@container_card_(min-height:0px)]:mx-auto [@container_card_(min-height:0px)]:w-full [@container_card_(min-height:0px)]:max-w-[calc((100cqh-7rem)*2.4)]"
          />
        </div>
        {standard && <Label>Oldest week at the top</Label>}
      </WCard>
    )
  }
  return (
    <WCard icon={Sigma} title="P&L by weekday" meta="Last 4 weeks" chip={<Chip>best {WEEKDAYS[best]}</Chip>} bodyClassName={SPLIT}>
      <div data-main className="flex min-h-min flex-1 flex-col">
        <Bars values={BY_DAY} labels={WEEKDAYS.map((d) => d[0])} tips={WEEKDAYS} diverging active={best} className="min-h-24 flex-1" format={(v) => signed(v)} />
      </div>
      {standard && (
        <Legend
          items={[
            { label: `Best · ${WEEKDAYS[best]}`, value: signed(BY_DAY[best]), valueTone: "profit" },
            { label: `Worst · ${WEEKDAYS[worst]}`, value: signed(BY_DAY[worst]), valueTone: "loss" },
          ]}
        />
      )}
    </WCard>
  )
}

const WIN = { "4w": [52, 49, 55, 51, 54, 58, 56, 60, 57, 58], "3m": [44, 47, 46, 50, 49, 52, 51, 55, 54, 57, 56, 58] }
/** The group's average over the same four weeks. */
const GROUP_WIN = [50, 49, 51, 50, 52, 51, 50, 52, 51, 51]

export function WinRateTrend({ variant = "trend" }: WidgetProps) {
  const standard = useMore("standard")
  const [period, setPeriod] = useState<"4w" | "3m">("4w")
  const values = WIN[period]
  const now = values[values.length - 1]
  const delta = now - values[0]
  if (variant === "compare") {
    return (
      <WCard icon={LineChart} title="Win rate" meta="You and the group, last 4 weeks" bodyClassName={SPLIT}>
        <MiniStats
          items={[
            { label: "You", value: `${now}%`, tone: "accent" },
            { label: "Group average", value: `${GROUP_WIN[GROUP_WIN.length - 1]}%` },
            ...(standard ? [{ label: "Change", value: `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} pts`, tone: delta >= 0 ? ("profit" as const) : ("loss" as const) }] : []),
          ]}
        />
        {/* The two lines behind the figures take whatever height the card has; on a short card they give way. */}
        <Drop level={2}>
          <div data-main className="flex min-h-min flex-1 flex-col">
            <Panel className="min-h-16 flex-1">
              <StepChart
                className="min-h-12 flex-1"
                height={0}
                format={(v) => `${v}%`}
                series={[
                  { values: WIN["4w"], label: "You" },
                  { values: GROUP_WIN, label: "Group average" },
                ]}
              />
            </Panel>
          </div>
        </Drop>
      </WCard>
    )
  }
  return (
    <WCard icon={LineChart} title="Win rate trend" meta="Share of trades closed in profit" control={<Seg label="Period" value={period} onChange={setPeriod} options={[["4w", "4W"], ["3m", "3M"]]} />} bodyClassName={SPLIT}>
      <Num value={`${now}%`} delta={`${delta >= 0 ? "+" : "−"}${Math.abs(delta)} pts`} deltaTone={delta >= 0 ? "profit" : "loss"} caption={period === "4w" ? "in 4 weeks" : "in 3 months"} />
      <div data-main className="flex min-h-min flex-1 flex-col">
        <Spark values={values} className="min-h-16 flex-1" format={(v) => `${v}%`} />
      </div>
    </WCard>
  )
}

export { tone, signed }
