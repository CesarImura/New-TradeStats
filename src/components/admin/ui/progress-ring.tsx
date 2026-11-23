import { cn } from "@/lib/utils"

/**
 * Admin / Progress ring (Figma: Course tour pill, Design progress): a track and an arc that grows with `value` (0 to 1).
 * The arc is always the progress colour (orange, `--admin-component-progress-fill`), never white or the accent: one
 * place for it, so the tour pill and the design setup cannot drift apart. A finished ring is a green check instead, not a full ring.
 * `size` is the outer diameter in px, `stroke` the thickness; the arc eases in 500 ms (still with reduced motion).
 */
export function ProgressRing({ value, size = 18, stroke = 2.5, className, label }: { value: number; size?: number; stroke?: number; className?: string; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(1, Math.max(0.06, value))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className={cn("shrink-0 -rotate-90", className)}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: "var(--admin-color-border-default)" }} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v)}
        className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        style={{ stroke: "var(--admin-component-progress-fill)" }}
      />
    </svg>
  )
}
