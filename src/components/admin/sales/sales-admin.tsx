"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExternalLink, Plus } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { isFreeTier, useTiers } from "@/lib/data/access"
import { PageHeader } from "../kit"
import { SetupTip } from "../setup-checklist"
import { AdminButton, AdminTabs, Panel, PanelHeader, TabPanel } from "@/components/admin/ui"
import { AccessOverview } from "./access-overview"
import { Groups, NewGroupButton } from "./groups"
import { SalesPageEditor, SalesPageActions } from "./sales-page-editor"
import { Coupons, NewCouponButton } from "./coupons"
import { RevenueOverview } from "./revenue"
import { Offers, OffersActions } from "./offers"
import { Payouts } from "./payouts"
import { Tiers } from "./tiers"
import { Transactions } from "./transactions"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tiers", label: "Tiers & prices" },
  { id: "offers", label: "Offers" },
  { id: "groups", label: "Groups" },
  { id: "access", label: "Access" },
  { id: "page", label: "Sales page" },
  { id: "coupons", label: "Coupons" },
  { id: "transactions", label: "Transactions" },
  { id: "payouts", label: "Payouts" },
] as const
type Tab = (typeof TABS)[number]["id"] | "affiliates"

/** Sales & payments (Figma 535:7152, 12 screens): tiers, groups, access, the sales page, coupons, transactions and payouts. The header's actions follow the tab. */
export function SalesAdmin() {
  const { coach } = useCoach()
  const noTiers = useTiers(coach).filter((t) => !isFreeTier(t)).length === 0
  const asked = useSearchParams().get("tab")
  const pick = (v: string | null): Tab => (TABS.some((t) => t.id === v) || v === "affiliates" ? (v as Tab) : "overview")
  const [tab, setTab] = useState<Tab>(pick(asked))
  // Visited pages stay mounted: a link to another ?tab= (Getting started → Payouts) must still switch the tab.
  const [seen, setSeen] = useState(asked)
  if (asked !== seen) {
    setSeen(asked)
    if (asked) setTab(pick(asked))
  }
  const [newTier, setNewTier] = useState(0)
  const [newGroup, setNewGroup] = useState(0)
  const [newCoupon, setNewCoupon] = useState(0)
  const [newOffer, setNewOffer] = useState(0)
  const [sendOffer, setSendOffer] = useState(0)
  const [resetPage, setResetPage] = useState(0)

  const salesPage = (
    <AdminButton nativeButton={false} render={<a href={`/site/${coach.slug}`} target="_blank" rel="noreferrer" />} hierarchy="secondary">
      <ExternalLink /> Sales page
    </AdminButton>
  )
  const actions =
    tab === "overview" || tab === "tiers" ? (
      <>
        {salesPage}
        <AdminButton hierarchy={noTiers ? "secondary" : "primary"} onClick={() => (setTab("tiers"), setNewTier((n) => n + 1))}>
          <Plus /> New tier
        </AdminButton>
      </>
    ) : tab === "offers" ? (
      <OffersActions onNew={() => setNewOffer((n) => n + 1)} onSend={() => setSendOffer((n) => n + 1)} />
    ) : tab === "groups" ? (
      <NewGroupButton onClick={() => setNewGroup((n) => n + 1)} />
    ) : tab === "page" ? (
      <SalesPageActions slug={coach.slug} onReset={() => setResetPage((n) => n + 1)} />
    ) : tab === "coupons" ? (
      <NewCouponButton onClick={() => setNewCoupon((n) => n + 1)} />
    ) : (
      salesPage
    )

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader title="Sales & payments" text="Tiers, offers, sales page, coupons and payouts" actions={actions} />
      {tab === "tiers" && <SetupTip task="membership" />}
      {tab === "payouts" && <SetupTip task="payouts" />}
      <div className="flex">
        <AdminTabs label="Sales sections" tabs={TABS} value={tab as (typeof TABS)[number]["id"]} onChange={setTab} />
      </div>
      <TabPanel value={tab} order={TABS.map((t) => t.id)}>
      {tab === "overview" && <RevenueOverview onProblems={() => setTab("transactions")} />}
      {tab === "tiers" && <Tiers newSignal={newTier} onNew={() => setNewTier((n) => n + 1)} />}
      {tab === "offers" && <Offers newSignal={newOffer} sendSignal={sendOffer} />}
      {tab === "groups" && <Groups newSignal={newGroup} />}
      {tab === "access" && <AccessOverview />}
      {tab === "page" && <SalesPageEditor resetSignal={resetPage} />}
      {tab === "coupons" && <Coupons newSignal={newCoupon} />}
      {tab === "transactions" && <Transactions />}
      {tab === "payouts" && <Payouts />}
      {tab === "affiliates" && <Affiliates />}
      </TabPanel>
    </div>
  )
}

// ---------- ADM-33 / ADM-34 Affiliates and partner links (moved to Partners)

function Affiliates() {
  const { base } = useCoach()
  return (
    <Panel className="max-w-xl">
      <PanelHeader title="Affiliates moved to Partners" description="The affiliate program, partner deals and partner earnings are all in Partners." />
      <div>
        <AdminButton nativeButton={false} render={<Link href={`${base}/partners`} />} hierarchy="secondary">
          Open Partners
        </AdminButton>
      </div>
    </Panel>
  )
}
