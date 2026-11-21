import { PingDot } from "@/components/ui/ping-dot"
import { cn } from "@/lib/utils"

const TONE = {
  success: { dot: "bg-a-success-fill", ring: "bg-a-success" },
  danger: { dot: "bg-a-danger-fill", ring: "bg-a-danger" },
} as const

/**
 * Admin / Live dot (Figma Components › Admin · 08 Data display, Tone Success / Danger): the product's PingDot in the Admin status colours.
 * Use it only where something is happening right now (students online, a stream on air). 8 px by default; `size-1.5` for a smaller one.
 */
export function LiveDot({ tone = "success", className }: { tone?: keyof typeof TONE; className?: string }) {
  const t = TONE[tone]
  return <PingDot className={cn(t.dot, className)} ringClassName={t.ring} />
}
