import { cn } from "@/lib/utils"

/** Admin / Metric (583:539): Mono label, Display value, delta line. Tone colours only the delta. */
export function Metric({ label, value, delta, tone = "neutral", wrap, className }: { label: string; value: React.ReactNode; delta?: React.ReactNode; tone?: "neutral" | "success" | "danger"; /** Let a long line run to two lines instead of cutting it with an ellipsis. */ wrap?: boolean; className?: string }) {
  return (
    <div className={cn("@container flex min-w-0 flex-col gap-1.5 px-5 py-[18px]", className)}>
      <span className="t-mono-label truncate text-a-text-2">{label}</span>
      <span className="t-title @min-[200px]:t-display text-a-text tabular-nums [overflow-wrap:anywhere]">{value}</span>
      {delta && (
        <span title={typeof delta === "string" ? delta : undefined} className={cn("t-body-m", wrap ? "line-clamp-2" : "max-lg:line-clamp-2 lg:truncate lg:@min-[290px]:overflow-visible lg:@min-[290px]:text-clip", tone === "success" ? "text-a-success" : tone === "danger" ? "text-a-danger" : "text-a-text-2")}>{delta}</span>
      )}
    </div>
  )
}
