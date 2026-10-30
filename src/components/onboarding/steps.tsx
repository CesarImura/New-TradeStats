"use client"

import { useEffect, useState } from "react"
import { Check, CircleAlert } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { More } from "@/components/admin/design/controls"
import { DesignField } from "@/components/admin/design/design-fields"
import { LogoColoursField } from "@/components/admin/design/settings-fields"
import { COACHES } from "@/lib/data/coaches"
import { customCommunities, slugify } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"
import { Choice } from "./frame"
import { LookCards } from "@/components/admin/design/design-steps"
import { FullEditorLink } from "./look-steps"
import { suggestedTemplate } from "./suggest"
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
      {/* The same order as Design → Brand. */}
      <DesignField id="mode" />
      <DesignField id="primary" />
      <DesignField id="highlight" />
      <LogoColoursField />
      <More label="Profit and loss colours">
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
    <div className="grid gap-7">
      <BrandStep {...props} />
      <section className="grid gap-1.5 border-t pt-5" aria-labelledby="look-title">
        <h2 id="look-title" className="text-sm font-medium">
          Pick a look
        </h2>
        <p className="text-xs text-muted-foreground">Each one is a complete design; your logo and colours stay. Fine-tune fonts, roundness and widgets later in Design.</p>
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

