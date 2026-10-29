"use client"

import { useState } from "react"
import { Chip, WCard } from "@/components/widgets/instrument"
import { Spark, useFitRows, useMore } from "@/components/widgets/kit"
import type { WidgetProps } from "@/components/widgets/shared"
import { Trophy } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * The group's leaderboard as a table (prototype only): sortable columns, a
 * trend trace per trader, and the student's own row marked with the accent.
 */

type Row = { name: string; initials: string; score: number; win: number; r: number; trend: number[]; me?: boolean }
const BOARD: Row[] = [
  { name: "Jonas P.", initials: "JP", score: 98, win: 64, r: 14.2, trend: [80, 84, 88, 90, 93, 96, 98] },
  { name: "Sara K.", initials: "SK", score: 96, win: 61, r: 11.8, trend: [90, 91, 93, 92, 95, 95, 96] },
  { name: "Mia S.", initials: "MS", score: 95, win: 58, r: 9.4, trend: [85, 88, 90, 91, 92, 94, 95] },
  { name: "Tom B.", initials: "TB", score: 93, win: 55, r: 8.1, trend: [94, 93, 92, 92, 93, 92, 93] },
  { name: "Eli R.", initials: "ER", score: 91, win: 57, r: 7.6, trend: [86, 87, 89, 88, 90, 91, 91] },
  { name: "Ana L.", initials: "AL", score: 90, win: 53, r: 6.9, trend: [88, 89, 89, 90, 89, 90, 90] },
  { name: "You", initials: "AX", score: 88, win: 58, r: 6.2, trend: [74, 78, 80, 83, 85, 86, 88], me: true },
  { name: "Leo M.", initials: "LM", score: 86, win: 50, r: 4.1, trend: [88, 87, 87, 86, 86, 85, 86] },
]

type Key = "score" | "win" | "r"

export function Leaderboard({ variant = "table" }: WidgetProps) {
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const [sort, setSort] = useState<Key>("score")
  const ranked = [...BOARD].sort((a, b) => b.score - a.score).map((x, i) => ({ ...x, rank: i + 1 }))
  const rows = [...ranked].sort((a, b) => b[sort] - a[sort])
  const me = ranked.find((x) => x.me)!
  // As many rows as the card holds, Detail's count until measured.
  // The student's own row is always one of them: pinned under the top when it isn't in it.
  const [body, fit] = useFitRows<HTMLDivElement>(36, { min: 2, item: "tbody tr" })
  const want = fit ?? (variant === "compact" ? (standard ? 5 : 4) : detailed ? 9 : standard ? 7 : 5)
  const top = rows.slice(0, want)
  const shown = top.some((x) => x.me) ? top : [...rows.slice(0, want - 1), me]
  const head = (k: Key, label: string, className?: string) => (
    <th className={cn("h-8 px-2 text-right font-medium", className)} aria-sort={sort === k ? "descending" : "none"}>
      <button type="button" onClick={() => setSort(k)} className={cn("rounded-sm transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-(--brand-mark)", sort === k && "text-foreground")}>
        {label}
        <span aria-hidden className={cn("ml-0.5 text-[0.625rem]", sort !== k && "opacity-0")}>
          ▼
        </span>
      </button>
    </th>
  )
  return (
    <WCard icon={Trophy} title="Leaderboard" meta="Discipline score · this month · 240 traders" chip={<Chip>{`You #${me.rank}`}</Chip>}>
      <div ref={body} className="min-h-0 flex-1 overflow-hidden">
      <table className="w-full text-[0.8125rem] tabular-nums">
        <thead className="text-[0.6875rem] text-muted-foreground">
          <tr className="border-b" style={{ borderColor: "var(--w-hair, var(--border))" }}>
            <th className="h-8 w-8 px-2 text-left font-medium">#</th>
            {/* The name takes the spare width, so the figures stay together on the right of a wide card. */}
            <th className="h-8 w-full px-2 text-left font-medium">Trader</th>
            {head("score", "Score")}
            {variant !== "compact" && standard && head("win", "Win", "hidden @[26rem]:table-cell")}
            {variant !== "compact" && head("r", "R")}
            {variant !== "compact" && standard && <th className="hidden h-8 w-20 px-2 text-right font-medium @[30rem]:table-cell">Trend</th>}
          </tr>
        </thead>
        <tbody>
          {shown.map((x) => (
            <tr
              key={x.name}
              aria-current={x.me ? "true" : undefined}
              className={cn("h-9 border-b transition-colors duration-150 last:border-b-0", !x.me && "hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]")}
              style={{ borderColor: "var(--w-hair, var(--border))", background: x.me ? "color-mix(in oklab, var(--foreground) 5%, transparent)" : undefined }}
            >
              <td className="relative px-2 text-muted-foreground">
                {/* The one accent mark: a bar beside the student's own row. */}
                {x.me && <span aria-hidden className="absolute inset-y-1 left-0 w-[3px] rounded-full" style={{ background: "var(--w-accent, var(--primary))" }} />}
                {x.rank}
              </td>
              <td className="px-2">
                <span className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem] font-medium">{x.initials}</span>
                  <span className={cn("truncate", x.me && "font-medium")}>{x.name}</span>
                </span>
              </td>
              <td className="px-2 text-right font-medium">{x.score}</td>
              {variant !== "compact" && standard && <td className="hidden px-2 text-right text-muted-foreground @[26rem]:table-cell">{x.win}%</td>}
              {variant !== "compact" && (
                <td className="px-2 text-right" style={{ color: "var(--profit-text)" }}>
                  +{x.r.toFixed(1)}R
                </td>
              )}
              {variant !== "compact" && standard && (
                <td className="hidden px-2 @[30rem]:table-cell">
                  <Spark values={x.trend} tone="muted" className="h-5" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </WCard>
  )
}
