"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowUp, Banknote, BadgeCheck, CalendarDays, Clock, CreditCard, Euro, Landmark, Loader2, ShieldCheck, User, Wallet, X } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { account } from "@/lib/data/communities"
import { MONEY } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { useWizardCommunity } from "../setup-checklist"
import { isFreeTier, useTiers } from "@/lib/data/access"
import { AdminSelect, AdminButton, AdminDrawer, AdminField, Callout, Dropzone, OptionCard, Panel, StatPanel, Tag, TimelineStep, adminControl } from "../ui"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

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
/** Country and check digits, then the last four: "DE89 •••• 3000" (QA 14/11). */
const maskIban = (v: string) => { const s = v.replace(/\s/g, "").toUpperCase(); return `${s.slice(0, 4)} •••• ${s.slice(-4)}` }

/** Are payouts connected? Offer links need it: no connected account, no payment (Figma Sales · 04b). */
export function usePayoutsDone() {
  const { coach } = useCoach()
  const wizard = useWizardCommunity(coach.slug)
  const [state] = useCommunityData<Payouts>(coach.slug, "payouts-v2", !wizard || wizard.setup?.payouts === "connected" ? CONNECTED : NOT_CONNECTED)
  return state.done
}

/** Sales · 14 Payouts (Figma 536:8198) and 15 Connect payouts (536:8427). */
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
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="gap-4">
          <header className="grid gap-1"><h2 className="t-heading-s text-a-text">Connect payouts</h2><p className="t-body-m text-a-text-2">Needed before your first sale. Takes about 5 minutes.</p></header>
          <ol className="flex flex-col">
            {STEPS.map((s, i) => {
              const done = i < state.step
              const current = i === state.step
              return (
                <TimelineStep
                  key={s.title}
                  step={i + 1}
                  state={done ? "done" : current ? "current" : "locked"}
                  title={s.title}
                  description={sub(i) || s.text}
                  action={i === 0 ? "Start" : i === 1 ? "Continue" : "Verify identity"}
                  onAction={() => setOpen(i)}
                  onEdit={() => setOpen(i)}
                  first={i === 0}
                  last={i === STEPS.length - 1}
                  prevDone={i > 0 && i - 1 < state.step}
                  disabledHint="Finish the step above first"
                  icon={[User, Wallet, CreditCard][i]}
                  tourId={current ? (i === 0 ? "payouts-start" : "payouts-next") : undefined}
                />
              )
            })}
          </ol>
        </Panel>
        <Panel className="gap-4">
          <header className="grid gap-1"><h2 className="t-heading-s text-a-text">Before you start</h2><p className="t-body-m text-a-text-2">Have these ready so you do not have to stop.</p></header>
          <ul className="flex flex-col">
            {[
              [Landmark, "A bank account", "We need the IBAN, in your name.", "2 min"],
              [CreditCard, "An ID document", "A passport or national ID card.", "3 min"],
              [Clock, "You can pause", "Saved at every step.", "Anytime"],
            ].map(([Icon, title, text, time]) => {
              const I = Icon as React.ComponentType<{ className?: string }>
              return (
                <li key={title as string} className="flex items-center gap-3 border-t border-a-border-subtle py-3 first:border-t-0 first:pt-0">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-a-md bg-a-selected text-a-icon"><I className="size-4" /></span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="t-body-m text-a-text">{title as string}</span>
                    <span className="t-caption text-a-text-2">{text as string}</span>
                  </div>
                  <Tag>{time as string}</Tag>
                </li>
              )
            })}
          </ul>
          <p className="flex items-start gap-2 rounded-a-md border border-a-border-subtle bg-a-subtle p-3 t-caption text-a-text-3"><ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0" />Payments are processed by our payment partner. We never see or store your bank details.</p>
        </Panel>
        </div>
        <Callout tone="warning" icon={<AlertTriangle className="size-4" />}>
          {firstTier ? `Students can't buy ${firstTier} until payouts are connected.` : "Students can join free tiers now. Paid tiers open after payouts are connected."}
        </Callout>
        <PayoutDrawers step={open} state={state} busy={busy} onClose={() => !busy && setOpen(null)} onSave={(i, patch) => (i === 2 ? finish(patch) : advance(patch))} />
      </div>
    )
  }

  const iban = state.iban ? maskIban(state.iban) : "CH93 •••• 5295 7"
  const rows = [
    [Wallet, "Account", `IBAN ${iban}`],
    [CalendarDays, "Payout day", "Every Monday"],
    [User, "Holder", state.name || `${coach.org} GmbH`],
    [Banknote, "Minimum", "None"],
    [BadgeCheck, "Status", state.review ? <Tag tone="warning" key="s">In review</Tag> : <span key="s" className="inline-flex items-center gap-2">12 Oct <Tag tone="success">Verified</Tag></span>],
    [Euro, "Currency", "EUR"],
  ] as [React.ComponentType<{ className?: string }>, string, React.ReactNode][]
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
      <div className={cn("grid items-stretch gap-4", !fresh && "lg:grid-cols-[minmax(0,610fr)_minmax(0,570fr)]")}>
        <Panel className="gap-3 pb-3" data-tour="payouts-connected" data-state={state.review ? "review" : "connected"}>
          <header className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2"><h2 className="t-heading-s text-a-text">Payout account</h2>{state.review ? <Tag tone="warning">ID in review</Tag> : <Tag tone="success">Connected</Tag>}</div>
            <AdminButton hierarchy="secondary" size="md" onClick={() => (setState({ ...state, step: 1, done: false }), setOpen(1))}>Change</AdminButton>
          </header>
          <dl className="grid flex-1 gap-x-0 sm:grid-cols-2 sm:grid-rows-3">
            {rows.map(([Icon, k, v], i) => (
              <div key={k} className={cn("flex items-center gap-3 border-t border-a-border-subtle py-3 first:border-t-0 sm:[&:nth-child(2)]:border-t-0", i % 2 === 0 ? "sm:border-r sm:border-r-a-border-subtle sm:pr-6" : "sm:pl-6")}>
                <Icon aria-hidden className="size-4 shrink-0 text-a-icon" />
                <dt className="t-body-m text-a-text-2">{k}</dt>
                <dd className="ml-auto min-w-0 truncate text-right t-body-m text-a-text">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        {!fresh && (
        <Panel className="gap-0 overflow-hidden p-0">
          <header className="flex items-center justify-between gap-2 px-5 py-4">
            <h2 className="t-heading-s text-a-text">Recent payouts</h2>
            <button type="button" onClick={() => toast("All payouts are shown here", { description: "Older payouts are in the e-mails you got from our payment partner." })} className="rounded-a-xs t-caption text-a-text-2 outline-none transition-colors duration-300 hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">See all</button>
          </header>
          <Table bare scrollLabel="Payout history">
            <TableHeader>
              <TableRow>
                <TableHead className="h-[34px]">Date</TableHead>
                <TableHead className="h-[34px]">To</TableHead>
                <TableHead className="h-[34px] text-right">Amount</TableHead>
                <TableHead className="h-[34px] w-24 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HISTORY.map((p) => (
                <TableRow key={p.d}>
                  <TableCell className="h-[42px] py-0">{p.d}</TableCell>
                  <TableCell className="h-[42px] py-0 text-a-text-2">Bank ••{(state.iban ? state.iban.replace(/\s/g, "").slice(-1) : "7")}</TableCell>
                  <TableCell className="h-[42px] py-0 text-right tabular-nums">€{p.a.toLocaleString("en")}</TableCell>
                  <TableCell className="h-[42px] py-0 text-right"><Tag tone="success">Paid</Tag></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
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
  const [file, setFile] = useState<File | null>(null)
  // Open on the saved values every time (derived state, no effect).
  if (step !== key) {
    setKey(step)
    // The legal name starts from the name given at sign-up (Flavio, 14/11); the coach checks it against the ID.
    // Only a person's name: a company's registered name is never the coach's own (QA 14/11).
    const name = state.name ?? (step !== null && (state.kind ?? "person") === "person" ? account()?.name : undefined)
    setForm({ ...state, name, holder: state.holder ?? name })
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
  // Rule (19/11): the action stays disabled until the step is valid; a field with an error shows it only once something is typed.
  const ready = step === 0 ? nameOk : step === 1 ? holderOk && ibanOk : !!file
  const submit = () => {
    if (!ready) return
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
          <AdminButton disabled={busy || !ready} onClick={submit}>
            {busy && <Loader2 className="animate-spin" />} {copy.action}
          </AdminButton>
        </>
      }
    >
      {step === 0 && (
        <div data-tour="payouts-you" className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Sell as" className="flex flex-col gap-4">
            <span className="t-caption text-a-text">Sell as</span>
            <OptionCard checked={(form.kind ?? "person") === "person"} onSelect={() => set({ kind: "person", name: form.name || account()?.name })} title="A person" description="You sell as yourself" />
            <OptionCard checked={form.kind === "company"} onSelect={() => set({ kind: "company", name: form.name === account()?.name ? "" : form.name })} title="A company" description="You sell through a registered business" />
          </div>
          <AdminField label="Country">
            {() => <AdminSelect ariaLabel="Country" value={form.country ?? "DE"} onValueChange={(v) => set({ country: v })} options={COUNTRIES} />}
          </AdminField>
          <AdminField label={form.kind === "company" ? "Company name" : "Full legal name"} hint={form.kind === "company" ? "Exactly as registered" : "Exactly as on your ID"} error={(form.name ?? "").trim() && !nameOk ? "Type the name as it is on your ID." : undefined}>
            {(p) => <input {...p} autoFocus value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder={form.kind === "company" ? "Your company’s name" : "Your legal name"} className={cn(adminControl, "h-11")} />}
          </AdminField>
        </div>
      )}
      {step === 1 && (
        <div data-tour="payouts-bank" className="flex flex-col gap-4">
          <AdminField label="Account holder" hint="Must match the name on your ID" error={(form.holder ?? "").trim() && !holderOk ? "Type the account holder’s name." : undefined}>
            {(p) => <input {...p} value={form.holder ?? ""} onChange={(e) => set({ holder: e.target.value })} placeholder="Your legal name" className={cn(adminControl, "h-11")} />}
          </AdminField>
          <AdminField label="IBAN" hint="Payouts go out every Monday, no minimum" error={iban.trim() && !ibanOk ? "Check the IBAN. It starts with the country, like DE89…" : undefined}>
            {(p) => <input {...p} autoFocus value={iban} onChange={(e) => set({ iban: e.target.value.toUpperCase() })} placeholder="DE89 3704 0044 0532 0130 00" className={cn(adminControl, "h-11")} />}
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
