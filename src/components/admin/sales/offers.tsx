"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, Check, Copy, ExternalLink, FileDown, MoreHorizontal, Plus, Send } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Switch } from "@/components/ui/switch"
import { isFreeTier, useTiers } from "@/lib/data/access"
import {
  ago, instalmentDate, isoDay, linkStatus, linkUrl, money, newLinkId, NOW_ISO, offerTier, NO_LINKS, NO_OFFERS, LINKS, OFFERS, OFFER_PLANS, planEach, planHint, planLine, planName, shortDate, STATUS_LABEL, totals,
  type LinkStatus, type Offer, type OfferLink, type OfferPlan,
} from "@/lib/data/offers"
import { NOW } from "@/lib/data/schedule"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { usePayoutsDone } from "./payouts"
import {
  AdminButton, AdminDrawer, AdminField, AdminFilter, AdminMenu, AdminMenuContent, AdminMenuItem, AdminMenuSeparator, AdminMenuTrigger, AdminModal, AdminSearch, AdminSegmented, AdminSelect, AdminTabs,
  AdminTable, AdminTableHead, AdminTd, AdminTh, AdminToolbar, AdminTr, AdminUnderlineTabs, Callout, EmptyState, Panel, StatPanel, Tag, adminControl,
} from "../ui"

const STATUS_TONE: Record<LinkStatus, "neutral" | "info" | "success" | "warning"> = { new: "neutral", opened: "info", paid: "success", expired: "warning" }
const FILTERS = ["all", "new", "opened", "paid", "expired"] as const
type Filter = (typeof FILTERS)[number]

/** Offers data in one place: the offers and the links made from them (one store each per community). */
export function useOffers() {
  const { coach } = useCoach()
  const [offers, setOffers] = useCommunityData(coach.slug, "offers", OFFERS, NO_OFFERS)
  const [links, setLinks] = useCommunityData(coach.slug, "offerLinks", LINKS, NO_LINKS)
  return { coach, offers, setOffers, links, setLinks }
}

/** The page header's two actions on the Offers tab (Figma Sales · 04): New offer, and Send offer link as the primary one. */
export function OffersActions({ onNew, onSend }: { onNew: () => void; onSend: () => void }) {
  const { offers } = useOffers()
  const payouts = usePayoutsDone()
  return (
    <>
      <AdminButton hierarchy="secondary" onClick={onNew}>
        <Plus /> New offer
      </AdminButton>
      {offers.length > 0 && (
        <AdminButton onClick={onSend} disabled={!payouts} title={payouts ? undefined : "Connect payouts first"}>
          <Send /> Send offer link
        </AdminButton>
      )}
    </>
  )
}

/** Sales · 04 Offers (Figma 1876:71176), 04b Offers · New platform, 05 Edit offer, 06 Send offer link. */
export function Offers({ newSignal, sendSignal }: { newSignal: number; sendSignal: number }) {
  const { coach, offers, setOffers, links, setLinks } = useOffers()
  const tiers = useTiers(coach)
  const payouts = usePayoutsDone()
  const [editing, setEditing] = useState<Offer | "new" | null>(null)
  const [sending, setSending] = useState<{ offerId?: string; plan?: OfferPlan; email?: string; name?: string } | null>(null)
  // The page header's buttons bump a counter; the change is read while rendering, not in an effect.
  const [seenNew, setSeenNew] = useState(newSignal)
  const [seenSend, setSeenSend] = useState(sendSignal)
  // The ⌘K actions arrive as ?new=1 and ?send=1; each is read once, when it changes.
  const params = useSearchParams()
  const wantNew = params.get("new")
  const wantSend = params.get("send")
  const [seenParams, setSeenParams] = useState("")
  const paramKey = `${wantNew ?? ""}|${wantSend ?? ""}`
  if (paramKey !== seenParams) {
    setSeenParams(paramKey)
    if (wantNew) setEditing("new")
    else if (wantSend) {
      if (offers.length === 0) setEditing("new")
      else if (payouts) setSending({})
    }
  }
  if (newSignal !== seenNew) {
    setSeenNew(newSignal)
    setEditing("new")
  }
  if (sendSignal !== seenSend) {
    setSeenSend(sendSignal)
    if (offers.length === 0) setEditing("new")
    else if (payouts) setSending({})
  }

  const tierName = (id: string) => offerTier(tiers, id)?.name ?? "paid"
  const sum = totals(offers, links)
  const topSold = Math.max(0, ...offers.map((o) => o.sold))

  if (offers.length === 0) {
    return (
      <>
        <EmptyState
          title="No offers yet"
          description="An offer is a package you sell on a call. It has its own payment plans, and you make one link for each client."
          actions={<AdminButton onClick={() => setEditing("new")}><Plus /> New offer</AdminButton>}
        />
        <OfferDrawer item={editing} onClose={() => setEditing(null)} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!payouts && (
        <Callout tone="warning" icon={<AlertTriangle className="size-4" />} action={<AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href="?tab=payouts" />}>Connect payouts</AdminButton>}>
          Connect payouts first: offer links need a connected account to take payments.
        </Callout>
      )}
      <StatPanel
        stats={[
          { label: "Collected · November", value: money(sum.collected), delta: `${sum.paid} ${sum.paid === 1 ? "link" : "links"} paid`, tone: "success" },
          { label: "Still to collect", value: money(sum.toCollect), delta: "In the coming months" },
          { label: "Links sent", value: sum.sent, delta: `${sum.opened} opened · ${sum.paid} paid` },
          { label: "Needs you", value: sum.failed, delta: sum.failed === 0 ? "Nothing to do" : `${sum.failed} ${sum.failed === 1 ? "instalment" : "instalments"} failed`, tone: "neutral" as const },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {offers.map((o) => (
          <Panel key={o.id} className={cn("gap-4", o.sold === topSold && topSold > 0 && "border-a-success/[0.22]")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate t-heading-m text-a-text">{o.name}</h3>
                {o.sold === topSold && topSold > 0 && <Tag tone="success">Most sold</Tag>}
              </div>
              <AdminMenu>
                <AdminMenuTrigger render={<AdminButton aria-label={`Actions for ${o.name}`} hierarchy="ghost" size="md" iconOnly />}>
                  <MoreHorizontal />
                </AdminMenuTrigger>
                <AdminMenuContent align="end">
                  <AdminMenuItem onClick={() => setEditing(o)}>Edit offer</AdminMenuItem>
                  <AdminMenuItem disabled={!payouts} onClick={() => setSending({ offerId: o.id })}>Send link</AdminMenuItem>
                  <AdminMenuSeparator />
                  <AdminMenuItem
                    tone="danger"
                    onClick={() => {
                      setOffers((l) => l.filter((x) => x.id !== o.id))
                      toast(`${o.name} deleted`, { action: { label: "Undo", onClick: () => setOffers((l) => (l.some((x) => x.id === o.id) ? l : [...l, o])) } })
                    }}>
                    Delete
                  </AdminMenuItem>
                </AdminMenuContent>
              </AdminMenu>
            </div>
            <div className="grid gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="t-metric text-a-text tabular-nums">{money(o.price)}</span>
                <span className="t-caption text-a-text-3">/ total</span>
              </div>
              <span className="t-caption text-a-text-2">{tiers.length === 0 ? "No tier to open yet" : `Opens the ${tierName(o.tierId)} tier`}</span>
            </div>
            <ul className="grid gap-1.5 border-t border-a-border pt-3 t-body-m text-a-text">
              {o.plans.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-3.5 text-a-success" aria-hidden />
                  {p === 1 ? `Pay in full · ${money(o.price)}` : `${p} payments · ${money(planEach(o.price, p))} each`}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-a-border pt-3">
              <span className="t-caption text-a-text-2">
                {o.sold} sold · {o.paying} paying
              </span>
              <div className="flex gap-2">
                <AdminButton hierarchy="secondary" size="md" onClick={() => setEditing(o)}>Edit</AdminButton>
                <AdminButton hierarchy="secondary" size="md" disabled={!payouts} title={payouts ? undefined : "Connect payouts first"} onClick={() => setSending({ offerId: o.id })}>Send link</AdminButton>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      <LinksTable offers={offers} links={links} setLinks={setLinks} onNewLink={(l) => setSending({ offerId: l.offerId, plan: l.plan, email: l.email, name: l.name })} />
      <OfferDrawer item={editing} onClose={() => setEditing(null)} />
      <SendLinkModal open={!!sending && payouts} start={sending ?? {}} onClose={() => setSending(null)} />
    </div>
  )
}

// ---------- the links

function LinksTable({ offers, links, setLinks, onNewLink }: { offers: Offer[]; links: OfferLink[]; setLinks: (n: OfferLink[] | ((c: OfferLink[]) => OfferLink[])) => void; onNewLink: (l: OfferLink) => void }) {
  const { coach } = useCoach()
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const [sender, setSender] = useState("all")
  const senders = [...new Set(links.map((l) => l.sender))]
  const count = (f: Filter) => (f === "all" ? links.length : links.filter((l) => linkStatus(l) === f).length)
  const rows = links
    .filter((l) => (filter === "all" || linkStatus(l) === filter) && (sender === "all" || l.sender === sender))
    .filter((l) => `${l.name ?? ""} ${l.email ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
  const offerOf = (l: OfferLink) => offers.find((o) => o.id === l.offerId)
  const url = (l: OfferLink) => linkUrl(typeof window === "undefined" ? "" : window.location.origin, coach.slug, l.id)
  const copy = (l: OfferLink) => {
    void navigator.clipboard?.writeText(url(l)).catch(() => {})
    toast("Link copied")
  }

  return (
    <div className="flex flex-col gap-3">
      <AdminToolbar className="justify-between">
        <AdminTabs label="Link status" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ id: f, label: f === "all" ? "All links" : STATUS_LABEL[f], count: count(f) }))} />
        <div className="flex flex-wrap items-center gap-2">
          <AdminSearch value={q} onChange={setQ} placeholder="Search name or e-mail" />
          <AdminFilter ariaLabel="Sender" value={sender} onValueChange={setSender} options={[{ value: "all", label: "All senders" }, ...senders.map((s) => ({ value: s, label: s }))]} />
        </div>
      </AdminToolbar>
      {rows.length === 0 ? (
        <EmptyState title={links.length === 0 ? "No links yet" : "No links match"} description={links.length === 0 ? "Send an offer link to a client after your call. It shows here once it is made." : "Try another status, sender or search."} />
      ) : (
        <AdminTable
          minWidth={900}
          footer={<span className="t-caption text-a-text-3">A link works once and expires after the days you chose. Payments by instalment are listed in Transactions.</span>}>
          <AdminTableHead>
            <AdminTh width={200}>Lead</AdminTh>
            <AdminTh width={240}>Offer and plan</AdminTh>
            <AdminTh width={110}>Amount</AdminTh>
            <AdminTh width={120}>Status</AdminTh>
            <AdminTh width={160}>Sent</AdminTh>
            <AdminTh width={140} />
          </AdminTableHead>
          <tbody>
            {rows.map((l) => {
              const st = linkStatus(l)
              const o = offerOf(l)
              return (
                <AdminTr key={l.id}>
                  <AdminTd className="truncate text-a-text">{l.name || l.email || "Anyone with the link"}</AdminTd>
                  <AdminTd className="truncate">{(o?.name ?? "Offer").replace("Coaching ", "")} · {l.plan === 1 ? "pay in full" : planLine(l.price, l.plan)}</AdminTd>
                  <AdminTd className="tabular-nums text-a-text">{money(l.price)}</AdminTd>
                  <AdminTd><Tag tone={STATUS_TONE[st]}>{l.failed ? "Retrying" : STATUS_LABEL[st]}</Tag></AdminTd>
                  <AdminTd className="truncate">{l.sender} · {ago(l.sentAt)}</AdminTd>
                  <AdminTd align="end">
                    <div className="flex items-center justify-end gap-1">
                      {st === "paid" ? (
                        <AdminButton hierarchy="ghost" size="md" onClick={() => toast("Invoice downloaded")}>
                          <FileDown /> Invoice
                        </AdminButton>
                      ) : st === "expired" ? (
                        <AdminButton hierarchy="ghost" size="md" onClick={() => onNewLink(l)}>
                          <Send /> New link
                        </AdminButton>
                      ) : (
                        <AdminButton hierarchy="ghost" size="md" onClick={() => copy(l)}>
                          <Copy /> Copy link
                        </AdminButton>
                      )}
                      <AdminMenu>
                        <AdminMenuTrigger render={<AdminButton aria-label={`Actions for the link to ${l.name || l.email || "anyone"}`} hierarchy="ghost" size="md" iconOnly />}>
                          <MoreHorizontal />
                        </AdminMenuTrigger>
                        <AdminMenuContent align="end">
                          <AdminMenuItem onClick={() => copy(l)}>Copy link</AdminMenuItem>
                          <AdminMenuItem render={<a href={url(l)} target="_blank" rel="noreferrer" />}>
                            <ExternalLink /> Open link
                          </AdminMenuItem>
                          {st !== "paid" && (
                            <>
                              <AdminMenuSeparator />
                              <AdminMenuItem
                                tone="danger"
                                onClick={() => {
                                  setLinks((c) => c.filter((x) => x.id !== l.id))
                                  toast("Link deleted. It no longer works.", { action: { label: "Undo", onClick: () => setLinks((c) => (c.some((x) => x.id === l.id) ? c : [l, ...c])) } })
                                }}>
                                Delete link
                              </AdminMenuItem>
                            </>
                          )}
                        </AdminMenuContent>
                      </AdminMenu>
                    </div>
                  </AdminTd>
                </AdminTr>
              )
            })}
          </tbody>
        </AdminTable>
      )}
    </div>
  )
}

// ---------- Edit offer (drawer, two tabs)

type Draft = { name: string; price: string; tierId: string; plans: OfferPlan[]; replaceSubscription: boolean; lockEmail: boolean; notifyOpen: boolean; senderPrice: boolean }

function OfferDrawer({ item, onClose }: { item: Offer | "new" | null; onClose: () => void }) {
  const { coach, offers, setOffers } = useOffers()
  const tiers = useTiers(coach).filter((t) => !isFreeTier(t))
  const base = item && item !== "new" ? item : null
  const blank: Draft = { name: "", price: "", tierId: tiers[tiers.length - 1]?.id ?? "", plans: [1, 2, 4, 6], replaceSubscription: true, lockEmail: true, notifyOpen: true, senderPrice: false }
  const from = (o: Offer): Draft => ({ name: o.name, price: String(o.price), tierId: o.tierId, plans: o.plans, replaceSubscription: o.replaceSubscription, lockEmail: o.lockEmail, notifyOpen: o.notifyOpen, senderPrice: o.senderPrice })
  const [f, setF] = useState<Draft>(base ? { ...from(base), tierId: offerTier(tiers, base.tierId)?.id ?? base.tierId } : blank)
  const [tab, setTab] = useState<"offer" | "link">("offer")
  const [key, setKey] = useState<string | null>(null)
  // Reset the form each time the drawer opens on another offer (or a new one).
  const openKey = item === null ? null : item === "new" ? "new" : item.id
  if (openKey !== key) {
    setKey(openKey)
    if (item !== null) {
      setF(base ? { ...from(base), tierId: offerTier(tiers, base.tierId)?.id ?? base.tierId } : blank)
      setTab("offer")
    }
  }
  const set = (p: Partial<Draft>) => setF((v) => ({ ...v, ...p }))
  const price = Number(f.price)
  const errors = {
    name: f.name.trim() ? (offers.some((o) => o.id !== base?.id && o.name.toLowerCase() === f.name.trim().toLowerCase()) ? "You already have an offer with this name" : "") : "Give it a name",
    price: price > 0 ? "" : "Enter the total price",
    plans: f.plans.length > 0 ? "" : "Turn on at least one plan",
    tier: f.tierId ? "" : "Pick the tier it opens",
  }
  const bad = Object.values(errors).some(Boolean)
  const save = () => {
    if (bad) return
    const next: Offer = {
      id: base?.id ?? `${f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "offer"}-${Date.now().toString(36).slice(-4)}`,
      name: f.name.trim(), price, tierId: f.tierId, plans: [...f.plans].sort((a, b) => a - b) as OfferPlan[],
      perks: base?.perks ?? [], replaceSubscription: f.replaceSubscription, lockEmail: f.lockEmail, notifyOpen: f.notifyOpen, senderPrice: f.senderPrice,
      sold: base?.sold ?? 0, paying: base?.paying ?? 0,
    }
    setOffers((l) => (base ? l.map((x) => (x.id === base.id ? next : x)) : [...l, next]))
    toast(base ? `${next.name} saved` : `${next.name} created`)
    onClose()
  }
  const togglePlan = (p: OfferPlan, on: boolean) => set({ plans: on ? [...f.plans, p] : f.plans.filter((x) => x !== p) })

  return (
    <AdminDrawer
      open={item !== null}
      onOpenChange={(o) => !o && onClose()}
      title={base ? base.name : "New offer"}
      subtitle={base ? `${base.sold} sold · changes apply to new links` : "A package you sell on a call. Changes apply to new links."}
      width={520}
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton disabled={bad} onClick={save}>Save offer</AdminButton>
        </>
      }>
      <AdminUnderlineTabs label="Offer sections" value={tab} onChange={setTab} tabs={[{ id: "offer", label: "Offer" }, { id: "link", label: "Link settings" }]} />
      {tab === "offer" ? (
        <div className="grid gap-5">
          <AdminField label="Name" error={f.name ? errors.name || undefined : undefined}>
            <input value={f.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} placeholder="Coaching Gold" aria-invalid={!!f.name && !!errors.name} className={cn(adminControl, "h-11")} />
          </AdminField>
          <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
            <AdminField label="Total price" error={f.price ? errors.price || undefined : undefined}>
              <span className="flex h-11 items-center rounded-a-md border border-a-border-subtle bg-a-field pr-3 transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong">
                <input value={f.price ? Number(f.price).toLocaleString("en") : ""} onChange={(e) => set({ price: e.target.value.replace(/\D/g, "") })} inputMode="numeric" aria-label="Total price" placeholder="6,000" className="min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text tabular-nums outline-none" />
                <span className="t-caption text-a-text-3">€</span>
              </span>
            </AdminField>
            <AdminField label="Currency" hint="Same as your platform">
              {(p) => <input {...p} value="EUR" readOnly aria-readonly className={cn(adminControl, "h-11 text-a-text-2")} />}
            </AdminField>
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Tier it gives</span>
            {tiers.length === 0 ? (
              <span className="t-caption text-a-text-3">Make a paid tier in Tiers & prices first.</span>
            ) : (
              <AdminSegmented label="Tier it gives" value={f.tierId} onChange={(v) => set({ tierId: v })} options={tiers.map((t) => ({ value: t.id, label: t.name }))} />
            )}
            <span className="t-caption text-a-text-3">Clients get this tier after their first payment.</span>
          </div>
          <span className="h-px bg-a-border" aria-hidden />
          <div className="grid gap-3">
            <div className="grid gap-0.5">
              <span className="t-caption text-a-text">Payment plans</span>
              <span className="t-caption text-a-text-3">Turn on the ways a client can pay. Each plan gets its own link.</span>
            </div>
            {OFFER_PLANS.map((p) => (
              <Row key={p} title={planName(p)} text={price > 0 ? planHint(price, p) : "Set the price first"}>
                <Switch checked={f.plans.includes(p)} onCheckedChange={(v) => togglePlan(p, v)} aria-label={planName(p)} />
              </Row>
            ))}
            {errors.plans && <span className="t-caption text-a-danger">{errors.plans}</span>}
          </div>
          <span className="h-px bg-a-border" aria-hidden />
          <Row title="Replace their subscription" text="If they already subscribe, it ends after the first payment.">
            <Switch checked={f.replaceSubscription} onCheckedChange={(v) => set({ replaceSubscription: v })} aria-label="Replace their subscription" />
          </Row>
        </div>
      ) : (
        <div className="grid gap-4">
          <Row title="Lock the link to the client's e-mail" text="Only the e-mail you typed can pay with the link.">
            <Switch checked={f.lockEmail} onCheckedChange={(v) => set({ lockEmail: v })} aria-label="Lock the link to the client's e-mail" />
          </Row>
          <Row title="Tell me when a link is opened" text="A notification, so you know the client is looking.">
            <Switch checked={f.notifyOpen} onCheckedChange={(v) => set({ notifyOpen: v })} aria-label="Tell me when a link is opened" />
          </Row>
          <Row title="Let the sender change the price" text="Useful for a special offer. Every change is recorded.">
            <Switch checked={f.senderPrice} onCheckedChange={(v) => set({ senderPrice: v })} aria-label="Let the sender change the price" />
          </Row>
        </div>
      )}
    </AdminDrawer>
  )
}

function Row({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid min-w-0 gap-0.5">
        <span className="t-body-m text-a-text">{title}</span>
        <span className="t-caption text-a-text-3">{text}</span>
      </div>
      {children}
    </div>
  )
}

// ---------- Send offer link (modal)

const EXPIRY = [{ value: "1", label: "In 24 hours" }, { value: "7", label: "In 7 days" }, { value: "30", label: "In 30 days" }] as const

function SendLinkModal({ open, start, onClose }: { open: boolean; start: { offerId?: string; plan?: OfferPlan; email?: string; name?: string }; onClose: () => void }) {
  const { coach, offers, setLinks } = useOffers()
  const sender = coach.coachName.split(" ")[0]
  const [offerId, setOfferId] = useState("")
  const [plan, setPlan] = useState<OfferPlan>(4)
  const [price, setPrice] = useState("")
  const [email, setEmail] = useState("")
  const [days, setDays] = useState<"1" | "7" | "30">("7")
  const [fresh, setFresh] = useState(false)
  // Opening the modal starts the form again: from the offer, plan and client of the card or row it came from.
  if (open !== fresh) {
    setFresh(open)
    if (open) {
      const o = offers.find((x) => x.id === start.offerId) ?? offers.find((x) => x.sold === Math.max(...offers.map((y) => y.sold))) ?? offers[0]
      if (o) {
        setOfferId(o.id)
        setPlan(start.plan && o.plans.includes(start.plan) ? start.plan : o.plans.includes(4) ? 4 : o.plans[0])
        setPrice(String(o.price))
      }
      setEmail(start.email ?? "")
      setDays("7")
    }
  }
  const offer = offers.find((o) => o.id === offerId)
  if (!offer) return null
  const total = Number(price)
  const emailOk = email.trim() === "" || /^\S+@\S+\.\S+$/.test(email.trim())
  const errors = { price: total > 0 ? "" : "Enter the price for this client", email: emailOk ? "" : "Check the e-mail address" }
  const bad = !!errors.price || !!errors.email
  const create = () => {
    if (bad) return
    const link: OfferLink = {
      id: newLinkId(offer.id), offerId: offer.id, plan, price: total, ...(email.trim() ? { email: email.trim(), name: start.name } : {}),
      sender, sentAt: NOW_ISO, expires: isoDay(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + Number(days))),
    }
    setLinks((l) => [link, ...l])
    const url = linkUrl(window.location.origin, coach.slug, link.id)
    void navigator.clipboard?.writeText(url).catch(() => {})
    toast("Link made and copied", { action: { label: "Open", onClick: () => window.open(url, "_blank") } })
    onClose()
  }

  return (
    <AdminModal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Send an offer link"
      subtitle="Make a checkout link for one client. It works once."
      className="sm:max-w-[560px]"
      bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton disabled={bad} onClick={create}><Send /> Create and copy link</AdminButton>
        </>
      }>
      <div className="contents" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); create() } }}>
        <AdminField label="Offer">
          {(p) => (
            <AdminSelect
              {...p}
              ariaLabel="Offer"
              value={offerId}
              onValueChange={(id) => {
                const o = offers.find((x) => x.id === id)!
                setOfferId(id)
                setPrice(String(o.price))
                setPlan(o.plans.includes(plan) ? plan : o.plans[0])
              }}
              options={offers.map((o) => ({ value: o.id, label: o.name }))}
            />
          )}
        </AdminField>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Payment plan</span>
          <AdminSegmented label="Payment plan" value={String(plan) as `${OfferPlan}`} onChange={(v) => setPlan(Number(v) as OfferPlan)} options={offer.plans.map((p) => ({ value: String(p) as `${OfferPlan}`, label: planName(p) }))} />
          <span className="t-caption text-a-text-3">{total > 0 ? (plan === 1 ? `${money(total)} today.` : `${planLine(total, plan)}, one a month, starting today.`) : "Enter a price to see the instalments."}</span>
        </div>
        <AdminField label="Price for this client" hint={undefined} error={errors.price || undefined}>
          {(p) => (
            <>
              <input {...p} value={price ? Number(price).toLocaleString("en") : ""} disabled={!offer.senderPrice} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(adminControl, "h-11 tabular-nums disabled:opacity-60")} />
              <span className="t-caption text-a-text-3">
                {offer.senderPrice ? `Standard price ${money(offer.price)}. A change is recorded with your name.` : `Fixed at ${money(offer.price)}. Turn on "Let the sender change the price" in the offer to change it.`}
              </span>
            </>
          )}
        </AdminField>
        <AdminField label="Client e-mail" optional error={errors.email || undefined}>
          {(p) => (
            <>
              <input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={cn(adminControl, "h-11")} />
              <span className="t-caption text-a-text-3">{offer.lockEmail ? "Locks the link to this e-mail so it cannot be passed on." : "Fills in the e-mail at checkout."}</span>
            </>
          )}
        </AdminField>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Link expires</span>
          <AdminSegmented label="Link expires" value={days} onChange={setDays} options={EXPIRY} />
          <span className="t-caption text-a-text-3">After that the link stops working and you can make a new one.</span>
        </div>
        {plan > 1 && total > 0 && (
          <div className="t-caption text-a-text-3">
            First payment {money(planEach(total, plan))}, then on {Array.from({ length: plan - 1 }, (_, i) => shortDate(isoDay(instalmentDate(NOW, i + 1)))).join(", ")}.
          </div>
        )}
      </div>
    </AdminModal>
  )
}
