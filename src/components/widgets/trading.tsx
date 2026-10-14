"use client"

import { useState } from "react"
import { Link2, ShieldAlert } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ACCOUNT } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, Big, Caps, Head, Stat, TYPE, Tip, Track, W, useMore } from "./kit"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`

function ConnectBroker() {
  return <WidgetEmpty icon={Link2} title="Connect your broker" text="This fills in from your own trades." action={<Button size="sm">Connect</Button>} />
}

// ---------- Risk limits (drawdown)

/** Neutral fill for bars that are not the widget's one accent. */
const NEUTRAL = "color-mix(in oklab, var(--foreground) 40%, transparent)"
const HAIR = "border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)]"

/** Half-dial: a thin muted track, the share used in the accent. Scales to fit its box. */
function Dial({ value, max }: { value: number; max: number }) {
  const pct = Math.min(1, Math.max(0, value / max))
  const r = 44
  const len = Math.PI * r
  const d = `M6,50 A${r},${r} 0 0 1 94,50`
  return (
    <svg viewBox="0 0 100 52" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 size-full" aria-hidden>
      <path d={d} fill="none" stroke="var(--muted)" strokeWidth={4} style={{ strokeLinecap: "var(--cap)" as never }} />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={4} strokeDasharray={len} strokeDashoffset={len * (1 - pct)} style={{ strokeLinecap: "var(--cap)" as never }} />
    </svg>
  )
}

/** Balance as a hairline, with the account's floor drawn where it really is. */
function FloorChart({ values, floor }: { values: number[]; floor: number }) {
  const [hover, setHover] = useState<number>()
  const hi = Math.max(...values)
  const lo = Math.min(floor, ...values)
  const pad = (hi - lo) * 0.08
  const y = (v: number) => 6 + ((hi - v) / (hi - lo + pad)) * 88
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, y(v)] as const)
  const line = pts.map(([x, py], i) => `${i ? "L" : "M"}${x},${py}`).join(" ")
  const [lx, ly] = pts[hover ?? pts.length - 1]
  const fy = y(floor)
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect()
    const t = Math.min(Math.max((e.clientX - b.left) / b.width, 0), 1)
    setHover(Math.round(t * (values.length - 1)))
  }
  return (
    <div className="relative min-h-12 flex-1 touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(undefined)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <line x1={0} x2={100} y1={fy} y2={fy} stroke="var(--loss)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity={0.7} />
        {hover !== undefined && <line x1={lx} x2={lx} y1={0} y2={100} stroke="var(--muted-foreground)" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />}
        <path d={line} fill="none" stroke={ACCENT} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ strokeLinejoin: "round", strokeLinecap: "var(--cap)" as never }} />
      </svg>
      <span className="r-dot absolute size-1.5 -translate-x-1/2 -translate-y-1/2" style={{ left: `${lx}%`, top: `${ly}%`, background: ACCENT, boxShadow: "0 0 0 2px var(--card)" }} />
      <span className="absolute right-0 -translate-y-full pb-0.5" style={{ top: `${fy}%` }}>
        <Caps className="text-loss">Limit {euro(floor)}</Caps>
      </span>
      {hover !== undefined && <Tip x={lx} y={ly} label={`Day ${hover + 1}`} value={euro(values[hover])} />}
    </div>
  )
}

/** One limit: what is used, out of what is allowed. */
function LimitRow({ label, used, limit, accent }: { label: string; used: number; limit: number; accent?: boolean }) {
  const p = (used / limit) * 100
  return (
    <div className="grid gap-1.5">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className={cn(TYPE.body, "truncate")}>{label}</span>
        <span className="ml-auto shrink-0 text-[0.8125rem] font-medium tabular-nums">{euro(used)}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">/ {euro(limit)}</span>
      </div>
      <Track value={p} color={accent ? ACCENT : NEUTRAL} className="h-1.5" />
    </div>
  )
}

/** Risk limits: gauge (share of the max drawdown used), bars (daily and max limits), curve (balance above its floor). */
export function Drawdown({ variant = "gauge" }: WidgetProps) {
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <ConnectBroker />
  const dd = ACCOUNT.peak - ACCOUNT.balance
  const left = ACCOUNT.maxDrawdown - dd
  const used = (dd / ACCOUNT.maxDrawdown) * 100
  const todayLoss = Math.max(0, -ACCOUNT.today)
  const todayUsed = (todayLoss / ACCOUNT.dailyLimit) * 100
  const floor = ACCOUNT.peak - ACCOUNT.maxDrawdown
  const danger = used > 75

  if (variant === "bars") {
    // The accent goes to whichever limit is closer to being hit.
    const ddFirst = used >= todayUsed
    return (
      <W>
        <Head icon={ShieldAlert} label="Risk limits" right={ACCOUNT.name} />
        <div className="grid min-h-0 flex-1 content-evenly gap-3">
          <LimitRow label="Max drawdown" used={dd} limit={ACCOUNT.maxDrawdown} accent={ddFirst} />
          {standard && <LimitRow label="Today" used={todayLoss} limit={ACCOUNT.dailyLimit} accent={!ddFirst} />}
        </div>
        {detailed && (
          <div className={cn("grid shrink-0 grid-cols-3 gap-3 border-t pt-3", HAIR)}>
            <Stat label="Balance" value={euro(ACCOUNT.balance)} />
            <Stat label="Peak" value={euro(ACCOUNT.peak)} />
            <Stat label="Floor" value={euro(floor)} />
          </div>
        )}
      </W>
    )
  }

  if (variant === "curve") {
    return (
      <W>
        <Head icon={ShieldAlert} label={ACCOUNT.name} right={`${euro(left)} to limit`} />
        <Big size="lg" value={euro(ACCOUNT.balance)} sub={`${signed(ACCOUNT.balance - ACCOUNT.start)} since start · ${euro(left)} above the limit`} />
        {standard && <FloorChart values={ACCOUNT.history} floor={floor} />}
        {detailed && (
          <div className={cn("grid shrink-0 grid-cols-3 gap-3 border-t pt-3", HAIR)}>
            <Stat label="Peak" value={euro(ACCOUNT.peak)} />
            <Stat label="Drawdown" value={euro(dd)} tone={danger ? "loss" : "fg"} />
            <Stat label="Today" value={signed(ACCOUNT.today)} tone={ACCOUNT.today >= 0 ? "profit" : "loss"} />
          </div>
        )}
      </W>
    )
  }

  // gauge
  return (
    <W>
      <Head icon={ShieldAlert} label="Drawdown" right={ACCOUNT.name} />
      <div className="relative min-h-16 flex-1">
        <Dial value={dd} max={ACCOUNT.maxDrawdown} />
        <div className="absolute inset-x-0 bottom-0 grid justify-items-center text-center">
          <Big value={<span className={danger ? "text-loss" : undefined}>{Math.round(used)}%</span>} sub="of max drawdown" />
        </div>
      </div>
      {standard && (
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{euro(dd)} down</span>
          <span className="text-foreground">{euro(left)} left</span>
        </div>
      )}
      {detailed && (
        <div className={cn("shrink-0 border-t pt-3", HAIR)}>
          <LimitRow label="Today" used={todayLoss} limit={ACCOUNT.dailyLimit} />
        </div>
      )}
    </W>
  )
}

// ---------- Win rate by setup


// ---------- R-multiple spread


