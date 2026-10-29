"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CoachContext } from "@/components/coach/coach-provider"
import { PageRenderer } from "@/components/widgets/page-renderer"
import { DETAILED_EXTRA_ROWS } from "@/components/widgets/registry"
import { getDemoCoach } from "@/lib/data/coaches"
import { contrast } from "@/lib/theme/contrast"
import { themeToCss } from "@/lib/theme/css"
import { resolveColors } from "@/lib/theme/derive"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import type { ChartStyle, CoachTheme, FigureStyle, HeaderForm, Mode, PanelStyle, StarStyle, TemplateId, WidgetFinish } from "@/lib/theme/types"
import { checkWidget, type RuleResult } from "@/lib/widgets/checks"
import type { Detail, PageLayout } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { LabButton, LabSeg, LabToolbar } from "./lab-controls"

/** Each template with the demo coach that uses it. */
const ROWS: { template: TemplateId; slug: string }[] = [
  { template: "terminal", slug: "northline" },
  { template: "atelier", slug: "sophia" },
  { template: "pulse", slug: "kairo" },
]

/** The personality settings, "template" keeps the template's own choice. */
type Mix = {
  headerForm: "template" | HeaderForm
  figureStyle: "template" | FigureStyle
  chartStyle: "template" | ChartStyle
  panelStyle: "template" | PanelStyle
  starStyle: "template" | StarStyle
  widgetFinish: "template" | WidgetFinish
}
const MIX0: Mix = { headerForm: "template", figureStyle: "template", chartStyle: "template", panelStyle: "template", starStyle: "template", widgetFinish: "template" }
const MIX_OPTIONS: { key: keyof Mix; label: string; options: [string, string][] }[] = [
  { key: "headerForm", label: "Names", options: [["top", "Top"], ["label", "Label"], ["caption", "Caption"], ["tag", "Tag"], ["path", "Path"]] },
  { key: "figureStyle", label: "Numbers", options: [["plain", "Plain"], ["marked", "Marked"], ["mono", "Mono"], ["display", "Display"]] },
  { key: "chartStyle", label: "Bars", options: [["ticks", "Ticks"], ["solid", "Solid"], ["thin", "Thin"], ["blocks", "Blocks"], ["dots", "Dots"]] },
  { key: "panelStyle", label: "Panels", options: [["none", "None"], ["filled", "Filled"], ["outline", "Outline"]] },
  { key: "starStyle", label: "Star", options: [["spotlight", "Spotlight"], ["brand", "Brand"], ["inverted", "Inverted"]] },
  { key: "widgetFinish", label: "Finish", options: [["none", "None"], ["corners", "Corners"], ["grid", "Grid"]] },
]

/**
 * Proof of the base structure (prototype only): Up next, Performance and
 * Discipline on the five-band base, for each template in light and dark, with
 * the personality settings to try on all of them at once. Lives in the library
 * (Tools), under its heading and in its chrome.
 */
export function WidgetProof() {
  const [detail, setDetail] = useState<Detail>("standard")
  const [star, setStar] = useState(true)
  const [mix, setMix] = useState<Mix>(MIX0)
  // Detailed widgets get extra rows, as in the builder (heightFor in the registry).
  const h = 5 + (detail === "detailed" ? DETAILED_EXTRA_ROWS : 0)
  const layout: PageLayout = useMemo(
    () => ({
      items: [
        { id: "a", type: "next-live", variant: "countdown", x: 0, y: 0, w: 4, h, detail, emphasis: star ? "star" : "accent" },
        { id: "b", type: "journal-pnl", variant: "curve", x: 4, y: 0, w: 4, h, detail },
        { id: "c", type: "rules-followed", variant: "radar", x: 8, y: 0, w: 4, h, detail },
      ],
    }),
    [detail, star, h],
  )
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pb-16">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <LabToolbar>
          <LabSeg label="Detail" value={detail} onChange={setDetail} options={[["compact", "Compact"], ["standard", "Standard"], ["detailed", "Detailed"]]} />
          <LabSeg label="Up next" value={star ? "star" : "accent"} onChange={(v) => setStar(v === "star")} options={[["star", "Star"], ["accent", "Accent"]]} />
          <LabButton onClick={() => setMix(MIX0)} label="Reset to templates" hint="Every personality setting back to each template's own" />
        </LabToolbar>
        {/* The personality settings, tried on every template at once. */}
        <LabToolbar>
          {MIX_OPTIONS.map((o) => (
            <LabSeg key={o.key} label={o.label} value={mix[o.key]} onChange={(v) => setMix((m) => ({ ...m, [o.key]: v }))} options={[["template", "Template’s"], ...o.options]} />
          ))}
        </LabToolbar>
      </div>
      {ROWS.flatMap((r) => (["light", "dark"] as Mode[]).map((mode) => <Cell key={`${r.template}-${mode}`} slug={r.slug} mode={mode} mix={mix} layout={layout} />))}
    </div>
  )
}

function Cell({ slug, mode, mix, layout }: { slug: string; mode: Mode; mix: Mix; layout: PageLayout }) {
  const coach = useMemo(() => resolveCoach(getDemoCoach(slug)!), [slug])
  const theme = useMemo<CoachTheme>(() => {
    const t: CoachTheme = { ...resolveTheme(coach), mode }
    for (const [k, v] of Object.entries(mix)) if (v !== "template") Object.assign(t, { [k]: v })
    return t
  }, [coach, mode, mix])
  const scope = `pf-${slug}-${mode}`
  const ctx = useMemo(() => ({ coach, theme, base: `/c/${slug}`, scope: `.${scope}`, preview: false }), [coach, theme, slug, scope])
  // The surface ladder as measured (derive.ts surfaces), and the widget wall's four checks on each widget.
  const steps = useMemo(() => {
    const c = resolveColors(theme)
    return [
      ["Card / page", contrast(c.card, c.background)],
      ["Panel / card", contrast(c.panel, c.card)],
      ["Track / panel", contrast(c.track, c.panel)],
      ["Hairline / card", contrast(c.hair, c.card)],
      ["Text 2 / panel", contrast(c.mutedForeground, c.panel, c.card)],
    ] as [string, number][]
  }, [theme])
  const box = useRef<HTMLDivElement>(null)
  const [fails, setFails] = useState<string[]>()
  useEffect(() => {
    const id = setTimeout(() => {
      const items = [...(box.current?.querySelectorAll<HTMLElement>(".g-item") ?? [])]
      setFails(
        items.flatMap((el, i) => {
          const r: RuleResult[] = checkWidget(el, { star: !!el.querySelector('[data-emphasis="star"]') }) ?? []
          return r.filter((x) => !x.pass).map((x) => `${["Up next", "Performance", "Discipline"][i]}: ${x.label} ${x.value}`)
        }),
      )
    }, 900)
    return () => clearTimeout(id)
  }, [theme, layout])
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-(--c-t3)">
        <span className="text-[0.8125rem] font-medium text-(--c-t1)">
          {coach.name} · {theme.template} · {mode}
        </span>
        {steps.map(([l, v]) => (
          <span key={l}>
            {l} <span className="text-(--c-t2) tabular-nums">{v.toFixed(2)}</span>
          </span>
        ))}
        <span className={cn("ml-auto font-medium", fails?.length ? "text-(--loss-text)" : "text-(--c-t2)")}>{fails === undefined ? "checking…" : fails.length ? `${fails.length} check(s) fail` : "all checks pass"}</span>
      </div>
      {!!fails?.length && <div className="text-xs text-(--loss-text)">{fails.join(" · ")}</div>}
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, `.${scope}`) }} />
      <CoachContext.Provider value={ctx}>
        <div ref={box} className={cn(scope, "overflow-x-auto rounded-xl border border-(--c-hair) p-8")} style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--coach-font-body)" }}>
          <PageRenderer layout={layout} />
        </div>
      </CoachContext.Provider>
    </section>
  )
}
