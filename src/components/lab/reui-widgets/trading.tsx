"use client"

import { useState } from "react"
import { Link2, ShieldAlert } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ACCOUNT } from "@/lib/data/sample"
import { Axis, Chip, FitGauge, GREY, GridLines, Label, Legend, Num, Rule, TickBar, useFigureFont, WCard } from "./instrument"
import { ACCENT, Drop, SPLIT, useMore } from "./kit"
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
        <path d={`${path} V${fy} H0 Z`} fill={ACCENT} opacity={0.05} />
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

/** Risk limits: gauge (share of the max drawdown used), bars (today's loss limit), curve (balance above its floor). */
export function Drawdown({ variant = "gauge" }: WidgetProps) {
  const empty = useEmpty()
  const font = useFigureFont()
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
      // Wide and short: the gauge and its figures side by side as one centred group (not pushed to opposite edges).
      bodyClassName="[@container_card_(min-aspect-ratio:2/1)]:flex-row [@container_card_(min-aspect-ratio:2/1)]:items-center [@container_card_(min-aspect-ratio:2/1)]:justify-center [@container_card_(min-aspect-ratio:2/1)]:gap-[clamp(1.5rem,5cqw,4rem)]"
    >
      <FitGauge
        value={dd}
        max={ACCOUNT.maxDrawdown}
        className="[@container_card_(min-aspect-ratio:2/1)]:h-full [@container_card_(min-aspect-ratio:2/1)]:flex-none [@container_card_(min-aspect-ratio:2/1)]:w-[min(46%,26rem,max(calc((100cqh-6.5rem)*1.15),min(calc((100cqh-6.5rem)*1.8),17rem)))]"
      >
        {/* The figure and its caption scale with the gauge (cqw of the gauge), so a large gauge isn't a small number in a big arc. */}
        <span className="font-heading text-[clamp(1.25rem,12cqw,3.5rem)] leading-none font-medium tracking-[-0.02em] tabular-nums" style={{ fontFamily: font }}>
          {euro(left)}
        </span>
        <Label className="text-[clamp(0.6875rem,3.6cqw,1rem)] leading-tight">left before the floor</Label>
      </FitGauge>
      {/* Beside the gauge the legend reads at body size with room between its rows, and stays narrow so each value sits near its name. */}
      <div className="grid shrink-0 gap-3 [@container_card_(min-aspect-ratio:2/1)]:w-[min(36%,15rem)] [@container_card_(min-aspect-ratio:2/1)]:content-center [@container_card_(min-aspect-ratio:2/1)]:[&_[data-legend]]:gap-3 [@container_card_(min-aspect-ratio:2/1)]:[&_[data-legend]>div]:text-sm [@container_card_(min-aspect-ratio:2/1)]:[&_[data-legend]>div]:leading-6">
        <Drop level={2}>
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
        </Drop>
        <Drop level={3}>
          {detailed && (
            <>
              <Rule />
              <LimitLine label="Daily loss limit" used={TODAY.used} limit={TODAY.limit} />
              <Legend className="shrink-0" items={[{ label: "Trades today", value: `${TODAY.trades} of ${TODAY.maxTrades} max` }]} />
            </>
          )}
        </Drop>
      </div>
    </WCard>
  )
}
