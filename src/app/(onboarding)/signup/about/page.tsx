"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "@/components/icons"
import { Choice, OnbFrame, OnbTitle, mono } from "@/components/onboarding/frame"
import { AUDIENCES, OFFERS, TOOLS, routeFor } from "@/components/onboarding/suggest"
import { Button } from "@/components/ui/button"
import { setAccount, type Audience } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

/**
 * ONB-04 · About you. Three questions. The answers pick the route (setup call
 * or the wizard) and preselect a template and modules.
 */
export default function About() {
  const router = useRouter()
  const acc = useAccount()
  const [audience, setAudience] = useState<Audience>()
  const [tools, setTools] = useState<string[]>([])
  const [offers, setOffers] = useState<string[]>([])

  const toggle = (list: string[], id: string, set: (l: string[]) => void, only?: string) => {
    if (list.includes(id)) return set(list.filter((x) => x !== id))
    // "Nothing yet" can't be picked together with a tool.
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
    <OnbFrame right={<span className={mono}>3 quick questions</span>}>
      <div className="grid gap-6">
        <OnbTitle
          eyebrow={acc?.name ? `Hi ${acc.name.split(" ")[0]}` : "About you"}
          title="Tell us where you are today."
          text="So we can start you off in the right place. You can change everything later."
        />

        <Question n={1} title="How many paying students do you have?">
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {AUDIENCES.map((a) => (
              <Choice key={a.id} checked={audience === a.id} onClick={() => setAudience(a.id)} title={a.label} text={a.text} />
            ))}
          </div>
        </Question>

        <Question n={2} title="What do you use today?" hint="Pick all that apply">
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <Pill key={t.id} on={tools.includes(t.id)} onClick={() => toggle(tools, t.id, setTools, "none")}>
                {t.label}
              </Pill>
            ))}
          </div>
        </Question>

        <Question n={3} title="What do you offer your students?" hint="Pick all that apply">
          <div className="flex flex-wrap gap-2">
            {OFFERS.map((o) => (
              <Pill key={o.id} on={offers.includes(o.id)} onClick={() => toggle(offers, o.id, setOffers)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </Question>

        <Button className="w-full justify-between" disabled={!ready} onClick={next}>
          Continue <ArrowRight />
        </Button>
      </div>
    </OnbFrame>
  )
}

function Question({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 flex w-full items-baseline gap-2">
        <span className={cn(mono, "text-[var(--ts-interactive)]")}>0{n}</span>
        <span className="text-[0.875rem] font-medium">{title}</span>
        {hint && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "h-7 rounded-[4px] border border-[#2a2a2f] bg-[var(--ts-layer-2)] px-2.5 text-[0.78125rem] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-colors outline-none hover:border-[#3a3a40] hover:bg-[var(--ts-layer-3)] focus-visible:border-[var(--ts-interactive)] focus-visible:shadow-[0_0_0_3px_rgb(255_85_0/0.18)]",
        on && "border-[var(--ts-interactive)] bg-[color-mix(in_oklab,var(--ts-interactive)_12%,var(--ts-layer-2))] text-foreground hover:border-[var(--ts-interactive)] hover:bg-[color-mix(in_oklab,var(--ts-interactive)_16%,var(--ts-layer-2))]",
        !on && "text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}
