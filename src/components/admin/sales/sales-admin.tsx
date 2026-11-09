"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExternalLink } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TRANSACTIONS } from "@/lib/data/people"
import { Page, PageHeader } from "../kit"
import { SetupTip } from "../setup-checklist"
import { AccessOverview, PreviewAsMenu } from "./access-overview"
import { Groups } from "./groups"
import { SalesPageEditor } from "./sales-page-editor"
import { Coupons } from "./coupons"
import { Overview } from "./overview"
import { Payouts } from "./payouts"
import { Tiers } from "./tiers"
import { Transactions } from "./transactions"

/** ADM-29 to ADM-36, ADM-14, ADM-15, ADM-40 and ADM-41: tiers, groups, access, sales page, coupons, revenue, transactions, payouts, affiliates. */
export function SalesAdmin() {
  const { coach } = useCoach()
  const [tab, setTab] = useState(useSearchParams().get("tab") ?? "overview")
  const problems = TRANSACTIONS.filter((t) => ["failed", "retrying", "disputed"].includes(t.status)).length

  return (
    <Page wide>
      <PageHeader
        title="Sales & payments"
        text="What students pay for, what they get, what came in, and where the money goes. Our fees are shown openly."
        guide="Tiers and prices · 3 min"
        actions={
          <>
            <PreviewAsMenu size="sm" />
            <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/site/${coach.slug}`} target="_blank" rel="noreferrer" />}>
              <ExternalLink /> Sales page
            </Button>
          </>
        }
      />
      {tab === "tiers" && <SetupTip task="membership" />}
      {tab === "payouts" && <SetupTip task="payouts" />}
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        {/* Scrolls sideways on narrow screens instead of widening the page. */}
        <div className="w-0 min-w-full overflow-x-auto [scrollbar-width:none]">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tiers">Tiers & prices</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="page">Sales page</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="transactions">
              Payments {problems > 0 && <span className="rounded-full bg-[var(--loss)]/20 px-1.5 text-[0.6875rem] text-[var(--ts-loss-text)] tabular-nums">{problems}</span>}
            </TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <Overview onProblems={() => setTab("transactions")} />
        </TabsContent>
        <TabsContent value="tiers">
          <Tiers />
        </TabsContent>
        <TabsContent value="groups">
          <Groups />
        </TabsContent>
        <TabsContent value="access">
          <AccessOverview />
        </TabsContent>
        <TabsContent value="page">
          <SalesPageEditor />
        </TabsContent>
        <TabsContent value="coupons">
          <Coupons />
        </TabsContent>
        <TabsContent value="transactions">
          <Transactions />
        </TabsContent>
        <TabsContent value="payouts">
          <Payouts />
        </TabsContent>
        <TabsContent value="affiliates">
          <Affiliates />
        </TabsContent>
      </Tabs>
    </Page>
  )
}

// ---------- ADM-33 / ADM-34 Affiliates and partner links (moved to Partners)

function Affiliates() {
  const { base } = useCoach()
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Affiliates moved to Partners</CardTitle>
        <CardDescription>The affiliate program, your partner offers and what they earn are now in one place.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" nativeButton={false} render={<Link href={`${base}/partners`} />}>
          Open Partners
        </Button>
      </CardContent>
    </Card>
  )
}
