"use client"

import { useState } from "react"
import { Check, Eye, Plus, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { addTier, amount, per, saveTier, setPreviewAs, useTiers, type TierExtra, type TierInfo } from "@/lib/data/access"
import { saveCatalog, useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { Field, NativeSelect, SettingRow } from "../kit"
import { Panel, Tag, AdminButton } from "../ui"

/** ADM-29 Tiers & prices and ADM-30 tier editor. */
export function Tiers() {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [open, setOpen] = useState<string | null>(null)
  const tier = tiers.find((t) => t.id === open) ?? null

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">No fixed tiers: make as many as you need. Each one has its own price and its own access.</p>
        <AdminButton hierarchy="primary" onClick={() => setOpen(addTier(coach.slug).id)}>
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
      <p className="text-xs text-muted-foreground">Upgrades start straight away with the price difference. Downgrades start at the end of the period. Nothing is deleted when someone cancels.</p>
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

  return (
    <Sheet open={!!tier} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full data-[side=right]:w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{x?.name || "Tier"}</SheetTitle>
          <SheetDescription>{tier?.members ? `${tier.members} members. Price changes apply to new members only.` : "Not on sale yet."}</SheetDescription>
        </SheetHeader>
        {x && tier && (
          <div className="grid gap-5 overflow-y-auto px-4">
            <Field label="Name">
              <Input value={x.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="One line for the sales page" hint="Optional">
              <Input value={x.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. For traders who want daily guidance" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price">
                <Input value={x.price ?? ""} onChange={(e) => set({ price: e.target.value })} className="tabular-nums" />
              </Field>
              <Field label="Billing">
                <NativeSelect value={x.cadence} onChange={(e) => set({ cadence: e.target.value })}>
                  <option value="month">Monthly</option>
                  <option value="quarter">Every 3 months</option>
                  <option value="year">Yearly</option>
                  <option value="once">One payment</option>
                </NativeSelect>
              </Field>
            </div>
            <div className="divide-y rounded-lg border px-3 bg-card">
              <SettingRow label="Also offer yearly" text="Usually two months free">
                {x.yearly !== undefined && <Input value={x.yearly} onChange={(e) => set({ yearly: e.target.value })} className="h-8 w-24 tabular-nums" aria-label="Yearly price" />}
                <Switch checked={x.yearly !== undefined} onCheckedChange={(v) => set({ yearly: v ? `€${Math.round(amount(x.price ?? "") * 10)}` : undefined })} />
              </SettingRow>
              <SettingRow label="Free trial" text="Card needed; first payment after the trial">
                <NativeSelect value={String(x.trial)} onChange={(e) => set({ trial: Number(e.target.value) })}>
                  {[0, 3, 7, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {d ? `${d} days` : "No trial"}
                    </option>
                  ))}
                </NativeSelect>
              </SettingRow>
              <SettingRow label="Pay in instalments" text="For one-time prices: 3 monthly payments">
                <Switch checked={x.installments} onCheckedChange={(v) => set({ installments: v })} />
              </SettingRow>
              <SettingRow label="Mark as most popular" text="Highlighted on the sales page">
                <Switch checked={!!x.featured} onCheckedChange={(v) => set({ featured: v })} />
              </SettingRow>
              <SettingRow label="Hidden" text="Not on the sales page; only people with the link can join">
                <Switch checked={x.hidden} onCheckedChange={(v) => set({ hidden: v })} />
              </SettingRow>
            </div>

            <div className="grid gap-2">
              <span className="text-[0.8125rem] font-medium">What the sales page lists</span>
              <ul className="grid gap-1">
                {x.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Input value={f} onChange={(e) => set({ features: x.features.map((y, j) => (j === i ? e.target.value : y)) })} className="h-8" />
                    <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Remove" onClick={() => set({ features: x.features.filter((_, j) => j !== i) })}>
                      <X />
                    </AdminButton>
                  </li>
                ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!feature.trim()) return
                  set({ features: [...x.features, feature.trim()] })
                  setFeature("")
                }}
              >
                <Input value={feature} onChange={(e) => setFeature(e.target.value)} placeholder="Add a line, e.g. Weekly group call" className="h-8" />
                <AdminButton hierarchy="secondary" size="md" type="submit">
                  Add
                </AdminButton>
              </form>
            </div>

            <div className="grid gap-2">
              <span className="text-[0.8125rem] font-medium">Courses it unlocks</span>
              {catalog.courses
                .filter((c) => c.status !== "archived")
                .map((c) => (
                  <label key={c.id} className={cn("flex items-center gap-2 text-sm", c.status !== "published" && "text-muted-foreground")}>
                    <Checkbox checked={has(c.tiers)} onCheckedChange={(v) => toggleCourse(c.id, !!v)} />
                    {c.title}
                    {c.status !== "published" && <span className="text-xs">· {c.status}</span>}
                  </label>
                ))}
              <p className="text-xs text-muted-foreground">Saved straight away. Modules and groups are fine-tuned in the Access tab.</p>
            </div>
            <Field label="Discord role">
              <NativeSelect value={x.role} onChange={(e) => set({ role: e.target.value })}>
                <option value="">Same as in Community</option>
                <option>@Core</option>
                <option>@Trading Desk</option>
                <option>@VIP</option>
              </NativeSelect>
            </Field>
          </div>
        )}
        <SheetFooter className="flex-row">
          <AdminButton hierarchy="secondary"
            onClick={() => {
              if (!tier) return
              setPreviewAs(coach.slug, { kind: "tier", id: tier.id, label: x?.name ?? tier.name })
              window.open(`/c/${coach.slug}`, "_blank")
            }}
          >
            <Eye /> Preview as
          </AdminButton>
          <AdminButton hierarchy="primary"
            className="flex-1"
            onClick={() => {
              if (x && tier) saveTier(coach.slug, tier.id, index, x)
              toast(`${x?.name} saved`)
              onClose()
            }}
          >
            Save tier
          </AdminButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
