"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, CircleAlert, Loader2, PlayCircle } from "@/components/icons"
import { GuideDialog } from "@/components/admin/design/editor/editor-shell"
import { PreviewFrame } from "@/components/admin/design/editor/preview-frame"
import { AdminButton, AdminSegmented, Callout } from "@/components/admin/ui"
import { currentLook } from "@/components/admin/design/looks"
import { DEMO_ADMIN } from "@/lib/data/account"
import { DEFAULT_WORDING } from "@/lib/data/coaches"
import { account, customCommunities, renameSlug, saveCommunity, setAccount, slugify, updateCommunity, type CustomCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { LOOKS } from "@/components/admin/design/looks"
import { EMPTY, mergeOverrides, publish as publishDraft, setDraft, useOverrides } from "@/lib/prototype-store"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { uid } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { OnbFrame } from "./frame"
import { BrandLookStep, TierStep } from "./steps"
import { suggestedModules, suggestedTemplate } from "./suggest"
import { WizardDesign } from "./wizard-design"

export type StepProps = {
  community: CustomCommunity
  update: (patch: Partial<CustomCommunity>) => void
  /** Lets a step hold Continue back until it has what it needs. */
  setReady: (ready: boolean) => void
  /** Jump to another step (the review's "Fix"). */
  goTo?: (n: number) => void
}

type Preview = { path: (slug: string) => string; label: string }
const home: Preview = { path: (slug) => `/c/${slug}`, label: "Home" }

/**
 * Setup is only what a coach needs to open their platform: brand and look, then a first membership.
 * Menu, Pages, videos and payouts wait on the admin Overview's checklist (admin/setup-checklist.tsx).
 */
type Guide = { title: string; text: string; minutes: number }

const STEPS: { id: string; label: string; title: string; text: string; guide: Guide; preview: Preview; Step: React.ComponentType<StepProps> }[] = [
  { id: "brand", label: "Brand and template", title: "Your brand and look", text: "Pick a template once. Every page, colour and widget can be changed later in Design.", guide: { title: "Your brand and look", text: "Upload a logo (we suggest the colours), name your platform and pick a look. Fonts, roundness and widgets wait in Design.", minutes: 1 }, preview: home, Step: BrandLookStep },
  { id: "tier", label: "First membership", title: "Your first membership", text: "What students join. Add more tiers, payouts and bundles later in Sales.", guide: { title: "Your first membership", text: "Free or paid, the price, a trial and a second tier.", minutes: 1 }, preview: { path: (slug) => `/site/${slug}#tiers`, label: "Sales page · prices" }, Step: TierStep },
  { id: "review", label: "Review and publish", title: "Ready when you are", text: "Check what students will see. You can keep editing after you publish.", guide: { title: "Review and publish", text: "What is ready and what can wait. Nothing blocks publishing.", minutes: 1 }, preview: home, Step: ReviewStep },
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
  const [publishing, setPublishing] = useState(false)

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
  const last = step === STEPS.length - 1
  const update = (patch: Partial<CustomCommunity>) => updateCommunity(community.slug, patch)
  const go = (n: number) => {
    setReady(true)
    if (S.id === "tier" && n > step) update({ setup: { ...community.setup, membership: true } })
    setAccount({ step: Math.max(0, Math.min(n, STEPS.length - 1)) })
  }
  const address = community.address || slugify(community.name)
  const publish = () => {
    setPublishing(true)
    setTimeout(() => {
      publishDraft(community.slug, "Published from setup")
      updateCommunity(community.slug, { status: "live" })
      renameSlug(community.slug, address)
      setAccount({ setupSlug: address, step: undefined })
      router.push(`/setup/invite?c=${address}`)
    }, 900)
  }
  const tier = community.tiers[0]
  const sub = (id: string) => (id === "brand" ? community.name : id === "tier" && tier ? `${tier.name} · ${tier.price === "Free" ? "Free" : `${tier.price}/${tier.cadence === "month" ? "mo" : tier.cadence}`}` : "")

  return (
    <OnbFrame
      wide
      suffix="Setup"
      right={
        <>
          <span className="hidden t-caption text-a-text-3 sm:inline">Saved</span>
          <Link href="/signup/call" className="hidden rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus md:inline">Let us set it up for you</Link>
          <AdminButton nativeButton={false} render={<Link href={`/admin/${community.slug}`} />} hierarchy="secondary" size="lg">Exit</AdminButton>
        </>
      }>
      <div data-design-ws className="grid min-h-0 flex-1 [--background:#0b0b0c] [--border:rgb(255_255_255/0.08)] [--ts-interactive:#f4f4f5] lg:grid-cols-[240px_minmax(420px,520px)_1fr]">
        {/* Rail: where you are */}
        <nav aria-label="Setup steps" className="hidden flex-col gap-1.5 border-r border-a-border p-4 lg:flex">
          <span className="px-2 pb-1 t-mono-label-s text-a-text-3">Setup steps</span>
          {STEPS.map((x, i) => {
            const done = i < step
            return (
              <button key={x.id} type="button" onClick={() => i < step && go(i)} disabled={i > step} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-3 rounded-a-md border px-3 py-2.5 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus disabled:cursor-default", i === step ? "border-a-border-active bg-a-raised" : "border-transparent enabled:hover:bg-a-hover")}>
                <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full t-caption tabular-nums", done ? "bg-a-accent text-[var(--admin-component-button-primary-content)]" : i === step ? "bg-a-accent text-[var(--admin-component-button-primary-content)]" : "border border-a-border-strong text-a-text-3")}>
                  {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="grid min-w-0">
                  <span className={cn("truncate t-body-m", i > step ? "text-a-text-2" : "text-a-text")}>{x.label}</span>
                  {done && sub(x.id) && <span className="truncate t-caption text-a-text-2">{sub(x.id)}</span>}
                </span>
              </button>
            )
          })}
        </nav>

        {/* The step */}
        <div className="flex min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <span className="t-mono-label-s text-a-text-accent">Step {step + 1} of {STEPS.length}</span>
                <h1 className="t-title leading-[1.15]! text-a-text">{S.title}</h1>
                <p className="t-body-m text-a-text-2">{S.text}</p>
                <button onClick={() => setGuideOpen(true)} className="mt-0.5 flex w-fit items-center gap-1.5 rounded-a-xs t-caption text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
                  <PlayCircle className="size-3.5" /> Watch the {S.guide.minutes}-minute guide
                </button>
              </div>
              <WizardDesign community={community}>
                <S.Step key={S.id} community={community} update={update} setReady={setReady} goTo={go} />
              </WizardDesign>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-a-border px-6 py-4 md:px-8">
            {step > 0 ? <AdminButton hierarchy="ghost" onClick={() => go(step - 1)}>Back</AdminButton> : <span />}
            <div className="ml-auto flex items-center gap-2">
              {last ? (
                <AdminButton disabled={publishing} onClick={publish} className="min-w-32">
                  {publishing ? <><Loader2 className="animate-spin" /> Publishing…</> : `Publish ${community.name}`}
                </AdminButton>
              ) : (
                <AdminButton disabled={!ready} onClick={() => go(step + 1)} className="min-w-28">
                  Continue <ArrowRight />
                </AdminButton>
              )}
            </div>
          </div>
        </div>

        {/* Right: the real platform, as students will see it */}
        <div className="relative hidden min-h-0 flex-col border-l border-a-border lg:flex">
          <div className="flex h-14 items-center justify-between gap-3 px-6">
            <span className="t-mono-label-s text-a-text-3">Live preview</span>
            <AdminSegmented size="sm" label="Preview size" value={device} onChange={setDevice} options={[{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }]} className="w-[160px]" />
          </div>
          <div className="min-h-0 flex-1 px-6 pb-6">
            <div className="h-full overflow-hidden rounded-a-lg border border-a-border">
              <PreviewFrame src={draftSrc(S.preview.path(community.slug))} device={device} />
            </div>
          </div>
        </div>
      </div>
      <GuideDialog title={S.guide.title} text={S.guide.text} open={guideOpen} onOpenChange={setGuideOpen} />
    </OnbFrame>
  )
}

/** Step 3: what is ready and what can wait. Nothing blocks publishing. */
function ReviewStep({ community, goTo }: StepProps) {
  const draft = useOverrides(community.slug, "draft")
  const c = { ...community, ...resolveCoach(community, draft.content) }
  const look = currentLook(resolveTheme(c, draft.theme))
  const address = c.address || slugify(c.name)
  const tier = c.tiers[0]
  const rows: { ok: boolean; title: string; text: string; fix?: React.ReactNode }[] = [
    { ok: true, title: "Brand and template", text: `${c.name}${look ? ` · ${look.name}` : ""}` },
    { ok: true, title: "Your address", text: `${address}.traderhub.io` },
    { ok: !!tier, title: tier?.name || "No tier yet", text: tier ? `${tier.price === "Free" ? "Free" : `${tier.price}/${tier.cadence === "month" ? "mo" : tier.cadence}`}${(c.setup?.trial ?? 0) > 0 ? ` · ${c.setup?.trial}-day trial` : ""}` : "Add your first membership", fix: <AdminButton hierarchy="ghost" size="md" onClick={() => goTo?.(1)}>Fix</AdminButton> },
    { ok: !!c.logo, title: c.logo ? "Logo added" : "No logo yet", text: c.logo ? "Students see your logo" : "Students see your initials until you add one", fix: <AdminButton hierarchy="ghost" size="md" onClick={() => goTo?.(0)}>Fix</AdminButton> },
    { ok: false, title: "No course yet", text: "Add one now or after publishing", fix: <AdminButton hierarchy="ghost" size="md" nativeButton={false} render={<Link href={`/admin/${c.slug}/content`} />}>Fix</AdminButton> },
  ]
  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-a-border overflow-hidden rounded-a-lg border border-a-border">
        {rows.map((r) => (
          <li key={r.title} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full", r.ok ? "bg-a-success-soft text-a-success" : "bg-a-warning-soft text-a-warning")}>
              {r.ok ? <Check className="size-3" strokeWidth={3} /> : <CircleAlert className="size-3" />}
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="t-body-m text-a-text">{r.title}</span>
              <span className="truncate t-caption text-a-text-2">{r.text}</span>
            </span>
            {!r.ok && r.fix}
          </li>
        ))}
      </ul>
      <Callout>Nothing is charged until a student joins.</Callout>
    </div>
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
