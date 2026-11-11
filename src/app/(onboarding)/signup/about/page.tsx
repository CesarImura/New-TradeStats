"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Choice, OnbFrame, OnbTitle, mono } from "@/components/onboarding/frame"
import { AUDIENCES, OFFERS, TOOLS, routeFor } from "@/components/onboarding/suggest"
import { AdminButton } from "@/components/admin/ui"
import { setAccount, type Audience } from "@/lib/data/communities"
import { cn } from "@/lib/utils"

/**
 * Onboarding · 03 About you (Figma 521:7240). Three questions on one screen. The answers pick the route
 * (setup call or the wizard) and preselect a template and modules.
 */
export default function About() {
  const router = useRouter()
  const [audience, setAudience] = useState<Audience>()
  const [tools, setTools] = useState<string[]>([])
  const [offers, setOffers] = useState<string[]>([])

  const toggle = (list: string[], id: string, set: (l: string[]) => void, only?: string) => {
    if (list.includes(id)) return set(list.filter((x) => x !== id))
    // "Nothing" can't be picked together with a tool.
    if (id === only) return set([id])
    set([...list.filter((x) => x !== only), id])
  }

  const ready = audience && tools.length > 0 && offers.length > 0

  const next = () => {
    if (!audience) return
    const answers = { audience, tools, offers }
    const route = routeFor(answers)
    setAccount({ answers, route })
    router.push(route === "B" ? "/signup/call" : "/setup")
  }

  return (
    <OnbFrame size="lg" right={<><span className={cn(mono, "hidden text-a-text-3 sm:inline")}>Step 3 of 4</span><Link href="/signup/verify" className="rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">← Back</Link></>}>
      <div className="grid gap-6">
        <OnbTitle eyebrow="About you" title="Tell us where you are today." text="So we can start you off in the right place. You can change everything later." />

        <Question title="What do you offer your students?" hint="Pick all that apply">
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {OFFERS.filter((o) => o.ask).map((o) => (
              <Choice key={o.id} multi checked={offers.includes(o.id)} onClick={() => toggle(offers, o.id, setOffers)} title={o.label} />
            ))}
          </div>
        </Question>

        <Question title="How many paying students do you have?">
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1" role="radiogroup" aria-label="How many paying students do you have?">
            {AUDIENCES.map((a) => (
              <Choice key={a.id} checked={audience === a.id} onClick={() => setAudience(a.id)} title={a.label} />
            ))}
          </div>
        </Question>

        <Question title="What do you use today?">
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {TOOLS.filter((t) => t.ask).map((t) => (
              <Choice key={t.id} multi checked={tools.includes(t.id)} onClick={() => toggle(tools, t.id, setTools, "none")} title={t.label} />
            ))}
          </div>
        </Question>

        <div className="flex items-center justify-end gap-2">
          <AdminButton hierarchy="ghost" onClick={() => (setAccount({ route: "C" }), router.push("/setup"))}>Skip</AdminButton>
          <AdminButton className="min-w-28" disabled={!ready} onClick={next}>Continue</AdminButton>
        </div>
      </div>
    </OnbFrame>
  )
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2.5">
      <legend className="grid gap-0.5">
        <span className="t-body-m text-a-text">{title}</span>
        {hint && <span className="t-caption text-a-text-3">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}
