"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, MessageCircle, Monitor, PlayCircle, Smartphone } from "@/components/icons"
import { GuideDialog } from "@/components/admin/design/editor-shell"
import { PreviewFrame } from "@/components/admin/design/preview-frame"
import { Button } from "@/components/ui/button"
import { DEMO_ADMIN } from "@/lib/data/account"
import { DEFAULT_WORDING } from "@/lib/data/coaches"
import { account, customCommunities, saveCommunity, setAccount, updateCommunity, type CustomCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { LOOKS } from "@/components/admin/design/looks"
import { EMPTY, mergeOverrides, setDraft } from "@/lib/prototype-store"
import { uid } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { OnbFrame, mono } from "./frame"
import { BrandLookStep, TierStep } from "./steps"
import { suggestedModules, suggestedTemplate } from "./suggest"
import { WizardDesign } from "./wizard-design"

export type StepProps = {
  community: CustomCommunity
  update: (patch: Partial<CustomCommunity>) => void
  /** Lets a step hold Continue back until it has what it needs. */
  setReady: (ready: boolean) => void
}

type Preview = { path: (slug: string) => string; label: string }
const home: Preview = { path: (slug) => `/c/${slug}`, label: "Home" }

/**
 * Setup is only what a coach needs to open their platform: brand and look, then a first membership.
 * Menu, Pages, videos and payouts wait on the admin Overview's checklist (admin/setup-checklist.tsx).
 */
type Guide = { title: string; text: string; minutes: number }

const STEPS: { id: string; label: string; title: string; text: string; skip?: string; guide: Guide; preview: Preview; Step: React.ComponentType<StepProps> }[] = [
  { id: "brand", label: "Brand and look", title: "Your brand and look", text: "Logo, name and colour, then a ready-made look. Fine-tune it later in Design.", guide: { title: "Your brand and look", text: "Upload a logo (we suggest the colours), name your platform and pick a look. Fonts, roundness and widgets wait in Design.", minutes: 1 }, preview: home, Step: BrandLookStep },
  { id: "tier", label: "Membership", title: "Create your first membership", text: "What students join. Add more tiers, payouts and bundles later.", guide: { title: "Your first membership", text: "Free or paid, the price, a trial and a second tier.", minutes: 1 }, preview: { path: (slug) => `/site/${slug}#tiers`, label: "Sales page · prices" }, Step: TierStep },
]

/** The preview address with ?preview=draft before any #hash. */
const draftSrc = (path: string) => {
  const [url, hash] = path.split("#")
  return `${url}?preview=draft${hash ? `#${hash}` : ""}`
}

/**
 * ONB-08 to ONB-17 · The setup wizard. Each step writes straight into the
 * new community, so the live preview on the right is the real platform.
 * Nothing is public until Publish (ONB-15).
 */
export function SetupWizard() {
  const router = useRouter()
  const acc = useAccount()
  const communities = useCustomCommunities()
  const [ready, setReady] = useState(true)
  const [device, setDevice] = useState<"desktop" | "phone">("desktop")
  const [guideOpen, setGuideOpen] = useState(false)

  // Start a community, or pick up the one being set up. "?new=1" (from the
  // admin's community switcher) always starts a fresh one.
  useEffect(() => {
    const fresh = new URLSearchParams(location.search).has("new")
    const a = account()
    const existing = a?.setupSlug ? customCommunities().find((c) => c.slug === a.setupSlug) : undefined
    if (existing && existing.status === "setup" && !fresh) return
    const name = a?.name || DEMO_ADMIN.name
    const slug = `new-${uid().slice(-5)}`
    const template = suggestedTemplate(a?.answers)
    saveCommunity({
      slug,
      org: name,
      name: `${name.split(" ")[0]} Trading`,
      coachName: name.split(" ")[0],
      mark: name.split(" ")[0].slice(0, 1).toUpperCase(),
      tagline: "",
      template,
      overrides: {},
      wording: DEFAULT_WORDING,
      modules: suggestedModules(a?.answers),
      menu: ["courses", "calendar", "charts", "journal", "community", "ai", "ranking", "downloads", "partners"],
      tiers: [],
      status: "setup",
      createdAt: new Date().toISOString(),
    })
    // Start on the look that fits, so the Look step has it selected (as picking it there would).
    const look = LOOKS.find((l) => l.template === template)
    if (look) setDraft(slug, mergeOverrides(EMPTY, { theme: { template: look.template, ...look.set } }))
    setAccount({ ...(a ? {} : { name, email: DEMO_ADMIN.email, verified: true, approved: false }), setupSlug: slug, step: 0 })
    if (fresh) history.replaceState(null, "", "/setup")
  }, [])

  const community = communities.find((c) => c.slug === acc?.setupSlug)
  const step = Math.min(acc?.step ?? 0, STEPS.length - 1)
  if (!community) return <OnbFrame wide>{null}</OnbFrame>

  const S = STEPS[step]
  const go = (n: number) => {
    setReady(true)
    if (S.id === "tier" && n > step) update({ setup: { ...community.setup, membership: true } })
    if (n >= STEPS.length) return router.push("/setup/publish")
    setAccount({ step: Math.max(0, n) })
  }
  const update = (patch: Partial<CustomCommunity>) => updateCommunity(community.slug, patch)

  return (
    <OnbFrame
      wide
      right={
        <>
          <span className={cn(mono, "hidden sm:inline")}>
            Step {step + 1} of {STEPS.length}
          </span>
          <Link href="/signup/call" title="Let us set it up for you" className="flex items-center gap-1.5 text-foreground hover:underline hover:underline-offset-4">
            <MessageCircle className="size-3.5" />
            <span className="hidden md:inline">Let us set it up for you</span>
          </Link>
          <Link href={`/admin/${community.slug}`} className="text-foreground underline underline-offset-4">
            Save and exit
          </Link>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(400px,480px)_1fr]">
        {/* Left: the step */}
        <div className="flex min-h-0 flex-col border-r bg-card">
          <nav aria-label="Setup steps" className="flex gap-1 border-b px-4 py-2.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => i < step && go(i)}
                disabled={i > step}
                title={s.label}
                aria-current={i === step ? "step" : undefined}
                className="group -my-[11px] grid flex-1 gap-1.5 py-[11px] text-left disabled:cursor-default"
              >
                <span className={cn("h-0.5 w-full bg-white/12", i < step && "bg-[var(--ts-cta)]", i === step && "bg-[var(--ts-interactive)]")} />
                <span className={cn(mono, "hidden truncate text-[0.6rem] text-muted-foreground xl:block", i === step && "text-foreground", i < step && "group-hover:text-foreground")}>
                  {s.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-5">
            <div className="grid gap-5">
              <div className="grid gap-1.5 border-b pb-4">
                <span className={cn(mono, "text-[var(--ts-interactive)]")}>
                  {String(step + 1).padStart(2, "0")} · {S.label}
                </span>
                <h1 className="text-lg leading-6 font-medium tracking-[-0.01em]">{S.title}</h1>
                <p className="text-sm text-muted-foreground">{S.text}</p>
                <button onClick={() => setGuideOpen(true)} className="mt-0.5 flex w-fit items-center gap-1.5 text-sm text-[var(--ts-interactive)] hover:underline hover:underline-offset-4">
                  <PlayCircle className="size-4" /> Watch the {S.guide.minutes}-minute guide
                </button>
              </div>
              <WizardDesign community={community}>
                <S.Step key={S.id} community={community} update={update} setReady={setReady} />
              </WizardDesign>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t px-4 py-2.5 md:px-5">
            {step > 0 && (
              <Button variant="ghost" onClick={() => go(step - 1)}>
                <ArrowLeft /> Back
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {S.skip && (
                <Button variant="ghost" onClick={() => go(step + 1)}>
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
        <div className="relative hidden min-h-0 flex-col bg-background lg:flex">
          <div className="flex h-9 items-center justify-between gap-3 border-b bg-[var(--sidebar)] px-3">
            <span className={cn(mono, "flex items-center gap-2 text-muted-foreground")}>
              <span className="size-1.5 rounded-full bg-[var(--ts-interactive)]" /> Live preview · {S.preview.label} · not public yet
            </span>
            <div className="flex rounded-[4px] border border-[#2a2a2f] bg-[#0e0e10] p-0.5" role="radiogroup" aria-label="Preview size">
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
                  className={cn("grid size-6 place-items-center rounded-[3px] text-muted-foreground hover:text-foreground", device === d && "bg-[var(--ts-layer-3)] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]")}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <PreviewFrame src={draftSrc(S.preview.path(community.slug))} device={device} />
          </div>
        </div>
      </div>
      <GuideDialog title={S.guide.title} text={S.guide.text} open={guideOpen} onOpenChange={setGuideOpen} />
    </OnbFrame>
  )
}

/** A done/not-done row, used on the publish screen. */
export function DoneRow({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className={cn("grid size-3.5 shrink-0 place-items-center rounded-[3px] border border-[#4a4a52] bg-[#0e0e10]", done && "border-[var(--ts-cta)] bg-[var(--ts-cta)] text-[#040404]")}>
        {done && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className={cn(!done && "text-muted-foreground")}>{children}</span>
    </li>
  )
}
