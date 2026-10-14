"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Monitor, Smartphone } from "@/components/icons"
import { PreviewFrame } from "@/components/admin/design/preview-frame"
import { Button } from "@/components/ui/button"
import { DEMO_ADMIN } from "@/lib/data/account"
import { DEFAULT_WORDING } from "@/lib/data/coaches"
import { account, customCommunities, saveCommunity, setAccount, updateCommunity, type CustomCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { uid } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { OnbFrame, mono } from "./frame"
import { AddressStep, BrandStep, ModulesStep, PayoutsStep, TemplateStep, TierStep } from "./steps"
import { suggestedModules, suggestedTemplate } from "./suggest"
import { HomeStep, StyleStep } from "./look-steps"
import { VideosStep } from "./videos-step"

export type StepProps = {
  community: CustomCommunity
  update: (patch: Partial<CustomCommunity>) => void
  /** Lets a step hold Continue back until it has what it needs. */
  setReady: (ready: boolean) => void
}

const STEPS: { id: string; label: string; title: string; text: string; skip?: string; Step: React.ComponentType<StepProps> }[] = [
  { id: "template", label: "Template", title: "Pick a starting point", text: "Each one is a complete look. You'll make it yours in the next steps.", Step: TemplateStep },
  { id: "address", label: "Name", title: "Name your platform", text: "This is what your students see in the menu, in e-mails and on the login page.", Step: AddressStep },
  { id: "brand", label: "Logo & colours", title: "Add your logo and colour", text: "We'll suggest colours from your logo. Everything else follows from them.", Step: BrandStep },
  { id: "style", label: "Fonts & style", title: "Fonts and style", text: "Pick a font pair and how round things are. Everything else is under More.", skip: "Keep the template's style", Step: StyleStep },
  { id: "modules", label: "Sections & menu", title: "What's on your platform?", text: "Switch on what you offer and call it your way. Hidden sections stay ready for later.", Step: ModulesStep },
  { id: "home", label: "Home", title: "Pick a Home page", text: "What students see first after they log in.", skip: "Keep the template's Home", Step: HomeStep },
  { id: "tier", label: "First tier", title: "Create your first membership", text: "What students join. Add more tiers and bundles later.", Step: TierStep },
  { id: "videos", label: "Videos", title: "Bring your first videos", text: "Drop a folder. We'll suggest modules and lessons from the file names.", skip: "Add videos later", Step: VideosStep },
  { id: "payouts", label: "Get paid", title: "Get paid", text: "Connect where your money goes. Free tiers work without it.", skip: "Do this later", Step: PayoutsStep },
]

/**
 * ONB-08 to ONB-14 · The setup wizard. Each step writes straight into the
 * new community, so the live preview on the right is the real platform.
 * Nothing is public until Publish (ONB-15).
 */
export function SetupWizard() {
  const router = useRouter()
  const acc = useAccount()
  const communities = useCustomCommunities()
  const [ready, setReady] = useState(true)
  const [device, setDevice] = useState<"desktop" | "phone">("desktop")

  // Start a community, or pick up the one being set up. "?new=1" (from the
  // admin's community switcher) always starts a fresh one.
  useEffect(() => {
    const fresh = new URLSearchParams(location.search).has("new")
    const a = account()
    const existing = a?.setupSlug ? customCommunities().find((c) => c.slug === a.setupSlug) : undefined
    if (existing && existing.status === "setup" && !fresh) return
    const name = a?.name || DEMO_ADMIN.name
    const slug = `new-${uid().slice(-5)}`
    saveCommunity({
      slug,
      org: name,
      name: `${name.split(" ")[0]} Trading`,
      coachName: name.split(" ")[0],
      mark: name.split(" ")[0].slice(0, 1).toUpperCase(),
      tagline: "",
      template: suggestedTemplate(a?.answers),
      overrides: {},
      wording: DEFAULT_WORDING,
      modules: suggestedModules(a?.answers),
      menu: ["courses", "calendar", "charts", "journal", "community", "ai", "ranking"],
      tiers: [],
      status: "setup",
      createdAt: new Date().toISOString(),
    })
    setAccount({ ...(a ? {} : { name, email: DEMO_ADMIN.email, verified: true, approved: false }), setupSlug: slug, step: 0 })
    if (fresh) history.replaceState(null, "", "/setup")
  }, [])

  const community = communities.find((c) => c.slug === acc?.setupSlug)
  const step = Math.min(acc?.step ?? 0, STEPS.length - 1)
  if (!community) return <OnbFrame wide>{null}</OnbFrame>

  const S = STEPS[step]
  const go = (n: number) => {
    setReady(true)
    if (n >= STEPS.length) return router.push("/setup/publish")
    setAccount({ step: Math.max(0, n) })
  }
  const update = (patch: Partial<CustomCommunity>) => updateCommunity(community.slug, patch)
  const stepDone = (S.id === "videos" && !!community.setup?.courses?.length) || (S.id === "payouts" && community.setup?.payouts === "connected")

  return (
    <OnbFrame
      wide
      right={
        <>
          <span className={cn(mono, "hidden sm:inline")}>
            Step {step + 1} of {STEPS.length}
          </span>
          <Link href={`/admin/${community.slug}`} className="text-foreground underline underline-offset-4">
            Save and exit
          </Link>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(400px,480px)_1fr]">
        {/* Left: the step */}
        <div className="flex min-h-0 flex-col border-r">
          <nav aria-label="Setup steps" className="flex gap-1 border-b px-5 py-3">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => i < step && go(i)}
                disabled={i > step}
                title={s.label}
                aria-current={i === step ? "step" : undefined}
                className="group grid flex-1 gap-1.5 text-left disabled:cursor-default"
              >
                <span className={cn("h-0.5 w-full bg-white/12", i < step && "bg-[var(--ts-cta)]", i === step && "bg-[var(--ts-interactive)]")} />
                <span className={cn(mono, "hidden truncate text-[0.6rem] text-muted-foreground xl:block", i === step && "text-foreground", i < step && "group-hover:text-foreground")}>
                  {s.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
            <div className="grid gap-7">
              <div className="grid gap-2.5">
                <span className={cn(mono, "text-[var(--ts-interactive)]")}>
                  {String(step + 1).padStart(2, "0")} · {S.label}
                </span>
                <h1 className="text-[1.75rem] leading-[1.1] font-normal tracking-tight">{S.title}</h1>
                <p className="text-sm text-muted-foreground">{S.text}</p>
              </div>
              <S.Step key={S.id} community={community} update={update} setReady={setReady} />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t px-5 py-3 md:px-8">
            {step > 0 && (
              <Button variant="ghost" onClick={() => go(step - 1)}>
                <ArrowLeft /> Back
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {S.skip && !stepDone && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (S.id === "payouts") update({ setup: { ...community.setup, payouts: community.setup?.payouts ?? "later" } })
                    go(step + 1)
                  }}
                >
                  {S.skip}
                </Button>
              )}
              <Button disabled={!ready} onClick={() => go(step + 1)} className="min-w-32 justify-between">
                {step === STEPS.length - 1 ? "Review and publish" : "Continue"} <ArrowRight />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: the real platform, as students will see it */}
        <div className="relative hidden min-h-0 flex-col bg-[#0b0b0b] lg:flex">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-2.5">
            <span className={cn(mono, "flex items-center gap-2 text-muted-foreground")}>
              <span className="size-1.5 rounded-full bg-[var(--ts-interactive)]" /> Live preview · not public yet
            </span>
            <div className="flex rounded-[var(--radius)] border p-0.5" role="radiogroup" aria-label="Preview size">
              {(
                [
                  ["desktop", Monitor],
                  ["phone", Smartphone],
                ] as const
              ).map(([d, Icon]) => (
                <button
                  key={d}
                  role="radio"
                  aria-checked={device === d}
                  aria-label={d}
                  onClick={() => setDevice(d)}
                  className={cn("grid size-7 place-items-center rounded-[2px] text-muted-foreground", device === d && "bg-white/10 text-foreground")}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <PreviewFrame src={`/c/${community.slug}?preview=draft`} device={device} />
          </div>
        </div>
      </div>
    </OnbFrame>
  )
}

/** A done/not-done row, used on the publish screen. */
export function DoneRow({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className={cn("grid size-4 shrink-0 place-items-center border border-white/25", done && "border-[var(--ts-cta)] bg-[var(--ts-cta)] text-[#040404]")}>
        {done && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className={cn(!done && "text-muted-foreground")}>{children}</span>
    </li>
  )
}
