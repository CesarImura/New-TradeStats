"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { Check, Copy, ExternalLink, Landmark, Loader2, MoreHorizontal, Plus, RotateCcw } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COUPONS, MONEY, TRANSACTIONS, type Txn } from "@/lib/data/people"
import { REVENUE_MONTHS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Field, Mono, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"
import { SetupTip, useWizardCommunity } from "../setup-checklist"
import { AdminTabs, Panel, PanelHeader, StatPanel, Tag } from "../ui"
import { AccessOverview, PreviewAsMenu } from "./access-overview"
import { Groups } from "./groups"
import { SalesPageEditor } from "./sales-page-editor"
import { Tiers } from "./tiers"

const TXN_TONE = { paid: "success", failed: "danger", retrying: "warning", refunded: "neutral", disputed: "danger" } as const
const STATUS: Record<Txn["status"], { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "text-muted-foreground" },
  failed: { label: "Failed", cls: "text-[var(--loss)]" },
  retrying: { label: "Retrying", cls: "text-amber-400" },
  refunded: { label: "Refunded", cls: "text-muted-foreground" },
  disputed: { label: "Disputed", cls: "text-[var(--loss)]" },
}

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

// ---------- ADM-35 Revenue

function Overview({ onProblems }: { onProblems: () => void }) {
  const { coach } = useCoach()
  const attention = TRANSACTIONS.filter((t) => ["failed", "retrying", "disputed"].includes(t.status))
  const members = coach.tiers.reduce((n, t) => n + t.members, 0)
  const [metric, setMetric] = useState<"revenue" | "members">("revenue")
  const data = REVENUE_MONTHS.map((m, i) => ({ ...m, members: Math.round(members * (0.72 + i * 0.056)) }))
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? data.length - 1
  const fmt = (v: number) => (metric === "revenue" ? `€${Math.round(v / 1000)}k` : String(v))
  const toneOf = { failed: "danger", retrying: "warning", disputed: "danger" } as const
  const revenueByTier = coach.tiers.map((t) => ({ ...t, revenue: Math.round(Number(t.price.replace(/[^\d]/g, "")) * t.members * (t.cadence === "quarter" ? 1 / 3 : 1)) }))
  const maxRevenue = Math.max(...revenueByTier.map((t) => t.revenue), 1)
  return (
    <div className="grid gap-4">
      <StatPanel
        stats={[
          { label: "Monthly recurring", value: `€${MONEY.mrr.toLocaleString("en")}`, delta: `+${MONEY.mrrChange}% vs September`, tone: "success" },
          { label: "Paid out to you · October", value: `€${MONEY.month.toLocaleString("en")}`, delta: `After €${MONEY.fees.amount.toLocaleString("en")} fees` },
          { label: "Next payout", value: `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: MONEY.nextPayout.date },
          { label: "Cancellations", value: `${MONEY.churn}%`, delta: `${MONEY.trials} trials running` },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHeader
            title="Last 6 months, what students paid"
            actions={<AdminTabs label="Chart metric" tabs={[{ id: "revenue", label: "Revenue" }, { id: "members", label: "Members" }]} value={metric} onChange={setMetric} />}
          />
          <ChartContainer config={{ [metric]: { label: metric === "revenue" ? "Revenue" : "Members", color: "var(--admin-color-accent-strong)" } } satisfies ChartConfig} className="aspect-auto h-60 w-full">
            <BarChart data={data} margin={{ top: 20, left: 0, right: 4 }} barCategoryGap="14%" onMouseMove={(st) => setHover(typeof st.activeTooltipIndex === "number" ? st.activeTooltipIndex : null)} onMouseLeave={() => setHover(null)}>
              <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={fmt} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => <span className="tabular-nums">{metric === "revenue" ? `€${Number(v).toLocaleString("en")}` : v}</span>} />} />
              <Bar dataKey={metric} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={metric} position="top" formatter={(v: unknown) => fmt(Number(v))} className="fill-[var(--admin-color-text-secondary)] text-[11px]" />
                {data.map((d, i) => (
                  <Cell key={d.month} fill={i === active ? "var(--admin-color-accent-strong)" : "var(--admin-color-chart-bar-muted)"} fillOpacity={i === active ? 1 : 0.45} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>
        <Panel>
          <PanelHeader title="Needs attention" actions={<button onClick={onProblems} className="t-body-m text-a-text-2 hover:text-a-text">All payments</button>} />
          {attention.length === 0 ? (
            <p className="rounded-a-md border border-dashed border-a-border-strong px-4 py-8 text-center t-body-m text-a-text-2">All payments are fine.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-a-border-subtle">
              {attention.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="t-body-m-medium truncate">{t.who}</div>
                    <div className="t-caption truncate text-a-text-2">{t.status === "disputed" ? "Disputed" : "Payment failed"} · {t.what.split(" · ")[0]} €{t.amount}</div>
                  </div>
                  {t.status === "disputed" ? (
                    <Button size="sm" variant="outline" onClick={onProblems}>Answer the dispute</Button>
                  ) : (
                    <Tag tone={toneOf[t.status as keyof typeof toneOf]} dot>{t.status === "retrying" ? "Retrying" : "Failed"}</Tag>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Tier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Revenue · Oct</TableHead>
              <TableHead className="hidden w-48 sm:table-cell">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueByTier.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-5 font-medium">{t.name}</TableCell>
                <TableCell className="text-a-text-2">{t.price} / {t.cadence === "quarter" ? "qtr" : "mo"}</TableCell>
                <TableCell className="text-right tabular-nums">{t.members}</TableCell>
                <TableCell className="text-right tabular-nums">€{t.revenue.toLocaleString("en")}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-a-track" role="img" aria-label={`${Math.round((t.revenue / maxRevenue) * 100)}% of the top tier`}>
                    <div className="h-full rounded-full bg-a-accent-strong" style={{ width: `${(t.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <p className="t-caption text-a-text-2">October in full: students paid €19,360, our share 5% (−€968), card and payment fees (−€452), to you €{MONEY.month.toLocaleString("en")}. VAT is collected and paid for you; it isn&apos;t in these numbers.</p>
    </div>
  )
}

// ---------- ADM-32 Coupons

function Coupons() {
  const { coach } = useCoach()
  const [list, setList] = useCommunityData(coach.slug, "coupons", COUPONS)
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [kind, setKind] = useState("percent")
  const [amount, setAmount] = useState("20")
  const [months, setMonths] = useState("1")
  const [limit, setLimit] = useState("")

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> New coupon
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Used</TableHead>
              <TableHead className="hidden sm:table-cell">Ends</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.code}>
                <TableCell>
                  <button onClick={() => toast(`${c.code} copied`)} className="flex items-center gap-1.5 font-mono">
                    {c.code} <Copy className="size-3 text-muted-foreground" />
                  </button>
                </TableCell>
                <TableCell>{c.discount}</TableCell>
                <TableCell className="tabular-nums">{c.uses}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{c.expires}</TableCell>
                <TableCell>
                  <Switch checked={c.active} onCheckedChange={(v) => setList((l) => l.map((x) => (x.code === c.code ? { ...x, active: v } : x)))} aria-label={`${c.code} active`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogDescription>Students enter it at checkout. A wrong code never blocks the purchase.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="AUTUMN20" className="font-mono" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount">
                <NativeSelect value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="percent">% off</option>
                  <option value="amount">€ off</option>
                  <option value="trial">Free days</option>
                </NativeSelect>
              </Field>
              <Field label={kind === "trial" ? "Days" : "Amount"}>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            {kind !== "trial" && (
              <Field label="For how long">
                <NativeSelect value={months} onChange={(e) => setMonths(e.target.value)}>
                  <option value="1">First payment</option>
                  <option value="3">3 months</option>
                  <option value="12">12 months</option>
                  <option value="forever">Forever</option>
                </NativeSelect>
              </Field>
            )}
            <Field label="Limit" hint="Optional">
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="No limit" inputMode="numeric" />
            </Field>
          </div>
          <DialogFooter>
            <Button
              disabled={!code}
              onClick={() => {
                const discount = kind === "trial" ? `${amount}-day free trial` : `${kind === "percent" ? `${amount}%` : `€${amount}`} off ${months === "1" ? "first payment" : months === "forever" ? "forever" : `for ${months} months`}`
                setList((l) => [{ code, discount, uses: limit ? `0 of ${limit}` : "0", expires: "never", active: true }, ...l])
                setOpen(false)
                setCode("")
                toast(`${code} created`)
              }}
            >
              Create coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- ADM-36 Transactions & problems

function Transactions() {
  const [filter, setFilter] = useState<"all" | "failed" | "disputed" | "refunded">("all")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState(TRANSACTIONS)
  const count = (st: string) => rows.filter((t) => t.status === st).length
  const shown = rows.filter((t) => (filter === "all" || t.status === filter) && (!q.trim() || `${t.who} ${t.what}`.toLowerCase().includes(q.trim().toLowerCase())))
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs
          label="Payment status"
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: `All payments ${rows.length}` },
            { id: "failed", label: `Failed ${count("failed")}` },
            { id: "disputed", label: `Disputed ${count("disputed")}` },
            { id: "refunded", label: `Refunded ${count("refunded")}` },
          ]}
        />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or e-mail" aria-label="Search payments" className="w-full sm:w-72" />
      </div>
      <div className="overflow-x-auto rounded-a-lg border border-a-border bg-a-panel">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead className="hidden md:table-cell">What</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">When</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-a-text-2">No payments match.</TableCell>
              </TableRow>
            )}
            {shown.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.who}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{t.what}</TableCell>
                <TableCell className="text-right tabular-nums">€{t.amount.toLocaleString("en")}</TableCell>
                <TableCell><Tag tone={TXN_TONE[t.status]} dot>{STATUS[t.status].label}</Tag></TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{t.when}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(t.status === "failed" || t.status === "retrying") && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "paid" } : x)))
                              toast(`Charged ${t.who} again`, { description: "The payment went through." })
                            }}
                          >
                            <RotateCcw /> Try again now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(`Payment link sent to ${t.who}`)}>Send payment link</DropdownMenuItem>
                        </>
                      )}
                      {t.status === "disputed" && <DropdownMenuItem onClick={() => toast("Send proof", { description: "We add the login history and course progress for you." })}>Answer the dispute</DropdownMenuItem>}
                      {t.status === "paid" && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "refunded" } : x)))
                            toast(`€${t.amount} refunded to ${t.who}`)
                          }}
                        >
                          Refund
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toast("Invoice downloaded")}>Download invoice</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">When a payment fails, the student sees “Update payment” and gets e-mails. They keep access during the retries, then it pauses.</p>
    </div>
  )
}

// ---------- ADM-41 Payouts

const KYC = ["Country and business type", "About you", "Bank account", "Identity check"]
const CONNECTED = { step: KYC.length, done: true }
const NOT_CONNECTED = { step: 0, done: false }

function Payouts() {
  const { coach } = useCoach()
  // The demo communities have payouts set up; one made in setup only if the coach connected them there.
  const wizard = useWizardCommunity(coach.slug)
  const [state, setState] = useCommunityData(coach.slug, "payouts", !wizard || wizard.setup?.payouts === "connected" ? CONNECTED : NOT_CONNECTED)
  const [busy, setBusy] = useState(false)

  if (!state.done)
    return (
      <div className="grid max-w-xl gap-4">
        <div className="flex gap-1">
          {KYC.map((k, i) => (
            <span key={k} className={cn("h-0.5 flex-1 bg-white/10", i < state.step && "bg-[var(--ts-cta)]", i === state.step && "bg-[var(--ts-interactive)]")} />
          ))}
        </div>
        <Mono className="text-[var(--ts-interactive)]">
          Step {state.step + 1} of {KYC.length}
        </Mono>
        <h2 className="text-xl">{KYC[state.step]}</h2>
        {state.step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country">
              <NativeSelect defaultValue="CH">
                <option value="CH">Switzerland</option>
                <option value="DE">Germany</option>
                <option value="AT">Austria</option>
                <option value="GB">United Kingdom</option>
              </NativeSelect>
            </Field>
            <Field label="You are">
              <NativeSelect defaultValue="company">
                <option value="person">A person</option>
                <option value="company">A company</option>
              </NativeSelect>
            </Field>
          </div>
        )}
        {state.step === 1 && (
          <div className="grid gap-3">
            <Field label="Legal name">
              <Input defaultValue={`${coach.org} GmbH`} />
            </Field>
            <Field label="Address">
              <Input defaultValue="Bahnhofstrasse 1, 8001 Zürich" />
            </Field>
          </div>
        )}
        {state.step === 2 && (
          <Field label="IBAN" hint="Where your money goes every week">
            <Input placeholder="CH93 0076 2011 6238 5295 7" className="font-mono" />
          </Field>
        )}
        {state.step === 3 && <p className="text-sm text-muted-foreground">Our payment partner opens a short check: a photo of your ID and a selfie. About 2 minutes.</p>}
        <div className="flex gap-2">
          {state.step > 0 && (
            <Button variant="ghost" onClick={() => setState({ step: state.step - 1, done: false })}>
              Back
            </Button>
          )}
          <Button
            disabled={busy}
            onClick={() => {
              if (state.step < KYC.length - 1) return setState({ step: state.step + 1, done: false })
              setBusy(true)
              setTimeout(() => {
                setState({ step: KYC.length, done: true })
                setBusy(false)
                toast("Payouts connected")
              }, 1100)
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : null} {state.step < KYC.length - 1 ? "Continue" : "Start identity check"}
          </Button>
        </div>
      </div>
    )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 place-items-center bg-[var(--ts-cta)] text-[#0a0a0a]">
              <Check className="size-4" strokeWidth={3} />
            </span>
            Payouts connected
          </CardTitle>
          <CardDescription>Every Monday, no minimum</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1 divide-y text-sm">
          <SettingRow label="Bank account">
            <span className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <Landmark className="size-3.5" /> CH93 ···· 5295 7
            </span>
          </SettingRow>
          <SettingRow label="Next payout">
            <span className="tabular-nums">
              €{MONEY.nextPayout.amount.toLocaleString("en")} · {MONEY.nextPayout.date}
            </span>
          </SettingRow>
          <SettingRow label="Payout day">
            <NativeSelect defaultValue="mon">
              <option value="mon">Every Monday</option>
              <option value="month">Once a month</option>
            </NativeSelect>
          </SettingRow>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent payouts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {[
            ["Mon 12 Oct", 4380],
            ["Mon 5 Oct", 3920],
            ["Mon 28 Sep", 4105],
            ["Mon 21 Sep", 3790],
          ].map(([d, a]) => (
            <div key={d} className="flex justify-between">
              <span className="text-muted-foreground">{d}</span>
              <span className="tabular-nums">€{Number(a).toLocaleString("en")}</span>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setState({ step: 0, done: false })}>
            Change bank account
          </Button>
        </CardContent>
      </Card>
    </div>
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
