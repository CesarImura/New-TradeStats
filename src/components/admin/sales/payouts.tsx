"use client"

import { useEffect, useRef, useState } from "react"
import { Landmark, Loader2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MONEY } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, Mono, NativeSelect, SettingRow, useCommunityData } from "../kit"
import { useWizardCommunity } from "../setup-checklist"
import { Panel, StatPanel, Tag, AdminButton } from "../ui"

// ---------- ADM-41 Payouts

const KYC = ["Country and business type", "About you", "Bank account", "Identity check"]
const CONNECTED = { step: KYC.length, done: true }
const NOT_CONNECTED = { step: 0, done: false }

export function Payouts() {
  const { coach } = useCoach()
  // The demo communities have payouts set up; one made in setup only if the coach connected them there.
  const wizard = useWizardCommunity(coach.slug)
  const [state, setState] = useCommunityData(coach.slug, "payouts", !wizard || wizard.setup?.payouts === "connected" ? CONNECTED : NOT_CONNECTED)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

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
            <AdminButton hierarchy="ghost" onClick={() => setState({ step: state.step - 1, done: false })}>
              Back
            </AdminButton>
          )}
          <AdminButton hierarchy="primary"
            disabled={busy}
            onClick={() => {
              if (state.step < KYC.length - 1) return setState({ step: state.step + 1, done: false })
              setBusy(true)
              timer.current = setTimeout(() => {
                setState({ step: KYC.length, done: true })
                setBusy(false)
                toast("Payouts connected")
              }, 1100)
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : null} {state.step < KYC.length - 1 ? "Continue" : "Start identity check"}
          </AdminButton>
        </div>
      </div>
    )

  const payouts = [
    { d: "Mon 12 Oct", a: 4380 },
    { d: "Mon 5 Oct", a: 3920 },
    { d: "Mon 28 Sep", a: 4105 },
    { d: "Mon 21 Sep", a: 3790 },
  ]
  return (
    <div className="grid gap-4">
      <StatPanel
        stats={[
          { label: "Next payout", value: `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: MONEY.nextPayout.date },
          { label: "Paid out to you · this month", value: `€${MONEY.month.toLocaleString("en")}`, delta: "After fees, every Monday" },
          { label: "Card and payment fees", value: `€${MONEY.fees.amount.toLocaleString("en")}`, delta: `${((MONEY.fees.amount / (MONEY.month + MONEY.fees.amount)) * 100).toFixed(1)}% of revenue` },
          { label: "Payouts", value: "Connected", tone: "success", delta: "Every Monday, no minimum" },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="grid content-start gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-heading-m">Where your money goes every week</h2>
            <Tag tone="success" dot>Payouts connected</Tag>
          </div>
          <div className="divide-y divide-a-border-subtle">
            <SettingRow label="Bank account">
              <span className="flex items-center gap-1.5 font-a-mono t-mono-meta text-a-text-2">
                <Landmark className="size-3.5" /> CH93 ···· 5295 7
              </span>
            </SettingRow>
            <SettingRow label="Payout day">
              <NativeSelect defaultValue="mon">
                <option value="mon">Every Monday</option>
                <option value="month">Once a month</option>
              </NativeSelect>
            </SettingRow>
          </div>
          <AdminButton hierarchy="secondary" size="md" className="justify-self-start" onClick={() => setState({ step: 0, done: false })}>
            Change bank account
          </AdminButton>
        </Panel>
        <Panel>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.d}>
                  <TableCell>{p.d}</TableCell>
                  <TableCell className="text-right tabular-nums">€{p.a.toLocaleString("en")}</TableCell>
                  <TableCell>
                    <Tag tone="success" dot>Paid</Tag>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </div>
  )
}
