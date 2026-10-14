"use client"

import { fmtPrice, tvSymbol, type Trade } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { TradingViewChart } from "./tradingview"

/**
 * A journal trade on TradingView: the symbol's chart with TradingView's own
 * drawing tools, and the trade's entry, exit, stop and target beside it.
 * With TradingView's Advanced Charts library these four lines and the
 * entry/exit markers are drawn on the chart itself (open question in the
 * PRD addendum); the free widget in the prototype can't do that.
 */
export function TradeChart({ trade: t, dark, background, className }: { trade: Trade; dark: boolean; background?: string; className?: string }) {
  const levels = [
    { label: "Target", v: t.target, cls: "text-[var(--profit)]" },
    { label: "Entry", v: t.entry, cls: "text-foreground" },
    { label: "Exit", v: t.exit, cls: t.r >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]" },
    { label: "Stop", v: t.stop, cls: "text-[var(--loss)]" },
  ]
  return (
    <div className={cn("grid overflow-hidden", className)}>
      <TradingViewChart symbol={tvSymbol(t.symbol)} interval="5" dark={dark} background={background} symbolChange={false} className="h-[340px]" />
      <div className="grid grid-cols-4 divide-x border-t text-sm">
        {levels.map((l) => (
          <div key={l.label} className="grid gap-0.5 px-3 py-2">
            <span className="text-xs text-muted-foreground">{l.label}</span>
            <span className={cn("tabular-nums", l.cls)}>{fmtPrice(l.v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
