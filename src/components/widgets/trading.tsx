"use client"

import { useState } from "react"
import { Clock, Crosshair, Link2, ShieldAlert, Sigma } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { ACCOUNT, MARKET_SESSIONS, NOW_HOUR, R_BINS, R_STATS, SESSION_PNL, SETUPS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, Head, Key, Spark, TONE, Tip, Track, W, fill, series } from "./kit"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const hhmm = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`

function ConnectBroker() {
  return <WidgetEmpty icon={Link2} title="Connect your broker" text="This fills in from your own trades." action={<Button size="sm">Connect</Button>} />
}

// ---------- Market sessions

function sessionState(s: { open: number; close: number }, now: number) {
  const open = now >= s.open && now < s.close
  const until = open ? s.close - now : (s.open - now + 24) % 24
  return { open, until }
}
const inHours = (h: number) => (h >= 1 ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m` : `${Math.round(h * 60)}m`)

/** Market sessions: timeline (24h bars), clock (24h dial), status (open/closed with countdown). */
export function MarketSessions({ variant = "timeline" }: WidgetProps) {
  const now = NOW_HOUR
  const open = MARKET_SESSIONS.filter((s) => sessionState(s, now).open)

  if (variant === "clock") {
    const R = 40
    const arc = (from: number, to: number, r: number) => {
      const a = (h: number) => (h / 24) * Math.PI * 2 - Math.PI / 2
      const [x1, y1] = [50 + r * Math.cos(a(from)), 50 + r * Math.sin(a(from))]
      const [x2, y2] = [50 + r * Math.cos(a(to)), 50 + r * Math.sin(a(to))]
      return `M${x1},${y1} A${r},${r} 0 ${to - from > 12 ? 1 : 0} 1 ${x2},${y2}`
    }
    const na = (now / 24) * Math.PI * 2 - Math.PI / 2
    return (
      <W>
        <Head icon={Clock} value={open.length} label="Open now" right={hhmm(now)} />
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full max-h-full w-auto" aria-label="Market sessions over 24 hours">
            <circle cx={50} cy={50} r={R + 6} fill="none" stroke="var(--border)" strokeWidth={0.5} />
            {[0, 6, 12, 18].map((h) => {
              const a = (h / 24) * Math.PI * 2 - Math.PI / 2
              return (
                <text key={h} x={50 + 47 * Math.cos(a)} y={50 + 47 * Math.sin(a)} fontSize={4.5} textAnchor="middle" dominantBaseline="middle" fill="var(--muted-foreground)">
                  {String(h).padStart(2, "0")}
                </text>
              )
            })}
            {MARKET_SESSIONS.map((s, i) => (
              <path key={s.name} d={arc(s.open, s.close, R - i * 6)} fill="none" stroke={series(i)} strokeWidth={4.5} opacity={sessionState(s, now).open ? 1 : 0.35} style={{ strokeLinecap: "var(--cap)" as never }} />
            ))}
            <line x1={50} y1={50} x2={50 + (R + 4) * Math.cos(na)} y2={50 + (R + 4) * Math.sin(na)} stroke="var(--foreground)" strokeWidth={1} />
            <circle cx={50} cy={50} r={1.6} fill="var(--foreground)" />
          </svg>
        </div>
        <div className="hidden flex-wrap justify-center gap-x-3 gap-y-1 @[15rem]:flex">
          {MARKET_SESSIONS.map((s, i) => (
            <Key key={s.name} color={series(i)}>
              {s.name}
            </Key>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "status") {
    return (
      <W>
        <Head icon={Clock} value={open.length} label="Sessions open" right={hhmm(now)} />
        <div className="grid flex-1 content-evenly gap-2">
          {MARKET_SESSIONS.map((s, i) => {
            const st = sessionState(s, now)
            return (
              <div key={s.name} className="flex min-w-0 items-center gap-2.5">
                <i className="r-dot size-2 shrink-0" style={{ background: st.open ? series(i) : "var(--muted)" }} />
                <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                <span className={cn("text-xs tabular-nums", st.open ? "text-foreground" : "text-muted-foreground")}>
                  {st.open ? `closes in ${inHours(st.until)}` : `opens in ${inHours(st.until)}`}
                </span>
              </div>
            )
          })}
        </div>
      </W>
    )
  }

  // timeline
  const pos = (h: number) => `${(h / 24) * 100}%`
  const best = [...SESSION_PNL].sort((a, b) => b.pnl - a.pnl)[0]
  return (
    <W>
      <Head icon={Clock} value={open.length} label="Open now" right={`Your best: ${best.name}`} />
      <div className="relative grid flex-1 content-evenly gap-1.5">
        {MARKET_SESSIONS.map((s, i) => {
          const pnl = SESSION_PNL.find((p) => p.name === s.name)?.pnl
          return (
            <div key={s.name} className="grid grid-cols-[4.5rem_1fr] items-center gap-2 @max-[16rem]:grid-cols-[3rem_1fr]">
              <Caps className="truncate">{s.name}</Caps>
              <div className="relative h-4">
                <span className="r-bar absolute inset-y-0 bg-muted" style={{ left: 0, right: 0, opacity: 0.5 }} />
                <span
                  className="r-bar absolute inset-y-0 flex items-center justify-end px-1.5"
                  style={{ left: pos(s.open), width: pos(s.close - s.open), background: series(i), opacity: sessionState(s, now).open ? 1 : 0.45 }}
                >
                  {pnl !== undefined && <span className="hidden text-[0.6rem] font-semibold text-white tabular-nums @[20rem]:inline">{signed(pnl)}</span>}
                </span>
              </div>
            </div>
          )
        })}
        {/* now line across all sessions */}
        <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-loss" style={{ left: `calc(4.5rem + 0.5rem + (100% - 5rem) * ${now / 24})` }} />
      </div>
      <div className="grid grid-cols-[4.5rem_1fr] gap-2 @max-[16rem]:grid-cols-[3rem_1fr]">
        <span />
        <div className="flex justify-between">
          {["00", "06", "12", "18", "24"].map((t) => (
            <Caps key={t}>{t}</Caps>
          ))}
        </div>
      </div>
    </W>
  )
}

// ---------- Drawdown

function Gauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(1, value / max)
  const r = 40
  const len = Math.PI * r
  return (
    <svg viewBox="0 0 100 56" className="w-full max-w-56" aria-hidden>
      <path d={`M10,50 A${r},${r} 0 0 1 90,50`} fill="none" stroke="var(--muted)" strokeWidth={9} style={{ strokeLinecap: "var(--cap)" as never }} />
      <path d={`M10,50 A${r},${r} 0 0 1 90,50`} fill="none" stroke={color} strokeWidth={9} strokeDasharray={len} strokeDashoffset={len * (1 - pct)} style={{ strokeLinecap: "var(--cap)" as never }} />
    </svg>
  )
}

/** Drawdown: gauge (share of the max drawdown used), bars (daily and max limits), curve (balance with the limit line). */
export function Drawdown({ variant = "gauge" }: WidgetProps) {
  const empty = useEmpty()
  if (empty) return <ConnectBroker />
  const dd = ACCOUNT.peak - ACCOUNT.balance
  const used = (dd / ACCOUNT.maxDrawdown) * 100
  const limitAt = ACCOUNT.peak - ACCOUNT.maxDrawdown
  const tone = used > 75 ? "loss" : used > 40 ? "highlight" : "profit"
  const color = tone === "highlight" ? "oklch(0.75 0.15 75)" : TONE[tone]

  if (variant === "bars") {
    const rows = [
      { label: "Today", used: -ACCOUNT.today, limit: ACCOUNT.dailyLimit },
      { label: "Max drawdown", used: dd, limit: ACCOUNT.maxDrawdown },
    ]
    return (
      <W>
        <Head icon={ShieldAlert} tone="loss" label="Risk limits" right={ACCOUNT.name} />
        <div className="grid flex-1 content-evenly gap-3">
          {rows.map((r) => {
            const p = (r.used / r.limit) * 100
            return (
              <div key={r.label} className="grid gap-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{r.label}</span>
                  <span className="ml-auto font-heading text-sm font-semibold tabular-nums">{euro(r.used)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">/ {euro(r.limit)}</span>
                </div>
                <Track value={p} color={p > 75 ? TONE.loss : p > 40 ? "oklch(0.75 0.15 75)" : TONE.profit} className="h-2" />
              </div>
            )
          })}
        </div>
      </W>
    )
  }

  if (variant === "curve") {
    return (
      <W>
        <Head icon={ShieldAlert} tone={tone === "highlight" ? "fg" : tone} label={ACCOUNT.name} right={`${euro(ACCOUNT.maxDrawdown - dd)} to limit`} />
        <Big value={euro(ACCOUNT.balance)} sub={`${signed(ACCOUNT.balance - ACCOUNT.start)} since start`} />
        <Spark values={ACCOUNT.history} format={euro} tip={(i) => `Day ${i + 1}`} />
        {/* The limit sits below everything on the chart; mark it as a floor. */}
        <div className="flex items-center gap-2">
          <span className="h-0 flex-1 border-t border-dashed border-loss" />
          <Caps className="text-loss">Limit {euro(limitAt)}</Caps>
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={ShieldAlert} tone="loss" label="Drawdown" right={ACCOUNT.name} />
      <div className="relative flex flex-1 flex-col items-center justify-end">
        <Gauge value={dd} max={ACCOUNT.maxDrawdown} color={color} />
        <div className="absolute bottom-0 grid justify-items-center gap-0.5">
          <span className="font-heading text-2xl leading-none font-semibold tabular-nums">{Math.round(used)}%</span>
          <Caps>of max</Caps>
        </div>
      </div>
      <div className="flex justify-between text-xs tabular-nums">
        <span className="text-muted-foreground">{euro(dd)} down</span>
        <span>{euro(ACCOUNT.maxDrawdown - dd)} left</span>
      </div>
    </W>
  )
}

// ---------- Win rate by setup

/** Setups: bars (win rate per setup), table (trades, win rate, R), best (the setup that pays). */
export function Setups({ variant = "bars" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const [hover, setHover] = useState<number>()
  if (empty) return <ConnectBroker />
  const sorted = [...SETUPS].sort((a, b) => b.r - a.r)
  const best = sorted[0]

  if (variant === "table") {
    return (
      <W>
        <Head icon={Crosshair} label="Setups" right="This month" />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="pb-2 font-normal"><Caps>Setup</Caps></th>
              <th className="hidden pb-2 text-right font-normal @[16rem]:table-cell"><Caps>Trades</Caps></th>
              <th className="pb-2 text-right font-normal"><Caps>Win</Caps></th>
              <th className="pb-2 text-right font-normal"><Caps>Avg R</Caps></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((s) => (
              <tr key={s.name}>
                <td className="max-w-0 truncate py-1.5 pr-2">{s.name}</td>
                <td className="hidden py-1.5 text-right text-muted-foreground tabular-nums @[16rem]:table-cell">{s.trades}</td>
                <td className="py-1.5 text-right tabular-nums">{s.win}%</td>
                <td className={cn("py-1.5 text-right font-medium tabular-nums", s.r >= 0 ? "text-profit" : "text-loss")}>
                  {s.r >= 0 ? "+" : ""}
                  {s.r.toFixed(1)}R
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </W>
    )
  }

  if (variant === "best") {
    return (
      <W>
        <Head icon={Crosshair} tone="profit" label="Your best setup" />
        <Big value={best.name} sub={`${best.trades} trades · ${best.win}% win`} />
        <div className="mt-auto flex items-end justify-between gap-3">
          <span className="font-heading text-3xl leading-none font-semibold text-profit tabular-nums">+{best.r.toFixed(1)}R</span>
          <span className="text-right text-xs text-muted-foreground">avg per trade · drop {sorted.at(-1)!.short}?</span>
        </div>
      </W>
    )
  }

  const maxTrades = Math.max(...SETUPS.map((s) => s.trades))
  return (
    <W>
      <Head icon={Crosshair} label="Win rate by setup" right={coach.wording.journal} />
      <div className="grid flex-1 content-evenly gap-2.5" onPointerLeave={() => setHover(undefined)}>
        {sorted.map((s, i) => (
          <div key={s.name} className={cn("grid gap-1 transition-opacity", hover !== undefined && hover !== i && "opacity-50")} onPointerEnter={() => setHover(i)}>
            <div className="flex min-w-0 items-baseline gap-2 text-xs">
              <span className="truncate">{s.name}</span>
              <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">{hover === i ? `${s.trades} trades` : `${s.r >= 0 ? "+" : ""}${s.r.toFixed(1)}R`}</span>
              <span className="w-9 shrink-0 text-right font-semibold tabular-nums">{s.win}%</span>
            </div>
            <div className="relative">
              <Track value={s.win} color={s.r >= 0 ? (i === 0 ? fill("primary", "90deg") : TONE.primary) : TONE.loss} className="h-2" />
              {/* sample size: a faint marker showing how many trades back this up */}
              <span className="r-bar absolute -bottom-1 left-0 h-0.5 bg-muted-foreground/30" style={{ width: `${(s.trades / maxTrades) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </W>
  )
}

// ---------- R-multiple spread

/** R spread: histogram (trades per R), expectancy (one number + avg win vs loss), split (wins vs losses). */
export function RSpread({ variant = "histogram" }: WidgetProps) {
  const empty = useEmpty()
  const [hover, setHover] = useState<number>()
  if (empty) return <ConnectBroker />
  const total = R_BINS.reduce((n, b) => n + b.n, 0)
  const exp = `${R_STATS.expectancy >= 0 ? "+" : ""}${R_STATS.expectancy.toFixed(2)}R`

  if (variant === "expectancy") {
    const maxAbs = Math.max(R_STATS.avgWin, -R_STATS.avgLoss)
    return (
      <W>
        <Head icon={Sigma} tone="profit" label="Expectancy" right={`${total} trades`} />
        <Big value={exp} tone={R_STATS.expectancy >= 0 ? "profit" : "loss"} sub="earned per trade, on average" />
        <div className="mt-auto grid gap-2">
          {[
            { label: "Avg win", v: R_STATS.avgWin, color: TONE.profit },
            { label: "Avg loss", v: R_STATS.avgLoss, color: TONE.loss },
          ].map((r) => (
            <div key={r.label} className="grid grid-cols-[4rem_1fr_2.5rem] items-center gap-2 text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <Track value={(Math.abs(r.v) / maxAbs) * 100} color={r.color} className="h-2" />
              <span className="text-right font-medium tabular-nums">{r.v > 0 ? "+" : ""}{r.v}R</span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "split") {
    return (
      <W>
        <Head icon={Sigma} value={exp} tone="profit" label="Per trade" right={`${R_STATS.winRate}% win`} />
        <div className="flex h-3 gap-1">
          <span className="r-bar" style={{ flex: R_STATS.winRate, background: TONE.profit }} />
          <span className="r-bar" style={{ flex: 100 - R_STATS.winRate, background: TONE.loss }} />
        </div>
        <div className="mt-auto flex justify-between text-xs tabular-nums">
          <span className="text-profit">Wins avg +{R_STATS.avgWin}R</span>
          <span className="text-loss">Losses avg {R_STATS.avgLoss}R</span>
        </div>
      </W>
    )
  }

  const max = Math.max(...R_BINS.map((b) => b.n))
  return (
    <W>
      <Head icon={Sigma} value={exp} tone="profit" label="Expectancy" right={`${total} trades`} />
      <div className="relative flex flex-1 items-end gap-[min(5%,5px)]" onPointerLeave={() => setHover(undefined)}>
        {R_BINS.map((b, i) => (
          <div key={b.r} className="relative h-full flex-1" onPointerEnter={() => setHover(i)}>
            <span
              className="r-bar absolute inset-x-0 bottom-0 transition-opacity"
              style={{ height: `${(b.n / max) * 100}%`, background: b.r < 0 ? TONE.loss : b.r === 0 ? "var(--muted-foreground)" : TONE.profit, opacity: hover !== undefined && hover !== i ? 0.35 : 1 }}
            />
          </div>
        ))}
        {hover !== undefined && (
          <Tip x={((hover + 0.5) / R_BINS.length) * 100} y={100 - (R_BINS[hover].n / max) * 100} label={`${R_BINS[hover].r > 0 ? "+" : ""}${R_BINS[hover].r}R`} value={`${R_BINS[hover].n} trades`} />
        )}
      </div>
      <div className="flex gap-[min(5%,5px)]">
        {R_BINS.map((b) => (
          <Caps key={b.r} className="flex-1 text-center">
            {b.r > 0 ? `+${b.r}` : b.r}
          </Caps>
        ))}
      </div>
    </W>
  )
}
