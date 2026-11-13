"use client"

import { useState } from "react"
import { ChoiceChip, SignupFrame, SignupTitle, useSignupGo } from "@/components/onboarding/signup-frame"
import { AdminButton } from "@/components/admin/ui"
import { setAccount, type Audience } from "@/lib/data/communities"

/**
 * Sign up · 04 About you (Figma 939:58985). Three optional questions as chips. The answers preselect the look and the
 * modules (suggest.ts); nothing here changes the route any more: everyone names their platform next.
 */
const MEMBERS: { id: string; label: string; audience: Audience }[] = [
  { id: "none", label: "None yet", audience: "starting" },
  { id: "under-100", label: "Under 100", audience: "small" },
  { id: "100-500", label: "100–500", audience: "growing" },
  { id: "500-1500", label: "500–1,500", audience: "large" },
  { id: "1500", label: "1,500+", audience: "large" },
]
const TOOLS = [
  { id: "none", label: "Nothing yet" },
  { id: "discord", label: "Discord" },
  { id: "whop", label: "Whop" },
  { id: "skool", label: "Skool" },
  { id: "kajabi", label: "Kajabi" },
  { id: "other", label: "Other" },
]
const OFFERS = [
  { id: "courses", label: "Courses" },
  { id: "calls", label: "Mentoring / 1:1" },
  { id: "live", label: "Live trading" },
  { id: "community", label: "Community" },
  { id: "other", label: "Other" },
]

export default function About() {
  const go = useSignupGo()
  const [members, setMembers] = useState<string>()
  const [tools, setTools] = useState<string[]>([])
  const [offers, setOffers] = useState<string[]>([])

  // "Nothing yet" can't sit next to a tool.
  const toggle = (list: string[], id: string, only?: string) => (list.includes(id) ? list.filter((x) => x !== id) : id === only ? [id] : [...list.filter((x) => x !== only), id])

  const next = (skip?: boolean) => {
    const m = MEMBERS.find((x) => x.id === members)
    setAccount({ answers: skip ? undefined : { audience: m?.audience ?? "starting", members, tools, offers } })
    go("/signup/name")
  }

  const question = (label: string, children: React.ReactNode, multi?: boolean) => (
    <div className="flex flex-col gap-2" role={multi ? "group" : "radiogroup"} aria-label={label}>
      <span className="t-body-m-medium text-a-text">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )

  return (
    <SignupFrame>
      <div className="flex flex-col gap-5">
        <SignupTitle title="Tell us about your coaching." text="Help us tailor TraderHub for you. All optional." />
        <div className="flex flex-col gap-6">
          {question(
            "How many members do you have today?",
            MEMBERS.map((o) => (
              <ChoiceChip key={o.id} checked={members === o.id} onClick={() => setMembers((m) => (m === o.id ? undefined : o.id))}>
                {o.label}
              </ChoiceChip>
            )),
          )}
          {question(
            "Where do you run your community today?",
            TOOLS.map((o) => (
              <ChoiceChip key={o.id} multi checked={tools.includes(o.id)} onClick={() => setTools((l) => toggle(l, o.id, "none"))}>
                {o.label}
              </ChoiceChip>
            )),
            true,
          )}
          {question(
            "What do you offer?",
            OFFERS.map((o) => (
              <ChoiceChip key={o.id} multi checked={offers.includes(o.id)} onClick={() => setOffers((l) => toggle(l, o.id))}>
                {o.label}
              </ChoiceChip>
            )),
            true,
          )}
        </div>
        {/* Figma 939:58985: Continue then Skip, on the right. */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <AdminButton size="xl" onClick={() => next()}>
            Continue
          </AdminButton>
          <AdminButton size="xl" hierarchy="ghost" className="pr-0" onClick={() => next(true)}>
            Skip
          </AdminButton>
        </div>
      </div>
    </SignupFrame>
  )
}
