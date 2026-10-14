"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Camera, Check, PlayCircle } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTiers } from "@/lib/data/access"
import { usePurchase } from "@/lib/data/sales-page"
import { saveStudentStart, useOnboardingSettings, useStudentStart } from "@/lib/data/student-start"
import { setStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

const EXPERIENCE = ["Just starting", "Under a year", "1–3 years", "More than 3 years"]
const MARKETS = ["Futures", "Forex", "Stocks", "Crypto", "Options", "Indices"]
const GOALS = ["Pass a prop challenge", "A second income", "Trade full-time", "Understand the markets"]

function Choices({ options, value, onChange, multi }: { options: string[]; value: string | string[]; onChange: (v: string) => void; multi?: boolean }) {
  const on = (o: string) => (multi ? (value as string[]).includes(o) : value === o)
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={on(o)}
          onClick={() => onChange(o)}
          className={cn("r-chip flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors", on(o) ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
        >
          {multi && on(o) && <Check className="size-3.5" />}
          {o}
        </button>
      ))}
    </div>
  )
}

/** STO-01 welcome, STO-02 short profile, STO-03 link Discord. Every step can be skipped; the tour (STO-04) runs on Home. */
export function StudentStart() {
  const { coach } = useCoach()
  const router = useRouter()
  const settings = useOnboardingSettings(coach.slug)
  const state = useStudentStart(coach.slug)
  const purchase = usePurchase(coach.slug)
  const tiers = useTiers(coach)
  const tier = tiers.find((t) => t.id === purchase?.tier) ?? tiers[0]
  const q = settings.questions
  const askProfile = q.nickname || q.experience || q.markets || q.goal
  const askDiscord = settings.discord && coach.modules.community
  const steps = ["welcome", ...(askProfile ? ["profile"] : []), ...(askDiscord ? ["discord"] : [])] as const
  const [i, setI] = useState(0)
  const step = steps[i]
  const [linked, setLinked] = useState(false)
  const p = state.profile
  const setP = (patch: Partial<typeof p>) => saveStudentStart(coach.slug, (s) => ({ ...s, profile: { ...s.profile, ...patch } }))
  const first = purchase?.name?.split(" ")[0] || "there"

  const next = () => {
    if (i < steps.length - 1) return setI(i + 1)
    saveStudentStart(coach.slug, (s) => ({ ...s, stage: "new", tour: settings.tour, dismissed: false }))
    router.push(`/c/${coach.slug}`)
  }

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8 sm:py-14">
      <div className="grid w-full max-w-xl gap-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {steps.map((s, j) => (
              <span key={s} className={cn("h-1 flex-1 rounded-full bg-muted", j <= i && "bg-primary")} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {i + 1} of {steps.length}
          </span>
        </div>

        <div className="grid gap-6 rounded-(--radius) bg-card p-6 text-card-foreground sm:p-8" style={{ boxShadow: "var(--card-shadow)" }}>
          {step === "welcome" && (
            <>
              <div className="grid gap-1.5">
                <span className="eyebrow">Welcome to {coach.name}</span>
                <h1 className="text-3xl leading-tight">Hi {first}, good to have you.</h1>
              </div>
              {/* Buyers just saw the video on the thank-you page; invited and free members see it here. */}
              {settings.video && !purchase && (
                <button className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-(--radius) bg-primary text-primary-foreground">
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.25),transparent_60%)]" />
                  <PlayCircle className="relative size-14" strokeWidth={1.25} />
                  <span className="absolute bottom-3 left-4 text-sm opacity-90">{coach.coachName}&apos;s welcome · 1:12</span>
                </button>
              )}
              <figure className="grid gap-3 border-l-2 border-primary pl-4">
                <blockquote className="text-[0.95rem] leading-relaxed">{settings.message}</blockquote>
                <figcaption className="text-sm text-muted-foreground">
                  {coach.coachName} · {tier?.name}
                </figcaption>
              </figure>
            </>
          )}

          {step === "profile" && (
            <>
              <div className="grid gap-1.5">
                <span className="eyebrow">About you</span>
                <h1 className="text-3xl leading-tight">So {coach.coachName} knows where you are</h1>
                <p className="text-sm text-muted-foreground">Skip anything you like. You can change it later in your profile.</p>
              </div>
              {q.nickname && (
                <div className="flex items-end gap-4">
                  <button type="button" className="group relative" aria-label="Add a picture">
                    <Avatar className="size-16">
                      <AvatarFallback className="text-lg">{(p.nickname || purchase?.name || purchase?.email || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Camera className="size-3.5" />
                    </span>
                  </button>
                  <div className="grid flex-1 gap-1.5">
                    <Label htmlFor="st-nick">Nickname</Label>
                    <Input id="st-nick" value={p.nickname} onChange={(e) => setP({ nickname: e.target.value })} placeholder="Shown in the community and ranking" />
                  </div>
                </div>
              )}
              {q.experience && (
                <div className="grid gap-2">
                  <Label>How long have you traded?</Label>
                  <Choices options={EXPERIENCE} value={p.experience} onChange={(v) => setP({ experience: v })} />
                </div>
              )}
              {q.markets && (
                <div className="grid gap-2">
                  <Label>What do you trade?</Label>
                  <Choices multi options={MARKETS} value={p.markets} onChange={(v) => setP({ markets: p.markets.includes(v) ? p.markets.filter((x) => x !== v) : [...p.markets, v] })} />
                </div>
              )}
              {q.goal && (
                <div className="grid gap-2">
                  <Label>What&apos;s your goal?</Label>
                  <Choices options={GOALS} value={p.goal} onChange={(v) => setP({ goal: v })} />
                </div>
              )}
            </>
          )}

          {step === "discord" && (
            <>
              <div className="grid gap-1.5">
                <span className="eyebrow">{coach.wording.community}</span>
                <h1 className="text-3xl leading-tight">Link your Discord</h1>
                <p className="text-sm text-muted-foreground">One click. You get the {tier?.name} role and its channels straight away; nothing else is shared.</p>
              </div>
              <div className="grid gap-3 rounded-(--radius) border p-4">
                {["#announcements", "#trade-ideas", "#questions", `#${(tier?.name ?? "members").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`].map((c) => (
                  <span key={c} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{c}</span>
                    {linked ? <Check className="size-4 text-primary" /> : <span className="text-xs text-muted-foreground">after linking</span>}
                  </span>
                ))}
              </div>
              <Button size="lg" variant={linked ? "outline" : "default"} disabled={linked} onClick={() => {
                  setLinked(true)
                  setStored(`${coach.slug}:discord-linked`, true)
                }}>
                {linked ? (
                  <>
                    <Check /> Linked as {p.nickname || first.toLowerCase()}
                  </>
                ) : (
                  "Link Discord"
                )}
              </Button>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-5">
            {i > 0 ? (
              <Button variant="ghost" onClick={() => setI(i - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {step !== "welcome" && (
                <Button variant="ghost" onClick={next}>
                  Skip
                </Button>
              )}
              <Button onClick={next}>
                {i === steps.length - 1 ? `Go to ${coach.wording.home}` : "Continue"} <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
