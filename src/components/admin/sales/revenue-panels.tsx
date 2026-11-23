"use client"

import { ArrowRight } from "@/components/icons"
import { cn } from "@/lib/utils"
import { AdminButton, EmptyState, Panel, Tag } from "../ui"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

/** The next instalments to collect (sample data of the prototype; Figma Sales 01 "Coming up"). */
export const UPCOMING = [
  { id: "u1", who: "Marco Bellini", plan: "Gold · 3 of 4", when: "25 Nov", retrying: true, amount: 1500 },
  { id: "u2", who: "Alex Moreau", plan: "Platinum · 2 of 6", when: "3 Dec", retrying: false, amount: 1600 },
  { id: "u3", who: "Lena Ito", plan: "Silver · 2 of 4", when: "4 Dec", retrying: false, amount: 600 },
  { id: "u4", who: "Tom Okafor", plan: "Gold · 2 of 4", when: "5 Dec", retrying: false, amount: 1000 },
  { id: "u5", who: "Mia Sørensen", plan: "Gold · 2 of 4", when: "12 Dec", retrying: false, amount: 1500 },
]
export type Upcoming = (typeof UPCOMING)[number]

/** Sales · 01 "Coming up": the next instalments, soonest first. */
export function ComingUp({ rows, onAll }: { rows: Upcoming[]; onAll: () => void }) {
  return (
    <Panel className="gap-0 overflow-hidden p-0">
      <header className="flex min-h-[49px] items-center justify-between gap-2 px-5 py-3">
        <h2 className="t-heading-s text-a-text">Coming up</h2>
        <AdminButton hierarchy="ghost" size="md" onClick={onAll} className="-mr-2.5">
          All instalments <ArrowRight />
        </AdminButton>
      </header>
      {rows.length === 0 ? (
        <EmptyState compact title="No instalments scheduled. Offers paid in parts show up here." className="m-5 mt-0 py-8" />
      ) : (
        <>
          <Table bare scrollLabel="Coming up">
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="max-sm:hidden">Plan</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="h-[51px] whitespace-nowrap">
                    {r.who}
                    <span className="block t-caption text-a-text-2 sm:hidden">{r.plan}</span>
                  </TableCell>
                  <TableCell className="h-[51px] whitespace-nowrap text-a-text-2 max-sm:hidden">{r.plan}</TableCell>
                  <TableCell className="h-[51px] whitespace-nowrap text-a-text-2">{r.when}</TableCell>
                  <TableCell className="h-[51px]"><Tag tone={r.retrying ? "warning" : "neutral"}>{r.retrying ? "Retrying" : "Scheduled"}</Tag></TableCell>
                  <TableCell className="h-[51px] text-right tabular-nums">€{r.amount.toLocaleString("en")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-a-border px-5 py-3 t-caption text-a-text-3">Instalments are charged on their date. A failed one is retried for 2 weeks.</p>
        </>
      )}
    </Panel>
  )
}

export type Source = { id: string; name: string; revenue: number; color: string }

/** Sales · 01 "Revenue by source": a donut with the month's total in the middle, and one line per source. */
export function SourceDonut({ sources, month, fresh }: { sources: Source[]; month: string; fresh: boolean }) {
  const total = sources.reduce((n, s) => n + s.revenue, 0)
  // Figma Sales 01 "Revenue by source": a 185 px donut, ring 10 % of its width, 18 px under the title and 13 px above the legend.
  const size = 185
  const stroke = 18.5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = 2
  // Where each slice starts: the share of everything before it.
  const starts = sources.map((_, i) => (sources.slice(0, i).reduce((n, x) => n + x.revenue, 0) / (total || 1)) * c)
  return (
    <Panel className="gap-0">
      <h2 className="mb-[18px] t-heading-s text-a-text">Revenue by source</h2>
      {fresh || total === 0 ? (
        <EmptyState compact title="No sales yet. Revenue by source shows up here." className="py-8" />
      ) : (
        <>
          <div className="flex flex-1 items-center justify-center pb-[13px]"><div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Revenue by source: ${sources.map((s) => `${s.name} ${Math.round((s.revenue / total) * 100)}%`).join(", ")}`} className="-rotate-90">
              {sources.map((s, i) => (
                <circle key={s.id} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${Math.max(0, (s.revenue / total) * c - gap)} ${c}`} strokeDashoffset={-starts[i]} />
              ))}
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <span className="t-metric text-a-text tabular-nums">€{total.toLocaleString("en")}</span>
              <span className="t-caption text-a-text-2">Total in {month}</span>
            </div>
          </div></div>
          <ul>
            {sources.map((s, i) => (
              <li key={s.id} className={cn("flex items-center gap-3", i === 0 ? "pb-3" : i === sources.length - 1 ? "pt-3" : "py-3", i < sources.length - 1 && "border-b border-a-border")}>
                <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: s.color }} />
                <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{s.name}</span>
                <span className="t-body-m text-a-text tabular-nums">€{s.revenue.toLocaleString("en")}</span>
                <span className="w-9 text-right t-caption text-a-text-3 tabular-nums">{Math.round((s.revenue / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
