"use client"

import { useState } from "react"
import { Pane } from "@/components/lab/widget-base"
import { WIDGETS } from "@/components/lab/reui-widgets/registry"
import { themeToCss } from "@/lib/theme/css"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import { LabSeg, LabToolbar } from "./lab-controls"

/** The same widgets under each template, side by side: do two coaches look like different products? */
const SHOW: [string, string][] = [
  ["journal-pnl", "curve"],
  ["next-live", "countdown"],
  ["rules-followed", "gauge"],
  ["latest-downloads", "list"],
  ["announcement", "headline"],
]

/** In the library (Tools): the page's light or dark, five widgets or every layout. */
export function AnatomyCompare({ mode = "light" }: { mode?: Mode }) {
  const [all, setAll] = useState(false)
  const show: [string, string][] = all ? WIDGETS.filter((w) => !w.core).flatMap((w) => w.variants.map((v) => [w.type, v.value] as [string, string])) : SHOW
  const themes = TEMPLATE_IDS.map((id) => ({ id, theme: { ...TEMPLATES[id].theme, template: id, mode } as CoachTheme }))
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16">
      <LabToolbar>
        <LabSeg label="Widgets" value={all ? "all" : "five"} onChange={(v) => setAll(v === "all")} options={[["five", "Five"], ["all", "Every layout"]]} />
      </LabToolbar>
      <style dangerouslySetInnerHTML={{ __html: themes.map(({ id, theme }) => themeToCss(theme, `.wb-${id}`)).join("") }} />
      {/* One column per template at real size; wider than the screen, so it scrolls sideways. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${themes.length}, max-content)` }}>
          {themes.map(({ id, theme }) => (
            <div key={id} data-template={id} className={`wb-${id} grid content-start gap-4 rounded-xl border border-(--c-hair) p-6`} style={{ background: "var(--background)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {TEMPLATES[id].name ?? id}
              </span>
              {show.map(([type, variant]) => {
                const def = WIDGETS.find((w) => w.type === type)
                if (!def) return null
                const v = def.variants.find((x) => x.value === variant) ?? def.variants[0]
                return <Pane key={`${type}/${variant}`} def={def} variant={v.value} h={v.h} scale={1} mode={mode} theme={theme} emphasis="accent" detail="standard" scope={`wb-${id}`} />
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
