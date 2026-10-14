"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Check, Clock, Loader2, Mail, PlayCircle, Wrench } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fmtDate, saveGroups, useGroups, useTiers } from "@/lib/data/access"
import { LEGAL } from "@/lib/data/people"
import { usePurchase } from "@/lib/data/sales-page"
import { resetAsNewStudent, useOnboardingSettings } from "@/lib/data/student-start"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { FocusCard } from "./public-shell"

// ---------- shared bits

/** Six boxes for the e-mail code. Prototype: any six digits work. */
function CodeInput({ onDone }: { onDone: () => void }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const set = (i: number, v: string) => {
    const chars = v.replace(/\D/g, "").split("")
    if (chars.length === 0) {
      setDigits((d) => d.map((x, j) => (j === i ? "" : x)))
      return
    }
    const next = [...digits]
    chars.slice(0, 6 - i).forEach((c, k) => (next[i + k] = c))
    setDigits(next)
    const at = Math.min(5, i + chars.length)
    refs.current[at]?.focus()
    if (next.every(Boolean)) onDone()
  }
  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Six-digit code">
      {digits.map((d, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && refs.current[i - 1]?.focus()}
          className="h-12 w-11 text-center font-heading text-xl tabular-nums"
        />
      ))}
    </div>
  )
}

function DiscordButton({ onClick, label = "Continue with Discord" }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="outline" size="lg" onClick={onClick} className="w-full">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="currentColor"
          d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.4 8 10.4s2.2 1.1 2.2 2.5-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.4-2.2 2.4Z"
        />
      </svg>
      {label}
    </Button>
  )
}

function Or() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function Title({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: React.ReactNode }) {
  return (
    <div className="mb-6 grid gap-1.5 text-center">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="text-2xl leading-tight">{title}</h1>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

// ---------- PUB-04 confirm e-mail after payment

export function ConfirmAccount() {
  const { coach, base } = useCoach()
  const router = useRouter()
  const purchase = usePurchase(coach.slug)
  const [busy, setBusy] = useState(false)
  const done = () => {
    setBusy(true)
    setTimeout(() => router.push(`${base}/welcome`), 600)
  }
  return (
    <FocusCard>
      <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="size-6" />
      </div>
      <Title
        eyebrow="Payment received"
        title="One last step: your account"
        text={
          <>
            We sent a six-digit code to <b className="text-foreground">{purchase?.email || "your e-mail"}</b>. Type it here and you&apos;re in.
          </>
        }
      />
      <div className="grid gap-4">
        <CodeInput onDone={done} />
        <span className="text-center text-xs text-muted-foreground">{busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Prototype: any six digits work."}</span>
        <Or />
        <DiscordButton onClick={done} />
        <p className="text-center text-xs text-muted-foreground">No code? Check your spam folder or wait a minute, then send it again.</p>
      </div>
    </FocusCard>
  )
}

// ---------- PUB-05 thank you and welcome

export function ThankYou() {
  const { coach, base } = useCoach()
  const purchase = usePurchase(coach.slug)
  const tiers = useTiers(coach)
  const groups = useGroups(coach)
  const settings = useOnboardingSettings(coach.slug)
  const tier = tiers.find((t) => t.id === purchase?.tier) ?? tiers[0]
  const group = groups.find((g) => g.id === purchase?.group)
  const first = purchase?.name?.split(" ")[0]
  return (
    <FocusCard className="max-w-xl">
      <Title eyebrow="You're in" title={`Welcome to ${coach.name}${first ? `, ${first}` : ""}`} text={`You're a member of ${tier?.name}${group ? ` and ${group.name}` : ""}.`} />
      {settings.video && (
        <button className="relative mb-5 grid aspect-video w-full place-items-center overflow-hidden rounded-(--radius) bg-primary text-primary-foreground">
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.25),transparent_60%)]" />
          <PlayCircle className="relative size-14" strokeWidth={1.25} />
          <span className="absolute bottom-3 left-4 text-sm opacity-90">A word from {coach.coachName} · 1:12</span>
        </button>
      )}
      <ul className="mb-6 grid gap-2 text-sm">
        {purchase && purchase.trial > 0 && (
          <li className="flex gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" /> Your free trial runs {purchase.trial} days. We remind you two days before the first payment.
          </li>
        )}
        {group && (
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {group.name} {group.start <= "2026-10-12" ? "is running; you can catch up at your pace." : `starts on ${fmtDate(group.start)}.`}
          </li>
        )}
        <li className="flex gap-2">
          <Mail className="mt-0.5 size-4 shrink-0 text-primary" /> Your receipt is on its way to {purchase?.email || "your inbox"}.
        </li>
      </ul>
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href={`${base}/start`} onClick={() => resetAsNewStudent(coach.slug)} />}
      >
        Start <ArrowRight />
      </Button>
    </FocusCard>
  )
}

// ---------- PUB-07 login, PUB-10 reset, PUB-08 free sign-up, PUB-09 invite

export function Login() {
  const { coach, base } = useCoach()
  const router = useRouter()
  const settings = useOnboardingSettings(coach.slug)
  const reset = useSearchParams().get("reset") === "1"
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [busy, setBusy] = useState(false)
  const password = settings.login !== "code"
  const enter = () => {
    setBusy(true)
    setTimeout(() => router.push(`/c/${coach.slug}`), 500)
  }

  if (reset)
    return (
      <FocusCard>
        <Title title="Set a new password" text="We send a link to your e-mail. It works for one hour." />
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            setStep("code")
          }}
        >
          {step === "email" ? (
            <>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="E-mail" />
              <Button size="lg" type="submit" disabled={!email.includes("@")}>
                Send the link
              </Button>
            </>
          ) : (
            <p className="rounded-(--radius) bg-muted p-4 text-center text-sm">Check {email}. The link opens a page where you choose a new password.</p>
          )}
          <Link href={`${base}/login`} className="text-center text-sm text-muted-foreground hover:text-foreground">
            Back to log in
          </Link>
        </form>
      </FocusCard>
    )

  return (
    <FocusCard>
      <Title eyebrow={coach.name} title="Welcome back" text={step === "code" ? `We sent a code to ${email}.` : "Log in to your platform."} />
      {step === "email" ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (password) enter()
            else setStep("code")
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="li-email">E-mail</Label>
            <Input id="li-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {password && (
            <div className="grid gap-1.5">
              <Label htmlFor="li-pw" className="flex justify-between">
                Password
                <Link href={`${base}/login?reset=1`} className="font-normal text-muted-foreground hover:text-foreground">
                  Forgot it?
                </Link>
              </Label>
              {/* Prototype: any password works; nothing is checked or stored. */}
              <Input id="li-pw" type="password" autoComplete="current-password" />
            </div>
          )}
          <Button size="lg" type="submit" disabled={!email.includes("@") || busy}>
            {busy && <Loader2 className="animate-spin" />}
            {password ? "Log in" : "Send me a code"}
          </Button>
          {settings.login !== "password" && (
            <>
              <Or />
              <DiscordButton onClick={enter} />
            </>
          )}
          <p className="pt-2 text-center text-sm text-muted-foreground">
            Not a member yet?{" "}
            <Link href={`${base}#tiers`} className="text-foreground underline underline-offset-4">
              See the plans
            </Link>
          </p>
        </form>
      ) : (
        <div className="grid gap-4">
          <CodeInput onDone={enter} />
          <span className="text-center text-xs text-muted-foreground">{busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Prototype: any six digits work."}</span>
          <Button variant="ghost" onClick={() => setStep("email")}>
            Use another e-mail
          </Button>
        </div>
      )}
    </FocusCard>
  )
}

/** PUB-08 free join (free tier, or a free link from Discord or socials) and PUB-09 accept an invite. */
export function JoinFree({ invite }: { invite?: boolean }) {
  const { coach, base } = useCoach()
  const router = useRouter()
  const tiers = useTiers(coach)
  const params = useSearchParams()
  const tier = tiers.find((t) => t.id === params.get("tier")) ?? tiers[0]
  const [name, setName] = useState(invite ? "Lena Hoffmann" : "")
  const [email, setEmail] = useState(invite ? "lena.hoffmann@mail.com" : "")
  const [step, setStep] = useState<"form" | "code">("form")
  const go = () => {
    resetAsNewStudent(coach.slug)
    router.push(`${base}/start`)
  }
  return (
    <FocusCard>
      <Title
        eyebrow={invite ? `Invitation from ${coach.coachName}` : `Join ${tier?.name} for free`}
        title={invite ? `You're invited to ${coach.name}` : `Join ${coach.name}`}
        text={invite ? `${coach.coachName} gave you ${tier?.name}. Check your name and you're in.` : step === "code" ? `We sent a code to ${email}.` : "No card needed."}
      />
      {step === "form" ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (invite) go()
            else setStep("code")
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="jf-name">Name</Label>
            <Input id="jf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="jf-email">E-mail</Label>
            <Input id="jf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={invite} autoComplete="email" className={cn(invite && "text-muted-foreground")} />
          </div>
          <Button size="lg" type="submit" disabled={!name || !email.includes("@")}>
            {invite ? "Accept and start" : "Join free"}
          </Button>
          {!invite && (
            <>
              <Or />
              <DiscordButton onClick={go} label="Join with Discord" />
            </>
          )}
        </form>
      ) : (
        <div className="grid gap-4">
          <CodeInput onDone={go} />
          <span className="text-center text-xs text-muted-foreground">Prototype: any six digits work.</span>
        </div>
      )}
    </FocusCard>
  )
}

// ---------- PUB-06 waiting list

export function WaitingList() {
  const { coach, base } = useCoach()
  const groups = useGroups(coach)
  const asked = useSearchParams().get("group")
  const group = groups.find((g) => g.id === asked) ?? groups.find((g) => g.members >= g.seats)
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  if (!group) return <Unavailable reason="missing" />
  return (
    <FocusCard>
      <Title
        eyebrow="Waiting list"
        title={done ? "You're on the list" : `${group.name} is full`}
        text={
          done
            ? `You're number ${group.waiting + 1}. When a seat opens, you hear first and have 48 hours to take it.`
            : `${group.seats} of ${group.seats} seats are taken. Leave your e-mail and you hear first when one opens.`
        }
      />
      {done ? (
        <Button variant="outline" size="lg" className="w-full" nativeButton={false} render={<Link href={base} />}>
          Back to {coach.name}
        </Button>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            saveGroups(coach, (list) => list.map((g) => (g.id === group.id ? { ...g, waiting: g.waiting + 1 } : g)))
            setDone(true)
          }}
        >
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="E-mail" />
          <Button size="lg" type="submit" disabled={!email.includes("@")}>
            Put me on the list
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {group.waiting} {group.waiting === 1 ? "person is" : "people are"} waiting. Or{" "}
            <Link href={`${base}#tiers`} className="underline underline-offset-2">
              join without a group
            </Link>{" "}
            and start today.
          </p>
        </form>
      )}
    </FocusCard>
  )
}

// ---------- PUB-11 legal pages

export function LegalPage({ doc }: { doc: string }) {
  const { coach, base } = useCoach()
  const texts = useStored<Record<string, string>>(`${coach.slug}:legal`, NO_TEXTS)
  const page = LEGAL.find((l) => l.id === doc)
  if (!page) return <Unavailable reason="missing" />
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-12 sm:px-6">
      <nav className="flex flex-wrap gap-2">
        {LEGAL.map((l) => (
          <Link key={l.id} href={`${base}/legal/${l.id}`} className={cn("r-chip border px-3 py-1.5 text-sm", l.id === doc ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
            {l.name}
          </Link>
        ))}
      </nav>
      <h1 className="text-3xl">{page.name}</h1>
      <div className="text-[0.95rem] leading-relaxed whitespace-pre-line text-muted-foreground">{(texts[doc] ?? page.text).replace(/Northline Trading/g, coach.org)}</div>
      <span className="text-xs text-muted-foreground">Last updated 1 October 2026</span>
    </div>
  )
}
const NO_TEXTS: Record<string, string> = {}

// ---------- PUB-12 platform unavailable

export function Unavailable({ reason = "unpublished" }: { reason?: "unpublished" | "suspended" | "missing" }) {
  const { coach, base } = useCoach()
  const copy = {
    unpublished: { title: "Opening soon", text: `${coach.name} is getting ready. Leave your e-mail and you hear when it opens.` },
    suspended: { title: "Back shortly", text: `${coach.name} is paused for maintenance. Your account and progress are safe.` },
    missing: { title: "This page doesn't exist", text: "The link may be old, or the page was moved." },
  }[reason]
  return (
    <FocusCard className="text-center">
      <Wrench className="mx-auto mb-4 size-8 text-muted-foreground" />
      <Title title={copy.title} text={copy.text} />
      <Button variant="outline" nativeButton={false} render={<Link href={base} />}>
        Go to {coach.name}
      </Button>
    </FocusCard>
  )
}
