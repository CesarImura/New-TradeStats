import { cn } from "@/lib/utils"
import { Metric } from "./metric"
import { Panel } from "./panel"

type Stat = { label: string; value: React.ReactNode; delta?: React.ReactNode; tone?: "neutral" | "success" | "danger" }

/** Metrics in one panel (Figma: Admin / Metric × 3–4 in an Admin / Panel, 1px dividers). 2 columns on phones, one row from lg. */
export function StatPanel({ stats, className }: { stats: Stat[]; className?: string }) {
  const cols = stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
  return (
    <Panel className={cn("gap-0 overflow-hidden p-0", className)}>
      <div className={cn("grid grid-cols-2 gap-px bg-a-border", cols)}>
        {stats.map((s) => (
          <Metric key={s.label} {...s} className="bg-a-panel" />
        ))}
      </div>
    </Panel>
  )
}
