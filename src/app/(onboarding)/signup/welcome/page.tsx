"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarPlus } from "@/components/icons"
import { toast } from "sonner"
import { OnbFrame, OnbTitle } from "@/components/onboarding/frame"
import { AdminButton } from "@/components/admin/ui"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"

/**
 * Onboarding · 05 Welcome (Figma 521:7377): everything is on from day one. After booking a setup call it says when;
 * with a pre-approved e-mail (route A) it welcomes the coach by name.
 */
export default function Welcome() {
  const router = useRouter()
  const acc = useAccount()
  const first = acc?.name.split(" ")[0]
  const booked = acc?.call

  return (
    <OnbFrame right={acc?.name ? <span className="t-body-m text-a-text-2">{acc.name}</span> : undefined} size="lg">
      <div className="grid gap-6">
        <OnbTitle
          eyebrow={booked ? `Call booked · ${booked.date}, ${booked.time}` : "Partner access"}
          title={booked ? "Everything is on from day one." : <>Welcome{first ? `, ${first}` : ""}. You&apos;re unlocked.</>}
          text={booked ? "No trial limits while you set up. Start now or wait for the call." : "We set your account up ahead of time, so there are no questions to answer. Nothing goes live until you say so."}
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            ["Free migration", "We move your students and videos over for you."],
            ["No trial limits", "Every feature is on for 14 days."],
            ["Partner access", "A partner manager replies within hours."],
          ].map(([t, d]) => (
            <li key={t} className="grid content-start gap-1 rounded-a-10 border border-a-border px-4 py-3.5">
              <span className="t-body-m text-a-text">{t}</span>
              <span className="t-caption text-a-text-2">{d}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {booked ? (
            <AdminButton hierarchy="secondary" onClick={() => toast("Added to your calendar", { description: "Prototype: nothing is sent." })}>
              <CalendarPlus /> Add to calendar
            </AdminButton>
          ) : (
            <span />
          )}
          <AdminButton nativeButton={false} render={<Link href="/setup" onClick={() => setAccount({ route: booked ? "B" : "A" })} />} onClick={() => router.prefetch("/setup")}>
            Start setting up <ArrowRight />
          </AdminButton>
        </div>
      </div>
    </OnbFrame>
  )
}
