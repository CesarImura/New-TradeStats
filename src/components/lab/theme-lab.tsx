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

const mono = "font-[family-name:var(--ff-space-mono)] text-[0.68rem] uppercase tracking-[0.06em]"
type SetId = "branded" | "matrix" | "random"

/**
 * Theme lab (prototype only). The same student screen in many themes side by
 * side, each with a readability check, to find where the theme engine breaks
 * before a coach does.
 */
export function ThemeLab() {
  const [set, setSet] = useState<SetId>("branded")
  const [templates, setTemplates] = useState<TemplateId[]>(TEMPLATE_IDS)
  const [mode, setMode] = useState<Mode | "both">("light")
  const [seed, setSeed] = useState(7)
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [fixes, setFixes] = useState(true)

  const themes = useMemo<LabTheme[]>(
    () => (set === "branded" ? BRANDED : set === "matrix" ? matrixSet(templates, mode) : randomSet(seed)),
    [set, templates, mode, seed],
  )
  const audits = useMemo(() => new Map(themes.map((t) => [t.id, auditTheme(t.theme, { fixes })])), [themes, fixes])
  const shown = onlyIssues ? themes.filter((t) => audits.get(t.id)!.some((c) => !c.pass)) : themes

  return (
    <div className="min-h-svh bg-[#040404] font-[family-name:var(--ff-archivo)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#040404]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <div className="grid gap-0.5">
            <span className={cn(mono, "text-white/50")}>Prototype · Theme lab</span>
            <h1 className="text-xl font-normal">Does every theme still look designed?</h1>
          </div>
          <Seg value={fixes ? "fixes" : "today"} onChange={(v) => setFixes(v === "fixes")} options={[["today", "Engine today"], ["fixes", "With fixes"]]} />
          <Seg value={set} onChange={setSet} options={[["branded", "Own brands"], ["matrix", "Templates × colours"], ["random", "Random"]]} />
          {set === "matrix" && (
            <>
              <div className="flex gap-1">
                {TEMPLATE_IDS.map((id) => {
                  const on = templates.includes(id)
                  return (
                    <button
                      key={id}
                      onClick={() => setTemplates(on ? templates.filter((x) => x !== id) : [...templates, id])}
                      className={cn("rounded-[3px] border px-2.5 py-1 text-sm", on ? "border-[#ff5500] text-white" : "border-white/15 text-white/45")}
                    >
                      {TEMPLATES[id].name}
                    </button>
                  )
                })}
              </div>
              <Seg value={mode} onChange={setMode} options={[["light", "Light"], ["dark", "Dark"], ["both", "Both"]]} />
            </>
          )}
          {set === "random" && (
            <button onClick={() => setSeed(Math.floor(Math.random() * 1e6))} className="flex items-center gap-1.5 rounded-[3px] border border-white/15 px-2.5 py-1 text-sm hover:border-white/40">
              <Shuffle className="size-3.5" /> Shuffle <span className="text-white/40 tabular-nums">#{seed}</span>
            </button>
          )}
          <label className="ml-auto flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} className="accent-[#ff5500]" />
            Only themes with issues
          </label>
        </div>
        <Summary themes={themes} audits={audits} />
      </header>

      <main className="mx-auto grid max-w-[1800px] gap-px bg-white/10 p-px [grid-template-columns:repeat(auto-fill,minmax(400px,1fr))]">
        {shown.map((t) => (
          <Cell key={t.id} lab={t} checks={audits.get(t.id)!} fixes={fixes} />
        ))}
      </main>
    </div>
  )
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex rounded-[4px] border border-white/15 p-0.5">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={cn("rounded-[3px] px-2.5 py-1 text-sm", v === value ? "bg-white text-black" : "text-white/60 hover:text-white")}>
          {label}
        </button>
      ))}
    </div>
  )
}

/** Which checks fail, and in how many of the themes shown. */
function Summary({ themes, audits }: { themes: LabTheme[]; audits: Map<string, Check[]> }) {
  const first = audits.get(themes[0]?.id)
  if (!first) return null
  const clean = themes.filter((t) => audits.get(t.id)!.every((c) => c.pass)).length
  return (
    <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-white/10 px-5 py-2.5 text-sm">
      <span className={cn(mono, "text-white/50")}>
        {clean}/{themes.length} fully readable
      </span>
      {first.map((c) => {
        const fails = themes.filter((t) => !audits.get(t.id)!.find((x) => x.id === c.id)!.pass).length
        return (
          <span key={c.id} className={cn("flex items-center gap-1.5", fails ? "text-white" : "text-white/35")}>
            <span className={cn("size-1.5 rounded-full", fails ? "bg-[#ff5500]" : "bg-white/25")} />
            {c.label}
            <span className="tabular-nums text-white/50">{fails ? `fails ${fails}` : "ok"}</span>
          </span>
        )
      })}
    </div>
  )
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
    <section className="flex flex-col bg-[#040404]">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="grid min-w-0 gap-0.5">
          <span className="truncate text-sm">{lab.name}</span>
          {lab.note && <span className="truncate text-xs text-white/45">{lab.note}</span>}
        </div>
        <span className={cn(mono, "ml-auto flex shrink-0 items-center gap-1", fails.length ? "text-[#ff5500]" : "text-white/40")}>
          {fails.length ? <TriangleAlert className="size-3.5" /> : <CheckIcon className="size-3.5" />}
          {fails.length ? `${fails.length} unreadable` : "Readable"}
        </span>
      </div>

      <CoachContext.Provider value={ctx}>
        <style dangerouslySetInnerHTML={{ __html: themeToCss(t, `.${cls}`, { fixes }) }} />
        <div
          className={cn(cls, t.mode === "dark" ? "dark" : "light", "relative isolate flex-1 overflow-hidden bg-background text-foreground", !backdrop && texture[t.background])}
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
        <ul className="grid gap-1 px-4 py-3 text-xs">
          {fails.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className="flex h-4 w-7 shrink-0 items-center justify-center rounded-[2px] text-[0.6rem] font-semibold" style={{ background: c.bg, color: c.fg }}>
                Aa
              </span>
              <span className="text-white/75">{c.label}</span>
              <span className="ml-auto tabular-nums text-white/45">
                {c.ratio.toFixed(2)} : 1 <span className="text-white/25">/ needs {c.min}</span>
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
