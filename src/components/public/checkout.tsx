"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, CreditCard, Loader2, Lock, Tag, Users, Wallet } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { amount, fmtDate, isFull, per, useGroups, useTiers } from "@/lib/data/access"
import { COUPONS } from "@/lib/data/people"
import { savePurchase } from "@/lib/data/sales-page"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

const AFFILIATES: Record<string, string> = { JONAS: "Jonas Pereira", SARA: "Sara Kowalski", TARIQ: "Tariq Bello" }

type Applied = { code: string; kind: "percent" | "amount" | "trial" | "affiliate"; value: number; label: string } | { code: string; kind: "invalid"; value: 0; label: string }

function applyCode(raw: string, coupons: typeof COUPONS): Applied | null {
  const code = raw.trim().toUpperCase()
  if (!code) return null
  if (AFFILIATES[code]) return { code, kind: "affiliate", value: 0, label: `Invited by ${AFFILIATES[code]}` }
  const c = coupons.find((x) => x.code === code)
  if (!c) return { code, kind: "invalid", value: 0, label: "This code doesn't exist. You can still join at the normal price." }
  if (!c.active) return { code, kind: "invalid", value: 0, label: "This code has ended. You can still join at the normal price." }
  const pct = c.discount.match(/(\d+)%/)
  if (pct) return { code, kind: "percent", value: Number(pct[1]), label: c.discount }
  const eur = c.discount.match(/€(\d+)/)
  if (eur) return { code, kind: "amount", value: Number(eur[1]), label: c.discount }
  const days = c.discount.match(/(\d+)-day/)
  if (days) return { code, kind: "trial", value: Number(days[1]), label: c.discount }
  return { code, kind: "invalid", value: 0, label: "This code can't be used here." }
}

/**
 * PUB-03: one screen, no account step before it. Plan, e-mail, payment, code.
 * Prototype: the payment fields are a picture of the provider's form; nothing is charged.
 */
export function Checkout() {
  const { coach, base } = useCoach()
  const router = useRouter()
  const params = useSearchParams()
  const tiers = useTiers(coach)
  const groups = useGroups(coach)
  const coupons = useStored(`${coach.slug}:coupons`, COUPONS)
  const paid = tiers.filter((t) => amount(t.price) > 0)
  const asked = tiers.find((t) => t.id === params.get("tier"))
  const firstPaid = (paid.find((t) => t.featured && !t.hidden) ?? paid[0])?.id
  const [tierId, setTierId] = useState(asked && amount(asked.price) > 0 ? asked.id : firstPaid)
  // Wizard-made communities arrive after the first render (the provider shows a stand-in until then), so fall back to the first paid tier.
  const tier = tiers.find((t) => t.id === tierId) ?? tiers.find((t) => t.id === firstPaid)
  const [yearly, setYearly] = useState(params.get("cycle") === "yearly")
  const open = groups.filter((g) => tier && g.tiers.includes(tier.id) && !isFull(g) && g.end >= "2026-10-12")
  const [groupId, setGroupId] = useState(params.get("group") ?? "")
  const group = open.find((g) => g.id === groupId)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [codeInput, setCodeInput] = useState(params.get("ref")?.toUpperCase() ?? "")
  const [applied, setApplied] = useState<Applied | null>(() => applyCode(params.get("ref") ?? "", coupons))
  const [method, setMethod] = useState<"card" | "wallet">("card")
  const [busy, setBusy] = useState(false)

  if (!tier) return <p className="p-10 text-center text-muted-foreground">No paid plans yet.</p>

  const isYearly = yearly && !!tier.yearly
  const list = amount(isYearly ? tier.yearly! : tier.price)
  const off = applied?.kind === "percent" ? Math.round(list * applied.value) / 100 : applied?.kind === "amount" ? Math.min(list, applied.value) : 0
  const trial = applied?.kind === "trial" ? applied.value : tier.trial
  const first = list - off
  const today = trial ? 0 : first
  const emailOk = /^\S+@\S+\.\S+$/.test(email)
  const money = (n: number) => `€${n.toLocaleString("en", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
  const cadence = isYearly ? "/ year" : per(tier.cadence)
  const trialEnd = (() => {
    const d = new Date("2026-10-12T12:00:00Z")
    d.setUTCDate(d.getUTCDate() + trial)
    return fmtDate(d.toISOString().slice(0, 10), false)
  })()

  return (
    <div className="mx-auto grid w-full max-w-[1080px] gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid content-start gap-8">
        <div className="grid gap-1">
          <h1 className="text-3xl leading-tight">Join {coach.name}</h1>
          <p className="text-muted-foreground">One page, about a minute. Your account is made from your e-mail after you pay.</p>
        </div>

        <section className="grid gap-3">
          <h2 className="text-lg">Your plan</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {paid
              .filter((t) => !t.hidden || t.id === tierId)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTierId(t.id)}
                  aria-pressed={t.id === tierId}
                  className={cn("flex items-start justify-between gap-3 rounded-(--radius) border bg-card p-4 text-left transition-colors", t.id === tierId ? "border-primary ring-1 ring-primary" : "hover:border-foreground/30")}
                >
                  <span className="grid gap-0.5">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {t.price} {per(t.cadence)}
                    </span>
                  </span>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", t.id === tierId && "border-primary bg-primary text-primary-foreground")}>
                    {t.id === tierId && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </button>
              ))}
          </div>
          {tier.yearly && (
            <div className="flex w-fit rounded-full border p-1 text-sm">
              {[false, true].map((y) => (
                <button key={String(y)} onClick={() => setYearly(y)} className={cn("rounded-full px-3.5 py-1", yearly === y ? "bg-foreground text-background" : "text-muted-foreground")}>
                  {y ? `Yearly · ${tier.yearly}` : `Monthly · ${tier.price}`}
                </button>
              ))}
            </div>
          )}
          {open.length > 0 && (
            <div className="grid gap-2 pt-1">
              <Label className="flex items-center gap-1.5">
                <Users className="size-4" /> Start with a group <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {[{ id: "", name: "On my own", start: "", seats: 0, members: 0 }, ...open].map((g) => (
                  <button
                    key={g.id || "none"}
                    onClick={() => setGroupId(g.id)}
                    className={cn("r-chip border px-3 py-1.5 text-sm", groupId === g.id ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground")}
                  >
                    {/* Name first, details after it: told apart by weight, both in a colour that reads at 4.5:1. */}
                    <span className="font-medium">{g.name}</span>
                    {g.id && <span> · {g.start <= "2026-10-12" ? "running" : `starts ${fmtDate(g.start, false)}`}, {g.seats - g.members} left</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-3">
          <h2 className="text-lg">You</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="co-email">E-mail</Label>
              <Input id="co-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="co-name">Name</Label>
              <Input id="co-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
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
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={cn("flex flex-1 items-center justify-center gap-2 rounded-(--radius) border bg-card px-3 py-2.5 text-sm", method === id ? "border-primary ring-1 ring-primary" : "text-muted-foreground")}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          {/* A picture of the payment provider's form. The prototype takes no payment details. */}
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
            <span className="text-center text-xs text-muted-foreground">Prototype: the payment provider&apos;s form goes here. Nothing is charged.</span>
          </div>
        </section>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-6">
        <div className="grid gap-4 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="grid gap-0.5">
            <span className="eyebrow">Summary</span>
            <span className="text-xl">{tier.name}</span>
            {group && <span className="text-sm text-muted-foreground">with {group.name}</span>}
          </div>
          <ul className="grid gap-1.5 text-sm">
            {tier.features.slice(0, 4).map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Separator />
          <form
            className="grid gap-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              setApplied(applyCode(codeInput, coupons))
            }}
          >
            <Label htmlFor="co-code" className="flex items-center gap-1.5">
              <Tag className="size-3.5" /> Coupon or invite code
            </Label>
            <div className="flex gap-2">
              <Input id="co-code" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className="font-mono" />
              <Button type="submit" variant="outline" disabled={!codeInput.trim()}>
                Apply
              </Button>
            </div>
            {applied && <span className={cn("text-xs", applied.kind === "invalid" ? "text-destructive" : "text-primary")}>{applied.label}</span>}
          </form>
          <Separator />
          <dl className="grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {tier.name} {isYearly ? "yearly" : ""}
              </dt>
              <dd className="tabular-nums">{money(list)}</dd>
            </div>
            {off > 0 && (
              <div className="flex justify-between text-primary">
                <dt>{applied?.code}</dt>
                <dd className="tabular-nums">−{money(off)}</dd>
              </div>
            )}
            {trial > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{trial}-day free trial</dt>
                <dd className="tabular-nums">−{money(first)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-medium">
              <dt>Today</dt>
              <dd className="tabular-nums">{money(today)}</dd>
            </div>
            <dd className="text-xs text-muted-foreground">
              {trial > 0 ? `Then ${money(first)} ${cadence} from ${trialEnd}.` : tier.cadence === "once" ? "One payment." : `Then ${money(list)} ${cadence}.`} VAT included. Cancel any time.
            </dd>
          </dl>
          <Button
            size="lg"
            disabled={!emailOk || busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => {
                savePurchase(coach.slug, {
                  tier: tier.id,
                  cycle: isYearly ? "yearly" : "regular",
                  email,
                  name,
                  group: group?.id,
                  coupon: applied && applied.kind !== "invalid" ? applied.code : undefined,
                  discount: off ? money(off) : undefined,
                  total: today,
                  trial,
                })
                router.push(`${base}/account`)
              }, 900)
            }}
          >
            {busy && <Loader2 className="animate-spin" />}
            {trial > 0 ? `Start free trial` : `Pay ${money(today)}`}
          </Button>
          {/* Say why the button is dimmed, before anything was typed too. */}
          {!emailOk && email.length <= 3 && <span className="-mt-2 text-center text-xs text-muted-foreground">Enter your e-mail above to continue.</span>}
          {!emailOk && email.length > 3 && <span className="-mt-2 text-center text-xs text-destructive">Check the e-mail address.</span>}
          <p className="text-center text-xs text-muted-foreground">
            By joining you accept the{" "}
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
        <Link href={`${base}/login`} className="text-center text-sm text-muted-foreground hover:text-foreground">
          Already a member? Log in to change your plan
        </Link>
      </aside>
    </div>
  )
}
