"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const STYLE = { bars: "0", candles: "1", line: "2" } as const

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
    el.innerHTML = ""
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
    const t = setTimeout(() => el.append(inner, script), 0)
    return () => {
      clearTimeout(t)
      el.innerHTML = ""
    }
  }, [widget, json])

  return (
    <div className={cn("relative min-h-0 overflow-hidden", className)}>
      <div ref={box} className="tradingview-widget-container size-full" />
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
