import { cn } from "@/lib/utils"
import type { Coach } from "@/lib/data/coaches"

/** Stand-in for the coach's uploaded logo: a mark tile plus the platform name. */
export function CoachLogo({
  coach,
  showName = true,
  className,
}: {
  coach: Coach
  showName?: boolean
  className?: string
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {coach.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coach.logo} alt="" className="size-8 shrink-0 rounded-[min(var(--radius),10px)] object-contain" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-[min(var(--radius),10px)] bg-primary font-heading text-sm text-primary-foreground">
          {coach.mark}
        </span>
      )}
      {showName && <span className="truncate font-heading text-[0.95rem] leading-tight">{coach.name}</span>}
    </span>
  )
}
