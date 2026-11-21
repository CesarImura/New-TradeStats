"use client"

import { useMemo, useState } from "react"
import { Bell, BarChart3, Camera, ChevronDown, Crosshair, LineChart, Lock, Maximize, Minus, MoreHorizontal, Pencil, Pin, Plus, Settings2, Square, Trash2 } from "@/components/icons"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { CoachChart } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { SlideTrack } from "@/components/admin/ui/slide-thumb"

/**
 * Charts · 01 Live chart (Figma Admin v2, 1485:102744): a charting workspace. Drawing tools on the left, a toolbar with the
 * symbol and timeframes, candles with volume and the coach's levels in the middle, and on the right the watchlist,
 * the charts the coach marked up and the levels on this chart. Prices are sample data, steady per symbol and timeframe.
 */
const WATCH = [
  { k: "NQ", name: "Nasdaq 100 futures", price: 21312, chg: 0.84, dec: 0 },
  { k: "ES", name: "S&P 500 futures", price: 6142.25, chg: 0.41, dec: 2 },
  { k: "CL", name: "Crude oil futures", price: 71.84, chg: -0.62, dec: 2 },
  { k: "EURUSD", name: "Euro / US dollar", price: 1.0892, chg: 0.12, dec: 4 },
  { k: "XAUUSD", name: "Gold spot", price: 2641.3, chg: -0.28, dec: 2 },
  { k: "BTCUSD", name: "Bitcoin", price: 91480, chg: 1.92, dec: 0 },
] as const
type Sym = (typeof WATCH)[number]
const FRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"] as const
const TOOLS = [Crosshair, LineChart, Minus, Square, Pencil, Settings2] as const
const LEVELS = [
  { label: "Weekly high", role: "Resistance", off: 0.0079, tone: "danger" },
  { label: "Gap fill", role: "Target", off: -0.0076, tone: "muted" },
  { label: "Value area low", role: "Support", off: -0.0184, tone: "success" },
] as const

const fmt = (n: number, dec: number) => n.toLocaleString("en", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/,/g, " ")

function useCandles(sym: Sym, frame: string) {
  return useMemo(() => {
    let seed = [...`${sym.k}${frame}`].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 4294967296, 11)
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
    const step = sym.price * 0.0016
    let p = sym.price * 0.972
    const out: { o: number; c: number; h: number; l: number; v: number }[] = []
    for (let i = 0; i < 64; i++) {
      const o = p
      p = o + (rnd() - 0.42) * step * 2 + (sym.price - o) * 0.035
      out.push({ o, c: p, h: Math.max(o, p) + rnd() * step, l: Math.min(o, p) - rnd() * step, v: 0.2 + rnd() * 0.8 })
    }
    const shift = sym.price - out[out.length - 1]!.c
    return out.map((c) => ({ ...c, o: c.o + shift, c: c.c + shift, h: c.h + shift, l: c.l + shift }))
  }, [sym, frame])
}

export function ChartWorkspace({ charts, onPin, onArchive, onNew }: { charts: CoachChart[]; onPin: (id: string) => void; onArchive: (id: string) => void; onNew: () => void }) {
  const [sym, setSym] = useState<Sym>(WATCH[0])
  const [frame, setFrame] = useState<(typeof FRAMES)[number]>("4h")
  const [coachLevels, setCoachLevels] = useState(true)
  const candles = useCandles(sym, frame)
  const levels = LEVELS.map((l) => ({ ...l, at: sym.price * (1 + l.off) }))
  const hi = Math.max(...candles.map((c) => c.h), ...levels.map((l) => l.at)) * 1.002
  const lo = Math.min(...candles.map((c) => c.l), ...levels.map((l) => l.at)) * 0.998
  const y = (v: number) => ((hi - v) / (hi - lo)) * 100
  const ticks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * (i + 0.5)) / 5)
  const days = ["Nov 9", "Nov 10", "Nov 11", "Nov 12", "Nov 13", "Nov 16", "Nov 17"]
  const tone = { danger: "border-a-border-danger bg-a-danger-soft text-a-danger", success: "border-[var(--admin-color-status-success)]/40 bg-a-success-soft text-a-success", muted: "border-a-border-strong bg-a-muted text-a-text-2" } as const

  return (
    <div className="grid overflow-hidden rounded-a-lg border border-a-border bg-a-panel lg:h-[704px] lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-a-border px-3 py-2">
          <button className="flex h-7 items-center gap-1.5 rounded-a-sm border border-a-border px-2 t-caption text-a-text outline-none hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus" aria-label="Symbol">
            <span className="text-a-text-3">Symbol</span>
            {sym.k}
            <ChevronDown className="size-3.5 text-a-text-3" aria-hidden />
          </button>
          <div
            role="radiogroup"
            aria-label="Timeframe"
            className="flex rounded-a-md border border-a-border-subtle bg-a-subtle p-0.5"
            onKeyDown={(e) => {
              if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
              e.preventDefault()
              const next = FRAMES[(FRAMES.indexOf(frame) + (e.key === "ArrowRight" ? 1 : FRAMES.length - 1)) % FRAMES.length]
              setFrame(next)
              ;(e.currentTarget.querySelectorAll("[role=radio]")[FRAMES.indexOf(next)] as HTMLElement | undefined)?.focus()
            }}
          >
            <SlideTrack
              items={FRAMES.map((f) => ({ key: f }))}
              activeKey={frame}
              rowClass="flex gap-0.5"
              thumbClass="rounded-a-sm bg-a-raised shadow-[inset_0_0_0_1px_var(--admin-color-border-default)]"
              renderItem={(f, layer, s) => {
                const item = "inline-flex h-6 items-center rounded-a-sm px-2 t-caption"
                if (layer === "base") return <span data-slide={f.key} aria-hidden className={cn(item, "transition-colors duration-150", s.pre ? "bg-a-raised text-a-text shadow-[inset_0_0_0_1px_var(--admin-color-border-default)]" : s.hovered ? "text-a-text" : "text-a-text-2")}>{f.key}</span>
                if (layer === "copy") return <span className={cn(item, "text-a-text")}>{f.key}</span>
                return <button type="button" role="radio" aria-checked={f.key === frame} tabIndex={f.key === frame ? 0 : -1} onClick={() => setFrame(f.key as typeof frame)} {...s.hover} className={cn(item, "text-transparent outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus")}>{f.key}</button>
              }}
            />
          </div>
          <button className="flex h-7 items-center gap-1.5 rounded-a-sm px-2 t-caption text-a-text-2 outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus"><BarChart3 className="size-4" aria-hidden /> Indicators</button>
          <button className="flex h-7 items-center gap-1.5 rounded-a-sm px-2 t-caption text-a-text-2 outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus"><LineChart className="size-4" aria-hidden /> Weekly levels <ChevronDown className="size-3.5" aria-hidden /></button>
          <div className="ml-auto flex items-center gap-1">
            <label className="mr-2 flex items-center gap-2 t-caption text-a-text-2">
              <Switch checked={coachLevels} onCheckedChange={setCoachLevels} aria-label="Coach levels" />
              Coach levels
            </label>
            {[Bell, Camera, Maximize].map((Icon, i) => <button key={i} aria-label={["Alert", "Snapshot", "Full screen"][i]} className="grid size-7 place-items-center rounded-a-sm text-a-text-2 outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus"><Icon className="size-4" aria-hidden /></button>)}
          </div>
        </div>
        <div className="relative flex min-h-[420px] flex-1">
          <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-a-border py-2" role="toolbar" aria-label="Drawing tools" aria-orientation="vertical">
            {TOOLS.map((Icon, i) => <button key={i} aria-label={["Cursor", "Trend line", "Horizontal line", "Rectangle", "Brush", "Measure"][i]} className={cn("grid size-8 place-items-center rounded-a-sm text-a-text-2 outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus", i === 0 && "bg-a-selected text-a-text")}><Icon className="size-4" aria-hidden /></button>)}
            <span className="flex-1" />
            {[Lock, Trash2].map((Icon, i) => <button key={i} aria-label={["Lock drawings", "Remove drawings"][i]} className="grid size-8 place-items-center rounded-a-sm text-a-text-3 outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus"><Icon className="size-4" aria-hidden /></button>)}
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="absolute inset-x-0 top-0 bottom-[22%]" role="img" aria-label={`${sym.k} ${frame} candles`}>
              {ticks.map((t) => <span key={t} aria-hidden className="absolute right-0 left-0 h-px bg-a-border-subtle" style={{ top: `${y(t)}%` }} />)}
              {candles.map((c, i) => {
                const up = c.c >= c.o
                const col = up ? "bg-a-success-fill" : "bg-a-danger-fill"
                return (
                  <span key={i} aria-hidden className="absolute" style={{ left: `${(i / candles.length) * 100 + 0.6}%`, width: `${100 / candles.length - 0.5}%`, top: `${y(c.h)}%`, height: `${y(c.l) - y(c.h)}%` }}>
                    <span className={cn("absolute left-1/2 h-full w-px -translate-x-1/2", col)} />
                    <span className={cn("absolute inset-x-[15%] min-h-px", col)} style={{ top: `${((c.h - Math.max(c.o, c.c)) / (c.h - c.l)) * 100}%`, height: `${(Math.abs(c.c - c.o) / (c.h - c.l)) * 100}%` }} />
                  </span>
                )
              })}
              {coachLevels && levels.map((l) => (
                <div key={l.label} className="absolute inset-x-0" style={{ top: `${y(l.at)}%` }}>
                  <span aria-hidden className={cn("absolute inset-x-0 border-t border-dashed", l.tone === "danger" ? "border-a-danger/50" : l.tone === "success" ? "border-a-success/50" : "border-a-border-active")} />
                  <span className={cn("absolute left-3 -translate-y-full rounded-a-xs border px-1.5 py-0.5 t-micro", tone[l.tone])}>{l.role} · {l.label}</span>
                </div>
              ))}
              <div className="absolute inset-x-0" style={{ top: `${y(sym.price)}%` }}><span aria-hidden className="absolute inset-x-0 border-t border-dotted border-a-border-active" /></div>
            </div>
            <div aria-hidden className="absolute inset-x-0 bottom-[6%] h-[16%]">
              {candles.map((c, i) => <span key={i} className={cn("absolute bottom-0 opacity-70", c.c >= c.o ? "bg-a-success-fill" : "bg-a-danger-fill")} style={{ left: `${(i / candles.length) * 100 + 0.6}%`, width: `${100 / candles.length - 0.5}%`, height: `${c.v * 55}%` }} />)}
            </div>
            <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-[6%] items-center justify-between px-6 t-micro text-a-text-3">{days.map((d) => <span key={d}>{d}</span>)}</div>
          </div>
          <div aria-hidden className="relative w-[60px] shrink-0 border-l border-a-border">
            <div className="absolute inset-x-0 top-0 bottom-[22%]">
              {ticks.map((t) => <span key={t} className="absolute right-2 -translate-y-1/2 t-micro text-a-text-3 tabular-nums" style={{ top: `${y(t)}%` }}>{fmt(t, sym.dec)}</span>)}
              {coachLevels && levels.map((l) => <span key={l.label} className={cn("absolute right-1 -translate-y-1/2 rounded-a-xs px-1 t-micro tabular-nums", l.tone === "danger" ? "bg-a-danger-soft text-a-danger" : l.tone === "success" ? "bg-a-success-soft text-a-success" : "bg-a-muted text-a-text-2")} style={{ top: `${y(l.at)}%` }}>{fmt(l.at, sym.dec)}</span>)}
              <span className="absolute right-1 -translate-y-1/2 rounded-a-xs bg-a-selected px-1 t-micro text-a-text tabular-nums" style={{ top: `${y(sym.price)}%` }}>{fmt(sym.price, sym.dec)}</span>
            </div>
          </div>
        </div>
      </div>

      <aside aria-label="Watchlist and charts" className="flex min-h-0 flex-col divide-y divide-a-border overflow-y-auto border-t border-a-border lg:border-t-0 lg:border-l">
        <section>
          <div className="flex h-9 items-center justify-between px-4 t-caption text-a-text-3">Watchlist <button aria-label="Add a symbol" className="grid size-6 place-items-center rounded-a-sm outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus"><Plus className="size-4" aria-hidden /></button></div>
          {WATCH.map((w) => (
            <button key={w.k} onClick={() => setSym(w)} aria-pressed={w.k === sym.k} className={cn("grid w-full grid-cols-[1fr_auto] gap-x-3 px-4 py-1.5 text-left outline-none transition-colors duration-300 ease-out hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-a-border-focus", w.k === sym.k && "bg-a-selected")}>
              <span className="t-body-m text-a-text">{w.k}</span>
              <span className="t-body-m text-a-text tabular-nums">{fmt(w.price, w.dec)}</span>
              <span className={cn("t-caption", w.k === sym.k ? "text-a-text-2" : "text-a-text-3")}>{w.name}</span>
              <span className={cn("t-caption tabular-nums", w.chg >= 0 ? "text-a-success" : "text-a-danger")}>{w.chg >= 0 ? "+" : ""}{w.chg.toFixed(2)}%</span>
            </button>
          ))}
        </section>
        <section>
          <div className="flex h-9 items-center justify-between px-4 t-caption text-a-text-3">Marked up by you <span>{charts.length} chart{charts.length === 1 ? "" : "s"}</span></div>
          {charts.length === 0 && <button onClick={onNew} className="px-4 py-3 text-left t-body-m text-a-text-2 outline-none hover:text-a-text">Mark up your first chart</button>}
          {charts.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-4 py-2 hover:bg-a-hover">
              <span className="grid size-4 shrink-0 place-items-center text-a-text-2">{c.pinned && <Pin className="size-3.5" aria-label="Pinned" />}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate t-body-m text-a-text">{c.title}</span>
                <span className="truncate t-caption text-a-text-3">{c.symbol.name} · {c.interval ?? "4h"} · {c.levels.length} levels</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<button aria-label={`Actions for ${c.title}`} className="grid size-6 place-items-center rounded-a-sm text-a-text-3 outline-none hover:bg-a-selected hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPin(c.id)}>{c.pinned ? "Unpin" : "Pin to the top"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(c.id)}>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </section>
        <section>
          <div className="flex h-9 items-center justify-between px-4 t-caption text-a-text-3">On this chart <span>{sym.k} · {frame}</span></div>
          {levels.map((l) => (
            <div key={l.label} className="flex items-center justify-between px-4 py-1.5">
              <div className="flex flex-col"><span className="t-body-m text-a-text">{l.label}</span><span className={cn("t-caption", l.tone === "danger" ? "text-a-danger" : l.tone === "success" ? "text-a-success" : "text-a-text-3")}>{l.role}</span></div>
              <span className="t-body-m text-a-text tabular-nums">{fmt(l.at, sym.dec)}</span>
            </div>
          ))}
        </section>
      </aside>
    </div>
  )
}
