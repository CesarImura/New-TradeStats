"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Check, CreditCard, Loader2, Lock, Wallet } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTiers } from "@/lib/data/access"
import { instalmentDate, isoDay, offerTier, LINKS, linkStatus, money, NOW_ISO, OFFERS, planFirst, readLinks, readOffers, planLine, planName, shortDate, type OfferLink } from "@/lib/data/offers"
import { NOW } from "@/lib/data/schedule"
import { savePurchase } from "@/lib/data/sales-page"
import { setStored, useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import type { Offer } from "@/lib/data/offers"

/**
 * An offer link's page (Figma Sales · 07 Offer checkout, 07b Link expired, 07c Link already used): one client, one plan, one payment that
 * opens the offer's tier. The link works once. The payment fields are a picture of the provider's form.
 */
export function OfferCheckout() {
  const { coach, base } = useCoach()
  const { id } = useParams<{ id: string }>()
  const links = readLinks(useStored<OfferLink[]>(`${coach.slug}:offerLinks`, LINKS))
  const offers = readOffers(useStored<Offer[]>(`${coach.slug}:offers`, OFFERS))
  const link = links.find((l) => l.id === id)
  const offer = link ? offers.find((o) => o.id === link.offerId) : undefined

  // Opening the link is recorded once (the sender sees "Opened").
  const needsOpen = !!link && !link.openedAt && linkStatus(link) !== "expired"
  useEffect(() => {
    if (!needsOpen) return
    setStored<OfferLink[]>(`${coach.slug}:offerLinks`, (l) => l.map((x) => (x.id === id && !x.openedAt ? { ...x, openedAt: NOW_ISO } : x)), LINKS)
  }, [needsOpen, coach.slug, id])

  if (!link) return <Notice title="This link doesn't work" text={`Ask ${coach.coachName} for a new offer link.`} />
  if (!offer) return <Notice title="This offer isn't available anymore" text={`${coach.coachName} took it down. Ask what they can offer you instead.`} />
  const status = linkStatus(link)
  if (status === "paid") return <Notice title="This link was already used" text="An offer link works once. If you paid, log in to get to your platform." action={{ href: `${base}/login`, label: "Log in" }} />
  if (status === "expired") return <Notice title="This link has expired" text={`It was valid until ${shortDate(link.expires)}. Ask ${coach.coachName} for a new one.`} />
  return <Pay link={link} offer={offer} />
}

function Notice({ title, text, action }: { title: string; text: string; action?: { href: string; label: string } }) {
  const { coach } = useCoach()
  return (
    <div className="mx-auto grid w-full max-w-[520px] gap-4 px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl leading-tight">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      {action && (
        <div>
          <Button nativeButton={false} render={<Link href={action.href} />}>{action.label}</Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{coach.name}</p>
    </div>
  )
}

function Pay({ link, offer }: { link: OfferLink; offer: Offer }) {
  const { coach, base } = useCoach()
  const router = useRouter()
  const tiers = useTiers(coach)
  const tier = offerTier(tiers, offer.tierId)
  const locked = !!link.email && offer.lockEmail
  const [email, setEmail] = useState(link.email ?? "")
  const [name, setName] = useState(link.name ?? "")
  const [method, setMethod] = useState<"card" | "wallet">("card")
  const [busy, setBusy] = useState(false)
  // Prototype only: what the payment provider answers. Real payments decide this, not a switch.
  const [result, setResult] = useState<"paid" | "declined" | "bank">("paid")
  const [error, setError] = useState("")
  const [bank, setBank] = useState(false)

  const plan = link.plan
  const count = plan.payments.length
  const each = planFirst(plan)
  const emailOk = /^\S+@\S+\.\S+$/.test(email)
  const later = plan.payments.slice(1).map((amount, i) => ({ amount, date: shortDate(isoDay(instalmentDate(NOW, i + 1))) }))
  const ready = emailOk && name.trim().length > 1 && !busy
  const perks = [...(tier ? [`Opens the ${tier.name} tier`] : []), ...offer.perks]
  
  const complete = () => {
    setStored<OfferLink[]>(`${coach.slug}:offerLinks`, (l) => l.map((x) => (x.id === link.id ? { ...x, paidAt: NOW_ISO, openedAt: x.openedAt ?? NOW_ISO, email, name: name.trim() } : x)), LINKS)
    setStored<Offer[]>(`${coach.slug}:offers`, (o) => o.map((x) => (x.id === offer.id ? { ...x, sold: x.sold + 1, paying: x.paying + (count > 1 ? 1 : 0) } : x)), OFFERS)
    savePurchase(coach.slug, { tier: tier?.id ?? offer.tierId, cycle: "regular", email, name: name.trim(), total: each, trial: 0 })
    router.push(`${base}/account`)
  }
  const pay = () => {
    setBusy(true)
    setError("")
    setTimeout(() => {
      if (result === "declined") {
        setBusy(false)
        setError("Your card was declined. Nothing was charged. Try another card, or ask your bank to allow the payment.")
        return
      }
      if (result === "bank") {
        setBusy(false)
        setBank(true)
        return
      }
      complete()
    }, 900)
  }

  return (
    <div className="mx-auto grid w-full max-w-[1080px] gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid content-start gap-8">
        <div className="grid gap-1">
          <h1 className="text-3xl leading-tight">Your offer from {coach.name}</h1>
          <p className="text-muted-foreground">{link.name ? `Made for ${link.name}. ` : ""}Check the plan below, then pay to get access.</p>
        </div>

        <section className="grid gap-3">
          <h2 className="text-lg">Your plan</h2>
          <div className="flex items-start justify-between gap-3 rounded-(--radius) border border-primary bg-card p-4 ring-1 ring-primary">
            <span className="grid gap-0.5">
              <span className="font-medium">{offer.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {count === 1 ? `Pay in full · ${money(link.price)}` : `${planLine(plan)} · ${money(link.price)} in total`}
              </span>
            </span>
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-primary bg-primary text-primary-foreground">
              <Check className="size-3" strokeWidth={3} />
            </span>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-lg">You</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="of-email">E-mail</Label>
              <Input id="of-email" type="email" autoComplete="email" value={email} readOnly={locked} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              {locked && <span className="text-xs text-muted-foreground">Your e-mail comes from the link.</span>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="of-name">Name</Label>
              <Input id="of-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Payment</h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" /> Secured by our payment partner
            </span>
          </div>
          <div className="flex gap-2">
            {(
              [
                ["card", "Card", CreditCard],
                ["wallet", "Apple Pay / Google Pay", Wallet],
              ] as const
            ).map(([m, label, Icon]) => (
              <button key={m} onClick={() => setMethod(m)} className={cn("flex flex-1 items-center justify-center gap-2 rounded-(--radius) border bg-card px-3 py-2.5 text-sm", method === m ? "border-primary ring-1 ring-primary" : "text-muted-foreground")}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <div aria-hidden className="grid gap-2 rounded-(--radius) border border-dashed p-4">
            {method === "card" ? (
              <>
                <div className="flex h-9 items-center justify-between rounded-md bg-muted/60 px-3 text-sm text-muted-foreground">
                  Card number <CreditCard className="size-4" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex h-9 items-center rounded-md bg-muted/60 px-3 text-sm text-muted-foreground">MM / YY</div>
                  <div className="flex h-9 items-center rounded-md bg-muted/60 px-3 text-sm text-muted-foreground">CVC</div>
                </div>
              </>
            ) : (
              <div className="flex h-11 items-center justify-center rounded-md bg-foreground text-sm text-background">Pay with your wallet</div>
            )}
            <span className="text-center text-xs text-muted-foreground">The payment provider&apos;s secure form appears here.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Prototype · what the payment returns</span>
            {(
              [
                ["paid", "Paid"],
                ["declined", "Card declined"],
                ["bank", "Bank asks to confirm"],
              ] as const
            ).map(([r, label]) => (
              <button key={r} type="button" aria-pressed={result === r} onClick={() => (setResult(r), setError(""))} className={cn("rounded-full border px-2.5 py-1", result === r ? "border-foreground text-foreground" : "hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-6">
        <div className="grid gap-4 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="grid gap-0.5">
            <span className="eyebrow">Summary</span>
            <span className="text-xl">{offer.name}</span>
          </div>
          <ul className="grid gap-1.5 text-sm">
            {perks.slice(0, 4).map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          {offer.replaceSubscription && <p className="text-xs text-muted-foreground">Already a member? Your current subscription ends after this payment.</p>}
          <Separator />
          <dl className="grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {offer.name} · {planName(plan).toLowerCase()}
              </dt>
              <dd className="tabular-nums">{money(link.price)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-medium">
              <dt>Today</dt>
              <dd className="tabular-nums">{money(each)}</dd>
            </div>
            <dd className="text-xs text-muted-foreground">
              {later.length === 0 ? "One payment." : later.every((l) => l.amount === later[0].amount) ? `Then ${later.length === 1 ? "1 payment" : `${later.length} payments`} of ${money(later[0].amount)} on ${later.length > 1 ? `${later.slice(0, -1).map((l) => l.date).join(", ")} and ${later[later.length - 1].date}` : later[0].date}.` : `Then ${later.map((l) => `${money(l.amount)} on ${l.date}`).join(", ")}.`} VAT included.
            </dd>
          </dl>
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {bank && (
            <div role="alert" className="grid gap-2 rounded-md border p-3 text-sm">
              <span>Your bank asks you to confirm this payment of {money(each)}.</span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setBank(false); setBusy(true); setTimeout(complete, 600) }}>Confirm in my bank app</Button>
                <Button size="sm" variant="outline" onClick={() => { setBank(false); setError("The payment was not confirmed. Nothing was charged. You can try again.") }}>Cancel</Button>
              </div>
            </div>
          )}
          <Button size="lg" disabled={!ready || bank} onClick={pay}>
            {busy && <Loader2 className="animate-spin" />}
            Pay {money(each)} today
          </Button>
          {!emailOk && email.length <= 3 && <span className="-mt-2 text-center text-xs text-muted-foreground">Enter your e-mail above to continue.</span>}
          {!emailOk && email.length > 3 && <span className="-mt-2 text-center text-xs text-destructive">Check the e-mail address.</span>}
          <p className="text-center text-xs text-muted-foreground">
            By paying you accept the{" "}
            <Link href={`${base}/legal/terms`} className="underline underline-offset-2">
              terms
            </Link>{" "}
            and the{" "}
            <Link href={`${base}/legal/risk`} className="underline underline-offset-2">
              risk warning
            </Link>
            .
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">This link works once and is valid until {shortDate(link.expires)}.</p>
      </aside>
    </div>
  )
}
