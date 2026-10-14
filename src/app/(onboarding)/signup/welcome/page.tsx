"use client"

import Link from "next/link"
import { ArrowRight, Check } from "@/components/icons"
import { OnbFrame, OnbTitle, mono } from "@/components/onboarding/frame"
import { Button } from "@/components/ui/button"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

/** ONB-03 · Route A: the e-mail was pre-approved by us. No questions, straight into setup. */
export default function Welcome() {
  const acc = useAccount()
  const first = acc?.name.split(" ")[0]

  return (
    <OnbFrame>
      <div className="grid gap-5">
        <div className="grid size-12 place-items-center bg-[var(--ts-cta)] text-[#040404]">
          <Check className="size-6" strokeWidth={2.5} />
        </div>
        <OnbTitle
          eyebrow="Partner access"
          title={<>Welcome{first ? `, ${first}` : ""}. You&apos;re unlocked.</>}
          text="We set your account up ahead of time, so there are no questions to answer. Setting up takes about 15 minutes, and nothing goes live until you say so."
        />
        <ul className="grid gap-px border bg-border">
          {[
            ["No trial limits", "Everything is on from day one."],
            ["A direct line", "Your partner manager answers within a few hours."],
            ["Free migration", "We move your students and videos over for you."],
          ].map(([t, d]) => (
            <li key={t} className="flex items-baseline gap-4 bg-background px-4 py-3">
              <span className={cn(mono, "w-32 shrink-0 text-foreground")}>{t}</span>
              <span className="text-sm text-muted-foreground">{d}</span>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          className="w-full justify-between"
          nativeButton={false}
          render={<Link href="/setup" onClick={() => setAccount({ route: "A" })} />}
        >
          Set up my platform <ArrowRight />
        </Button>
      </div>
    </OnbFrame>
  )
}
