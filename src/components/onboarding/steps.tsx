"use client"

import { useEffect, useState } from "react"
import { CircleAlert } from "@/components/icons"
import { Switch } from "@/components/ui/switch"
import { AdminFilter, AdminSegmented, Callout, adminControl } from "@/components/admin/ui"
import { More } from "@/components/admin/design/fields/controls"
import { DesignField } from "@/components/admin/design/fields/design-fields"
import { LogoColoursField } from "@/components/admin/design/fields/settings-fields"
import { COACHES } from "@/lib/data/coaches"
import { customCommunities, slugify } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"
import { LookCards } from "@/components/admin/design/editor/design-steps"
import { FullEditorLink } from "./look-steps"
import { suggestedTemplate } from "./suggest"
import type { StepProps } from "./wizard"

function Row({ label, hint, children }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-caption text-a-text">{label}</span>
        {hint && <span className="t-caption text-a-text-3">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** A field with something fixed before or after what you type, in one 44px control. */
function Affix({ before, after, children }: { before?: React.ReactNode; after?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-11 items-stretch overflow-hidden rounded-a-md border border-a-border-subtle bg-a-field transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong">
      {before && <span className="flex items-center border-r border-a-border-subtle px-3 t-body-m text-a-text-2">{before}</span>}
      {children}
      {after && <span className="flex items-center px-3 t-caption text-a-text-3">{after}</span>}
    </div>
  )
}
const bare = "min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text tabular-nums outline-none placeholder:text-a-text-3"

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
    <div className="grid gap-5">
      <Row label="Platform name" hint={`${community.name.length}/40`}>
        <input
          aria-label="Platform name"
          value={community.name}
          maxLength={40}
          autoFocus
          className={cn(adminControl, "h-11")}
          onChange={(e) => {
            const name = e.target.value
            const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
            update({ name, org: name || community.org, mark: initials || community.mark, ...(touched ? {} : { address: slugify(name) }) })
          }}
        />
      </Row>

      <Row label="Your address">
        <Affix before="https://" after=".traderhub.io">
          <input
            aria-label="Your address"
            value={address}
            onChange={(e) => {
              setTouched(true)
              update({ address: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) })
            }}
            className={bare}
            spellCheck={false}
          />
        </Affix>
        <span className={cn("flex items-center gap-1.5 t-caption", ok || !community.name.trim() ? "text-a-text-3" : "text-a-warning")}>
          {!ok && community.name.trim() ? <CircleAlert className="size-3.5" /> : null}
          {!community.name.trim()
            ? "Give your platform a name first."
            : taken
              ? "That address is taken. Try adding your name or a word like ‘academy’."
              : !valid
                ? "Use 2–40 letters, numbers or dashes."
                : "Free · your own domain later in Settings"}
        </span>
      </Row>

      <Row label="What do students call you?" hint="Used in messages like “Marco replied”">
        <input aria-label="What do students call you?" value={community.coachName} onChange={(e) => update({ coachName: e.target.value })} className={cn(adminControl, "h-11")} />
      </Row>
    </div>
  )
}

// ---------- ONB-10 · Brand (same order as Design → Brand)

export function BrandStep({ community, update, setReady }: StepProps) {
  return (
    <div className="grid gap-6">
      <NameRows community={community} update={update} setReady={setReady} />
      <div className="grid gap-5">
        <DesignField id="logo" />
        <DesignField id="primary" />
      </div>
      <More label="More brand options">
        <DesignField id="mode" />
        <DesignField id="highlight" />
        <LogoColoursField />
        <DesignField id="trading" />
      </More>
    </div>
  )
}

/**
 * The first setup step: the brand, then the ready-made looks (the one that fits the sign-up answers
 * marked). No fine-tuning here: fonts, shape, widgets and page wait in Design.
 */
export function BrandLookStep(props: StepProps) {
  const acc = useAccount()
  return (
    <div className="grid gap-6">
      <BrandStep {...props} />
      <section className="grid gap-2 border-t border-a-border pt-5" aria-labelledby="look-title">
        <h2 id="look-title" className="t-caption text-a-text">Template</h2>
        <p className="t-caption text-a-text-2">Each one is a complete design; your logo and colours stay. Fine-tune fonts, roundness and widgets later in Design.</p>
        <div className="-mx-4 md:-mx-5">
          <LookCards suggested={suggestedTemplate(acc?.answers)} templates={false} />
        </div>
      </section>
      <FullEditorLink slug={props.community.slug} />
    </div>
  )
}


// ---------- ONB-12 · First tier

const CADENCES = [
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Every 3 months" },
  { value: "year", label: "Yearly" },
  { value: "once", label: "One payment" },
]

export function TierStep({ community, update, setReady }: StepProps) {
  const tier = community.tiers[0] ?? { id: "core", name: "", price: "€49", cadence: "month", members: 0 }
  const free = tier.price === "Free"
  const amount = free ? "" : tier.price.replace(/[^\d.,]/g, "")
  const set = (patch: Partial<typeof tier>) => update({ tiers: [{ ...tier, ...patch }, ...community.tiers.slice(1)] })
  const ok = tier.name.trim().length > 0 && (free || Number(amount.replace(",", ".")) > 0)
  const trial = community.setup?.trial ?? 0
  const second = community.tiers[1]

  useEffect(() => setReady(ok), [ok, setReady])
  // Save the starting values so the tier exists even if nothing is typed.
  useEffect(() => {
    if (!community.tiers.length) set({ name: "Core" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-5">
      <Row label="Name">
        <input aria-label="Name" value={tier.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Core, Academy, Inner Circle" className={cn(adminControl, "h-11")} />
      </Row>
      <Row label="Free or paid">
        <AdminSegmented label="Free or paid" value={free ? "free" : "paid"} onChange={(v) => set(v === "free" ? { price: "Free", cadence: "month" } : { price: "€49" })} options={[{ value: "free", label: "Free" }, { value: "paid", label: "Paid" }]} />
      </Row>
      {!free && (
        <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
          <Row label="Price">
            <Affix after="EUR">
              <input aria-label="Price" inputMode="decimal" value={amount} onChange={(e) => set({ price: `€${e.target.value.replace(/[^\d.,]/g, "")}` })} className={bare} />
            </Affix>
          </Row>
          <Row label="Billing">
            <AdminFilter ariaLabel="Billing" value={tier.cadence} onValueChange={(v) => set({ cadence: v })} options={CADENCES} className="h-11! w-full justify-between" />
          </Row>
        </div>
      )}
      {!free && (
        <div className="flex items-center gap-3 rounded-a-10 border border-a-border px-4 py-3">
          <span className="grid flex-1">
            <span className="t-body-m text-a-text">Free trial</span>
            <span className="t-caption text-a-text-2">Card needed, first payment after the trial</span>
          </span>
          {trial > 0 && <AdminFilter ariaLabel="Trial length" value={String(trial)} onValueChange={(v) => update({ setup: { ...community.setup, trial: Number(v) } })} options={[7, 14, 30].map((d) => ({ value: String(d), label: `${d} days` }))} />}
          <Switch checked={trial > 0} onCheckedChange={(v) => update({ setup: { ...community.setup, trial: v ? 7 : 0 } })} aria-label="Free trial" />
        </div>
      )}
      <div className="grid gap-3 rounded-a-10 border border-a-border px-4 py-3">
        <label className="flex items-center gap-3">
          <span className="grid flex-1">
            <span className="t-body-m text-a-text">Add a second tier</span>
            <span className="t-caption text-a-text-2">For example a cheaper community-only tier</span>
          </span>
          <Switch checked={!!second} onCheckedChange={(v) => update({ tiers: v ? [...community.tiers, { id: "plus", name: "Inner Circle", price: "€149", cadence: "month", members: 0 }] : community.tiers.slice(0, 1) })} aria-label="Add a second tier" />
        </label>
        {second && (
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <input value={second.name} onChange={(e) => update({ tiers: [community.tiers[0], { ...second, name: e.target.value }] })} aria-label="Second tier name" className={cn(adminControl, "h-11")} />
            <input value={second.price} onChange={(e) => update({ tiers: [community.tiers[0], { ...second, price: e.target.value }] })} aria-label="Second tier price" className={cn(adminControl, "h-11 tabular-nums")} />
          </div>
        )}
      </div>
      <Callout>Payouts are set up later in Sales. Students can join free during the trial.</Callout>
    </div>
  )
}
