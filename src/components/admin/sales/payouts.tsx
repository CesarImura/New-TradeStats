"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowUp, Loader2, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { MONEY } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { useWizardCommunity } from "../setup-checklist"
import { isFreeTier, useTiers } from "@/lib/data/access"
import { AdminButton, AdminDrawer, AdminField, AdminFilter, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, Callout, Dropzone, OptionCard, Panel, PanelHeader, StatPanel, StepIndicator, Tag, adminControl } from "../ui"

type Payouts = { step: number; done: boolean; country?: string; kind?: "person" | "company"; iban?: string; /** Full legal name, as on the ID. */ name?: string; holder?: string; /** The ID is being checked (it clears by itself in the prototype). */ review?: boolean }
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
  const tiers = useTiers(coach).filter((t) => !isFreeTier(t))
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  // The ID check clears a few seconds after it was sent.
  useEffect(() => {
    if (!state.review) return
    const t = setTimeout(() => setState((s) => ({ ...s, review: false })), 6000)
    return () => clearTimeout(t)
  }, [state.review, setState])

  if (!state.done) {
    // Each step leads straight into the next one's drawer (Figma 1040:1574 → 1933 → 2283).
    const advance = (patch: Partial<Payouts>) => {
      const next = (open ?? 0) + 1
      setState({ ...state, ...patch, step: Math.max(state.step, next) })
      setOpen(next < STEPS.length && state.step <= next ? next : null)
    }
    const finish = (patch: Partial<Payouts>) => {
      setBusy(true)
      timer.current = setTimeout(() => {
        // The ID goes to review first (Figma 1066:943); it clears a moment later, as the partner's check would.
        setState({ ...state, ...patch, step: STEPS.length, done: true, review: true })
        setBusy(false)
        setOpen(null)
        toast("Payouts connected. We're checking your ID.")
      }, 900)
    }
    const sub = (i: number) => (i === 0 && state.step > 0 ? `${state.kind === "company" ? "A company" : "A person"} · ${COUNTRIES.find((c) => c.value === (state.country ?? "DE"))?.label}` : i === 1 && state.step > 1 && state.iban ? `IBAN ${maskIban(state.iban)}` : STEPS[i].text)
    const firstTier = tiers[0]?.name

    return (
      <div className="flex flex-col gap-4">
        <Panel className="gap-3">
          <PanelHeader title="Connect payouts" description="Needed before your first sale. Takes about 5 minutes." />
          <ol className="flex flex-col gap-2.5">
            {STEPS.map((s, i) => {
              const done = i < state.step
              const current = i === state.step
              return (
                <li key={s.title} aria-current={current ? "step" : undefined} className={cn("flex items-center gap-3 rounded-a-md border px-3.5 py-3", current ? "border-a-border-strong" : "border-a-border")}>
                  <StepIndicator step={i + 1} state={done ? "done" : current ? "current" : "upcoming"} />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className={cn("t-body-m", done || current ? "text-a-text" : "text-a-text-2")}>{s.title}</span>
                    <span className="t-caption text-a-text-2">{sub(i)}</span>
                  </div>
                  {current && (
                    <AdminButton size="lg" data-tour={i === 0 ? "payouts-start" : "payouts-next"} onClick={() => setOpen(i)}>
                      {i === 0 ? "Start" : "Continue"}
                    </AdminButton>
                  )}
                  {done && (
                    <AdminButton hierarchy="ghost" size="md" onClick={() => setOpen(i)}>
                      Edit
                    </AdminButton>
                  )}
                </li>
              )
            })}
          </ol>
        </Panel>
        <Callout tone="warning" icon={<AlertTriangle className="size-4" />}>
          {firstTier ? `Students can’t buy ${firstTier} until payouts are connected.` : "Students can join free tiers now. Paid tiers open after payouts are connected."}
        </Callout>
        <PayoutDrawers step={open} state={state} busy={busy} onClose={() => !busy && setOpen(null)} onSave={(i, patch) => (i === 2 ? finish(patch) : advance(patch))} />
      </div>
    )
  }

  const iban = state.iban ? maskIban(state.iban) : "CH93 •••• 5295 7"
  const rows = [
    ["Bank account", `IBAN ${iban}`],
    ["Payout day", "Every Monday, no minimum"],
    ["Legal name", state.name || `${coach.org} GmbH`],
  ]
  // A platform made at sign-up has sold nothing yet (Figma 1040:2642): no demo money.
  const fresh = !!wizard
  return (
    <div className="flex flex-col gap-4">
      <StatPanel
        stats={[
          { label: "Next payout", value: fresh ? "€0" : `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: fresh ? "Every Monday" : MONEY.nextPayout.date },
          { label: "Paid out to you · October", value: fresh ? "€0" : `€${MONEY.month.toLocaleString("en")}`, delta: fresh ? "No sales yet" : "October, in full" },
          { label: "Card and payment fees", value: fresh ? "€0" : `€${MONEY.fees.amount.toLocaleString("en")}`, delta: "3.0% of revenue" },
          { label: "Our share · 5%", value: fresh ? "€0" : `€${MONEY.share.toLocaleString("en")}` },
        ]}
      />
      <div className={cn("grid items-start gap-4", !fresh && "lg:grid-cols-2")}>
        <Panel className="gap-3.5" data-tour="payouts-connected" data-state={state.review ? "review" : "connected"}>
          <PanelHeader title="Where your money goes every week" actions={state.review ? <Tag tone="warning" dot>ID in review</Tag> : <Tag tone="success" dot>Payouts connected</Tag>} />
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
        {!fresh && (
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
        )}
      </div>
    </div>
  )
}

/**
 * Connect payouts, one drawer per step (Figma 1040:1574 You are, 1040:1933 Bank account, 1040:2283 Identity check).
 * Each opens on what was saved; Continue, Save and Submit move to the next step.
 */
function PayoutDrawers({ step, state, busy, onClose, onSave }: { step: number | null; state: Payouts; busy: boolean; onClose: () => void; onSave: (i: number, patch: Partial<Payouts>) => void }) {
  const [form, setForm] = useState<Payouts>(state)
  const [key, setKey] = useState<number | null>(null)
  const [tried, setTried] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  // Open on the saved values every time (derived state, no effect).
  if (step !== key) {
    setKey(step)
    setForm({ ...state, holder: state.holder ?? state.name })
    setTried(false)
    setFile(null)
  }
  const set = (p: Partial<Payouts>) => setForm((f) => ({ ...f, ...p }))
  const iban = (form.iban ?? "").toUpperCase()
  const ibanOk = IBAN.test(iban.replace(/\s/g, ""))
  const nameOk = (form.name ?? "").trim().length > 1
  const holderOk = (form.holder ?? "").trim().length > 1

  const copy = [
    { title: "You are", subtitle: "Who gets paid. Step 1 of 3", action: "Continue" },
    { title: "Bank account", subtitle: "Where your money goes. Step 2 of 3", action: "Save" },
    { title: "Identity check", subtitle: "Checked once by our payment partner. Step 3 of 3", action: "Submit" },
  ][step ?? 0]
  const submit = () => {
    setTried(true)
    if (step === 0 && nameOk) onSave(0, { kind: form.kind ?? "person", country: form.country ?? "DE", name: form.name?.trim() })
    if (step === 1 && holderOk && ibanOk) onSave(1, { holder: form.holder?.trim(), iban })
    if (step === 2 && file) onSave(2, {})
  }

  return (
    <AdminDrawer
      open={step !== null}
      onOpenChange={(o) => !o && onClose()}
      title={copy.title}
      subtitle={copy.subtitle}
      bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton disabled={busy || (step === 2 && !file)} onClick={submit}>
            {busy && <Loader2 className="animate-spin" />} {copy.action}
          </AdminButton>
        </>
      }
    >
      {step === 0 && (
        <div data-tour="payouts-you" className="flex flex-col gap-5">
          <div role="radiogroup" aria-label="Sell as" className="flex flex-col gap-2">
            <span className="t-caption text-a-text">Sell as</span>
            <OptionCard checked={(form.kind ?? "person") === "person"} onSelect={() => set({ kind: "person" })} title="A person" description="You sell as yourself" />
            <OptionCard checked={form.kind === "company"} onSelect={() => set({ kind: "company" })} title="A company" description="You sell through a registered business" />
          </div>
          <AdminField label="Country">
            {() => <AdminFilter ariaLabel="Country" value={form.country ?? "DE"} onValueChange={(v) => set({ country: v })} options={COUNTRIES} className="h-11! w-full justify-between" />}
          </AdminField>
          <AdminField label={form.kind === "company" ? "Company name" : "Full legal name"} hint={form.kind === "company" ? "Exactly as registered" : "Exactly as on your ID"} error={tried && !nameOk ? "Type the name as it is on your ID." : undefined}>
            {(p) => <input {...p} autoFocus value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder={form.kind === "company" ? "Your company’s name" : "Your legal name"} className={cn(adminControl, "h-11")} />}
          </AdminField>
        </div>
      )}
      {step === 1 && (
        <div data-tour="payouts-bank" className="flex flex-col gap-5">
          <AdminField label="Account holder" hint="Must match the name on your ID" error={tried && !holderOk ? "Type the account holder’s name." : undefined}>
            {(p) => <input {...p} value={form.holder ?? ""} onChange={(e) => set({ holder: e.target.value })} placeholder="Your legal name" className={cn(adminControl, "h-11")} />}
          </AdminField>
          <AdminField label="IBAN" hint="Payouts go out every Monday, no minimum" error={tried && !ibanOk ? "Check the IBAN. It starts with the country, like DE89…" : undefined}>
            {(p) => <input {...p} autoFocus value={iban} onChange={(e) => set({ iban: e.target.value.toUpperCase() })} placeholder="DE89 3704 0044 0532 0130 00" className={cn(adminControl, "h-11 font-a-mono")} />}
          </AdminField>
        </div>
      )}
      {step === 2 && (
        <div data-tour="payouts-id" className="flex flex-col gap-1.5">
          <span className="t-caption text-a-text">Photo of your ID</span>
          {file ? (
            <div className="flex h-11 items-center gap-3 rounded-a-md border border-a-border px-3">
              <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{file.name}</span>
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Remove the photo" onClick={() => setFile(null)}>
                <X />
              </AdminButton>
            </div>
          ) : (
            <Dropzone label="Photo of your ID" title="Drop a photo of your ID, or click to choose" hint="Passport, ID card or driving licence" icon={<ArrowUp className="size-[22px]" />} accept="image/*,application/pdf" onFiles={(f) => setFile(f[0])} />
          )}
        </div>
      )}
    </AdminDrawer>
  )
}
