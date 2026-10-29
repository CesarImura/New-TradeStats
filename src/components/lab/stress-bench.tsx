"use client"

import { DataModeProvider } from "@/components/lab/reui-widgets/shared"
import type { WidgetDef } from "@/components/lab/reui-widgets/registry"
import { themeToCss } from "@/lib/theme/css"
import { COLS, type Detail } from "@/lib/widgets/layout"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import { useState } from "react"
import { LabSeg, LabSelect, LabToolbar } from "./lab-controls"
import { CONTENTS, propsFor, type Content } from "./stress-content"
import { LIBRARY, meaningCss, Pane, px, rowsPx, themeFor } from "./widget-base"

/** The sizes to try: the narrowest it allows up to a full row, and its shortest, default and a taller height. */
function sizesOf(def: WidgetDef, v: WidgetDef["variants"][number], range?: Range): { h: number; ws: number[] }[] {
  const minW = v.minW
  // axes: every width from 2 at the default height, and every height from 1 at the default width, to measure the limits.
  if (range === "axes") {
    const all = (n: number, from: number) => Array.from({ length: n - from + 1 }, (_, i) => from + i)
    return [{ h: v.h, ws: all(COLS, 2) }, ...all(10, 1).filter((h) => h !== v.h).map((h) => ({ h, ws: [def.defaultW] }))].sort((a, b) => a.h - b.h)
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
export function StressBench({ type, content = "sample", mode, detail = "standard", range, embedded, theme: given }: { type?: string; content?: string; mode: Mode; detail?: string; range?: Range; embedded?: boolean; theme?: CoachTheme }) {
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
                    <div key={h} className={embedded ? "-mx-1 flex items-start gap-4 overflow-x-auto px-1 pt-1 pb-2" : "flex items-start gap-4"}>
                      {ws.map((w) => (
                        <figure key={w} className="grid shrink-0 gap-1.5">
                          {/* In the library, a dashed outline shows the grid box the widget was given. */}
                          <div data-bench={`${def.type}/${v.value}/${w}x${h}`} className={embedded ? "outline-1 outline-offset-2 outline-(--c-hair) outline-dashed" : undefined} style={range === "natural" ? { width: px(w) } : { width: px(w), height: rowsPx(h) }}>
                            <Pane fill={range !== "natural"} def={def} variant={v.value} h={h} scale={1} mode={mode} theme={theme} emphasis="accent" detail={d} props={propsFor(def, c)} />
                          </div>
                          {embedded && (
                            <figcaption className="text-xs text-(--c-t3) tabular-nums">
                              {w} × {range === "natural" ? "auto" : h}
                            </figcaption>
                          )}
                        </figure>
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

/** The bench in the library (Tools): pick a widget and how much content, see every layout at many grid sizes. */
export function StressTool({ mode, theme }: { mode: Mode; theme: CoachTheme }) {
  const [type, setType] = useState(LIBRARY[0].type)
  const [content, setContent] = useState<Content>("sample")
  const [detail, setDetail] = useState<Detail>("standard")
  const [range, setRange] = useState("builder")
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16">
      <LabToolbar>
        <LabSelect label="Widget" value={type} onChange={setType}>
          {LIBRARY.map((w) => (
            <option key={w.type} value={w.type}>
              {w.name} · {w.group}
            </option>
          ))}
        </LabSelect>
        <LabSeg label="Content" value={content} onChange={setContent} options={[["sample", "Sample"], ["empty", "Empty"], ["short", "Short"], ["long", "Long"]]} />
        <LabSeg label="Detail" value={detail} onChange={setDetail} options={[["compact", "Compact"], ["standard", "Standard"], ["detailed", "Detailed"]]} />
        <LabSeg label="Sizes" value={range} onChange={setRange} options={RANGES} />
      </LabToolbar>
      <StressBench embedded type={type} content={content} mode={mode} theme={theme} detail={detail} range={range === "builder" ? undefined : (range as Range)} />
    </div>
  )
}
