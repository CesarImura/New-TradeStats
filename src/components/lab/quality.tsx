"use client"

import { ArrowRight, Check, TriangleAlert } from "lucide-react"
import { auditTheme } from "@/lib/theme/contrast"
import type { Mode } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS } from "./lab-controls"
import { read, resolveLab, useKey, write, type LabThemes } from "./lab-themes"
import { ThemeChip } from "./theme-switcher"

/**
 * Quality (prototype only): where the library stands against its rules. The
 * overview gathers the last Widget rules run, the readability of every theme
 * here (worked out now) and the last Stress test runs, each problem a link
 * to what to fix.
 */

export type WallSummary = {
  at: number
  theme: string
  pass: number
  total: number
  issues: number
  byRule: { label: string; fails: number }[]
  problems: { type: string; name: string; variant: string; label: string; size: string; rules: string[] }[]
}
export type StressSummary = { type: string; name: string; cuts: number; total: number; at: number }

const WALL = "lab-quality-wall-v1"
const STRESS = "lab-quality-stress-v1"
const NO_STRESS: Record<string, StressSummary> = {}

export const saveWallSummary = (s: WallSummary) => write(WALL, s)
export function saveStressSummary(s: StressSummary) {
  const all = read<Record<string, StressSummary>>(STRESS, NO_STRESS)
  if (all[s.type]?.cuts === s.cuts && all[s.type]?.total === s.total) return
  write(STRESS, { ...all, [s.type]: s })
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}

export function QualityOverview({ lab, go, onWidget, onTheme }: { lab: LabThemes; go: (cat: string) => void; onWidget: (type: string, variant: string) => void; onTheme: (id: string) => void }) {
  const wall = useKey<WallSummary | null>(WALL, null)
  const stress = Object.values(useKey<Record<string, StressSummary>>(STRESS, NO_STRESS)).sort((a, b) => b.cuts - a.cuts)
  // Every theme here, in light and dark: worked out now, it's cheap.
  const pairs = lab.all.flatMap((t) => (["light", "dark"] as Mode[]).map((m) => ({ t, m, fails: auditTheme(resolveLab(t, m), { fixes: true }).filter((c) => !c.pass) })))
  const readable = pairs.filter((p) => !p.fails.length).length
  const cut = stress.filter((s) => s.cuts > 0)

  return (
    <div className="grid gap-5 pb-16 xl:grid-cols-3">
      <Card
        title="Widget rules"
        score={wall ? `${wall.pass}/${wall.total}` : "—"}
        status={!wall ? "none" : wall.issues ? "warn" : "ok"}
        note={wall ? `widget renders pass every rule · ${wall.theme} · ${ago(wall.at)}` : "Not measured yet. A run takes about a minute."}
        action={{ label: wall ? "Run again" : "Run it", onClick: () => go("tool:wall") }}
      >
        {wall && (
          <ul className="flex flex-wrap gap-1.5">
            {wall.byRule.map((r) => (
              <Chip key={r.label} bad={r.fails > 0}>
                {r.label} <span className="text-(--c-t3) tabular-nums">{r.fails ? `${r.fails}` : "ok"}</span>
              </Chip>
            ))}
          </ul>
        )}
        <Problems
          empty={wall ? "Nothing to fix." : null}
          items={(wall?.problems ?? []).map((p, i) => ({
            key: `${p.type}-${p.variant}-${p.size}-${i}`,
            title: `${p.name} · ${p.label}`,
            detail: `${p.size} · ${p.rules.join(", ")}`,
            onClick: () => onWidget(p.type, p.variant),
          }))}
        />
      </Card>

      <Card
        title="Readability"
        score={`${readable}/${pairs.length}`}
        status={readable === pairs.length ? "ok" : "warn"}
        note="themes here, light and dark, with every colour pair at WCAG AA"
        action={{ label: "Test many brands", onClick: () => go("themes:check") }}
      >
        <Problems
          empty="Every theme reads well in light and dark."
          items={pairs
            .filter((p) => p.fails.length)
            .map((p) => ({
              key: `${p.t.id}-${p.m}`,
              icon: <ThemeChip entry={p.t} mode={p.m} />,
              title: `${p.t.name} · ${p.m}`,
              detail: p.fails.map((c) => `${c.label} ${c.ratio.toFixed(1)}/${c.min}`).join(", "),
              onClick: () => onTheme(p.t.id),
            }))}
        />
      </Card>

      <Card
        title="Stress test"
        score={stress.length ? `${cut.length}/${stress.length}` : "—"}
        status={!stress.length ? "none" : cut.length ? "warn" : "ok"}
        note={stress.length ? "widgets tested cut at some size or amount of content" : "No widget tested yet. Pick one and see it at every size."}
        action={{ label: "Open Stress test", onClick: () => go("tool:stress") }}
      >
        <Problems
          empty={stress.length ? "No cuts in the widgets tested." : null}
          items={cut.map((s) => ({ key: s.type, title: s.name, detail: `${s.cuts} of ${s.total} sizes cut · ${ago(s.at)}`, onClick: () => go(`tool:stress:${s.type}`) }))}
        />
      </Card>
    </div>
  )
}

function Card({
  title,
  score,
  status,
  note,
  action,
  children,
}: {
  title: string
  score: string
  status: "ok" | "warn" | "none"
  note: string
  action: { label: string; onClick: () => void }
  children?: React.ReactNode
}) {
  return (
    <section className="grid content-start gap-4 rounded-xl border p-5" style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}>
      <div className="flex items-center gap-2">
        <span className={cn("grid size-6 place-items-center rounded-full", status === "warn" ? "text-[#cf222e]" : "text-(--c-t3)")} style={{ background: "var(--c-on)" }}>
          {status === "warn" ? <TriangleAlert className="size-3.5" /> : <Check className="size-3.5" />}
        </span>
        <h2 className="flex-1 text-sm font-medium">{title}</h2>
        <button
          type="button"
          onClick={action.onClick}
          className={cn("flex h-8 items-center gap-1 rounded-lg px-2.5 text-[0.8125rem] text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
        >
          {action.label} <ArrowRight className="size-3.5" />
        </button>
      </div>
      <div className="grid gap-1">
        <span className="text-[2rem] leading-10 font-medium tracking-[-0.02em] tabular-nums">{score}</span>
        <span className="text-[0.8125rem] text-(--c-t2)">{note}</span>
      </div>
      {children}
    </section>
  )
}

function Chip({ bad, children }: { bad: boolean; children: React.ReactNode }) {
  return (
    <li className="flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[0.8125rem]" style={{ borderColor: bad ? "color-mix(in oklab, #cf222e 45%, var(--c-hair))" : "var(--c-hair)" }}>
      <span className="size-1.5 rounded-full" style={{ background: bad ? "#cf222e" : "var(--c-hair)" }} />
      {children}
    </li>
  )
}

/** What to fix, most important first; each one opens where to fix it. */
function Problems({ items, empty }: { items: { key: string; title: string; detail: string; icon?: React.ReactNode; onClick: () => void }[]; empty: string | null }) {
  if (!items.length) return empty ? <p className="text-[0.8125rem] text-(--c-t3)">{empty}</p> : null
  return (
    <div className="grid gap-1">
      <span className="text-[0.6875rem] font-medium tracking-wide text-(--c-t3) uppercase">To fix · {items.length}</span>
      <ul className="-mx-2 grid max-h-[22rem] gap-px overflow-y-auto">
        {items.map((p) => (
          <li key={p.key}>
            <button type="button" onClick={p.onClick} className={cn("group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-(--c-on)", CONTROL_FOCUS)}>
              {p.icon}
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-[0.8125rem]">{p.title}</span>
                <span className="truncate text-xs text-(--c-t3)">{p.detail}</span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-(--c-t3) opacity-0 group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
