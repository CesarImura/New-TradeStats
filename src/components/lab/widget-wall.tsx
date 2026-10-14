"use client"

import Link from "next/link"
import { Component, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Check as CheckIcon, TriangleAlert } from "@/components/icons"
import { CoachContext } from "@/components/coach/coach-provider"
import { WidgetFrame } from "@/components/widgets/kit"
import { DETAILED_EXTRA_ROWS, WIDGETS, type WidgetDef } from "@/components/widgets/registry"
import { DataModeProvider, type DataMode } from "@/components/widgets/shared"
import { getDemoCoach } from "@/lib/data/coaches"
import { themeToCss } from "@/lib/theme/css"
import { BRANDED, type LabTheme } from "@/lib/theme/lab"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import type { Mode, WidgetStyle } from "@/lib/theme/types"
import { LIMITS, RULES, checkWidget, type RuleId, type RuleResult } from "@/lib/widgets/checks"
import { ROW_HEIGHT, type Detail, type Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"

const mono = "font-[family-name:var(--ff-plex-mono)] text-[0.7rem] uppercase tracking-[0.06em]"

/** The real grid: 12 columns of 80px on a 1136px page, 16px gaps, 56px rows. */
const COL_PX = 80
const GAP_PX = 16
const px = (cols: number) => cols * COL_PX + (cols - 1) * GAP_PX
const rowsPx = (h: number) => h * ROW_HEIGHT + (h - 1) * GAP_PX

/** The three widths each look is drawn at. */
const SIZES = [
  { id: "s", label: "Small", cols: (d: WidgetDef) => Math.min(4, Math.max(3, d.minW)) },
  { id: "m", label: "Medium", cols: () => 6 },
  { id: "l", label: "Large", cols: (d: WidgetDef) => (d.defaultW >= 8 ? d.defaultW : 8) },
] as const

/** The three templates in light and dark, then a few coach colours that push the engine hardest. */
const EXTREME_IDS = ["neon", "pastel", "yellow-light", "navy-dark", "black-brand", "gold", "cyan-pulse", "mixed"]
const THEMES: LabTheme[] = [
  ...TEMPLATE_IDS.flatMap((id) =>
    (["light", "dark"] as Mode[]).map((mode) => ({ id: `${id}-${mode}`, name: `${TEMPLATES[id].name} · ${mode}`, theme: { ...TEMPLATES[id].theme, mode } })),
  ),
  ...BRANDED.filter((t) => EXTREME_IDS.includes(t.id)),
]

const SCOPE = "wl-canvas"
const coach = getDemoCoach("northline")!
const LIBRARY = WIDGETS.filter((w) => !w.core)

type Result = RuleResult[] | "error"
const failsOf = (r: Result | undefined) => (r === "error" ? 1 : r ? r.filter((x) => !x.pass).length : 0)

/**
 * Widget wall (prototype only). Every library widget, in every look, at three
 * widths, in one coach theme at a time, each measured after render against the
 * widget rules (type size, contrast, brand coverage, overflow).
 */
export function WidgetWall() {
  const [themeId, setThemeId] = useState(THEMES[0].id)
  const [emphasis, setEmphasis] = useState<Emphasis>("accent")
  const [detail, setDetail] = useState<Detail>("standard")
  // Detailed widgets get extra rows in the builder too (see heightFor in the registry).
  const extra = detail === "detailed" ? DETAILED_EXTRA_ROWS : 0
  const [data, setData] = useState<DataMode>("sample")
  const [filter, setFilter] = useState("all")
  const [onlyProblems, setOnlyProblems] = useState(false)

  const lab = THEMES.find((t) => t.id === themeId)!
  // "template" = the style the theme itself has (each template has a default).
  const [wstyle, setWstyle] = useState<"template" | WidgetStyle>("template")
  const theme = useMemo(() => (wstyle === "template" ? lab.theme : { ...lab.theme, widgetStyle: wstyle }), [lab.theme, wstyle])
  const config = `${themeId}|${emphasis}|${detail}|${data}|${wstyle}`

  // Results by cell key; a cell reports after each measurement. Re-renders are batched.
  const results = useRef(new Map<string, Result>())
  const [res, setSnapshot] = useState<Map<string, Result>>(() => new Map())
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  const report = useCallback((key: string, r: Result) => {
    const prev = results.current.get(key)
    if (prev && JSON.stringify(prev) === JSON.stringify(r)) return
    results.current.set(key, r)
    if (!pending.current)
      pending.current = setTimeout(() => {
        pending.current = null
        setSnapshot(new Map(results.current))
      }, 60)
  }, [])

  const widgets = filter === "all" ? LIBRARY : LIBRARY.filter((w) => w.type === filter)
  const cells = widgets.flatMap((def) =>
    def.variants.flatMap((v) => SIZES.map((s) => ({ def, variant: v, size: s, key: `${config}|${def.type}|${v.value}|${s.id}` }))),
  )
  const measured = cells.filter((c) => res.has(c.key))
  const failing = measured.filter((c) => failsOf(res.get(c.key)) > 0)
  const issues = measured.reduce((n, c) => n + failsOf(res.get(c.key)), 0)
  const byRule = (id: RuleId) => measured.filter((c) => {
    const r = res.get(c.key)
    return r !== "error" && r?.some((x) => x.id === id && !x.pass)
  }).length
  const crashed = measured.filter((c) => res.get(c.key) === "error").length
  /** With "only problems", hide a cell once it is measured and clean; unknown cells still render so they get measured. */
  const hidden = (key: string) => onlyProblems && res.has(key) && failsOf(res.get(key)) === 0

  const ctx = useMemo(() => ({ coach, theme, base: "/c/northline", scope: `.${SCOPE}`, preview: false }), [theme])
  const star = emphasis === "star"

  return (
    <div className="ts-ui min-h-svh bg-[#0a0a0b] font-[family-name:var(--ff-plex)] text-[0.8125rem] text-[#f4f4f5]">
      <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, `.${SCOPE}`) }} />

      <header className="z-30 border-b border-[#2a2a2f] bg-[#0a0a0b]/95 backdrop-blur xl:sticky xl:top-0">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
          <div className="grid gap-0.5">
            <Link href="/lab" className={cn(mono, "text-white/50 hover:text-white")}>
              Prototype · Theme lab ·
            </Link>
            <h1 className="text-xl font-normal">Widget wall</h1>
          </div>
          <Seg label="Emphasis" value={emphasis} onChange={setEmphasis} options={[["quiet", "Quiet"], ["accent", "Accent"], ["star", "Star"]]} />
          <Seg label="Detail" value={detail} onChange={setDetail} options={[["compact", "Compact"], ["standard", "Standard"], ["detailed", "Detailed"]]} />
          <Seg label="Widget style" value={wstyle} onChange={setWstyle} options={[["template", "Template’s"], ["instrument", "Instrument"], ["soft", "Soft"], ["editorial", "Editorial"]]} />
          <Seg label="Data" value={data} onChange={setData} options={[["sample", "Sample"], ["empty", "Empty"]]} />
          <label className="flex items-center gap-2">
            <span className={cn(mono, "text-white/45")}>Widget</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 rounded-[4px] border border-[#4a4a52] bg-[#0e0e10] px-2 text-[0.8125rem] text-white outline-none focus:border-[#ff5500]"
            >
              <option value="all">All widgets ({LIBRARY.length})</option>
              {LIBRARY.map((w) => (
                <option key={w.type} value={w.type}>
                  {w.name} · {w.group}
                </option>
              ))}
            </select>
          </label>
          <label className="ml-auto flex items-center gap-2 text-white/70">
            <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} className="accent-[#ff5500]" />
            Only show problems
          </label>
        </div>

        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-1.5 border-t border-[#2a2a2f] px-5 py-2.5">
          <span className={cn(mono, "mr-2 text-white/45")}>Theme</span>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              title={t.note}
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] border px-2 py-1",
                t.id === themeId ? "border-[#ff5500] bg-[#222226] text-white" : "border-[#2a2a2f] text-white/55 hover:text-white",
              )}
            >
              <span className="size-2.5 rounded-full shadow-[0_0_0_1px_rgb(255_255_255/0.2)]" style={{ background: t.theme.primary }} />
              <span className={cn("size-2.5 rounded-full shadow-[0_0_0_1px_rgb(255_255_255/0.2)]", t.theme.mode === "dark" ? "bg-black" : "bg-white")} />
              {t.name}
            </button>
          ))}
        </div>

        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[#2a2a2f] px-5 py-2.5">
          <span className={cn("flex items-center gap-1.5 font-medium", issues ? "text-[#ff5500]" : "text-[#42be65]")}>
            {issues ? <TriangleAlert className="size-3.5" /> : <CheckIcon className="size-3.5" />}
            {issues} {issues === 1 ? "issue" : "issues"}
          </span>
          <span className={cn(mono, "text-white/45")}>
            {failing.length}/{measured.length} renders fail{measured.length < cells.length ? ` · measuring ${measured.length}/${cells.length}` : ""}
          </span>
          {RULES.map((r) => {
            const n = byRule(r.id)
            return (
              <span key={r.id} className={cn("flex items-center gap-1.5", n ? "text-white" : "text-white/35")}>
                <span className={cn("size-1.5 rounded-full", n ? "bg-[#ff5500]" : "bg-white/25")} />
                {r.label}
                <span className="tabular-nums text-white/50">{n ? `fails ${n}` : "ok"}</span>
              </span>
            )
          })}
          {crashed > 0 && <span className="text-[#fa4d56]">{crashed} crashed</span>}
          <span className="ml-auto text-white/35">
            Limits: type ≤ {LIMITS.maxFont}px ({LIMITS.maxFontStar}px on Star) · contrast {LIMITS.contrastSmall}:1, {LIMITS.contrastLarge}:1 from {LIMITS.largeTextPx}px · brand ≤{" "}
            {LIMITS.maxBrandShare * 100}% (not on Star) · no overflow
          </span>
        </div>
      </header>

      <CoachContext.Provider value={ctx}>
        <DataModeProvider value={data}>
          <main className="mx-auto flex max-w-[1800px] flex-col gap-8 px-5 py-6">
            {widgets.map((def) => {
              const rows = def.variants.filter((v) => SIZES.some((s) => !hidden(`${config}|${def.type}|${v.value}|${s.id}`)))
              if (!rows.length) return null
              return (
                <section key={def.type} className="flex flex-col gap-4">
                  <div className="flex items-baseline gap-3 border-b border-[#2a2a2f] pb-2">
                    <h2 className="text-base font-medium">{def.name}</h2>
                    <span className={cn(mono, "text-white/40")}>
                      {def.type} · {def.group} · default {def.defaultW} cols · min {def.minW}
                    </span>
                  </div>
                  {rows.map((v) => (
                    <div key={v.value} className="flex flex-col gap-2">
                      <span className={cn(mono, "text-white/55")}>
                        Look · {v.label} <span className="text-white/30">· {v.h + extra} rows</span>
                      </span>
                      <div className="flex flex-wrap items-start gap-4">
                        {SIZES.map((s) => {
                          const key = `${config}|${def.type}|${v.value}|${s.id}`
                          if (hidden(key)) return null
                          const cols = s.cols(def)
                          return (
                            <div key={s.id} className="flex flex-col gap-1.5" style={{ width: px(cols) + 24 }}>
                              <div
                                data-coach-scope
                                className={cn(SCOPE, theme.mode === "dark" ? "dark" : "light", "rounded-[4px] bg-background p-3 text-foreground shadow-[0_0_0_1px_#2a2a2f]")}
                                // Tailwind's font variables resolve at :root; re-point them so widgets use the coach's fonts.
                                style={
                                  {
                                    fontFamily: "var(--coach-font-body)",
                                    "--font-sans": "var(--coach-font-body)",
                                    "--font-heading": "var(--coach-font-heading)",
                                    "--font-label": "var(--coach-font-label)",
                                  } as React.CSSProperties
                                }
                              >
                                <Cell def={def} variant={v.value} emphasis={emphasis} detail={detail} width={px(cols)} height={rowsPx(v.h + extra)} cellKey={key} star={star} report={report} />
                              </div>
                              <Badge size={`${s.label} · ${cols} cols · ${px(cols)}×${rowsPx(v.h + extra)}`} result={res.get(key)} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </section>
              )
            })}
            {onlyProblems && measured.length === cells.length && failing.length === 0 && (
              <p className="py-16 text-center text-white/50">No problems in this theme and setting.</p>
            )}
          </main>
        </DataModeProvider>
      </CoachContext.Provider>

      <footer className="mx-auto flex max-w-[1800px] px-5 pb-10">
        <Link href="/lab" className={cn(mono, "flex items-center gap-1.5 text-white/50 hover:text-white")}>
          Back to the theme lab <ArrowRight className="size-3.5" />
        </Link>
      </footer>
    </div>
  )
}

function Seg<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(mono, "text-white/45")}>{label}</span>
      <div className="flex rounded-[4px] border border-[#2a2a2f] bg-[#161618] p-0.5">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)} className={cn("rounded-[3px] px-2.5 py-1", v === value ? "bg-[#f4f4f5] text-[#0a0a0b]" : "text-white/60 hover:text-white")}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Measuring hundreds of widgets at once would freeze the page, so cells queue
 * up and a few are measured per frame. A cell queued twice is measured once.
 */
const queue = new Map<HTMLElement, () => void>()
let frame = 0
const PER_FRAME = 8
function enqueue(el: HTMLElement, job: () => void) {
  queue.set(el, job)
  if (!frame) frame = requestAnimationFrame(drain)
}
function dequeue(el: HTMLElement) {
  queue.delete(el)
}
function drain() {
  frame = 0
  const batch = [...queue].slice(0, PER_FRAME)
  for (const [el, job] of batch) {
    queue.delete(el)
    job()
  }
  if (queue.size) frame = requestAnimationFrame(drain)
}

/** One widget at one size, measured after every render, resize or DOM change. */
function Cell({
  def,
  variant,
  emphasis,
  detail,
  width,
  height,
  cellKey,
  star,
  report,
}: {
  def: WidgetDef
  variant: string
  emphasis: Emphasis
  detail: Detail
  width: number
  height: number
  cellKey: string
  star: boolean
  report: (key: string, r: Result) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const job = () => {
      if (!el.isConnected || el.querySelector("[data-crashed]")) return
      const r = checkWidget(el, { star })
      if (r) report(cellKey, r)
    }
    const run = () => enqueue(el, job)
    run()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    const mo = new MutationObserver(run)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    document.fonts?.ready.then(run)
    const timers = [setTimeout(run, 600), setTimeout(run, 2000)]
    return () => {
      dequeue(el)
      ro.disconnect()
      mo.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [cellKey, star, report])

  const C = def.Component
  return (
    <div
      ref={ref}
      className="pointer-events-none relative flex flex-col overflow-hidden select-none [&>*]:min-h-0 [&>*]:flex-1"
      style={{ width, height, containerType: "inline-size" }}
      inert
    >
      <Boundary onError={() => report(cellKey, "error")} name={def.name}>
        <WidgetFrame emphasis={emphasis} detail={detail}>
          <C variant={variant} props={{}} />
        </WidgetFrame>
      </Boundary>
    </div>
  )
}

/** A widget being edited elsewhere may throw; keep the wall up and count it. */
class Boundary extends Component<{ name: string; onError: () => void; children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    if (this.state.error)
      return (
        <div data-crashed className="grid place-items-center rounded-[4px] border border-dashed border-[#fa4d56] p-3 text-center text-xs text-[#fa4d56]">
          {this.props.name} crashed: {this.state.error}
        </div>
      )
    return this.props.children
  }
}

/** Pass/fail under a widget: the size it was drawn at, then each failed rule with its measure. */
function Badge({ size, result }: { size: string; result: Result | undefined }) {
  const fails = result && result !== "error" ? result.filter((r) => !r.pass) : []
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-white/45 tabular-nums">{size}</span>
        <span
          className={cn(
            mono,
            "ml-auto flex shrink-0 items-center gap-1",
            !result ? "text-white/30" : result === "error" || fails.length ? "text-[#ff5500]" : "text-[#42be65]",
          )}
          title={result && result !== "error" ? result.map((r) => `${r.label}: ${r.value}${r.detail ? ` (${r.detail})` : ""}`).join("\n") : undefined}
        >
          {!result ? (
            "Measuring"
          ) : result === "error" ? (
            <>
              <TriangleAlert className="size-3.5" /> Crashed
            </>
          ) : fails.length ? (
            <>
              <TriangleAlert className="size-3.5" /> {fails.length} {fails.length === 1 ? "issue" : "issues"}
            </>
          ) : (
            <>
              <CheckIcon className="size-3.5" /> Pass
            </>
          )}
        </span>
      </div>
      {fails.map((r) => (
        <div key={r.id} className="flex items-baseline gap-2 rounded-[3px] bg-[#161618] px-2 py-1">
          <span className="text-white/80">{r.label}</span>
          <span className="tabular-nums text-[#ff5500]">{r.value}</span>
          {r.detail && <span className="ml-auto truncate text-white/40" title={r.detail}>{r.detail}</span>}
        </div>
      ))}
    </div>
  )
}
