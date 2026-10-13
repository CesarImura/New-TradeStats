"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
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
      <div className="grid gap-10">
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

        <Button size="lg" className="h-12 justify-between px-4 text-[0.95rem]" disabled={!ready} onClick={next}>
          Continue <ArrowRight />
        </Button>
      </div>
    </OnbFrame>
  )
}

function Question({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 flex w-full items-baseline gap-3">
        <span className={cn(mono, "text-[var(--ts-orange)]")}>0{n}</span>
        <span className="text-[1.05rem]">{title}</span>
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
        "rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors outline-none hover:border-white/25 focus-visible:ring-2 focus-visible:ring-ring",
        on && "border-[var(--ts-orange)] bg-[color-mix(in_oklab,var(--ts-orange)_10%,transparent)] text-foreground hover:border-[var(--ts-orange)]",
        !on && "text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}
