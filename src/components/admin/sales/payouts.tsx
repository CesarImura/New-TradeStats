"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Check, Loader2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { MONEY } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { useWizardCommunity } from "../setup-checklist"
import { AdminButton, AdminField, AdminFilter, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, Callout, Panel, PanelHeader, StatPanel, Tag, adminControl } from "../ui"

type Payouts = { step: number; done: boolean; country?: string; kind?: "person" | "company"; iban?: string }
const STEPS = [
  { title: "You are", text: "A person or a company, and where" },
  { title: "Bank account", text: "Where your money goes every week" },
  { title: "Identity check", text: "We ask for an ID once. Usually done in minutes." },
]
const COUNTRIES = [
  { value: "DE", label: "Germany" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "GB", label: "United Kingdom" },
]
const CONNECTED: Payouts = { step: STEPS.length, done: true }
const NOT_CONNECTED: Payouts = { step: 0, done: false, country: "DE", kind: "person" }
const HISTORY = [
  { d: "Mon 10 Nov", a: 8120 },
  { d: "Mon 3 Nov", a: 7904 },
  { d: "Mon 27 Oct", a: 7611 },
]
const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9 ]{10,30}$/
const maskIban = (v: string) => { const s = v.replace(/\s/g, ""); return `${s.slice(0, 4)} •••• ${s.slice(-4, -1)} ${s.slice(-1)}`.trim() }

/** Sales · 10 Payouts (Figma 536:8198) and 11 Connect payouts (536:8427). */
export function Payouts() {
  const { coach } = useCoach()
  // The demo communities have payouts set up; one made in setup only if the coach connected them there.
  const wizard = useWizardCommunity(coach.slug)
  const [state, setState] = useCommunityData<Payouts>(coach.slug, "payouts-v2", !wizard || wizard.setup?.payouts === "connected" ? CONNECTED : NOT_CONNECTED)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [tried, setTried] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  if (!state.done) {
    const country = state.country ?? "DE"
    const kind = state.kind ?? "person"
    const iban = state.iban ?? ""
    const ibanOk = IBAN.test(iban.replace(/\s/g, "").toUpperCase())
    const advance = (patch: Partial<Payouts> = {}) => {
      setState({ ...state, ...patch, step: state.step + 1 })
      setOpen(null)
      setTried(false)
    }
    const finish = () => {
      setBusy(true)
      timer.current = setTimeout(() => {
        setState({ ...state, step: STEPS.length, done: true })
        setBusy(false)
        setOpen(null)
        toast("Payouts connected")
      }, 1100)
    }
    const sub = (i: number) => (i === 0 && state.step > 0 ? `${kind === "company" ? "A company" : "A person"} · ${COUNTRIES.find((c) => c.value === country)?.label}` : i === 1 && state.step > 1 ? `${maskIban(iban || "CH9300762011623852957")}` : STEPS[i].text)

    return (
      <div className="flex flex-col gap-4">
        <Panel className="gap-3">
          <PanelHeader title="Connect payouts" description="Needed before your first sale. Takes about 5 minutes." />
          <ol className="flex flex-col gap-2.5">
            {STEPS.map((s, i) => {
              const done = i < state.step
              const current = i === state.step
              return (
                <li key={s.title} aria-current={current ? "step" : undefined} className={cn("rounded-a-md border px-3.5 py-3", current ? "border-a-border-strong" : "border-a-border")}>
                  <div className="flex items-center gap-3">
                    <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full t-caption tabular-nums", done ? "bg-a-accent text-[var(--admin-component-button-primary-content)]" : current ? "border border-a-border-active text-a-text" : "border border-a-border-strong text-a-text-3")}>
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-0.5">
                      <span className={cn("t-body-m", done || current ? "text-a-text" : "text-a-text-2")}>{s.title}</span>
                      <span className="t-caption text-a-text-2">{sub(i)}</span>
                    </div>
                    {done && <Tag tone="success" dot>Done</Tag>}
                    {current && open !== i && <AdminButton size="lg" onClick={() => setOpen(i)}>Continue</AdminButton>}
                  </div>
                  {current && open === i && (
                    <div className="mt-3 flex flex-col gap-3 border-t border-a-border pt-3 pl-8 max-sm:pl-0">
                      {i === 0 && (
                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                          <AdminField label="You are">
                            {() => <AdminFilter ariaLabel="You are" value={kind} onValueChange={(v) => setState({ ...state, kind: v as "person" | "company" })} options={[{ value: "person", label: "A person" }, { value: "company", label: "A company" }]} className="h-11! w-full justify-between" />}
                          </AdminField>
                          <AdminField label="Country">
                            {() => <AdminFilter ariaLabel="Country" value={country} onValueChange={(v) => setState({ ...state, country: v })} options={COUNTRIES} className="h-11! w-full justify-between" />}
                          </AdminField>
                        </div>
                      )}
                      {i === 1 && (
                        <AdminField label="IBAN" hint="Where your money goes every week" error={tried && !ibanOk ? "Check the IBAN. It starts with the country, like CH93…" : undefined}>
                          {(p) => <input {...p} value={iban} onChange={(e) => setState({ ...state, iban: e.target.value.toUpperCase() })} placeholder="CH93 0076 2011 6238 5295 7" className={cn(adminControl, "h-11 font-mono")} />}
                        </AdminField>
                      )}
                      {i === 2 && <p className="t-body-m text-a-text-2">Our payment partner opens a short check: a photo of your ID and a selfie. About 2 minutes.</p>}
                      <div className="flex flex-wrap gap-2">
                        {i === 0 && <AdminButton onClick={() => advance()}>Save and continue</AdminButton>}
                        {i === 1 && <AdminButton onClick={() => (ibanOk ? advance() : setTried(true))}>Save and continue</AdminButton>}
                        {i === 2 && (
                          <AdminButton disabled={busy} onClick={finish}>
                            {busy && <Loader2 className="animate-spin" />} Start identity check
                          </AdminButton>
                        )}
                        <AdminButton hierarchy="ghost" disabled={busy} onClick={() => setOpen(null)}>Not now</AdminButton>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </Panel>
        <Callout tone="warning" icon={<AlertTriangle className="size-4" />}>Students can join free tiers now. Paid tiers open after payouts are connected.</Callout>
      </div>
    )
  }

  const iban = state.iban ? maskIban(state.iban) : "CH93 •••• 5295 7"
  const rows = [
    ["Bank account", `IBAN ${iban}`],
    ["Payout day", "Every Monday, no minimum"],
    ["Legal name", `${coach.org} GmbH`],
  ]
  return (
    <div className="flex flex-col gap-4">
      <StatPanel
        stats={[
          { label: "Next payout", value: `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: MONEY.nextPayout.date },
          { label: "Paid out to you · October", value: `€${MONEY.month.toLocaleString("en")}`, delta: "October, in full" },
          { label: "Card and payment fees", value: `€${MONEY.fees.amount.toLocaleString("en")}`, delta: "3.0% of revenue" },
          { label: "Our share · 5%", value: `€${MONEY.share.toLocaleString("en")}` },
        ]}
      />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel className="gap-3.5">
          <PanelHeader title="Where your money goes every week" actions={<Tag tone="success" dot>Payout connected</Tag>} />
          <dl className="flex flex-col gap-2.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4">
                <dt className="t-body-m text-a-text-2">{k}</dt>
                <dd className="min-w-0 truncate text-right t-body-m text-a-text">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <AdminButton hierarchy="secondary" size="md" onClick={() => (setState({ ...state, step: 1, done: false }), setOpen(1))}>Change</AdminButton>
          </div>
        </Panel>
        <AdminTable minWidth={360} scrollLabel="Payout history">
          <AdminTableHead>
            <AdminTh>Date</AdminTh>
            <AdminTh width={120} align="end">Amount</AdminTh>
            <AdminTh width={110}>Status</AdminTh>
          </AdminTableHead>
          <tbody>
            {HISTORY.map((p) => (
              <AdminTr key={p.d}>
                <AdminTd className="text-a-text">{p.d}</AdminTd>
                <AdminTd align="end">€{p.a.toLocaleString("en")}</AdminTd>
                <AdminTd><Tag tone="success" dot>Paid</Tag></AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  )
}
