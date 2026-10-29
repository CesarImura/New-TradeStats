"use client"

import { useState } from "react"
import { Link2, ShieldAlert } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ACCOUNT } from "@/lib/data/sample"
import { Axis, Chip, Donut, DonutFigure, GREY, GridLines, Label, Legend, Num, RING, RING_BODY, Rule, ShareRows, TickBar, useFigureFont, WCard } from "./instrument"
import { ACCENT, AreaFill, Drop, SPLIT, useMore } from "./kit"
import { BleedArea, HeroCard } from "./layouts"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`
const neg = (n: number) => `−€${Math.abs(Math.round(n)).toLocaleString("en")}`

function ConnectBroker() {
  return <WidgetEmpty icon={Link2} title="Connect your broker" text="This fills in from your own trades." action={<Button size="sm">Connect</Button>} />
}

// ---------- Risk limits (drawdown)

/** Today on the account: the daily loss limit, what is used, the last hour, trades against the cap. */
const TODAY = { limit: 500, used: 281, lastHour: -94, trades: 3, maxTrades: 4 }

/** Balance as a step line on hairline gridlines, the account's floor as a dashed loss line where it really is. */
function FloorChart({ values, floor }: { values: number[]; floor: number }) {
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
        <GridLines />
        <AreaFill d={`${path} V${fy} H0 Z`} />
        <line x1={0} x2={300} y1={fy} y2={fy} stroke="var(--loss)" strokeWidth={1.2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        <path d={path} fill="none" stroke={ACCENT} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-0 flex">
        {values.map((_, i) => (
          <span key={i} className="flex-1" onPointerEnter={() => setHover(i)} />
        ))}
      </div>
      {/* Gives way to the hover label when the two would meet. */}
      <span
        className={cn(
          "absolute right-0 -translate-y-full pb-0.5 text-[0.6875rem] leading-4 text-loss tabular-nums transition-opacity duration-150",
          hover !== undefined && Math.abs(y(values[at]) - fy) < 34 && "opacity-0",
        )}
        style={{ top: `${(fy / 110) * 100}%`, fontFamily: font }}
      >
        Floor {euro(floor)}
      </span>
      <span
        className="pointer-events-none absolute size-2 -translate-1/2 rounded-full border-[1.5px] bg-card"
        style={{ left: `${((at + 0.5) / n) * 100}%`, top: `${(y(values[at]) / 110) * 100}%`, borderColor: ACCENT }}
      />
      {/* On hover only, like every chart: at rest the dot marks today. It opens away from the nearer edge, so a wide (mono) figure never runs out of the card. */}
      {hover !== undefined && (
        <span
          className={cn(
            "pointer-events-none absolute rounded-[min(var(--radius),4px)] border bg-popover px-1.5 py-0.5 text-popover-foreground shadow-sm text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums",
            y(values[at]) < 33 ? "translate-y-2" : "-translate-y-[calc(100%+8px)]",
          )}
          style={{ ...((at + 0.5) / n > 0.5 ? { right: `${(1 - (at + 0.5) / n) * 100}%` } : { left: `${((at + 0.5) / n) * 100}%` }), top: `${(y(values[at]) / 110) * 100}%`, fontFamily: font }}
        >
          Day {at + 1} · {euro(values[at])}
        </span>
      )}
    </div>
  )
}

/** One limit as a thin line: label, used / allowed, a tick bar. */
function LimitLine({ label, used, limit, color = GREY[1] }: { label: string; used: number; limit: number; color?: string }) {
  const font = useFigureFont()
  return (
    <div className="grid shrink-0 gap-1">
      <div className="flex min-w-0 items-baseline gap-2 text-[0.8125rem] leading-5">
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 tabular-nums" style={{ fontFamily: font }}>
          {euro(used)} <span className="text-muted-foreground">/ {euro(limit)}</span>
        </span>
      </div>
      <TickBar value={used} max={limit} segments={40} height={6} color={color} />
    </div>
  )
}

/** Risk limits: gauge (a ring of the max drawdown used), bars (today's loss limit), curve (balance above its floor). */
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

  if (variant === "hero") {
    return (
      <HeroCard
        title={`Risk limits · ${ACCOUNT.name}`}
        chip={<Chip tone={ddPct > 75 ? "loss" : "accent"}>{pctText(ddPct)} used</Chip>}
        label="Left before the floor"
        value={euro(left)}
        delta={standard ? `${neg(dd)} from peak` : undefined}
        deltaTone="loss"
        line={standard ? `The account fails below ${euro(floor)}. Today you've used ${euro(TODAY.used)} of your ${euro(TODAY.limit)} daily limit.` : undefined}
        stats={
          detailed
            ? [
                { label: "Balance", value: euro(ACCOUNT.balance) },
                { label: "Today left", value: euro(TODAY.limit - TODAY.used), tone: "accent" },
                { label: "Trades", value: `${TODAY.trades}/${TODAY.maxTrades}` },
              ]
            : undefined
        }
        foot={standard ? <BleedArea values={ACCOUNT.history} floor={floor} /> : undefined}
      />
    )
  }

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
        <Drop level={2}>
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
        </Drop>
        <Drop level={3}>
          {detailed && (
            <>
              <LimitLine label={`Max drawdown · floor ${euro(floor)}`} used={dd} limit={ACCOUNT.maxDrawdown} />
              <Legend
                className="shrink-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5"
                items={[
                  { label: "Balance", value: euro(ACCOUNT.balance) },
                  { label: "Peak", value: euro(ACCOUNT.peak) },
                ]}
              />
            </>
          )}
        </Drop>
      </WCard>
    )
  }

  if (variant === "curve") {
    const days = ACCOUNT.history.length
    return (
      <WCard icon={ShieldAlert} title="Risk limits" meta={`${ACCOUNT.name} · last ${days} days · floor ${euro(floor)}`} chip={<Chip tone="neutral">{euro(left)} to floor</Chip>} bodyClassName={SPLIT}>
        <Num value={euro(ACCOUNT.balance)} delta={`${signed(ACCOUNT.balance - ACCOUNT.start)} since start`} deltaTone={ACCOUNT.balance >= ACCOUNT.start ? "profit" : "loss"} />
        <div data-main className="flex min-h-min flex-1 flex-col">
          <FloorChart values={ACCOUNT.history} floor={floor} />
        </div>
        <Drop level={2}>
          {standard && (
            <Legend
              className="shrink-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5"
              items={[
                { color: ACCENT, label: "Balance", value: euro(ACCOUNT.balance) },
                { color: "var(--loss)", label: "Loss floor", value: euro(floor) },
              ]}
            />
          )}
        </Drop>
        <Drop level={3}>
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
        </Drop>
      </WCard>
    )
  }

  // gauge: the max drawdown used
  return (
    <WCard
      icon={ShieldAlert}
      title="Risk limits"
      meta={`${ACCOUNT.name} · max drawdown ${euro(ACCOUNT.maxDrawdown)}`}
      chip={<Chip tone={ddPct > 75 ? "loss" : "accent"}>{pctText(ddPct)} used</Chip>}
      // A ring of the drawdown used, the room left in its middle, and the limits beside it (stacked in a tall, narrow cell).
      bodyClassName={RING_BODY}
    >
      <Donut className={RING} total={ACCOUNT.maxDrawdown} parts={[{ value: dd, color: ddPct > 75 ? "var(--loss)" : ACCENT }]} label={`${euro(left)} left before the floor`}>
        <DonutFigure value={euro(left)} caption="left before the floor" />
      </Donut>
      <Drop level={2}>
        {standard && (
          <ShareRows
            className="min-w-0 flex-1"
            rows={[
              { label: "Down from peak", value: euro(dd), share: dd / ACCOUNT.maxDrawdown, on: true },
              { label: "Today", value: `${euro(TODAY.used)} / ${euro(TODAY.limit)}`, share: TODAY.used / TODAY.limit, tone: TODAY.used / TODAY.limit > 0.75 ? ("loss" as const) : undefined },
              ...(detailed ? [{ label: "Trades today", value: `${TODAY.trades} of ${TODAY.maxTrades}`, share: TODAY.trades / TODAY.maxTrades }] : []),
            ]}
          />
        )}
      </Drop>
    </WCard>
  )
}
