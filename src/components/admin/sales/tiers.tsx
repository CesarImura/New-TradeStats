"use client"

import { useState } from "react"
import { Eye, MoreHorizontal, Plus, Star, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addTier, amount, per, saveTier, setPreviewAs, useTiers, type TierExtra, type TierInfo } from "@/lib/data/access"
import { saveCatalog, useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { Field, NativeSelect, SettingRow } from "../kit"

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
        <Button onClick={() => setOpen(addTier(coach.slug).id)}>
          <Plus /> New tier
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Trial</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="hidden md:table-cell">Visible</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setOpen(t.id)}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {t.name}
                    {t.featured && <Star className="size-3.5 fill-[var(--ts-cta)] text-[var(--ts-cta)]" aria-label="Most popular" />}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {t.price}
                  <span className="text-muted-foreground"> {per(t.cadence)}</span>
                  {t.yearly && <span className="block text-xs text-muted-foreground">or {t.yearly} / year</span>}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{t.trial ? `${t.trial} days` : "–"}</TableCell>
                <TableCell className="tabular-nums">{t.members.toLocaleString("en")}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="font-normal">
                    {t.hidden ? "Hidden · link only" : "On sales page"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${t.name}`}>
                    <MoreHorizontal />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
      <SheetContent className="w-full sm:max-w-lg">
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
            <div className="divide-y rounded-lg border px-3">
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
              <span className="text-[0.8rem] font-medium">What the sales page lists</span>
              <ul className="grid gap-1">
                {x.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Input value={f} onChange={(e) => set({ features: x.features.map((y, j) => (j === i ? e.target.value : y)) })} className="h-8" />
                    <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => set({ features: x.features.filter((_, j) => j !== i) })}>
                      <X />
                    </Button>
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
                <Button type="submit" variant="outline" size="sm">
                  Add
                </Button>
              </form>
            </div>

            <div className="grid gap-2">
              <span className="text-[0.8rem] font-medium">Courses it unlocks</span>
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
          <Button
            variant="outline"
            onClick={() => {
              if (!tier) return
              setPreviewAs(coach.slug, { kind: "tier", id: tier.id, label: x?.name ?? tier.name })
              window.open(`/c/${coach.slug}`, "_blank")
            }}
          >
            <Eye /> Preview as
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (x && tier) saveTier(coach.slug, tier.id, index, x)
              toast(`${x?.name} saved`)
              onClose()
            }}
          >
            Save tier
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
