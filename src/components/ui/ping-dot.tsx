import { cn } from "@/lib/utils"

/**
 * A solid dot with two soft rings that leave it one after the other (a slow 2.8 s cycle: about 2 s of motion, then a short rest; the second ring 0.6 s late, rings grow to 2.2x): the one "live / online" effect
 * of the whole product (Admin / Live dot, the student calendar, Live now, the public sales page).
 * Colour comes from `className` (any bg-*); the rings take it too unless `ringClassName` gives a lighter tone.
 * Size is `size-2` unless `className` says otherwise. Decorative: the label next to it says what it means.
 * Reduced motion: the rings are removed and the dot stays still. Only transform and opacity move.
 * The keyframe `live-ping` lives in app/admin-tokens.css.
 */
export function PingDot({ className, ringClassName = "bg-inherit" }: { className?: string; ringClassName?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2 shrink-0 rounded-full", className)}>
      <span className={cn("absolute inset-0 rounded-full opacity-75 motion-safe:animate-[live-ping_2.8s_cubic-bezier(0.16,0.6,0.3,1)_infinite] motion-reduce:hidden", ringClassName)} />
      <span className={cn("absolute inset-0 rounded-full opacity-45 motion-safe:animate-[live-ping_2.8s_cubic-bezier(0.16,0.6,0.3,1)_600ms_infinite] motion-reduce:hidden", ringClassName)} />
    </span>
  )
}
