"use client"

import { useState } from "react"
import { Info, ShieldCheck, TriangleAlert } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Field, NativeSelect, useCommunityData } from "../kit"
import { AdminButton, AdminModal, Panel, PanelHeader, Tag } from "../ui"
import { SettingsPage, DataCard, Affix, bareInput, handleOf } from "./settings-parts"

// ---------- ADM-45

type GeneralSettings = { name: string; short: string; tz: string; currency: string; from: string; replyTo: string }

export function General() {
  const { coach } = useCoach()
  const handle = handleOf(coach.name)
  const fallback: GeneralSettings = { name: coach.name, short: coach.name, tz: "lisbon", currency: "eur", from: `${coach.coachName} · ${coach.name}`, replyTo: `${coach.slug}@${handle}.trading` }
  const [g, setG] = useCommunityData<GeneralSettings>(coach.slug, "general", fallback)
  const set = (p: Partial<GeneralSettings>) => setG((x) => ({ ...x, ...p }))
  return (
    <SettingsPage title="General" text="What students see as your name and how we reach you.">
      <Panel>
        <PanelHeader title="Business" />
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input value={g.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Short name" hint="Used in the menu and e-mails">
            {(f) => <Input {...f} value={g.short} onChange={(e) => set({ short: e.target.value })} />}
          </Field>
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{(g.name || coach.name)[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <AdminButton hierarchy="secondary" size="md" className="justify-self-start" onClick={() => toast("Logo is changed in Design", { description: "Pick a file there and you see it on your site at once." })}>
              Change logo
            </AdminButton>
            <span className="t-caption text-a-text-2">Square, at least 256 px</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time zone">
            <NativeSelect value={g.tz} onChange={(e) => set({ tz: e.target.value })} aria-label="Time zone" className="h-9 w-full">
              <option value="lisbon">Europe/Lisbon</option>
              <option value="zurich">Europe/Zurich</option>
              <option value="london">Europe/London</option>
              <option value="ny">America/New_York</option>
              <option value="dubai">Asia/Dubai</option>
            </NativeSelect>
          </Field>
          <Field label="Currency">
            <NativeSelect value={g.currency} onChange={(e) => set({ currency: e.target.value })} aria-label="Currency" className="h-9 w-full">
              <option value="eur">EUR · €</option>
              <option value="chf">CHF · Fr.</option>
              <option value="usd">USD · $</option>
              <option value="gbp">GBP · £</option>
            </NativeSelect>
          </Field>
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="Sender" />
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field label="From name">
            <Input value={g.from} onChange={(e) => set({ from: e.target.value })} />
          </Field>
          <Field label="Reply-to">
            <Input value={g.replyTo} onChange={(e) => set({ replyTo: e.target.value })} />
          </Field>
        </div>
        <p className="t-caption text-a-success">Students reply to this address. Verified · SPF and DKIM ok.</p>
      </Panel>
    </SettingsPage>
  )
}

// ---------- ADM-46

type Domain = { domain: string; step: 0 | 1 | 2 }

export function Domain() {
  const { coach } = useCoach()
  const handle = handleOf(coach.name)
  const fallback: Domain = { domain: `academy.${handle}.trading`, step: 1 }
  const [d, setD] = useCommunityData<Domain>(coach.slug, "domain-v2", fallback)
  const [value, setValue] = useState(d.domain)
  const [checking, setChecking] = useState(false)
  const [address, setAddress] = useCommunityData<string>(coach.slug, "web-address", handle)
  const copy = (v: string) => {
    void navigator.clipboard?.writeText(v).catch(() => {})
    toast(`${v} copied`)
  }
  const sub = d.domain.split(".")[0]

  return (
    <SettingsPage title="Your web address" text="Where students find your site and log in.">
      <Panel>
        <PanelHeader title="Your web address" />
        <Affix
          before="https://"
          after={
            <>
              <span className="flex items-center t-caption text-a-text-3">.traderhub.io</span>
              <span className="flex items-center px-1.5">
                <AdminButton hierarchy="secondary" size="md" onClick={() => copy(`${address || handle}.traderhub.io`)}>
                  Copy
                </AdminButton>
              </span>
            </>
          }>
          <input aria-label="Web address" value={address} onChange={(e) => setAddress(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={bareInput} />
        </Affix>
      </Panel>
      <Panel>
        <PanelHeader title="Use your own domain" actions={<Tag>Optional</Tag>} />
        <Field label="Domain">
          <Affix
            before="https://"
            after={
              d.step === 0 && (
                <span className="flex items-center px-1.5">
                  <AdminButton size="md" disabled={!value.includes(".")} onClick={() => setD({ domain: value, step: 1 })}>
                    Connect
                  </AdminButton>
                </span>
              )
            }>
            <input aria-label="Domain" value={value} onChange={(e) => setValue(e.target.value.toLowerCase())} placeholder={`academy.${handle}.trading`} className={bareInput} />
          </Affix>
        </Field>
        {d.step === 0 ? (
          <p className="t-caption text-a-text-2">Students see only your address, never ours. Tip: use a sub-address like academy.yourname.com, so your website keeps working.</p>
        ) : (
          <>
            <p className="flex items-center gap-1.5 t-caption text-a-text-2">
              <ShieldCheck className="size-3.5" /> Your domain is verified and secured with HTTPS automatically.
            </p>
            <p className="t-body-m text-a-text-2">Add these two records at your domain provider. We check every few minutes.</p>
            <DataCard className="bg-a-field" rowHeight={45} scrollLabel="DNS records">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["CNAME", sub, "sites.traderhub.io", true],
                  ["TXT", "_th-verify", "th-verify=8f2c…a91", d.step === 2],
                ].map(([type, name, val, ok]) => (
                  <TableRow key={String(type)}>
                    <TableCell>{type}</TableCell>
                    <TableCell className="text-a-text-2">{name}</TableCell>
                    <TableCell className="text-a-text-2">
                      <button type="button" className="rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus" onClick={() => copy(String(val))}>
                        {val}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Tag tone={ok ? "success" : "warning"}>
                        {ok ? "Found" : "Waiting"}
                      </Tag>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataCard>
            {d.step === 1 ? (
              <div className="flex flex-wrap items-center gap-3 rounded-a-md border border-a-warning/30 bg-a-warning-soft px-3 py-2 t-body-m text-a-warning">
                <TriangleAlert className="size-4 shrink-0" />
                <span className="flex-1">Waiting for the TXT record · last checked 2 min ago</span>
                <AdminButton
                  hierarchy="secondary"
                  size="md"
                  disabled={checking}
                  onClick={() => {
                    setChecking(true)
                    setTimeout(() => {
                      setChecking(false)
                      setD({ ...d, step: 2 })
                      toast(`${d.domain} is connected`, { description: "The security certificate is set up for you." })
                    }, 1500)
                  }}
                >
                  {checking ? "Checking…" : "Review"}
                </AdminButton>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-a-md border border-a-success/30 bg-a-success-soft px-3 py-2 t-body-m text-a-success">
                <Info className="size-4 shrink-0" />
                <span className="flex-1">{d.domain} is connected. {`${handle}.traderhub.io`} forwards here.</span>
                <AdminButton hierarchy="ghost" size="md" onClick={() => setD({ domain: "", step: 0 })}>
                  Remove
                </AdminButton>
              </div>
            )}
          </>
        )}
      </Panel>
    </SettingsPage>
  )
}

// ---------- ADM-47

const EMAILS = [
  { id: "welcome", name: "Welcome", when: "Right after they join", on: true, subject: "Welcome to {platform}", body: "Hi {first},\n\nGlad you're here. Start with the first lesson: {link}\n\n{coach}" },
  { id: "receipt", name: "Payment receipt", when: "After every payment", on: true, subject: "Your receipt from {platform}", body: "Thanks for your payment of {amount}. Your invoice is attached." },
  { id: "failed", name: "Payment failed", when: "When a card is declined", on: true, subject: "Your payment didn't go through", body: "Hi {first},\n\nWe couldn't take your payment. Update your card here: {link}" },
  { id: "lesson", name: "New lesson", when: "When you publish a lesson", on: true, subject: "New: {lesson}", body: "{coach} published a new lesson: {lesson}.\n\n{link}" },
  { id: "event", name: "Live in 1 hour", when: "Before every livestream", on: true, subject: "{event} starts in 1 hour", body: "Join here: {link}" },
  { id: "feedback", name: "Feedback answered", when: "When you answer a journal request", on: true, subject: "{coach} reviewed your trade", body: "{coach} left feedback on your {trade} trade.\n\n{link}" },
  { id: "miss", name: "We miss you", when: "After 14 days without logging in", on: false, subject: "We miss you, {first}", body: "Hi {first},\n\nIt's been a while. Your next lesson is waiting: {link}\n\n{coach}" },
]

export function Emails() {
  const { coach } = useCoach()
  const [sel, setSel] = useState<string | null>(null)
  const [edits, setEdits] = useCommunityData<Record<string, { subject: string; body: string }>>(coach.slug, "emails", {})
  const [off, setOff] = useCommunityData<Record<string, boolean>>(coach.slug, "emails-on", {})
  const t = EMAILS.find((x) => x.id === sel)
  const cur = t ? (edits[t.id] ?? { subject: t.subject, body: t.body }) : null
  const fill = (s: string) =>
    s
      .replaceAll("{platform}", coach.name)
      .replaceAll("{first}", "Alex")
      .replaceAll("{coach}", coach.coachName)
      .replaceAll("{link}", `${coach.slug}.traderhub.io/…`)
      .replaceAll("{lesson}", "Daily loss limits")
      .replaceAll("{amount}", "€49")
      .replaceAll("{event}", "Live trading · NY open")
      .replaceAll("{trade}", "NQ long")

  return (
    <SettingsPage title="Every e-mail students get" text="Turn e-mails on or off and change the words.">
      <DataCard rowHeight={53}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>E-mail</TableHead>
            <TableHead>When</TableHead>
            <TableHead className="w-24">On</TableHead>
            <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {EMAILS.map((x) => (
            <TableRow key={x.id}>
              <TableCell>{x.name}</TableCell>
              <TableCell className="text-a-text-2">{x.when}</TableCell>
              <TableCell>
                <Switch checked={off[x.id] === undefined ? x.on : off[x.id]} onCheckedChange={(v) => setOff((o) => ({ ...o, [x.id]: v }))} aria-label={`${x.name} e-mail`} />
              </TableCell>
              <TableCell className="text-right">
                <AdminButton hierarchy="ghost" size="md" onClick={() => setSel(x.id)}>
                  Edit
                </AdminButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataCard>
      <AdminModal open={!!t} onOpenChange={(o) => !o && setSel(null)} title={t?.name} subtitle={<>In your design. Words in {"{curly brackets}"} fill in for each student.</>} className="sm:max-w-xl" footer={<>{t && edits[t.id] && (
                  <AdminButton hierarchy="ghost" onClick={() => t && setEdits((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== t.id)))}>
                    Back to our text
                  </AdminButton>
                )}
                <AdminButton hierarchy="secondary" onClick={() => toast("Test e-mail sent to you")}>
                  Send me a test
                </AdminButton>
                <AdminButton onClick={() => setSel(null)}>Done</AdminButton></>}>
          {t && cur && (
            <>
              
              <div className="grid gap-3">
                <Field label="Subject">
                  <Input value={cur.subject} onChange={(e) => setEdits((x) => ({ ...x, [t.id]: { ...cur, subject: e.target.value } }))} />
                </Field>
                <Field label="Text">
                  <Textarea rows={6} value={cur.body} onChange={(e) => setEdits((x) => ({ ...x, [t.id]: { ...cur, body: e.target.value } }))} />
                </Field>
                <div className="grid gap-1 rounded-a-md border border-a-border bg-a-raised p-4">
                  <span className="t-micro text-a-text-3">Preview</span>
                  <span className="t-body-m-medium">{fill(cur.subject)}</span>
                  <p className="t-body-m whitespace-pre-line text-a-text-2">{fill(cur.body)}</p>
                </div>
              </div>
              
            </>
          )}
        
</AdminModal>
    </SettingsPage>
  )
}

