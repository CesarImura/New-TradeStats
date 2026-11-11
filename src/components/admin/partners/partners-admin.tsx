"use client"

import { useState } from "react"
import Link from "next/link"
import { Handshake, Plus } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useTiers, isFreeTier } from "@/lib/data/access"
import { CATALOGUE, KIND_LABEL, PARTNER_KINDS, fromCatalogue, saveAffiliate, saveOffers, useAffiliate, useOffers, type AffiliateProgram, type PartnerKind, type PartnerOffer } from "@/lib/data/partners"
import { cn } from "@/lib/utils"
import { PageHeader } from "../kit"
import { AdminButton, AdminField, AdminFilter, AdminModal, AdminSearch, AdminSegmented, AdminTable, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminTr, Callout, EmptyState, Panel, StatPanel, Tag, adminControl } from "../ui"

const euro = (n: number) => `€${n.toLocaleString("en")}`

/** Logo tile: two letters on a colour by kind (a prop firm is blue, a tool green, a broker warm). */
const TILE: Record<PartnerKind, string> = { prop: "bg-a-info-soft text-a-info", tool: "bg-a-success-soft text-a-success", broker: "bg-a-warning-soft text-a-warning" }
function Logo({ name, kind }: { name: string; kind: PartnerKind }) {
  return <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-a-md t-body-m", TILE[kind])}>{name.slice(0, 2)}</span>
}

type Tab = "offers" | "affiliate"

/** Partners (Figma 537:7152: 01 Offers, 02 Add from catalogue, 03 Affiliate program, 04 Off): offers from brokers, prop firms and tools, and the coach's own affiliate program. */
export function PartnersAdmin() {
  const { coach, base } = useCoach()
  const offers = useOffers(coach)
  const program = useAffiliate(coach)
  const [tab, setTab] = useState<Tab>("offers")
  const [adding, setAdding] = useState<"catalogue" | "own" | null>(null)
  // The affiliate settings are a draft until "Save".
  const [draft, setDraft] = useState<Partial<AffiliateProgram>>({})
  const shown: AffiliateProgram = { ...program, ...draft }
  const dirty = Object.keys(draft).length > 0
  const save = () => {
    if (!dirty) return toast("Nothing to save", { description: "The affiliate program is up to date." })
    saveAffiliate(coach, draft)
    setDraft({})
    toast.success("Affiliate program saved")
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Partners"
        text="Offers from our partners and students who bring students"
        actions={
          tab === "offers" ? (
            <>
              <AdminButton onClick={() => setAdding("own")} hierarchy="secondary">Add my own link</AdminButton>
              <AdminButton onClick={() => setAdding("catalogue")}>
                <Plus /> Add from catalogue
              </AdminButton>
            </>
          ) : (
            <AdminButton onClick={save}>Save</AdminButton>
          )
        }
      />
      {!coach.modules.partners && (
        <Callout tone="warning" icon={<Handshake className="size-4" />} action={<AdminButton nativeButton={false} render={<Link href={`${base}/design`} />} hierarchy="secondary" size="md">Review</AdminButton>}>
          Partners is switched off, so students don&apos;t see it yet.
        </Callout>
      )}
      <div className="flex">
        <AdminTabs label="Partners sections" tabs={[{ id: "offers", label: "Offers", count: offers.length }, { id: "affiliate", label: "Affiliate program" }]} value={tab} onChange={setTab} />
      </div>
      {tab === "offers" && <Offers onAdd={setAdding} />}
      {tab === "affiliate" && <Affiliates program={shown} set={(p) => setDraft((d) => ({ ...d, ...p }))} turnOn={() => (saveAffiliate(coach, { on: true }), setDraft((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== "on"))), toast("Affiliate program is on"))} />}
      <CatalogueDialog open={adding === "catalogue"} onClose={() => setAdding(null)} />
      {adding === "own" && <OwnDialog onClose={() => setAdding(null)} />}
    </div>
  )
}

// ---------- Offers

function Offers({ onAdd }: { onAdd: (k: "catalogue" | "own") => void }) {
  const { coach } = useCoach()
  const offers = useOffers(coach)
  const tiers = useTiers(coach)
  const [editing, setEditing] = useState<PartnerOffer | null>(null)
  const paid = tiers.filter((t) => !isFreeTier(t)).map((t) => t.id)
  const tierName = (o: PartnerOffer) => (o.tiers.length === 0 ? "Everyone" : paid.length > 1 && o.tiers.length === paid.length && paid.every((id) => o.tiers.includes(id)) ? "Paid tiers" : o.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="No offers yet"
        description="Add an offer from our catalogue or your own affiliate link. Students see them labelled as partner offers."
        actions={
          <>
            <AdminButton onClick={() => onAdd("catalogue")} hierarchy="secondary">Add from catalogue</AdminButton>
            <AdminButton onClick={() => onAdd("own")}>Add my own link</AdminButton>
          </>
        }
      />
    )
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
      {offers.map((o) => (
        <Panel key={o.id} className="gap-3 p-[19px]">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setEditing(o)} aria-label={`Edit ${o.name}`} className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-a-md p-1 text-left outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus">
              <Logo name={o.name} kind={o.kind} />
              <span className="grid min-w-0 flex-1">
                <span className="truncate t-body-l-medium text-a-text">{o.name}</span>
                <span className="truncate t-caption text-a-text-2">{KIND_LABEL[o.kind]} · {o.source === "catalogue" ? "Our partner" : "Your own link"}</span>
              </span>
            </button>
            <Switch checked={o.on} onCheckedChange={(v) => saveOffers(coach, (l) => l.map((x) => (x.id === o.id ? { ...x, on: v } : x)))} aria-label={`${o.name} on`} />
          </div>
          <p className="t-body-m text-a-text">{o.offer}{o.code && !o.offer.includes(o.code) ? <span className="ml-1 font-mono text-a-text-2">{o.code}</span> : null}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
            <Tag>{tierName(o)}</Tag>
            <span className="min-w-0 t-caption text-a-text-2 tabular-nums">{o.clicks} clicks{o.signups ? ` · ${o.signups} sign-ups` : ""}</span>
          </div>
        </Panel>
      ))}
      {editing && <OwnDialog key={editing.id} item={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CatalogueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { coach } = useCoach()
  const offers = useOffers(coach)
  const [q, setQ] = useState("")
  const rows = CATALOGUE.filter((c) => `${c.name} ${c.offer} ${KIND_LABEL[c.kind]}`.toLowerCase().includes(q.trim().toLowerCase()))
  const close = () => {
    onClose()
    setTimeout(() => setQ(""), 200)
  }
  return (
    <AdminModal
      open={open}
      onOpenChange={(o) => !o && close()}
      title="Add from catalogue"
      className="sm:max-w-[560px]"
      bodyClassName="gap-3"
      footer={
        <div className="flex w-full items-center gap-3">
          <span className="t-caption text-a-text-2">Students see it as a partner offer.</span>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton onClick={close}>Done</AdminButton>
        </div>
      }>
      <AdminSearch value={q} onChange={setQ} placeholder="Search partners" label="Search partners" hint="⌘K" className="h-11 w-full" />
      {rows.length === 0 && <p className="py-6 text-center t-body-m text-a-text-2">No partner matches “{q}”.</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((c) => {
          const added = offers.some((o) => o.id === c.id)
          return (
            <li key={c.id} className="flex items-center gap-3 rounded-a-md border border-a-border px-3.5 py-3">
              <Logo name={c.name} kind={c.kind} />
              <span className="grid min-w-0 flex-1">
                <span className="truncate t-body-m text-a-text">{c.name}</span>
                <span className="truncate t-caption text-a-text-2">{c.offer}</span>
              </span>
              {added ? (
                <Tag tone="success" dot>Added</Tag>
              ) : (
                <AdminButton hierarchy="secondary" size="md" aria-label={`Add ${c.name}`} onClick={() => (saveOffers(coach, (l) => [...l, fromCatalogue(coach, c)]), toast(`${c.name} added`, { description: "Students see it as a partner offer." }))}>
                  Add
                </AdminButton>
              )}
            </li>
          )
        })}
      </ul>
    </AdminModal>
  )
}

/** Add the coach's own affiliate link, or edit any offer (a catalogue offer keeps its tracking link). */
function OwnDialog({ item, onClose }: { item?: PartnerOffer; onClose: () => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach).filter((t) => !isFreeTier(t))
  const [name, setName] = useState(item?.name ?? "")
  const [kind, setKind] = useState<PartnerKind>(item?.kind ?? "broker")
  const [offer, setOffer] = useState(item?.offer ?? "")
  const [code, setCode] = useState(item?.code ?? "")
  const [url, setUrl] = useState(item?.url ?? "")
  const [chosen, setChosen] = useState<string[]>(item?.tiers ?? [])
  const [tried, setTried] = useState(false)
  const fixed = item?.source === "catalogue"
  const errors = { name: name.trim() ? "" : "Give it a name", offer: offer.trim() ? "" : "Say what the student gets", url: /^https?:\/\/\S+\.\S+/.test(url.trim()) ? "" : "Use a full link, starting with https://" }
  const bad = Object.values(errors).some(Boolean)

  const save = () => {
    setTried(true)
    if (bad) return
    const next: PartnerOffer = { id: item?.id ?? `own-${Date.now()}`, name: name.trim(), kind, offer: offer.trim(), code: code.trim() || undefined, url: url.trim(), tiers: chosen, source: item?.source ?? "own", clicks: item?.clicks ?? 0, signups: item?.signups ?? 0, earnings: item?.earnings ?? 0, on: item?.on ?? true }
    saveOffers(coach, (l) => (item ? l.map((x) => (x.id === item.id ? next : x)) : [...l, next]))
    toast(item ? `${next.name} updated` : `${next.name} added`)
    onClose()
  }
  const remove = () => {
    if (!item) return
    saveOffers(coach, (l) => l.filter((x) => x.id !== item.id))
    toast(`${item.name} removed`, { action: { label: "Undo", onClick: () => saveOffers(coach, (l) => (l.some((x) => x.id === item.id) ? l : [...l, item])) } })
    onClose()
  }

  return (
    <AdminModal
      open
      onOpenChange={(o) => !o && onClose()}
      title={item ? `Edit ${item.name}` : "Add my own link"}
      subtitle={fixed ? "The tracking link stays as we set it, so your earnings are counted." : "Your own affiliate link, shown to students as a partner offer."}
      className="sm:max-w-[560px]"
      bodyClassName="gap-4"
      footer={
        <div className="flex w-full items-center gap-2">
          {item && <AdminButton hierarchy="danger" onClick={remove}>Remove</AdminButton>}
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={save}>{item ? "Save" : "Add"}</AdminButton>
        </div>
      }>
      <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
        <AdminField label="Name" error={tried ? errors.name : undefined}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tradeify" disabled={fixed} className={cn(adminControl, "h-11")} />
        </AdminField>
        <AdminField label="Kind">
          {() => <AdminFilter ariaLabel="Kind" value={kind} onValueChange={(v) => setKind(v as PartnerKind)} options={PARTNER_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))} className="h-11! w-full justify-between" />}
        </AdminField>
      </div>
      <AdminField label="Offer" hint="What the student gets" error={tried ? errors.offer : undefined}>
        <input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="20% off the first month" className={cn(adminControl, "h-11")} />
      </AdminField>
      <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
        <AdminField label="Code" optional>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="MARCO20" className={cn(adminControl, "h-11 font-mono")} />
        </AdminField>
        <AdminField label="Link" error={tried ? errors.url : undefined}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" disabled={fixed} className={cn(adminControl, "h-11")} />
        </AdminField>
      </div>
      <div className="grid gap-2">
        <span className="t-caption text-a-text">Who sees it unlocked <span className="text-a-text-3">{chosen.length === 0 ? "Everyone" : ""}</span></span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {tiers.map((t) => (
            <label key={t.id} className="flex cursor-pointer items-center gap-2.5 t-body-m text-a-text">
              <Checkbox checked={chosen.includes(t.id)} onCheckedChange={(v) => setChosen((c) => (v ? [...c, t.id] : c.filter((x) => x !== t.id)))} />
              {t.name}
            </label>
          ))}
        </div>
        <span className="t-caption text-a-text-3">Leave all unchecked for everyone. Other tiers see it locked.</span>
      </div>
    </AdminModal>
  )
}

// ---------- Affiliate program (students bring students)

const TOP = [
  { name: "Sara Kowalski", signups: 9, earned: 412 },
  { name: "Jonas Pereira", signups: 6, earned: 288 },
  { name: "Tariq Bello", signups: 4, earned: 196 },
]
const DAYS = [7, 30, 60, 90].map((d) => ({ value: String(d), label: `${d} days` }))

function Affiliates({ program: p, set, turnOn }: { program: AffiliateProgram; set: (p: Partial<AffiliateProgram>) => void; turnOn: () => void }) {
  if (!p.on)
    return <EmptyState icon={Handshake} title="The program is off" description="Switch it on and every student gets a link to share. You choose the commission." actions={<AdminButton onClick={turnOn}>Turn on the program</AdminButton>} />
  return (
    <div className="flex flex-col gap-4">
      <StatPanel
        stats={[
          { label: "Students sharing", value: 46, delta: "of 199 members" },
          { label: "Clicks · October", value: "1,204" },
          { label: "Sign-ups", value: 31, delta: "2.6% of clicks" },
          { label: "Earned by students", value: euro(1612), delta: "Paid with your platform payout" },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Panel className="gap-4">
          <label className="flex items-center justify-between gap-4">
            <span className="grid">
              <span className="t-body-m-medium text-a-text">Students bring students</span>
              <span className="t-caption text-a-text-2">Switch it on and every student gets a link to share.</span>
            </span>
            <Switch checked={p.on} onCheckedChange={(v) => set({ on: v })} aria-label="Students bring students" />
          </label>
          <span className="h-px bg-a-border" aria-hidden />
          <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
            <AdminField label="Commission percent" hint="Of what the new student pays">
              {(f) => (
                <span className="flex h-11 items-center rounded-a-md border border-a-border-subtle bg-a-field pr-3 transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong">
                  <input {...f} type="number" min={1} max={100} value={p.commission} onChange={(e) => set({ commission: Math.min(100, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })} className="min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text tabular-nums outline-none" />
                  <span aria-hidden className="t-caption text-a-text-3">%</span>
                </span>
              )}
            </AdminField>
            <AdminField label="Link stays valid" hint="If the friend joins within this time of clicking">
              {() => <AdminFilter ariaLabel="Link stays valid" value={String(p.cookieDays)} onValueChange={(v) => set({ cookieDays: Number(v) })} options={DAYS} className="h-11! w-full justify-between" />}
            </AdminField>
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Payout</span>
            <AdminSegmented label="Payout" value={p.payout} onChange={(v) => set({ payout: v })} options={[{ value: "monthly", label: "Once a month" }, { value: "with-platform", label: "With your platform payout" }]} />
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Who can share</span>
            <AdminSegmented label="Who can share" value={p.share ?? "everyone"} onChange={(v) => set({ share: v })} options={[{ value: "everyone", label: "Everyone" }, { value: "paid", label: "Paid tiers" }]} />
          </div>
        </Panel>
        <AdminTable minWidth={380} scrollLabel="Top affiliates">
          <AdminTableHead>
            <AdminTh>Student</AdminTh>
            <AdminTh width={106} align="end">Sign-ups</AdminTh>
            <AdminTh width={116} align="end">Earned</AdminTh>
          </AdminTableHead>
          <tbody>
            {TOP.map((t) => (
              <AdminTr key={t.name}>
                <AdminTd className="text-a-text">{t.name}</AdminTd>
                <AdminTd align="end">{t.signups}</AdminTd>
                <AdminTd align="end">{euro(t.earned)}</AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  )
}
