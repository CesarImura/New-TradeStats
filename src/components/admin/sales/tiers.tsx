"use client"

import { useEffect, useRef, useState } from "react"
import { Check, MoreHorizontal, Plus, Tag as TagIcon, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { addTier, amount, isFreeTier, per, saveTier, setPreviewAs, useTiers, type TierExtra, type TierInfo } from "@/lib/data/access"
import { saveCatalog, useCatalog } from "@/lib/data/learning"
import { setStored, useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { AdminButton, AdminDrawer, AdminSegmented, AdminUnderlineTabs, Callout, EmptyState, Panel, Tag, adminControl } from "../ui"

const NO_EXTRA: Record<string, TierExtra> = {}

const cadenceOf = (c: string) => (c === "once" ? "once" : c === "quarter" ? "quarter" : "month")

/** What sits under the price: the yearly price, how it can be paid, or the trial. */
const subline = (t: TierInfo) => (t.yearly ? `${t.yearly} / year · 2 months free` : t.installments ? "One payment or 3 instalments" : t.trial ? `${t.trial}-day free trial` : "No trial")

/** Sales · 02 Tiers & prices (Figma 535:7431) and 03 Edit tier (535:7677): price cards, and the tier opens in a drawer. */
export function Tiers({ newSignal, onNew }: { newSignal: number; onNew?: () => void }) {
  const { coach } = useCoach()
  const all = useTiers(coach)
  // Saved at least once (a tier just added and cancelled is not "ready" for the Getting started tour).
  const saved = useStored(`${coach.slug}:tier-extra`, NO_EXTRA)
  const [open, setOpen] = useState<string | null>(null)
  // The first tier, being created: the page behind the drawer still says "No tiers yet" until it's saved.
  const tiers = all.filter((t) => !isFreeTier(t) && !(t.id === open && all.length === 1 && !saved[t.id]))
  const index = all.findIndex((t) => t.id === open)
  const tier = all[index] ?? null

  // "New tier" lives in the page header: each click adds one and opens it.
  const seen = useRef(newSignal)
  useEffect(() => {
    if (newSignal === seen.current) return
    seen.current = newSignal
    setOpen(addTier(coach.slug).id)
  }, [newSignal, coach.slug])

  const patch = (t: TierInfo, p: Partial<TierExtra>, said: string) => {
    saveTier(coach.slug, t.id, all.findIndex((x) => x.id === t.id), p)
    toast(said)
  }

  // A new platform has no tier yet (Figma 1036:2805).
  if (tiers.length === 0)
    return (
      <>
        <EmptyState
          icon={TagIcon}
          title="No tiers yet"
          description="A tier is what students pay to join. Create one to start selling."
          actions={
            onNew && (
              <AdminButton data-tour="tier-new" onClick={onNew}>
                <Plus /> New tier
              </AdminButton>
            )
          }
        />
        <TierEditor tier={tier} index={index} onClose={() => setOpen(null)} />
      </>
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((t, i) => (
          <Panel key={t.id} data-tour={i === 0 ? "tier-card" : undefined} data-ready={saved[t.id] ? true : undefined} className={cn("gap-0 p-0", t.featured && "border-a-accent-strong")}>
            <div className="flex flex-1 flex-col gap-3 p-5 pb-4">
              <div className="flex items-start gap-2">
                <h2 className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 t-heading-m text-a-text">
                  {t.name}
                  {t.featured && <Tag tone="accent" dot>Most popular</Tag>}
                  {t.hidden && <Tag>Hidden · link only</Tag>}
                </h2>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<AdminButton aria-label={`Actions for ${t.name}`} hierarchy="ghost" size="md" iconOnly className="-mt-1 -mr-2" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setOpen(t.id)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => patch(t, { featured: !t.featured }, t.featured ? `${t.name} is no longer most popular` : `${t.name} is the most popular`)}>{t.featured ? "Remove “Most popular”" : "Mark as most popular"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => (setPreviewAs(coach.slug, { kind: "tier", id: t.id, label: t.name }), window.open(`/c/${coach.slug}`, "_blank"))}>Preview as this tier</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => patch(t, { hidden: !t.hidden }, t.hidden ? `${t.name} is on the sales page` : `${t.name} is link only`)}>{t.hidden ? "Show on the sales page" : "Hide: link only"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="t-display tabular-nums">{t.price}</span>
                <span className="t-body-m text-a-text-2">{per(t.cadence)}</span>
              </div>
              <span className="t-caption text-a-text-3">{subline(t)}</span>
              <span className="h-px bg-a-border" />
              <ul className="grid gap-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 t-body-m">
                    <Check className="mt-0.5 size-4 shrink-0 text-a-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between border-t border-a-border px-5 py-3">
              <span className="t-caption text-a-text-2 tabular-nums">{t.members.toLocaleString("en")} members</span>
              <AdminButton hierarchy="secondary" size="md" onClick={() => setOpen(t.id)} aria-label={`Edit ${t.name}`}>
                Edit
              </AdminButton>
            </div>
          </Panel>
        ))}
      </div>
      <Callout action={<AdminButton hierarchy="secondary" size="md" onClick={() => tiers[0] && setOpen(tiers[0].id)}>Review</AdminButton>}>
        No free tier: visitors see the paywall first. Free days on a paid tier work as a trial.
      </Callout>
      <TierEditor tier={tier} index={index} onClose={() => setOpen(null)} />
    </div>
  )
}

/** A number with its currency inside the field. */
function Money({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <span className="flex h-11 items-center rounded-a-md border border-a-border-subtle bg-a-field pr-3 transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong">
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder={placeholder} aria-label={label} className="min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text tabular-nums outline-none placeholder:text-a-text-3" />
      <span className="t-caption text-a-text-3">EUR</span>
    </span>
  )
}

function TierEditor({ tier, index, onClose }: { tier: TierInfo | null; index: number; onClose: () => void }) {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const allTiers = useTiers(coach).map((t) => t.id)
  const names = Object.fromEntries(useTiers(coach).map((t) => [t.id, t.name]))
  const [x, setX] = useState<TierExtra | null>(null)
  const [key, setKey] = useState<string | undefined>()
  const [tab, setTab] = useState<"plan" | "page">("plan")
  const saved = useStored(`${coach.slug}:tier-extra`, NO_EXTRA)
  // The platform's very first tier, just added (Getting started · Create a tier, Figma 1036:3177): the coach types the
  // name and price, there's no trial, one sales line to fill, and the extra options wait for later.
  const fresh = !!tier && !saved[tier.id] && tier.members === 0 && allTiers.length <= 1
  // Open on Plan with this tier's values every time (derived state, no effect).
  if (tier?.id !== key) {
    setKey(tier?.id)
    setX(tier ? (fresh ? { ...tier, name: "", price: "", trial: 0, features: [""] } : { ...tier, features: [...tier.features] }) : null)
    setTab("plan")
  }
  const set = (p: Partial<TierExtra>) => setX((v) => (v ? { ...v, ...p } : v))
  // Closing the first tier without saving it drops it, so the page goes back to "No tiers yet".
  const close = () => {
    if (fresh && tier) setStored<{ id: string }[]>(`${coach.slug}:tiers-added`, (a) => a.filter((t) => t.id !== tier.id), [])
    onClose()
  }

  // Course access lives on the course (Content), so the Access tab and the course builder show the same thing.
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

  const save = () => {
    if (!x || !tier) return
    saveTier(coach.slug, tier.id, index, { ...x, features: x.features.map((f) => f.trim()).filter(Boolean) })
    toast(`${x.name || tier.name} saved`)
    onClose()
  }

  return (
    <AdminDrawer
      open={!!tier}
      onOpenChange={(o) => !o && close()}
      title={fresh ? "New tier" : x?.name || "Tier"}
      subtitle={fresh ? "What students pay to join your platform" : tier?.members ? `${tier.members} members · changes apply to new members` : "Not on sale yet."}
      bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton>
          <AdminButton disabled={!x?.name?.trim() || !amount(x.price ?? "")} onClick={save}>Save tier</AdminButton>
        </>
      }>
      <AdminUnderlineTabs label="Tier sections" value={tab} onChange={setTab} tabs={[{ id: "plan", label: "Plan" }, { id: "page", label: "Sales page" }]} />
      {x && tier && tab === "plan" && (
        <div className="flex flex-col gap-5">
          <div data-tour="tier-plan" className="flex flex-col gap-5">
          <label className="grid gap-1.5">
            <span className="t-caption text-a-text">Name</span>
            <input value={x.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder={fresh ? "e.g. Inner Circle" : undefined} className={cn(adminControl, "h-11")} />
          </label>
          <div className="grid grid-cols-2 items-start gap-3">
            <div className="grid gap-1.5">
              <span className="t-caption text-a-text">Price</span>
              <Money label="Price" value={(x.price ?? "").replace(/^€/, "")} onChange={(v) => set({ price: `€${v}` })} />
            </div>
            <div className="grid gap-1.5">
              <span className="t-caption text-a-text">Yearly price</span>
              <Money label="Yearly price" value={(x.yearly ?? "").replace(/^€/, "")} onChange={(v) => set({ yearly: v ? `€${v}` : undefined })} placeholder="—" />
              <span className="t-caption text-a-text-3">Usually two months free</span>
            </div>
          </div>
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Billing</span>
            <AdminSegmented label="Billing" value={cadenceOf(x.cadence ?? "month")} onChange={(v) => set({ cadence: v })} options={[{ value: "month", label: "Monthly" }, { value: "once", label: "One payment" }, { value: "quarter", label: "Every 3 months" }]} />
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Free trial</span>
            <AdminSegmented label="Free trial" value={x.trial === 14 ? "14" : x.trial === 7 ? "7" : "0"} onChange={(v) => set({ trial: Number(v) })} options={[{ value: "0", label: "No trial" }, { value: "7", label: "7 days" }, { value: "14", label: "14 days" }]} />
            <span className="t-caption text-a-text-3">{x.trial ? "Card needed; first payment after the trial" : "Students pay when they join"}</span>
          </div>
          {!fresh && <span className="h-px bg-a-border" aria-hidden />}
          <div className={cn("flex flex-col gap-3.5", fresh && "hidden")}>
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
        <div data-tour="tier-page" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="t-caption text-a-text">Courses it unlocks</span>
            {catalog.courses.filter((c) => c.status !== "archived").map((c) => {
              const only = c.tiers.length > 0 && !c.tiers.includes(tier.id) ? `${c.tiers.map((id) => names[id]).filter(Boolean).join(", ")} only` : ""
              return (
                <label key={c.id} className="flex min-h-5 items-center gap-2.5 t-body-m text-a-text">
                  <Checkbox checked={has(c.tiers)} onCheckedChange={(v) => toggleCourse(c.id, !!v)} />
                  <span className={cn("min-w-0 flex-1", c.status !== "published" && "text-a-text-2")}>
                    {c.title}
                    {c.status !== "published" && <span className="t-caption text-a-text-3"> · {c.status}</span>}
                  </span>
                  {only && <span className="t-caption text-a-text-3">{only}</span>}
                </label>
              )
            })}
          </div>
          <div className="flex flex-col gap-2">
            <span className="t-caption text-a-text">Sales page lines</span>
            {x.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={f} autoFocus={f === "" && i === x.features.length - 1} onChange={(e) => set({ features: x.features.map((y, j) => (j === i ? e.target.value : y)) })} placeholder="e.g. Weekly group call" aria-label={`Line ${i + 1}`} className={cn(adminControl, "h-11 min-w-0 flex-1")} />
                <AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Remove line ${i + 1}`} onClick={() => set({ features: x.features.filter((_, j) => j !== i) })}><X /></AdminButton>
              </div>
            ))}
            <div>
              <AdminButton hierarchy="ghost" size="md" onClick={() => set({ features: [...x.features, ""] })}>
                <Plus /> Add a line
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminDrawer>
  )
}
