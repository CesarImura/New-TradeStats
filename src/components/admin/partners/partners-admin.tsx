"use client"

import { useState } from "react"
import Link from "next/link"
import { Handshake, Pencil, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"

import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTiers } from "@/lib/data/access"
import { CATALOGUE, COACH_SHARE, KIND_LABEL, PARTNER_KINDS, fromCatalogue, saveAffiliate, saveOffers, useAffiliate, useOffers, type PartnerKind, type PartnerOffer } from "@/lib/data/partners"
import { Tag, AdminButton } from "../ui"
import { Empty, Field, Mono, NativeSelect, Page, PageHeader, SettingRow } from "../kit"

const euro = (n: number) => `€${n.toLocaleString("en")}`

/** Offers from brokers, prop firms and tools, and the coach's own affiliate program behind them. */
export function PartnersAdmin() {
  const { coach, base } = useCoach()
  const [adding, setAdding] = useState<"catalogue" | "own" | null>(null)
  return (
    <Page>
      <PageHeader
        title="Partners"
        text="Offers from our partners and students who bring students"
        actions={
          <>
            <AdminButton hierarchy="secondary" onClick={() => setAdding("own")}>
              Add my own link
            </AdminButton>
            <AdminButton hierarchy="primary" onClick={() => setAdding("catalogue")}>
              <Plus /> Add from catalogue
            </AdminButton>
          </>
        }
      />
      {!coach.modules.partners && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ts-interactive)]/40 bg-[var(--ts-interactive)]/8 px-4 py-3 text-sm">
          <Handshake className="size-4 text-[var(--ts-interactive)]" />
          <span className="flex-1">Partners is switched off, so students don&apos;t see it yet.</span>
          <AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={`${base}/design`} />}>
            Switch on in Design
          </AdminButton>
        </div>
      )}
      <Tabs defaultValue="offers" className="gap-5">
        <TabsList>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate program</TabsTrigger>
        </TabsList>
        <TabsContent value="offers">
          <Offers onAdd={setAdding} />
        </TabsContent>
        <TabsContent value="affiliate">
          <Affiliates />
        </TabsContent>
      </Tabs>
      {adding === "catalogue" && <CatalogueDialog onClose={() => setAdding(null)} />}
      {adding === "own" && <OwnDialog onClose={() => setAdding(null)} />}
    </Page>
  )
}

// ---------- Offers

function Offers({ onAdd }: { onAdd: (k: "catalogue" | "own") => void }) {
  const { coach } = useCoach()
  const offers = useOffers(coach)
  const tiers = useTiers(coach)
  const [editing, setEditing] = useState<PartnerOffer | null>(null)
  const paid = tiers.filter((t) => t.price !== "€0").map((t) => t.id)
  const tierName = (o: PartnerOffer) => (o.tiers.length === 0 ? "Everyone" : paid.length > 1 && o.tiers.length === paid.length && paid.every((id) => o.tiers.includes(id)) ? "Paid tiers" : o.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))
  const total = offers.filter((o) => o.on).reduce((t, o) => ({ clicks: t.clicks + o.clicks, signups: t.signups + o.signups, earnings: t.earnings + o.earnings }), { clicks: 0, signups: 0, earnings: 0 })

  if (offers.length === 0) {
    return (
      <Empty
        icon={Handshake}
        title="No offers yet"
        text="Add an offer from our catalogue or your own affiliate link. Students see them labelled as partner offers."
        action={
          <div className="flex gap-2">
            <AdminButton hierarchy="secondary" onClick={() => onAdd("catalogue")}>
              Add from catalogue
            </AdminButton>
            <AdminButton hierarchy="primary" onClick={() => onAdd("own")}>Add my own link</AdminButton>
          </div>
        }
      />
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((o) => (
          <article key={o.id} className="flex min-w-0 flex-col gap-3 rounded-a-lg border border-a-border bg-a-panel p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-a-md bg-a-selected t-body-m-medium">{o.name.slice(0, 2)}</span>
              <div className="grid min-w-0 flex-1">
                <span className="truncate t-body-l-medium">{o.name}</span>
                <span className="truncate t-caption text-a-text-2">{KIND_LABEL[o.kind]} · {o.source === "catalogue" ? "Our partner" : "Your own link"}</span>
              </div>
              <Switch checked={o.on} onCheckedChange={(v) => saveOffers(coach, (l) => l.map((x) => (x.id === o.id ? { ...x, on: v } : x)))} aria-label={`${o.name} on`} />
            </div>
            <p className="t-body-m">{o.offer}{o.code ? <span className="ml-1 font-mono text-a-text-2">{o.code}</span> : null}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
              <Tag>{tierName(o)}</Tag>
              <span className="min-w-0 t-caption text-a-text-2 tabular-nums">{o.clicks} clicks{o.signups ? ` · ${o.signups} sign-ups` : ""}</span>
            </div>
            <div className="flex justify-end gap-0.5 border-t border-a-border-subtle pt-2">
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Edit ${o.name}`} onClick={() => setEditing(o)}>
                <Pencil />
              </AdminButton>
              <AdminButton hierarchy="ghost" size="md" iconOnly
                aria-label={`Remove ${o.name}`}
                onClick={() => {
                  saveOffers(coach, (l) => l.filter((x) => x.id !== o.id))
                  toast(`${o.name} removed`, { action: { label: "Undo", onClick: () => saveOffers(coach, (l) => [...l, o]) } })
                }}
              >
                <Trash2 />
              </AdminButton>
            </div>
          </article>
        ))}
      </div>
      <p className="t-caption text-a-text-2">Students see every offer labelled as a partner offer. {total.clicks} clicks, {total.signups} sign-ups and {euro(total.earnings)} earned from offers that are on.</p>
      {editing && <OwnDialog key={editing.id} item={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CatalogueDialog({ onClose }: { onClose: () => void }) {
  const { coach } = useCoach()
  const offers = useOffers(coach)
  const left = CATALOGUE.filter((c) => !offers.some((o) => o.id === c.id))
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add from catalogue</DialogTitle>
          <DialogDescription>Offers we negotiated for coaches. You earn {COACH_SHARE}% of the commission.</DialogDescription>
        </DialogHeader>
        {left.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">You have added every offer in the catalogue.</p>
        ) : (
          <div className="grid divide-y rounded-lg border bg-card">
            {left.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <div className="grid min-w-0 flex-1 basis-56 gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {c.name} <Tag>{KIND_LABEL[c.kind]}</Tag>
                  </span>
                  <span className="text-xs text-muted-foreground">{c.offer}</span>
                  <span className="text-xs text-muted-foreground">
                    Commission {c.commission} · You earn {COACH_SHARE}% of the commission
                  </span>
                </div>
                <AdminButton hierarchy="secondary" size="md"
                  onClick={() => {
                    saveOffers(coach, (l) => [...l, fromCatalogue(coach, c)])
                    toast(`${c.name} added`, { description: "Students see it as a partner offer." })
                  }}
                >
                  <Plus /> Add
                </AdminButton>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <AdminButton hierarchy="secondary" onClick={onClose}>
            Done
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Add the coach's own affiliate link, or edit any offer (a catalogue offer keeps its tracking link). */
function OwnDialog({ item, onClose }: { item?: PartnerOffer; onClose: () => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [name, setName] = useState(item?.name ?? "")
  const [kind, setKind] = useState<PartnerKind>(item?.kind ?? "broker")
  const [offer, setOffer] = useState(item?.offer ?? "")
  const [code, setCode] = useState(item?.code ?? "")
  const [url, setUrl] = useState(item?.url ?? "")
  const [chosen, setChosen] = useState<string[]>(item?.tiers ?? [])
  const fixed = item?.source === "catalogue"
  const ok = name.trim() && offer.trim() && /^https?:\/\/\S+\.\S+/.test(url.trim())

  const save = () => {
    if (!ok) return
    const next: PartnerOffer = {
      id: item?.id ?? `own-${Date.now()}`,
      name: name.trim(),
      kind,
      offer: offer.trim(),
      code: code.trim() || undefined,
      url: url.trim(),
      tiers: chosen,
      source: item?.source ?? "own",
      clicks: item?.clicks ?? 0,
      signups: item?.signups ?? 0,
      earnings: item?.earnings ?? 0,
      on: item?.on ?? true,
    }
    saveOffers(coach, (l) => (item ? l.map((x) => (x.id === item.id ? next : x)) : [...l, next]))
    toast(item ? `${next.name} updated` : `${next.name} added`)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? `Edit ${item.name}` : "Add my own link"}</DialogTitle>
          <DialogDescription>{fixed ? "The tracking link stays as we set it, so your earnings are counted." : "Your own affiliate link, shown to students as a partner offer."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tradeify" disabled={fixed} />
            </Field>
            <Field label="Kind">
              <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as PartnerKind)} disabled={fixed}>
                {PARTNER_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Offer" hint="What the student gets">
            <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="20% off the first month" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code" hint="Optional">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} className="font-mono" placeholder="MARCO20" />
            </Field>
            <Field label="Link">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" disabled={fixed} />
            </Field>
          </div>
          <Field label="Who sees it unlocked" hint={chosen.length === 0 ? "Everyone" : undefined}>
            <div className="grid gap-1.5 rounded-lg border p-2.5 bg-card">
              {tiers.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={chosen.includes(t.id)} onCheckedChange={(v) => setChosen((c) => (v ? [...c, t.id] : c.filter((x) => x !== t.id)))} />
                  {t.name}
                </label>
              ))}
              <span className="text-xs text-muted-foreground">Leave all unchecked for everyone. Other tiers see it locked.</span>
            </div>
          </Field>
        </div>
        <DialogFooter>
          <AdminButton hierarchy="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton hierarchy="primary" disabled={!ok} onClick={save}>
            {item ? "Save" : "Add"}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Affiliate program (students bring students)

const TOP = [
  { name: "Jonas Pereira", students: 6, earned: 268 },
  { name: "Sara Kowalski", students: 3, earned: 134 },
  { name: "Tariq Bello", students: 1, earned: 30 },
]

function Affiliates() {
  const { coach } = useCoach()
  const p = useAffiliate(coach)
  const set = (patch: Partial<typeof p>) => saveAffiliate(coach, patch)
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="grid content-start gap-2">
        <h2 className="font-medium">Students bring students</h2>
        <div className="divide-y rounded-lg border bg-card px-3">
          <SettingRow label="Affiliate program" text={`Every student gets their own link to ${coach.name}`}>
            <Switch checked={p.on} onCheckedChange={(v) => set({ on: v })} aria-label="Affiliate program" />
          </SettingRow>
          {p.on && (
            <>
              <SettingRow label="Commission" text="Of what the new student pays">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={p.commission}
                    onChange={(e) => set({ commission: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                    className="h-7 w-16 text-right tabular-nums"
                    aria-label="Commission percent"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </SettingRow>
              <SettingRow label="Link stays valid" text="If the friend joins within this time of clicking">
                <NativeSelect value={p.cookieDays} onChange={(e) => set({ cookieDays: Number(e.target.value) })}>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </NativeSelect>
              </SettingRow>
              <SettingRow label="Payout" text="When affiliates are paid">
                <NativeSelect value={p.payout} onChange={(e) => set({ payout: e.target.value as typeof p.payout })}>
                  <option value="monthly">Once a month</option>
                  <option value="with-platform">With your platform payout</option>
                </NativeSelect>
              </SettingRow>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Students find their link on the Partners page, under the offers.</p>
      </section>
      <section className="grid content-start gap-2">
        <h2 className="font-medium">Who brings students</h2>
        {p.on ? (
          <div className="grid gap-2 rounded-lg border bg-card p-3 text-sm">
            <Mono className="text-muted-foreground">Top affiliates · October</Mono>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.students}</TableCell>
                    <TableCell className="text-right tabular-nums">{euro(t.earned)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty icon={Handshake} title="The program is off" text="Switch it on and every student gets a link to share." />
        )}
      </section>
    </div>
  )
}
