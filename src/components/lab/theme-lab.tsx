"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check as CheckIcon, Shuffle, TriangleAlert } from "@/components/icons"
import { CoachContext } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Banner } from "@/components/widgets/brand"
import { Announcement } from "@/components/widgets/community"
import { JournalPnl } from "@/components/widgets/journal"
import { ContinueLesson } from "@/components/widgets/learning"
import { heightOf } from "@/components/widgets/registry"
import { getDemoCoach } from "@/lib/data/coaches"
import { backdropStyle } from "@/lib/theme/backdrops"
import { auditTheme, type Check } from "@/lib/theme/contrast"
import { themeToCss } from "@/lib/theme/css"
import { BRANDED, matrixSet, randomSet, type LabTheme } from "@/lib/theme/lab"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import type { Mode, TemplateId } from "@/lib/theme/types"
import { GAP, ROW_HEIGHT } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS, LabButton, LabSeg, LabSummary } from "./lab-controls"

export type ThemeSet = "branded" | "matrix" | "random"

/** The three ways to pick themes to check, in the library's sidebar order. */
export const THEME_SETS: { id: ThemeSet; label: string; blurb: string }[] = [
  { id: "branded", label: "Own brands", blurb: "Coaches who arrive with their own brand, picked to push the theme engine where it is weakest." },
  { id: "matrix", label: "Templates × colours", blurb: "Each starting template with each brand colour from the colour picker." },
  { id: "random", label: "Random", blurb: "Every setting picked at random, the way a coach clicking around might end up." },
]

/**
 * The readability check's state (prototype only). Lives in the library page so
 * its controls can sit in the sticky bar and its grid in the page.
 */
export function useThemeLab(set: ThemeSet, query = "") {
  const [templates, setTemplates] = useState<TemplateId[]>(TEMPLATE_IDS)
  const [mode, setMode] = useState<Mode | "both">("light")
  const [seed, setSeed] = useState(7)
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [fixes, setFixes] = useState(true)

  const themes = useMemo<LabTheme[]>(() => (set === "branded" ? BRANDED : set === "matrix" ? matrixSet(templates, mode) : randomSet(seed)), [set, templates, mode, seed])
  const audits = useMemo(() => new Map(themes.map((t) => [t.id, auditTheme(t.theme, { fixes })])), [themes, fixes])
  const q = query.trim().toLowerCase()
  const shown = themes.filter((t) => (!onlyIssues || audits.get(t.id)!.some((c) => !c.pass)) && (!q || `${t.name} ${t.note ?? ""}`.toLowerCase().includes(q)))
  return { set, templates, setTemplates, mode, setMode, seed, setSeed, onlyIssues, setOnlyIssues, fixes, setFixes, themes, audits, shown }
}
export type ThemeLabState = ReturnType<typeof useThemeLab>

/** How many themes each set shows by default, for the sidebar counts. */
export const themeSetSize = (set: ThemeSet) => (set === "branded" ? BRANDED.length : set === "matrix" ? matrixSet(TEMPLATE_IDS, "light").length : randomSet(7).length)

/** The check's controls, for the library's sticky bar: engine, then what the set needs, then the filter. */
export function ThemeLabControls({ lab }: { lab: ThemeLabState }) {
  return (
    <>
      <LabSeg
        label="Engine"
        value={lab.fixes ? "fixes" : "today"}
        onChange={(v) => lab.setFixes(v === "fixes")}
        options={[
          ["today", "Today"],
          ["fixes", "With fixes"],
        ]}
      />
      {lab.set === "matrix" && (
        <>
          <div role="group" aria-label="Templates" className="flex h-9 shrink-0 items-center gap-0.5 rounded-lg border p-[3px]" style={{ borderColor: "var(--c-hair)", background: "var(--c-page)" }}>
            <span aria-hidden className="flex h-full min-w-(--seg-label,0) shrink-0 items-center px-2.5 text-[0.8125rem] whitespace-nowrap text-(--c-t3)">
              Templates
            </span>
            <span aria-hidden className="mr-0.5 h-4 w-px shrink-0" style={{ background: "var(--c-hair)" }} />
            {TEMPLATE_IDS.map((id) => {
              const on = lab.templates.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  // Keep at least one template, so the grid never goes empty by accident.
                  onClick={() => lab.setTemplates(on ? (lab.templates.length > 1 ? lab.templates.filter((x) => x !== id) : lab.templates) : [...lab.templates, id])}
                  className={cn(
                    "flex h-full items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap transition-colors duration-150",
                    CONTROL_FOCUS,
                    on ? "bg-(--c-bar) font-medium text-(--c-t1) shadow-[0_0_0_1px_var(--c-hair),0_1px_2px_0_rgb(0_0_0/0.1)]" : "text-(--c-t2) hover:text-(--c-t1)",
                  )}
                >
                  {on && <CheckIcon className="size-3.5" />}
                  {TEMPLATES[id].name}
                </button>
              )
            })}
          </div>
          <LabSeg
            label="Themes in"
            value={lab.mode}
            onChange={lab.setMode}
            options={[
              ["light", "Light"],
              ["dark", "Dark"],
              ["both", "Both"],
            ]}
          />
        </>
      )}
      {lab.set === "random" && (
        <LabButton onClick={() => lab.setSeed(Math.floor(Math.random() * 1e6))} label={`Shuffle · #${lab.seed}`} hint="Pick a new random set">
          <Shuffle className="size-4" />
        </LabButton>
      )}
      <LabButton onClick={() => lab.setOnlyIssues(!lab.onlyIssues)} label="Only issues" hint="Show only themes with something unreadable" pressed={lab.onlyIssues}>
        <TriangleAlert className="size-4" />
      </LabButton>
    </>
  )
}

/**
 * The readability report: a summary of which checks fail, then one cell per
 * theme with a slice of the student Home in it. Styled with the library's
 * chrome (--c-*) so it reads as one page with the widgets.
 */
export function ThemeLabGrid({ lab }: { lab: ThemeLabState }) {
  const { themes, audits, shown, fixes } = lab
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16">
      <Summary themes={themes} audits={audits} />
      {shown.length === 0 ? (
        <div className="grid justify-items-start gap-2 rounded-xl border border-dashed px-6 py-12" style={{ borderColor: "var(--c-hair)" }}>
          <p className="text-sm font-medium">{lab.onlyIssues ? "Every theme here is readable" : "No theme matches the filter"}</p>
          <p className="text-(--c-t2)">{lab.onlyIssues ? "Turn off “Only issues” to see them all." : "Try another name, like a template or a colour."}</p>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))" }}>
          {shown.map((t) => (
            <Cell key={t.id} lab={t} checks={audits.get(t.id)!} fixes={fixes} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Which checks fail, and in how many of the themes shown. */
function Summary({ themes, audits }: { themes: LabTheme[]; audits: Map<string, Check[]> }) {
  const first = audits.get(themes[0]?.id)
  if (!first) return null
  const clean = themes.filter((t) => audits.get(t.id)!.every((c) => c.pass)).length
  const chips = first.map((c) => ({ label: c.label, fails: themes.filter((t) => !audits.get(t.id)!.find((x) => x.id === c.id)!.pass).length }))
  return <LabSummary value={clean} total={themes.length} text={clean === themes.length ? "themes fully readable" : "themes fully readable · the rest fail at least one check"} chips={chips} />
}

const coach = getDemoCoach("northline")!
const texture: Record<string, string> = { grid: "coach-bg-grid", glow: "coach-bg-glow", dots: "coach-bg-dots" }
const heightPx = (type: string, variant?: string, density: keyof typeof GAP = "comfortable") => {
  const h = heightOf({ type, variant })
  return h * ROW_HEIGHT + (h - 1) * GAP[density]
}

/** One theme: a slice of the student Home in that theme, and its readability report. */
function Cell({ lab, checks, fixes }: { lab: LabTheme; checks: Check[]; fixes: boolean }) {
  const t = lab.theme
  const cls = `lab-${lab.id.replace(/[^a-z0-9-]/gi, "")}`
  const fails = checks.filter((c) => !c.pass)
  const backdrop = backdropStyle(t)
  const ctx = useMemo(() => ({ coach, theme: t, base: "/c/northline", scope: `.${cls}`, preview: false }), [t, cls])

  return (
    <section aria-label={lab.name} className="grid min-w-0 content-start gap-3">
      <div className="flex items-start gap-3 px-1">
        <div className="grid min-w-0 gap-0.5">
          <span className="truncate text-[0.8125rem] font-medium">{lab.name}</span>
          {lab.note && <span className="truncate text-xs text-(--c-t2)">{lab.note}</span>}
        </div>
        <span
          className={cn("ml-auto flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs", fails.length ? "text-(--c-t1)" : "text-(--c-t2)")}
          style={{ borderColor: fails.length ? "color-mix(in oklab, var(--loss) 45%, var(--c-hair))" : "var(--c-hair)" }}
        >
          {fails.length ? <TriangleAlert className="size-3.5" style={{ color: "var(--loss)" }} /> : <CheckIcon className="size-3.5" />}
          {fails.length ? `${fails.length} unreadable` : "Readable"}
        </span>
      </div>

      <CoachContext.Provider value={ctx}>
        <style dangerouslySetInnerHTML={{ __html: themeToCss(t, `.${cls}`, { fixes }) }} />
        <div
          className={cn(cls, t.mode === "dark" ? "dark" : "light", "relative isolate overflow-hidden rounded-xl border border-(--c-hair) bg-background text-foreground", !backdrop && texture[t.background])}
          // Tailwind's font variables resolve at :root; re-point them here so each cell uses its own fonts.
          style={
            {
              fontFamily: "var(--coach-font-body)",
              "--font-sans": "var(--coach-font-body)",
              "--font-heading": "var(--coach-font-heading)",
              "--font-label": "var(--coach-font-label)",
            } as React.CSSProperties
          }
        >
          {backdrop && <div aria-hidden className="absolute inset-0 -z-10" style={backdrop} />}
          <Specimen density={t.density} />
        </div>
      </CoachContext.Provider>

      {fails.length > 0 && (
        <ul className="grid gap-1 px-1 text-xs">
          {fails.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className="flex h-4 w-7 shrink-0 items-center justify-center rounded-[2px] text-[0.6rem] font-semibold" style={{ background: c.bg, color: c.fg }}>
                Aa
              </span>
              <span className="text-(--c-t1)">{c.label}</span>
              <span className="ml-auto tabular-nums text-(--c-t2)">
                {c.ratio.toFixed(2)} : 1 <span className="text-(--c-t3)">/ needs {c.min}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const TRADES = [
  { sym: "EURUSD", side: "Long", r: "+2.1R", pnl: "+$412", up: true },
  { sym: "NAS100", side: "Short", r: "−1.0R", pnl: "−$180", up: false },
  { sym: "XAUUSD", side: "Long", r: "+0.6R", pnl: "+$96", up: true },
]

/** The parts of the student platform most likely to break: nav, type, buttons, links, widgets, numbers. */
function Specimen({ density }: { density: keyof typeof GAP }) {
  const gap = GAP[density] * 0.6
  return (
    <div className="flex flex-col" style={{ gap }}>
      <div className="flex items-center gap-3 border-b bg-sidebar px-4 py-2.5 text-sidebar-foreground">
        <span className="grid size-6 place-items-center rounded-[min(var(--radius),6px)] bg-primary text-[0.6rem] font-semibold text-primary-foreground">{coach.mark}</span>
        <span className="text-sm font-heading">{coach.name}</span>
        <nav className="ml-auto flex gap-1 text-xs">
          <span className="rounded-[min(var(--radius),6px)] bg-sidebar-accent px-2 py-1 font-medium text-sidebar-accent-foreground">Home</span>
          <span className="px-2 py-1 opacity-70">Courses</span>
          <span className="px-2 py-1 opacity-70">Journal</span>
        </nav>
      </div>

      <div className="flex flex-col px-4" style={{ gap }}>
        <div className="grid gap-1">
          <span className="eyebrow">Monday, 12 October</span>
          <h2 className="text-2xl leading-tight">Good morning, Alex</h2>
          <p className="text-sm text-muted-foreground">
            You&apos;re two lessons from finishing Foundations. <a className="font-medium text-primary underline underline-offset-2">Continue where you left off</a>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">
            Book a call <ArrowRight />
          </Button>
          <Button size="sm" variant="secondary">
            Journal
          </Button>
          <Button size="sm" variant="outline">
            Courses
          </Button>
          <Badge>New</Badge>
          <Badge className="bg-highlight text-highlight-foreground">Live today</Badge>
        </div>

        <div className="grid grid-cols-2" style={{ gap }}>
          <div style={{ height: heightPx("journal-pnl", "bars", density) }}>
            <JournalPnl variant="bars" props={{}} />
          </div>
          <div style={{ height: heightPx("continue-lesson", "card", density) }}>
            <ContinueLesson variant="card" props={{}} />
          </div>
        </div>

        <div style={{ height: heightPx("banner", "brand", density) }}>
          <Banner variant="brand" props={{ title: "Inner Circle opens 1 Nov", text: "Weekly 1:1 reviews and the full playbook." }} />
        </div>

        <div style={{ height: heightPx("announcement", "highlight", density) }}>
          <Announcement variant="highlight" props={{}} />
        </div>

        <Card size="sm" className="gap-0 py-0">
          {TRADES.map((tr) => (
            <div key={tr.sym} className="flex items-center gap-3 border-b px-(--card-spacing) py-2 text-sm last:border-0">
              <span className="font-medium">{tr.sym}</span>
              <span className="text-muted-foreground">{tr.side}</span>
              <span className={cn("ml-auto tabular-nums", tr.up ? "text-profit" : "text-loss")}>{tr.r}</span>
              <span className={cn("w-14 text-right font-medium tabular-nums", tr.up ? "text-profit" : "text-loss")}>{tr.pnl}</span>
            </div>
          ))}
        </Card>

        <Input placeholder="Ask your coach anything…" className="mb-4" />
      </div>
    </div>
  )
}
