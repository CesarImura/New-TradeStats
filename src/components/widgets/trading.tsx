"use client"

import { useId, useState } from "react"
import { Link2, ShieldAlert } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ACCOUNT } from "@/lib/data/sample"
import { Axis, Chip, GREY, Label, Legend, Num, Rule, TickBar, TickGauge, WCard, useFigureFont } from "./instrument"
import { ACCENT, useMore } from "./kit"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`
const neg = (n: number) => `−€${Math.abs(Math.round(n)).toLocaleString("en")}`

function ConnectBroker() {
  return <WidgetEmpty icon={Link2} title="Connect your broker" text="This fills in from your own trades." action={<Button size="sm">Connect</Button>} />
}

// ---------- Risk limits (drawdown)

/** Today on the account: the daily loss limit, what is used, the last hour, trades against the cap. */
const TODAY = { limit: 500, used: 281, lastHour: -94, trades: 3, maxTrades: 4 }

/** A gauge that fits whatever height the card leaves it (size container). */
function FitGauge({ value, max, children }: { value: number; max: number; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-20 flex-1 items-end justify-center [container-type:size]">
      <TickGauge value={value} max={max} className="w-[min(100cqw,189cqh)] max-w-80">
        {children}
      </TickGauge>
    </div>
  )
}

/** Balance as a step line on a dotted grid, the account's floor as a dashed loss line where it really is. */
function FloorChart({ values, floor }: { values: number[]; floor: number }) {
  const id = useId()
  const font = useFigureFont()
  const [hover, setHover] = useState<number>()
  const hi = Math.max(...values)
  const lo = Math.min(floor, ...values)
  const span = hi - lo || 1
  const n = values.length
  const x = (i: number) => (i / n) * 300
  const y = (v: number) => 8 + ((hi - v) / span) * 88
  const path = values.map((v, i) => `${i ? "H" + x(i).toFixed(1) + " V" : "M0 "}${y(v).toFixed(1)}`).join(" ") + " H300"
  const at = hover ?? n - 1
  const fy = y(floor)
  return (
    <div className="relative min-h-14 flex-1" onPointerLeave={() => setHover(undefined)}>
      <svg viewBox="0 0 300 110" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <pattern id={`dots${id}`} width="15" height="15" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="var(--foreground)" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="300" height="110" fill={`url(#dots${id})`} />
        <path d={`${path} V${fy} H0 Z`} fill={ACCENT} opacity={0.08} />
        <line x1={0} x2={300} y1={fy} y2={fy} stroke="var(--loss)" strokeWidth={1.2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        <path d={path} fill="none" stroke={ACCENT} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-0 flex">
        {values.map((_, i) => (
          <span key={i} className="flex-1" onPointerEnter={() => setHover(i)} />
        ))}
      </div>
      <span className="absolute right-0 -translate-y-full pb-0.5 text-[0.6875rem] leading-4 text-loss tabular-nums" style={{ top: `${(fy / 110) * 100}%`, fontFamily: font }}>
        Floor {euro(floor)}
      </span>
      <span
        className="pointer-events-none absolute size-2 -translate-1/2 rounded-full border-[1.5px] bg-card"
        style={{ left: `${((at + 0.5) / n) * 100}%`, top: `${(y(values[at]) / 110) * 100}%`, borderColor: ACCENT }}
      />
      <span
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-[min(var(--radius),4px)] bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums"
        style={{ left: `${Math.min(86, Math.max(14, ((at + 0.5) / n) * 100))}%`, top: `${(y(values[at]) / 110) * 100}%`, fontFamily: font }}
      >
        Day {at + 1} · {euro(values[at])}
      </span>
    </div>
  )
}

/** One limit as a thin line: label, used / allowed, a tick bar. */
function LimitLine({ label, used, limit, color = GREY[1] }: { label: string; used: number; limit: number; color?: string }) {
  const font = useFigureFont()
  return (
    <div className="grid shrink-0 gap-1">
      <div className="flex min-w-0 items-baseline gap-2 text-xs leading-5">
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 tabular-nums" style={{ fontFamily: font }}>
          {euro(used)} <span className="text-muted-foreground">/ {euro(limit)}</span>
        </span>
      </div>
      <TickBar value={used} max={limit} segments={40} height={6} color={color} />
    </div>
  )
}

/** Risk limits: gauge (share of the max drawdown used), bars (today's loss limit), curve (balance above its floor). */
export function Drawdown({ variant = "gauge" }: WidgetProps) {
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <ConnectBroker />
  const dd = ACCOUNT.peak - ACCOUNT.balance
  const left = ACCOUNT.maxDrawdown - dd
  const ddPct = (dd / ACCOUNT.maxDrawdown) * 100
  const floor = ACCOUNT.peak - ACCOUNT.maxDrawdown
  const dayPct = (TODAY.used / TODAY.limit) * 100
  const pctText = (p: number) => `${p.toFixed(1)}%`

  if (variant === "bars") {
    const q = TODAY.limit / 4
    return (
      <WCard crumb="Risk" title="Daily loss limit" chip={<Chip tone={dayPct > 85 ? "loss" : "accent"}>{pctText(dayPct)}</Chip>}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <Label>Used today</Label>
            <Num value={euro(TODAY.used)} delta={`${neg(TODAY.lastHour)} last hr`} deltaTone="loss" />
          </div>
          <div className="grid shrink-0 justify-items-end gap-1 text-right">
            <Label>Left</Label>
            <Num value={euro(TODAY.limit - TODAY.used)} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <TickBar value={TODAY.used} max={TODAY.limit} />
          <Axis labels={[0, q, q * 2, q * 3, TODAY.limit].map(euro)} />
        </div>
        {standard && (
          <>
            <Rule className="mt-auto" />
            <Legend
              className="shrink-0"
              items={[
                { label: <Label>Trades today</Label>, value: <Chip tone="neutral">{`${TODAY.trades} of ${TODAY.maxTrades} max`}</Chip> },
                { label: <Label>Max drawdown</Label>, value: `${euro(dd)} / ${euro(ACCOUNT.maxDrawdown)}` },
              ]}
            />
          </>
        )}
        {detailed && (
          <>
            <LimitLine label={`Max drawdown · floor ${euro(floor)}`} used={dd} limit={ACCOUNT.maxDrawdown} />
            <Legend
              className="shrink-0 @[20rem]:grid-cols-2 @[20rem]:gap-x-5"
              items={[
                { label: "Balance", value: euro(ACCOUNT.balance) },
                { label: "Peak", value: euro(ACCOUNT.peak) },
              ]}
            />
          </>
        )}
      </WCard>
    )
  }

  if (variant === "curve") {
    const days = ACCOUNT.history.length
    return (
      <WCard icon={ShieldAlert} title="Risk limits" meta={`${ACCOUNT.name} · last ${days} days · floor ${euro(floor)}`} chip={<Chip tone="neutral">{euro(left)} to floor</Chip>}>
        <Num value={euro(ACCOUNT.balance)} delta={`${signed(ACCOUNT.balance - ACCOUNT.start)} since start`} deltaTone={ACCOUNT.balance >= ACCOUNT.start ? "profit" : "loss"} />
        <FloorChart values={ACCOUNT.history} floor={floor} />
        {standard && (
          <Legend
            className="shrink-0 @[20rem]:grid-cols-2 @[20rem]:gap-x-5"
            items={[
              { color: ACCENT, label: "Balance", value: euro(ACCOUNT.balance) },
              { color: "var(--loss)", label: "Loss floor", value: euro(floor) },
            ]}
          />
        )}
        {detailed && (
          <>
            <Rule />
            <Legend
              className="shrink-0"
              items={[
                { label: "Peak", value: euro(ACCOUNT.peak) },
                { label: "Down from peak", value: neg(dd), valueTone: "loss" },
                { label: "Today", value: `${neg(TODAY.used)} of ${euro(TODAY.limit)}`, valueTone: "loss" },
              ]}
            />
          </>
        )}
      </WCard>
    )
  }

  // gauge: the max drawdown used
  return (
    <WCard icon={ShieldAlert} title="Risk limits" meta={`${ACCOUNT.name} · max drawdown ${euro(ACCOUNT.maxDrawdown)}`} chip={<Chip tone={ddPct > 75 ? "loss" : "accent"}>{pctText(ddPct)} used</Chip>}>
      <FitGauge value={dd} max={ACCOUNT.maxDrawdown}>
        <Num value={euro(left)} className="justify-center" />
        <Label>left before the floor</Label>
      </FitGauge>
      {standard && (
        <Legend
          className="shrink-0"
          items={[
            { color: ACCENT, label: "Down from peak", value: euro(dd) },
            { color: GREY[2], label: "Room to floor", value: euro(left) },
            ...(detailed ? [] : [{ color: GREY[0], label: "Today", value: `${euro(TODAY.used)} / ${euro(TODAY.limit)}` }]),
          ]}
        />
      )}
      {detailed && (
        <>
          <Rule />
          <LimitLine label="Daily loss limit" used={TODAY.used} limit={TODAY.limit} />
          <Legend className="shrink-0" items={[{ label: "Trades today", value: `${TODAY.trades} of ${TODAY.maxTrades} max` }]} />
        </>
      )}
    </WCard>
  )
}
