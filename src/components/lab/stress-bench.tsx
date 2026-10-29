"use client"

import { DataModeProvider } from "@/components/lab/reui-widgets/shared"
import type { WidgetDef } from "@/components/lab/reui-widgets/registry"
import { themeToCss } from "@/lib/theme/css"
import { COLS, type Detail } from "@/lib/widgets/layout"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { checkWidget } from "@/lib/widgets/checks"
import { saveStressSummary } from "./quality"
import { cn } from "@/lib/utils"
import { LabSeg, LabSelect, LabToolbar } from "./lab-controls"
import { CONTENTS, propsFor, type Content } from "./stress-content"
import { LIBRARY, meaningCss, Pane, px, rowsPx, themeFor } from "./widget-base"

/** The sizes to try: the narrowest it allows up to a full row, and its shortest, default and a taller height. */
function sizesOf(def: WidgetDef, v: WidgetDef["variants"][number], range?: Range): { h: number; ws: number[] }[] {
  const minW = v.minW
  // axes: every width from 2 at the default height, and every height from 1 at the default width, to measure the limits.
  if (range === "axes") {
    const all = (n: number, from: number) => Array.from({ length: n - from + 1 }, (_, i) => from + i)
    return [
      { h: v.h, ws: all(COLS, 2) },
      ...all(10, 1)
        .filter((h) => h !== v.h)
        .map((h) => ({ h, ws: [def.defaultW] })),
    ].sort((a, b) => a.h - b.h)
  }
  // natural: every width, the card as tall as its content (up to 12 rows), to measure how many rows it really needs.
  if (range === "natural") return [{ h: 12, ws: Array.from({ length: COLS - minW + 1 }, (_, i) => minW + i) }]
  // range: every width and every height up to 10 rows, to find where a layout stops looking right.
  if (range === "grid") {
    const ws = Array.from({ length: COLS - minW + 1 }, (_, i) => minW + i)
    return Array.from({ length: Math.max(1, 11 - v.minH) }, (_, i) => ({ h: v.minH + i, ws }))
  }
  // Only the sizes the builder allows: up to the layout's own maximum.
  const maxW = Math.min(COLS, v.maxW)
  const ws = [...new Set([minW, minW + 1, 4, 6, 8, maxW].filter((w) => w >= minW && w <= maxW))].sort((a, b) => a - b)
  const hs = [...new Set([v.minH, v.h, Math.min(v.h + 2, v.maxH)])].sort((a, b) => a - b)
  // Only sizes the builder allows: a layout that needs more rows when narrow skips those widths at the shorter heights.
  return hs.map((h) => ({ h, ws: ws.filter((w) => (!v.narrow || w >= v.narrow.below || h >= v.narrow.minH) && (!v.wide || w < v.wide.from || h <= v.wide.maxH)) })).filter((r) => r.ws.length)
}

type Range = "grid" | "axes" | "natural"

/**
 * The bench. On its own page (/lab/stress, driven by the URL for the audit
 * scripts) it brings its own white-label theme; `embedded` in the library it
 * uses the library's theme and chrome.
 */
export function StressBench({
  type,
  content = "sample",
  mode,
  detail = "standard",
  range,
  embedded,
  theme: given,
  report,
}: {
  type?: string
  content?: string
  mode: Mode
  detail?: string
  range?: Range
  embedded?: boolean
  theme?: CoachTheme
  /** In the library: each cell says whether it cuts. */ report?: (key: string, cut: boolean) => void
}) {
  const c = (CONTENTS.includes(content as Content) ? content : "sample") as Content
  const d = (["compact", "standard", "detailed"].includes(detail) ? detail : "standard") as Detail
  const theme = given ?? themeFor(mode, "minimal")
  const defs = type ? LIBRARY.filter((w) => w.type === type) : []
  const scope = mode === "light" ? "wb-light" : "wb-dark"
  return (
    <div className={embedded ? "grid grid-cols-[minmax(0,1fr)] gap-10" : `${scope} ${mode} min-h-svh p-8`} style={embedded ? undefined : { background: "var(--background)", colorScheme: mode }}>
      {!embedded && <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, `.${scope}`) + meaningCss("minimal") }} />}
      {!type && !embedded && (
        <ul className="grid gap-1 text-sm">
          {LIBRARY.map((w) => (
            <li key={w.type}>
              <a className="underline" href={`?type=${w.type}`}>
                {w.name}
              </a>
            </li>
          ))}
        </ul>
      )}
      <DataModeProvider value={c === "empty" ? "empty" : "sample"}>
        {defs.map((def) => (
          <div key={def.type} className="grid grid-cols-[minmax(0,1fr)] gap-10">
            {def.variants.map((v) => {
              const rows = sizesOf(def, v, range)
              return (
                <section key={v.value} data-bench-variant={v.value} className="grid grid-cols-[minmax(0,1fr)] gap-4">
                  <h2 className="text-sm font-medium" style={{ color: embedded ? "var(--c-t1)" : "var(--foreground)" }}>
                    {def.name} / {v.label} · {c} · {d}
                  </h2>
                  {rows.map(({ h, ws }) => (
                    <div key={h} className={embedded ? "flex flex-wrap items-start gap-4 pt-1" : "flex items-start gap-4"}>
                      {ws.map((w) => (
                        <BenchCell
                          key={w}
                          id={`${def.type}/${v.value}/${w}x${h}`}
                          embedded={embedded}
                          report={report}
                          label={`${w} × ${range === "natural" ? "auto" : h}`}
                          style={range === "natural" ? { width: px(w) } : { width: px(w), height: rowsPx(h) }}
                        >
                          <Pane fill={range !== "natural"} def={def} variant={v.value} h={h} scale={1} mode={mode} theme={theme} emphasis="accent" detail={d} props={propsFor(def, c)} />
                        </BenchCell>
                      ))}
                    </div>
                  ))}
                </section>
              )
            })}
          </div>
        ))}
      </DataModeProvider>
    </div>
  )
}

const RANGES: [string, string][] = [
  ["builder", "Builder sizes"],
  ["grid", "Every size"],
  ["axes", "Axes"],
  ["natural", "Natural height"],
]

/**
 * One size in the bench. In the library it is measured after it settles: a
 * widget that cuts or overflows its box gets a red outline and a "Cuts" tag.
 */
function BenchCell({
  id,
  embedded,
  report,
  label,
  style,
  children,
}: {
  id: string
  embedded?: boolean
  report?: (key: string, cut: boolean) => void
  label: string
  style: React.CSSProperties
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [cut, setCut] = useState<boolean | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !embedded) return
    const run = () => {
      const r = checkWidget(el, { star: false })
      if (!r) return
      const bad = r.some((x) => x.id === "overflow" && !x.pass)
      setCut(bad)
      report?.(id, bad)
    }
    const timers = [setTimeout(run, 400), setTimeout(run, 1500)]
    document.fonts?.ready.then(run)
    return () => timers.forEach(clearTimeout)
  }, [id, embedded, report])
  return (
    <figure className="grid max-w-full shrink-0 gap-1.5">
      {/* In the library, a dashed outline shows the grid box the widget was given; red where it cuts. */}
      <div ref={ref} data-bench={id} className={embedded ? cn("max-w-full outline-offset-2", cut ? "outline-2 outline-[#cf222e] outline-solid" : "outline-1 outline-(--c-hair) outline-dashed") : undefined} style={style}>
        {children}
      </div>
      {embedded && (
        <figcaption className="flex items-center gap-2 text-xs text-(--c-t3) tabular-nums">
          {label}
          {cut && (
            <span className="rounded-full px-1.5 leading-4 font-medium text-white" style={{ background: "#cf222e" }}>
              Cuts
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}

/** The bench in the library (Quality): pick a widget and how much content, see every variant at many grid sizes, cuts marked. */
export function StressTool({
  mode,
  theme,
  type,
  onType,
  fixed,
}: {
  mode: Mode
  theme: CoachTheme
  type: string
  onType: (t: string) => void
  /** Inside a widget's modal: the widget is given, no picker. */ fixed?: boolean
}) {
  const setType = onType
  const [content, setContent] = useState<Content>("sample")
  const [detail, setDetail] = useState<Detail>("standard")
  const [range, setRange] = useState("builder")
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16">
      <LabToolbar>
        {!fixed && (
          <LabSelect label="Widget" value={type} onChange={setType}>
            {LIBRARY.map((w) => (
              <option key={w.type} value={w.type}>
                {w.name} · {w.group}
              </option>
            ))}
          </LabSelect>
        )}
        <LabSeg
          label="Content"
          value={content}
          onChange={setContent}
          options={[
            ["sample", "Sample"],
            ["empty", "Empty"],
            ["short", "Short"],
            ["long", "Long"],
          ]}
        />
        <LabSeg
          label="Detail"
          value={detail}
          onChange={setDetail}
          options={[
            ["compact", "Compact"],
            ["standard", "Standard"],
            ["detailed", "Detailed"],
          ]}
        />
        <LabSeg label="Sizes" value={range} onChange={setRange} options={RANGES} />
      </LabToolbar>
      <StressSummary key={`${type}|${content}|${detail}|${range}`} type={type}>
        {(report, cuts, total) => (
          <>
            <p className="text-[0.8125rem] text-(--c-t2)">{total ? (cuts ? `${cuts} of ${total} sizes cut or overflow, marked in red.` : `No cuts in ${total} sizes.`) : "Measuring…"}</p>
            <StressBench embedded type={type} content={content} mode={mode} theme={theme} detail={detail} range={range === "builder" ? undefined : (range as Range)} report={report} />
          </>
        )}
      </StressSummary>
    </div>
  )
}

/** Counts the cells that cut and keeps the result for Quality's overview. */
function StressSummary({ type, children }: { type: string; children: (report: (key: string, cut: boolean) => void, cuts: number, total: number) => React.ReactNode }) {
  const [res, setRes] = useState<Record<string, boolean>>({})
  const report = useCallback((key: string, cut: boolean) => setRes((r) => (r[key] === cut ? r : { ...r, [key]: cut })), [])
  const total = Object.keys(res).length
  const cuts = Object.values(res).filter(Boolean).length
  useEffect(() => {
    const def = LIBRARY.find((w) => w.type === type)
    if (total && def) saveStressSummary({ type, name: def.name, cuts, total, at: Date.now() })
  }, [type, cuts, total])
  return <>{children(report, cuts, total)}</>
}
