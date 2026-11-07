"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const STYLE = { bars: "0", candles: "1", line: "2" } as const

/** Candles for the stand-in chart: the same symbol always draws the same ones. */
function candlesOf(seed: string, n = 40) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const rnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296)
  let p = 50
  return Array.from({ length: n }, () => {
    const o = p
    p = Math.min(85, Math.max(15, o + (rnd() - 0.46) * 12))
    return { o, c: p, hi: Math.max(o, p) + rnd() * 6, lo: Math.min(o, p) - rnd() * 6 }
  })
}

/**
 * What sits behind a TradingView widget: a quiet candle chart, so the box is never an empty grey block while the widget
 * loads, when it is blocked or when there is no connection. The widget paints over it once it is there.
 */
function StandInChart({ seed }: { seed: string }) {
  const bars = candlesOf(seed)
  const step = 100 / bars.length
  const y = (v: number) => 100 - v
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
      {[20, 40, 60, 80].map((g) => (
        <line key={g} x1="0" x2="100" y1={g} y2={g} stroke="currentColor" strokeOpacity="0.07" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
      ))}
      {bars.map((b, i) => {
        const x = step * i + step / 2
        const up = b.c >= b.o
        const col = up ? "var(--profit)" : "var(--loss)"
        return (
          <g key={i} opacity="0.55">
            <line x1={x} x2={x} y1={y(b.hi)} y2={y(b.lo)} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <rect x={x - step * 0.3} y={y(Math.max(b.o, b.c))} width={step * 0.6} height={Math.max(Math.abs(b.c - b.o), 0.8)} fill={col} />
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Embeds one of TradingView's widgets. Charting on the platform is the
 * TradingView integration (PRD feature 10): every chart, in Charts, the
 * journal, lessons and coach feedback, is a TradingView chart.
 *
 * The prototype uses the free widgets. Which TradingView product the real
 * build uses (widgets, Advanced Charts library or Trading Platform) is an
 * open question in the PRD addendum: only the library lets us draw the
 * journal's entry, exit, stop and target and save drawings per student.
 */
function TradingViewEmbed({ widget, config, className }: { widget: string; config: Record<string, unknown>; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const json = JSON.stringify(config)

  useEffect(() => {
    const el = box.current
    if (!el) return
    // Each run gets its own wrapper. TradingView's script looks up its parent when
    // it runs, which can be after this effect was cleaned up (symbol change, leaving
    // the page): the wrapper is detached as a whole, so that parent still exists.
    const run = document.createElement("div")
    run.style.height = "100%"
    run.style.width = "100%"
    const inner = document.createElement("div")
    inner.className = "tradingview-widget-container__widget"
    inner.style.height = "100%"
    inner.style.width = "100%"
    const script = document.createElement("script")
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`
    script.async = true
    script.type = "text/javascript"
    script.innerHTML = json
    script.onerror = () => setFailed(true)
    // Wait a tick: TradingView's script reads its own parent node when it runs,
    // so it must not be removed again right away (React's dev double-mount).
    const t = setTimeout(() => {
      run.append(inner, script)
      el.replaceChildren(run)
    }, 0)
    return () => {
      clearTimeout(t)
      run.remove()
    }
  }, [widget, json])

  return (
    <div className={cn("relative min-h-0 overflow-hidden", className)}>
      <StandInChart seed={String(config.symbol ?? widget)} />
      <div ref={box} className="tradingview-widget-container relative size-full" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          The TradingView chart couldn&apos;t load. Check the internet connection.
        </div>
      )}
    </div>
  )
}

/** TradingView's full chart: drawing tools, indicators, symbol search. */
export function TradingViewChart({
  symbol,
  interval = "5",
  style = "candles",
  studies = [],
  watchlist,
  dark,
  background,
  className,
  sideToolbar = true,
  symbolChange = true,
}: {
  symbol: string
  interval?: string
  style?: keyof typeof STYLE
  studies?: string[]
  watchlist?: string[]
  dark: boolean
  /** The platform's own background, so the chart sits in the coach's look. */
  background?: string
  className?: string
  sideToolbar?: boolean
  symbolChange?: boolean
}) {
  return (
    <TradingViewEmbed
      widget="advanced-chart"
      className={className}
      config={{
        autosize: true,
        symbol,
        interval,
        timezone: "Europe/Zurich",
        theme: dark ? "dark" : "light",
        style: STYLE[style],
        locale: "en",
        backgroundColor: background,
        gridColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        hide_side_toolbar: !sideToolbar,
        allow_symbol_change: symbolChange,
        save_image: false,
        calendar: false,
        studies,
        ...(watchlist?.length ? { watchlist } : {}),
        support_host: "https://www.tradingview.com",
      }}
    />
  )
}

/** TradingView's small symbol overview, for cards. */
export function TradingViewMini({ symbol, dark, className }: { symbol: string; dark: boolean; className?: string }) {
  return (
    <TradingViewEmbed
      widget="mini-symbol-overview"
      className={className}
      config={{ symbol, width: "100%", height: "100%", locale: "en", dateRange: "1M", colorTheme: dark ? "dark" : "light", isTransparent: true, autosize: true }}
    />
  )
}
