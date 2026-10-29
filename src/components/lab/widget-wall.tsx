"use client"

import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Check as CheckIcon, TriangleAlert } from "@/components/icons"
import { CoachContext } from "@/components/coach/coach-provider"
import { WidgetFrame } from "@/components/widgets/kit"
import { extraRows, heightFor, WIDGETS, type WidgetDef } from "@/components/widgets/registry"
import { DataModeProvider, type DataMode } from "@/components/widgets/shared"
import { getDemoCoach } from "@/lib/data/coaches"
import { themeToCss } from "@/lib/theme/css"
import type { CoachTheme } from "@/lib/theme/types"
import { LIMITS, RULES, checkWidget, type RuleId, type RuleResult } from "@/lib/widgets/checks"
import { ROW_HEIGHT, type Detail, type Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS, LabButton, LabSeg, LabSelect, LabSummary, LabToolbar } from "./lab-controls"
import { saveWallSummary, type WallSummary } from "./quality"

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

const SCOPE = "wl-canvas"
const coach = getDemoCoach("northline")!
const LIBRARY = WIDGETS.filter((w) => !w.core)

type Result = RuleResult[] | "error"
const failsOf = (r: Result | undefined) => (r === "error" ? 1 : r ? r.filter((x) => !x.pass).length : 0)

/**
 * Widget wall (prototype only). Every library widget, in every look, at three
 * widths, in one coach theme at a time, each measured after render against the
 * widget rules (type size, contrast, brand coverage, overflow). Lives in the
 * library (Tools), under its heading and in its chrome.
 */
export function WidgetWall({ theme, themeName, emphasis, detail, onOpen }: { theme: CoachTheme; themeName: string; emphasis: Emphasis; detail: Detail; onOpen: (type: string, variant: string) => void }) {
  // Each layout's rows at this Detail, as the builder gives them (heightFor in the registry).
  const [data, setData] = useState<DataMode>("sample")
  const [filter, setFilter] = useState("all")
  const [onlyProblems, setOnlyProblems] = useState(true)
  const config = `${JSON.stringify(theme)}|${emphasis}|${detail}|${data}`

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
  const cells = widgets.flatMap((def) => def.variants.flatMap((v) => SIZES.map((s) => ({ def, variant: v, size: s, key: `${config}|${def.type}|${v.value}|${s.id}` }))))
  const measured = cells.filter((c) => res.has(c.key))
  const failing = measured.filter((c) => failsOf(res.get(c.key)) > 0)
  const issues = measured.reduce((n, c) => n + failsOf(res.get(c.key)), 0)
  const byRule = (id: RuleId) =>
    measured.filter((c) => {
      const r = res.get(c.key)
      return r !== "error" && r?.some((x) => x.id === id && !x.pass)
    }).length
  const crashed = measured.filter((c) => res.get(c.key) === "error").length
  /** With "only problems", hide a cell once it is measured and clean; unknown cells still render so they get measured. */
  const hidden = (key: string) => onlyProblems && res.has(key) && failsOf(res.get(key)) === 0

  const ctx = useMemo(() => ({ coach, theme, base: "/c/northline", scope: `.${SCOPE}`, preview: false }), [theme])
  const star = emphasis === "star"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16">
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, `.${SCOPE}`) }} />
      <SaveSummary
        done={measured.length === cells.length && filter === "all"}
        themeName={themeName}
        pass={measured.length - failing.length}
        total={cells.length}
        issues={issues}
        byRule={RULES.map((r) => ({ label: r.label, fails: byRule(r.id) }))}
        problems={failing.slice(0, 40).map((c) => ({
          type: c.def.type,
          name: c.def.name,
          variant: c.variant.value,
          label: c.variant.label,
          size: c.size.label,
          rules: (() => {
            const r = res.get(c.key)
            return r === "error" ? ["Crashed"] : (r ?? []).filter((x) => !x.pass).map((x) => x.label)
          })(),
        }))}
      />

      <LabToolbar>
        <LabSeg
          label="Data"
          value={data}
          onChange={setData}
          options={[
            ["sample", "Sample"],
            ["empty", "Empty"],
          ]}
        />
        <LabSelect label="Widget" value={filter} onChange={setFilter}>
          <option value="all">All widgets ({LIBRARY.length})</option>
          {LIBRARY.map((w) => (
            <option key={w.type} value={w.type}>
              {w.name} · {w.group}
            </option>
          ))}
        </LabSelect>
        <LabButton onClick={() => setOnlyProblems(!onlyProblems)} label="Only problems" hint="Hide widgets that pass every check" pressed={onlyProblems}>
          <TriangleAlert className="size-4" />
        </LabButton>
      </LabToolbar>

      <div className="grid gap-2">
        <LabSummary
          value={measured.length - failing.length}
          total={cells.length}
          text={`renders pass every check · ${issues} ${issues === 1 ? "issue" : "issues"}${measured.length < cells.length ? ` · measuring ${measured.length}/${cells.length}` : ""}${crashed ? ` · ${crashed} crashed` : ""}`}
          chips={RULES.map((r) => ({ label: r.label, fails: byRule(r.id) }))}
        />
        <p className="px-1 text-xs text-(--c-t3)">
          Limits: type ≤ {LIMITS.maxFont}px ({LIMITS.maxFontStar}px on Star) · contrast {LIMITS.contrastSmall}:1, {LIMITS.contrastLarge}:1 from {LIMITS.largeTextPx}px · brand ≤ {LIMITS.maxBrandShare * 100}% (not on Star)
          · no overflow
        </p>
      </div>

      <CoachContext.Provider value={ctx}>
        <DataModeProvider value={data}>
          <div className="flex flex-col gap-10">
            {widgets.map((def) => {
              const rows = def.variants.filter((v) => SIZES.some((s) => !hidden(`${config}|${def.type}|${v.value}|${s.id}`)))
              if (!rows.length) return null
              return (
                <section key={def.type} className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b pb-2" style={{ borderColor: "var(--c-hair)" }}>
                    <h2 className="text-base font-medium">{def.name}</h2>
                    <button type="button" onClick={() => onOpen(def.type, def.variants[0].value)} className={cn("ml-auto rounded text-xs text-(--c-t2) hover:text-(--c-t1)", CONTROL_FOCUS)}>
                      Open widget →
                    </button>
                    <span className="text-xs text-(--c-t3)">
                      {def.type} · {def.group} · default {def.defaultW} cols · min {def.minW}
                    </span>
                  </div>
                  {rows.map((v) => (
                    <div key={v.value} className="flex flex-col gap-2">
                      <span className="text-xs text-(--c-t2)">
                        {v.label} <span className="text-(--c-t3)">· {heightFor(def, v.value, detail)} rows</span>
                      </span>
                      {/* Three widths side by side; scrolls sideways on a narrow screen instead of squeezing the widgets. */}
                      <div className="flex flex-wrap items-start gap-4">
                        {SIZES.map((s) => {
                          const key = `${config}|${def.type}|${v.value}|${s.id}`
                          if (hidden(key)) return null
                          const cols = s.cols(def)
                          // A variant that stacks when narrow gets the extra rows the builder gives it there.
                          const vh = v.narrow && cols < v.narrow.below ? Math.max(v.h, v.narrow.minH) : v.h
                          return (
                            <div key={s.id} className="flex max-w-full shrink-0 flex-col gap-1.5" style={{ width: px(cols) + 24 }}>
                              <div
                                data-coach-scope
                                className={cn(SCOPE, theme.mode === "dark" ? "dark" : "light", "rounded-xl border border-(--c-hair) bg-background p-3 text-foreground")}
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
                                <Cell def={def} variant={v.value} emphasis={emphasis} detail={detail} width={px(cols)} height={rowsPx(vh + extraRows(def, v.value, detail))} cellKey={key} star={star} report={report} />
                              </div>
                              <Badge size={`${s.label} · ${cols} cols · ${px(cols)}×${rowsPx(vh + extraRows(def, v.value, detail))}`} result={res.get(key)} />
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
              <div className="grid justify-items-start gap-2 rounded-xl border border-dashed px-6 py-12" style={{ borderColor: "var(--c-hair)" }}>
                <p className="text-sm font-medium">No problems in this theme and setting</p>
                <p className="text-(--c-t2)">Turn off “Only problems” to see every widget.</p>
              </div>
            )}
          </div>
        </DataModeProvider>
      </CoachContext.Provider>
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
    <div ref={ref} className="pointer-events-none relative flex flex-col overflow-hidden select-none [&>*]:min-h-0 [&>*]:flex-1" style={{ width, height, containerType: "inline-size" }} inert>
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
        <span className="text-(--c-t3) tabular-nums">{size}</span>
        <span
          className={cn("ml-auto flex shrink-0 items-center gap-1 font-medium", !result ? "text-(--c-t3)" : result === "error" || fails.length ? "text-(--loss-text,var(--loss))" : "text-(--c-t2)")}
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
        <div key={r.id} className="flex items-baseline gap-2 rounded-md px-2 py-1" style={{ background: "var(--c-on)" }}>
          <span className="text-(--c-t1)">{r.label}</span>
          <span className="text-(--loss-text,var(--loss)) tabular-nums">{r.value}</span>
          {r.detail && (
            <span className="ml-auto truncate text-(--c-t3)" title={r.detail}>
              {r.detail}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** When a full run is measured, keep its result for Quality's overview. */
function SaveSummary({ done, themeName, ...rest }: Omit<WallSummary, "at" | "theme"> & { done: boolean; themeName: string }) {
  const json = JSON.stringify(rest)
  useEffect(() => {
    if (done) saveWallSummary({ ...JSON.parse(json), theme: themeName, at: Date.now() })
  }, [done, json, themeName])
  return null
}
