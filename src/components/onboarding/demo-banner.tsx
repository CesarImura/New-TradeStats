"use client"

import Link from "next/link"
import { CalendarClock, X } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"

/**
 * ONB-07 · A coach who booked a setup call explores a filled example
 * platform until then. This stays on top so it's never mistaken for theirs.
 */
export function DemoBanner() {
  const acc = useAccount()
  const { coach } = useCoach()
  if (!acc?.call || acc.setupSlug || coach.slug !== "northline") return null
  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex w-[min(52rem,calc(100vw-2rem))] md:bottom-16 -translate-x-1/2 flex-wrap items-center gap-x-4 gap-y-1 rounded-[3px] bg-[#222226] px-4 py-2.5 text-sm text-white shadow-2xl ring-1 ring-white/10">
      <span className="rounded-[2px] bg-[#f8ff9e] px-1.5 py-0.5 font-[family-name:var(--ff-geist-mono)] text-[0.65rem] tracking-wider text-[#040404] uppercase">
        Demo
      </span>
      <span className="text-white/80">This is an example platform to click around. Nothing you change here is kept.</span>
      <span className="flex items-center gap-1.5 text-white/60">
        <CalendarClock className="size-3.5" /> Your setup call: {acc.call.date}, {acc.call.time}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-3">
        <Link href="/setup" onClick={() => setAccount({ route: "C" })} className="underline underline-offset-4">
          Start setting up myself
        </Link>
        <button onClick={() => setAccount({ call: undefined, route: undefined })} aria-label="Leave the demo (prototype reset)" className="text-white/50 hover:text-white">
          <X className="size-4" />
        </button>
      </span>
    </div>
  )
}
