"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExternalLink, Plus } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { PageHeader } from "../kit"
import { SetupTip } from "../setup-checklist"
import { AdminButton, AdminTabs, Panel, PanelHeader } from "@/components/admin/ui"
import { AccessOverview } from "./access-overview"
import { Groups, NewGroupButton } from "./groups"
import { SalesPageEditor, SalesPageActions } from "./sales-page-editor"
import { Coupons, NewCouponButton } from "./coupons"
import { RevenueOverview } from "./revenue"
import { Payouts } from "./payouts"
import { Tiers } from "./tiers"
import { Transactions } from "./transactions"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tiers", label: "Tiers & prices" },
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
  const asked = useSearchParams().get("tab")
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === asked) || asked === "affiliates" ? (asked as Tab) : "overview")
  const [newTier, setNewTier] = useState(0)
  const [newGroup, setNewGroup] = useState(0)
  const [newCoupon, setNewCoupon] = useState(0)
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
        <AdminButton onClick={() => (setTab("tiers"), setNewTier((n) => n + 1))}>
          <Plus /> New tier
        </AdminButton>
      </>
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
      <PageHeader title="Sales & payments" text="Tiers, sales page, coupons and payouts" actions={actions} />
      {tab === "tiers" && <SetupTip task="membership" />}
      {tab === "payouts" && <SetupTip task="payouts" />}
      <div className="flex">
        <AdminTabs label="Sales sections" tabs={TABS} value={tab as (typeof TABS)[number]["id"]} onChange={setTab} />
      </div>
      {tab === "overview" && <RevenueOverview onProblems={() => setTab("transactions")} />}
      {tab === "tiers" && <Tiers newSignal={newTier} />}
      {tab === "groups" && <Groups newSignal={newGroup} />}
      {tab === "access" && <AccessOverview />}
      {tab === "page" && <SalesPageEditor resetSignal={resetPage} />}
      {tab === "coupons" && <Coupons newSignal={newCoupon} />}
      {tab === "transactions" && <Transactions />}
      {tab === "payouts" && <Payouts />}
      {tab === "affiliates" && <Affiliates />}
    </div>
  )
}

// ---------- ADM-33 / ADM-34 Affiliates and partner links (moved to Partners)

function Affiliates() {
  const { base } = useCoach()
  return (
    <Panel className="max-w-xl">
      <PanelHeader title="Affiliates moved to Partners" description="The affiliate program, your partner offers and what they earn are now in one place." />
      <div>
        <AdminButton nativeButton={false} render={<Link href={`${base}/partners`} />} hierarchy="secondary">
          Open Partners
        </AdminButton>
      </div>
    </Panel>
  )
}
