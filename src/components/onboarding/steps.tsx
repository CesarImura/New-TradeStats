"use client"

import { useEffect, useState } from "react"
import { BookOpen, Bot, CalendarDays, ChartCandlestick, Check, CircleAlert, Download, Handshake, Landmark, Loader2, MessagesSquare, NotebookPen, Trophy } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { More } from "@/components/admin/design/controls"
import { DesignField, useDesign } from "@/components/admin/design/design-fields"
import { PagesField } from "@/components/admin/design/pages-field"
import { COACHES, type ModuleId } from "@/lib/data/coaches"
import { customCommunities, slugify } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { MARKETS, type Market } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { Choice, mono } from "./frame"
import { FullEditorLink } from "./look-steps"
import type { StepProps } from "./wizard"

function Row({ label, hint, htmlFor, children }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-[0.8rem] font-normal text-muted-foreground">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ---------- ONB-09 · Name & address (rows of the Brand step)

const RESERVED = ["admin", "app", "www", "help", "api", "login", "signup", "setup", "tradestats"]

export function NameRows({ community, update, setReady }: StepProps) {
  const [touched, setTouched] = useState(!!community.address)
  const address = community.address ?? slugify(community.name)
  const taken =
    RESERVED.includes(address) ||
    COACHES.some((c) => c.slug === address) ||
    customCommunities().some((c) => c.slug === address && c.slug !== community.slug)
  const valid = /^[a-z0-9][a-z0-9-]{1,39}$/.test(address) && !address.startsWith("new-")
  const ok = valid && !taken && community.name.trim().length > 1

  useEffect(() => setReady(ok), [ok, setReady])

  return (
    <div className="grid gap-6">
      <Row label="Platform name" htmlFor="pname" hint={`${community.name.length}/40`}>
        <Input
          id="pname"
          value={community.name}
          maxLength={40}
          autoFocus
          onChange={(e) => {
            const name = e.target.value
            const initials = name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("")
            update({ name, org: name || community.org, mark: initials || community.mark, ...(touched ? {} : { address: slugify(name) }) })
          }}
        />
      </Row>

      <Row label="Web address" htmlFor="paddr" hint="Free · your own domain later in Settings">
        <div className="flex h-7 items-center rounded-[4px] border border-[#2a2a2f] bg-[#0e0e10] text-[0.8125rem] shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)] focus-within:border-[var(--ts-interactive)] focus-within:shadow-[0_0_0_3px_rgb(255_85_0/0.18)]">
          <span className="pl-3 text-sm text-muted-foreground">https://</span>
          <input
            id="paddr"
            value={address}
            onChange={(e) => {
              setTouched(true)
              update({ address: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) })
            }}
            className="h-full min-w-0 flex-1 bg-transparent px-0.5 text-sm outline-none"
            spellCheck={false}
          />
          <span className="pr-3 text-sm text-muted-foreground">.tradestats.app</span>
        </div>
        <span className={cn("flex items-center gap-1.5 text-xs", ok ? "text-[var(--ts-cta)]" : "text-[var(--ts-interactive)]")}>
          {ok ? <Check className="size-3.5" /> : <CircleAlert className="size-3.5" />}
          {!community.name.trim()
            ? "Give your platform a name first."
            : taken
              ? "That address is taken. Try adding your name or a word like ‘academy’."
              : !valid
                ? "Use 2–40 letters, numbers or dashes."
                : "Available"}
        </span>
      </Row>

      <Row label="What do students call you?" htmlFor="cname" hint="Used in messages like “Marco replied”">
        <Input id="cname" value={community.coachName} onChange={(e) => update({ coachName: e.target.value })} />
      </Row>
    </div>
  )
}

// ---------- ONB-10 · Brand (same order as Design → Brand)

export function BrandStep({ community, update, setReady }: StepProps) {
  return (
    <div className="grid gap-7">
      <DesignField id="logo" />
      <NameRows community={community} update={update} setReady={setReady} />
      <DesignField id="primary" />
      <DesignField id="mode" />
      <More label="Second colour">
        <DesignField id="highlight" />
      </More>
      <FullEditorLink slug={community.slug} />
    </div>
  )
}

// ---------- ONB-11 · Menu (sections, names and the same folds as Design → Menu)

const MODULES: { id: ModuleId; name: string; text: string; icon: React.ComponentType<{ className?: string }>; later?: boolean }[] = [
  { id: "courses", name: "Courses", text: "Video lessons in modules, with progress", icon: BookOpen },
  { id: "calendar", name: "Calendar", text: "Live sessions, replays and 1:1 bookings", icon: CalendarDays },
  { id: "charts", name: "Charts", text: "Full TradingView charts, watchlist and your marked-up levels", icon: ChartCandlestick },
  { id: "journal", name: "Journal", text: "Students log trades and ask you for reviews", icon: NotebookPen },
  { id: "community", name: "Community", text: "Posts and chat, or a link to your Discord", icon: MessagesSquare },
  { id: "ai", name: "AI assistant", text: "Answers questions from your own lessons", icon: Bot },
  { id: "ranking", name: "Ranking", text: "Leaderboard by consistency and progress", icon: Trophy, later: true },
  { id: "downloads", name: "Downloads", text: "Indicators, templates and files for your students", icon: Download },
  { id: "partners", name: "Partners", text: "Broker and prop firm offers, with your affiliate links", icon: Handshake },
]

export function ModulesStep({ community, update }: StepProps) {
  const { coach, change } = useDesign()
  const acc = useAccount()
  const markets = community.setup?.markets ?? ["futures", "forex"]
  return (
    <div className="grid gap-4">
      {acc?.answers && <p className={cn(mono, "text-[0.62rem] text-[var(--ts-cta)]")}>Switched on from your answers</p>}
      <div className="grid divide-y rounded-[var(--radius)] border bg-card">
        {MODULES.map((m) => {
          const on = coach.modules[m.id]
          return (
            <label key={m.id} className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5">
              <m.icon className={cn("size-5 shrink-0", on ? "text-[var(--ts-interactive)]" : "text-muted-foreground")} />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex items-center gap-2 text-sm">
                  {m.name}
                  {m.later && (
                    <Badge variant="outline" className="h-4.5 px-1.5 text-[0.6rem] text-muted-foreground">
                      Coming soon
                    </Badge>
                  )}
                </span>
                {on && !m.later ? (
                  <input
                    value={coach.wording[m.id]}
                    onChange={(e) => change({ content: { wording: { [m.id]: e.target.value } } }, `w-${m.id}`)}
                    onClick={(e) => e.preventDefault()}
                    aria-label={`What students see instead of ${m.name}`}
                    className="mt-1 h-7 w-full max-w-56 rounded-[var(--radius)] border border-white/10 bg-transparent px-2 text-xs outline-none focus:border-[var(--ts-interactive)]"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">{m.text}</span>
                )}
              </span>
              <Switch checked={on} disabled={m.later} onCheckedChange={(v) => change({ content: { modules: { [m.id]: v } } }, `mod-${m.id}`)} />
            </label>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">Type a new name to rename a section for your students, e.g. Courses → Playbook.</p>
      {coach.modules.charts && (
        <Row label="Markets you trade" hint="Fills your chart watchlist">
          <div className="flex flex-wrap gap-1.5">
            {MARKETS.map((mk) => {
              const on = markets.includes(mk.id)
              return (
                <button
                  key={mk.id}
                  onClick={() => update({ setup: { ...community.setup, markets: on ? markets.filter((x) => x !== mk.id) : [...markets, mk.id as Market] } })}
                  aria-pressed={on}
                  className={cn("rounded-[var(--radius)] border px-2.5 py-1 text-xs", on ? "border-[var(--ts-interactive)] text-foreground" : "text-muted-foreground")}
                >
                  {mk.label}
                </button>
              )
            })}
          </div>
        </Row>
      )}
      <More label="Menu layout">
        <DesignField id="nav-layout" />
        <DesignField id="nav-frame" />
        <DesignField id="nav-style" />
        <DesignField id="nav-logo" />
      </More>
      <More label="What you call things">
        <DesignField id="wording" />
      </More>
      <More label="Your own pages">
        <p className="text-xs text-muted-foreground">Pages built from widgets, like Rules or Resources. Arrange them in Design → Pages.</p>
        <PagesField />
      </More>
    </div>
  )
}

// ---------- ONB-12 · First tier

const CADENCES = [
  { id: "month", label: "Monthly" },
  { id: "quarter", label: "Every 3 months" },
  { id: "year", label: "Yearly" },
  { id: "once", label: "One payment" },
]

export function TierStep({ community, update, setReady }: StepProps) {
  const tier = community.tiers[0] ?? { id: "core", name: "", price: "€49", cadence: "month", members: 0 }
  const free = tier.price === "Free"
  const amount = free ? "" : tier.price.replace(/[^\d.,]/g, "")
  const set = (patch: Partial<typeof tier>) => update({ tiers: [{ ...tier, ...patch }, ...community.tiers.slice(1)] })
  const ok = tier.name.trim().length > 0 && (free || Number(amount.replace(",", ".")) > 0)

  useEffect(() => setReady(ok), [ok, setReady])
  // Save the starting values so the tier exists even if nothing is typed.
  useEffect(() => {
    if (!community.tiers.length) set({ name: "Core" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Free or paid">
        <Choice checked={!free} onClick={() => set({ price: "€49" })} title="Paid" text="Students pay to join" />
        <Choice checked={free} onClick={() => set({ price: "Free", cadence: "month" })} title="Free" text="To grow an audience first" />
      </div>

      <Row label="Tier name" htmlFor="tname" hint="e.g. Core, Academy, Inner Circle">
        <Input id="tname" value={tier.name} onChange={(e) => set({ name: e.target.value })} />
      </Row>

      {!free && (
        <>
          <Row label="Price" htmlFor="tprice" hint="Euro · tax added at checkout where needed">
            <div className="flex h-7 items-center rounded-[4px] border border-[#2a2a2f] bg-[#0e0e10] text-[0.8125rem] shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)] focus-within:border-[var(--ts-interactive)] focus-within:shadow-[0_0_0_3px_rgb(255_85_0/0.18)]">
              <span className="pl-3 text-muted-foreground">€</span>
              <input
                id="tprice"
                inputMode="decimal"
                value={amount}
                onChange={(e) => set({ price: `€${e.target.value.replace(/[^\d.,]/g, "")}` })}
                className="h-full min-w-0 flex-1 bg-transparent px-2 tabular-nums outline-none"
              />
            </div>
          </Row>
          <Row label="Billing">
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {CADENCES.map((c) => (
                <Choice key={c.id} checked={tier.cadence === c.id} onClick={() => set({ cadence: c.id })} title={c.label} />
              ))}
            </div>
          </Row>
        </>
      )}

      <div className="flex items-baseline justify-between border-t pt-4 text-sm">
        <span className="text-muted-foreground">Students will see</span>
        <span>
          <span className="text-foreground">{tier.name || "Your tier"}</span>
          <span className="text-muted-foreground">
            {" · "}
            {free ? "Free" : `${tier.price}${tier.cadence === "once" ? " once" : ` / ${tier.cadence}`}`}
          </span>
        </span>
      </div>
      <More label="Free trial and a second tier">
        {!free && (
          <Row label="Free trial" hint="Card needed, first payment after the trial">
            <div className="grid grid-cols-4 gap-2" role="radiogroup">
              {[0, 7, 14, 30].map((d) => (
                <Choice key={d} checked={(community.setup?.trial ?? 0) === d} onClick={() => update({ setup: { ...community.setup, trial: d } })} title={d ? `${d} days` : "None"} />
              ))}
            </div>
          </Row>
        )}
        {community.tiers.length < 2 ? (
          <button
            onClick={() => update({ tiers: [...community.tiers, { id: "plus", name: "Inner Circle", price: "€149", cadence: "month", members: 0 }] })}
            className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            + Add a second tier
          </button>
        ) : (
          <Row label="Second tier" hint={<button onClick={() => update({ tiers: community.tiers.slice(0, 1) })} className="underline underline-offset-4">Remove</button>}>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Input value={community.tiers[1].name} onChange={(e) => update({ tiers: [community.tiers[0], { ...community.tiers[1], name: e.target.value }] })} aria-label="Second tier name" />
              <Input value={community.tiers[1].price} onChange={(e) => update({ tiers: [community.tiers[0], { ...community.tiers[1], price: e.target.value }] })} aria-label="Second tier price" className="tabular-nums" />
            </div>
          </Row>
        )}
        <p className="text-xs text-muted-foreground">Discounts, groups and who sees what are in Sales &amp; payments.</p>
      </More>
    </div>
  )
}

// ---------- ONB-14 · Get paid

export function PayoutsStep({ community, update }: StepProps) {
  const [busy, setBusy] = useState(false)
  const connected = community.setup?.payouts === "connected"
  const paid = community.tiers.some((t) => t.price !== "Free")

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-[var(--radius)] border bg-card p-5">
        <div className="flex items-start gap-3.5">
          <span className={cn("grid size-10 shrink-0 place-items-center bg-white/5", connected && "bg-[var(--ts-cta)] text-[#040404]")}>
            {connected ? <Check className="size-5" strokeWidth={2.5} /> : <Landmark className="size-5" />}
          </span>
          <div className="grid gap-1">
            <span className="text-base">{connected ? "Payouts connected" : "Connect your payouts"}</span>
            <span className="text-sm text-muted-foreground">
              {connected
                ? "Money from your students arrives in your bank account every week."
                : "A short form with our payment partner: who you are and where the money goes. About 5 minutes."}
            </span>
          </div>
        </div>
        {!connected && (
          <button
            disabled={busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => update({ setup: { ...community.setup, payouts: "connected" } }), 1200)
            }}
            className="flex h-7 items-center justify-center gap-1.5 rounded-[4px] bg-[var(--ts-cta)] text-[0.78125rem] font-medium text-[#040404] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0_0_1px_rgb(0_0_0/0.5)] hover:bg-[#ecf38a] disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Opening secure form…
              </>
            ) : (
              "Start payout setup"
            )}
          </button>
        )}
      </div>
      <ul className="grid gap-2 text-sm text-muted-foreground">
        <li>· Card, Apple Pay, Google Pay and SEPA for your students</li>
        <li>· VAT and invoices handled for you</li>
        <li>· Weekly payouts, no minimum</li>
      </ul>
      {!connected && paid && (
        <p className="text-xs text-[var(--ts-interactive)]">
          Your tier is paid, so students can&apos;t join until payouts are connected. You can still publish and invite them.
        </p>
      )}
      <p className="rounded-[var(--radius)] border border-dashed border-white/15 px-3 py-2 text-xs text-muted-foreground">
        <span className={cn(mono, "mr-1.5 text-[var(--ts-cta)]")}>Prototype</span>
        The real form is the payment provider&apos;s own (open question: Whop or Stripe Connect). Here it just simulates a success.
      </p>
    </div>
  )
}
