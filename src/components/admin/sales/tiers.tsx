"use client"

import { useState } from "react"
import { Check, Eye, Plus, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { addTier, per, saveTier, setPreviewAs, useTiers, type TierExtra, type TierInfo } from "@/lib/data/access"
import { saveCatalog, useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { NativeSelect } from "../kit"
import { AdminButton, AdminModal, AdminSegmented, AdminUnderlineTabs, Panel, Tag, adminControl } from "../ui"

const input = adminControl

/** ADM-29 Tiers & prices and ADM-30 tier editor. */
export function Tiers() {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [open, setOpen] = useState<string | null>(null)
  const tier = tiers.find((t) => t.id === open) ?? null

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="t-body-m text-a-text-2">No fixed tiers: make as many as you need. Each one has its own price and its own access.</p>
        <AdminButton onClick={() => setOpen(addTier(coach.slug).id)}>
          <Plus /> New tier
        </AdminButton>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((t) => (
          <Panel key={t.id} className={cn("flex flex-col gap-0 p-0", t.featured && "border-a-accent-strong/60")}>
            <button type="button" onClick={() => setOpen(t.id)} className="flex flex-1 flex-col gap-4 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">
              <span className="flex flex-wrap items-center gap-2">
                <span className="t-heading-l">{t.name}</span>
                {t.featured && <Tag tone="accent" dot>Most popular</Tag>}
                {t.hidden && <Tag>Hidden · link only</Tag>}
              </span>
              <span className="flex flex-col gap-1">
                <span className="flex items-baseline gap-2">
                  <span className="t-display tabular-nums">{t.price}</span>
                  <span className="t-body-m text-a-text-2">{per(t.cadence)}</span>
                </span>
                <span className="t-caption text-a-text-3">{t.yearly ? `${t.yearly} / year` : t.trial ? `${t.trial}-day free trial` : "No trial"}</span>
              </span>
              <span className="h-px bg-a-border" />
              <ul className="grid gap-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 t-body-m">
                    <Check className="mt-0.5 size-4 shrink-0 text-a-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
            <div className="flex items-center justify-between border-t border-a-border px-5 py-3">
              <span className="t-caption text-a-text-2 tabular-nums">{t.members.toLocaleString("en")} members</span>
              <AdminButton hierarchy="secondary" size="md" onClick={() => setOpen(t.id)} aria-label={`Edit ${t.name}`}>
                Edit
              </AdminButton>
            </div>
          </Panel>
        ))}
      </div>
      <p className="t-caption text-a-text-2">Upgrades start straight away with the price difference. Downgrades start at the end of the period. Nothing is deleted when someone cancels.</p>
      <TierEditor tier={tier} index={tiers.findIndex((t) => t.id === open)} onClose={() => setOpen(null)} />
    </div>
  )
}

function TierEditor({ tier, index, onClose }: { tier: TierInfo | null; index: number; onClose: () => void }) {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const allTiers = useTiers(coach).map((t) => t.id)
  const [x, setX] = useState<TierExtra | null>(null)
  const [key, setKey] = useState<string | undefined>()
  if (tier?.id !== key) {
    setKey(tier?.id)
    setX(tier ? { ...tier, features: [...tier.features] } : null)
  }
  const set = (p: Partial<TierExtra>) => setX((v) => (v ? { ...v, ...p } : v))
  const [feature, setFeature] = useState("")

  // Course access lives on the course, so the access overview and the course builder show the same thing.
  const has = (courseTiers: string[]) => !!tier && (courseTiers.length === 0 || courseTiers.includes(tier.id))
  const toggleCourse = (id: string, on: boolean) =>
    tier &&
    saveCatalog(coach, (c) => ({
      ...c,
      courses: c.courses.map((co) => {
        if (co.id !== id) return co
        const current = co.tiers.length ? co.tiers : allTiers
        const next = on ? [...new Set([...current, tier.id])] : current.filter((t) => t !== tier.id)
        return { ...co, tiers: next.length === allTiers.length ? [] : next }
      }),
    }))

  const [tab, setTab] = useState<"plan" | "page">("plan")
  const [lastKey, setLastKey] = useState<string | undefined>()
  if (tier?.id !== lastKey) {
    setLastKey(tier?.id)
    setTab("plan")
  }
  const seg = <T extends string>(value: T, options: readonly [T, string][], onPick: (v: T) => void, label: string) => <AdminSegmented label={label} value={value} onChange={onPick} options={options.map(([v, l]) => ({ value: v, label: l }))} />
  const cadenceOf = (c: string) => (c === "once" ? "once" : c === "quarter" ? "quarter" : "month")

  return (
    <AdminModal open={!!tier} onOpenChange={(o) => !o && onClose()} title={x?.name || "Tier"} subtitle={tier?.members ? `${tier.members} members · changes apply to new members` : "Not on sale yet."} className="h-[min(1060px,calc(100svh-1rem))] sm:max-w-[560px]" bodyClassName="gap-5 py-4"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={() => { if (!tier) return; setPreviewAs(coach.slug, { kind: "tier", id: tier.id, label: x?.name ?? tier.name }); window.open(`/c/${coach.slug}`, "_blank") }}><Eye /> Preview as</AdminButton>
          <span className="flex-1" />
          <AdminButton hierarchy="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={() => { if (x && tier) saveTier(coach.slug, tier.id, index, x); toast(`${x?.name} saved`); onClose() }}>Save tier</AdminButton>
        </>
      }>
      <AdminUnderlineTabs label="Tier sections" value={tab} onChange={setTab} tabs={[{ id: "plan", label: "Plan" }, { id: "page", label: "Sales page" }]} />
        {x && tier && tab === "plan" && (
          <div className="grid content-start gap-5">
            <label className="grid gap-2">
              <span className="t-caption text-a-text-2">Name</span>
              <input value={x.name ?? ""} onChange={(e) => set({ name: e.target.value })} className={cn(input, "h-11")} />
            </label>
            <div className="grid grid-cols-2 items-start gap-3">
              <label className="grid gap-2">
                <span className="t-caption text-a-text-2">Price</span>
                <span className="flex h-11 items-center rounded-a-md border border-a-border bg-a-field pr-3 focus-within:border-a-border-focus">
                  <input value={(x.price ?? "").replace(/^€/, "")} onChange={(e) => set({ price: `€${e.target.value.replace(/^€/, "")}` })} aria-label="Price" className="min-w-0 flex-1 bg-transparent px-3.5 t-body-l text-a-text tabular-nums outline-none" />
                  <span className="t-caption text-a-text-3">EUR</span>
                </span>
              </label>
              <label className="grid gap-2">
                <span className="t-caption text-a-text-2">Yearly price</span>
                <span className="flex h-11 items-center rounded-a-md border border-a-border bg-a-field pr-3 focus-within:border-a-border-focus">
                  <input value={(x.yearly ?? "").replace(/^€/, "")} onChange={(e) => set({ yearly: e.target.value ? `€${e.target.value.replace(/^€/, "")}` : undefined })} placeholder="—" aria-label="Yearly price" className="min-w-0 flex-1 bg-transparent px-3.5 t-body-l text-a-text tabular-nums outline-none placeholder:text-a-text-3" />
                  <span className="t-caption text-a-text-3">EUR</span>
                </span>
                <span className="t-caption text-a-text-3">Usually two months free</span>
              </label>
            </div>
            <div className="grid gap-2">
              <span className="t-caption text-a-text-2">Billing</span>
              {seg(cadenceOf(x.cadence ?? "month"), [["month", "Monthly"], ["once", "One payment"], ["quarter", "Every 3 months"]], (v) => set({ cadence: v }), "Billing")}
            </div>
            <div className="grid gap-2">
              <span className="t-caption text-a-text-2">Free trial</span>
              {seg(String(x.trial) === "0" ? "0" : String(x.trial) === "14" ? "14" : "7", [["0", "No trial"], ["7", "7 days"], ["14", "14 days"]], (v) => set({ trial: Number(v) }), "Free trial")}
              <span className="t-caption text-a-text-3">Card needed; first payment after the trial</span>
            </div>
            <span className="h-px bg-a-border-subtle" aria-hidden />
            <div className="grid gap-4">
              {([
                ["Mark as most popular", "Highlighted on the sales page", !!x.featured, (v: boolean) => set({ featured: v })],
                ["Hidden · link only", "Not on the sales page; only people with the link can join", x.hidden, (v: boolean) => set({ hidden: v })],
                ["Waiting list when full", "People leave their e-mail and hear first when a seat opens", !!x.waitlist, (v: boolean) => set({ waitlist: v })],
              ] as const).map(([label, text, on, fn]) => (
                <label key={label} className="flex items-center justify-between gap-4">
                  <span className="grid"><span className="t-body-m text-a-text">{label}</span><span className="t-caption text-a-text-2">{text}</span></span>
                  <Switch checked={on} onCheckedChange={fn} />
                </label>
              ))}
            </div>
          </div>
        )}

        {x && tier && tab === "page" && (
          <div className="grid content-start gap-5">
            <label className="grid gap-2">
              <span className="t-caption text-a-text-2">One line for the sales page <span className="text-a-text-3">Optional</span></span>
              <input value={x.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. For traders who want daily guidance" className={cn(input, "h-11")} />
            </label>
            <div className="grid gap-2">
              <span className="t-body-m text-a-text">What the sales page lists</span>
              <ul className="grid gap-1.5">
                {x.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input value={f} onChange={(e) => set({ features: x.features.map((y, j) => (j === i ? e.target.value : y)) })} aria-label={`Line ${i + 1}`} className={cn(input, "h-9")} />
                    <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Remove" onClick={() => set({ features: x.features.filter((_, j) => j !== i) })}><X /></AdminButton>
                  </li>
                ))}
              </ul>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!feature.trim()) return; set({ features: [...x.features, feature.trim()] }); setFeature("") }}>
                <input value={feature} onChange={(e) => setFeature(e.target.value)} placeholder="Add a line, e.g. Weekly group call" className={cn(input, "h-9")} />
                <AdminButton type="submit" hierarchy="secondary" size="lg">Add</AdminButton>
              </form>
            </div>
            <div className="grid gap-2">
              <span className="t-body-m text-a-text">Courses it unlocks</span>
              {catalog.courses.filter((c) => c.status !== "archived").map((c) => (
                <label key={c.id} className={cn("flex h-7 items-center gap-3 t-body-m text-a-text", c.status !== "published" && "text-a-text-2")}>
                  <Checkbox checked={has(c.tiers)} onCheckedChange={(v) => toggleCourse(c.id, !!v)} />
                  {c.title}
                  {c.status !== "published" && <span className="t-caption text-a-text-3">· {c.status}</span>}
                </label>
              ))}
              <p className="t-caption text-a-text-2">Saved straight away. Modules and groups are fine-tuned in the Access tab.</p>
            </div>
            <label className="grid gap-2">
              <span className="t-caption text-a-text-2">Discord role</span>
              <NativeSelect value={x.role} onChange={(e) => set({ role: e.target.value })}>
                <option value="">Same as in Community</option>
                <option>@Core</option>
                <option>@Trading Desk</option>
                <option>@VIP</option>
              </NativeSelect>
            </label>
          </div>
        )}
    </AdminModal>
  )
}
