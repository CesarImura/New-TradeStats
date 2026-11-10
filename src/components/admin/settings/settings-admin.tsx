"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Eye, GripVertical, Info, MoreHorizontal, Plus, ShieldCheck, Store, Ticket, TriangleAlert, UserAdmin, Users, Wallet } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FIRST_WEEK, MAX_CUSTOM_QUESTIONS, NO_QUESTIONS, resetAsNewStudent, useOnboardingSettings, type CustomQuestion, type FirstWeekItem, type OnboardingSettings } from "@/lib/data/student-start"
import { setStored } from "@/lib/prototype-store"
import { LEGAL } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"
import { AdminButton, AdminModal, Panel, PanelHeader, Tag } from "../ui"

/** Figma "Admin · 15 Settings": a menu of five groups (icon, mono label, pages) beside one page at a time. */
const GROUPS = [
  { label: "Your business", icon: Store, tabs: [["general", "General"], ["domain", "Web address"], ["email", "E-mails"], ["legal", "Legal pages"]] },
  { label: "Students", icon: Users, tabs: [["onboarding", "Onboarding questions"], ["firstweek", "Home in the first week"]] },
  { label: "Money", icon: Wallet, tabs: [["tax", "Invoices and VAT"]] },
  { label: "Team", icon: UserAdmin, tabs: [["team", "Team and roles"]] },
  { label: "Your plan", icon: Ticket, tabs: [["plan", "Plan and invoices"]] },
] as const

type TabId = (typeof GROUPS)[number]["tabs"][number][0]

/** ADM-45 to ADM-52. */
export function SettingsAdmin() {
  const initial = useSearchParams().get("tab")
  const [tab, setTab] = useState<TabId>((GROUPS.flatMap((g) => g.tabs.map((t) => t[0])) as TabId[]).includes(initial as TabId) ? (initial as TabId) : "general")
  const { coach } = useCoach()
  return (
    <Page>
      <PageHeader
        title="Settings"
        text={`${coach.name} · saved as you type`}
        actions={
          tab === "team" ? (
            <AdminButton onClick={() => document.dispatchEvent(new CustomEvent("settings:invite"))}>
              <Plus /> Invite to the team
            </AdminButton>
          ) : undefined
        }
      />
      <div className="flex gap-6 max-md:flex-col">
        <SettingsNav value={tab} onChange={setTab} />
        <div className="min-w-0 flex-1">
          {tab === "general" && <General />}
          {tab === "domain" && <Domain />}
          {tab === "email" && <Emails />}
          {tab === "legal" && <Legal />}
          {tab === "onboarding" && <StudentOnboarding />}
          {tab === "firstweek" && <FirstWeek />}
          {tab === "tax" && <Tax />}
          {tab === "team" && <Team />}
          {tab === "plan" && <Plan />}
        </div>
      </div>
    </Page>
  )
}

/** Settings menu: group header (16px icon + mono label), 32px items, hairline between groups. The open page is a soft pill with an orange bar, like the sidebar. */
function SettingsNav({ value, onChange }: { value: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav aria-label="Settings pages" className="flex shrink-0 flex-col md:w-[220px] max-md:flex-row max-md:gap-4 max-md:overflow-x-auto max-md:[scrollbar-width:none]">
      {GROUPS.map((g, i) => (
        <div key={g.label} className={cn("flex flex-col gap-0.5 max-md:flex-row max-md:items-center", i > 0 && "mt-3 border-t border-a-border-subtle pt-3 max-md:mt-0 max-md:border-t-0 max-md:pt-0")}>
          <div className="flex h-6 items-center gap-2 px-2 text-a-text-3 max-md:hidden">
            <g.icon className="size-4 text-a-icon" />
            <span className="t-mono-label-s">{g.label}</span>
          </div>
          {g.tabs.map(([id, label]) => {
            const active = id === value
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onChange(id)}
                className={cn(
                  "relative flex h-8 w-full shrink-0 items-center rounded-a-md border px-2.5 text-left t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus max-md:w-auto max-md:whitespace-nowrap",
                  active ? "border-a-border bg-a-selected text-a-text after:absolute after:top-2 after:right-2 after:bottom-2 after:w-0.5 after:rounded-full after:bg-a-accent-strong" : "border-transparent text-a-text-nav hover:bg-a-hover hover:text-a-text"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/** One settings page: heading, one plain sentence, then panels. */
function SettingsPage({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <h2 className="t-heading-m text-a-text">{title}</h2>
        <p className="t-body-m text-a-text-2">{text}</p>
      </header>
      {children}
    </div>
  )
}

/** Table inside a bordered panel surface (Figma "Table"). */
function DataCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-a-lg border border-a-border bg-a-panel", className)}>
      <div className="overflow-x-auto">
        <Table>{children}</Table>
      </div>
    </div>
  )
}

/** Choice shown as equal buttons; the chosen one has an orange border (Figma "Segmented"). */
function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "h-8 rounded-a-md border t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
            value === id ? "border-a-accent-strong bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:bg-a-hover hover:text-a-text"
          )}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

const RowMenu = ({ label, items }: { label: string; items: { text: string; onClick: () => void }[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="sm" iconOnly aria-label={label} />}>
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map((it) => (
        <DropdownMenuItem key={it.text} onClick={it.onClick}>
          {it.text}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

const handleOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "")

// ---------- ADM-45

function General() {
  const { coach } = useCoach()
  const handle = handleOf(coach.name)
  return (
    <SettingsPage title="General" text="What students see as your name and how we reach you.">
      <Panel>
        <PanelHeader title="Business" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input defaultValue={coach.name} />
          </Field>
          <Field label="Short name">
            <Input defaultValue={coach.name} />
            <span className="t-caption text-a-text-2">Used in the menu and e-mails</span>
          </Field>
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{coach.name[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <AdminButton hierarchy="secondary" size="sm" className="justify-self-start" onClick={() => toast("Logo is changed in Design", { description: "Pick a file there and you see it on your site at once." })}>
              Change logo
            </AdminButton>
            <span className="t-caption text-a-text-2">Square, at least 256 px</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time zone">
            <NativeSelect defaultValue="lisbon" aria-label="Time zone" className="h-9 w-full">
              <option value="lisbon">Europe/Lisbon</option>
              <option value="zurich">Europe/Zurich</option>
              <option value="london">Europe/London</option>
              <option value="ny">America/New_York</option>
              <option value="dubai">Asia/Dubai</option>
            </NativeSelect>
          </Field>
          <Field label="Currency">
            <NativeSelect defaultValue="eur" aria-label="Currency" className="h-9 w-full">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From name">
            <Input defaultValue={`${coach.coachName} · ${coach.name}`} />
          </Field>
          <Field label="Reply-to">
            <Input defaultValue={`${coach.slug}@${handle}.trading`} />
          </Field>
        </div>
        <p className="t-caption text-a-success">Students reply to this address. Verified · SPF and DKIM ok.</p>
      </Panel>
    </SettingsPage>
  )
}

// ---------- ADM-46

type Domain = { domain: string; step: 0 | 1 | 2 }

function Domain() {
  const { coach } = useCoach()
  const handle = handleOf(coach.name)
  const fallback: Domain = { domain: `academy.${handle}.trading`, step: 1 }
  const [d, setD] = useCommunityData<Domain>(coach.slug, "domain-v2", fallback)
  const [value, setValue] = useState(d.domain)
  const [checking, setChecking] = useState(false)
  const copy = (v: string) => {
    void navigator.clipboard?.writeText(v).catch(() => {})
    toast(`${v} copied`)
  }
  const sub = d.domain.split(".")[0]

  return (
    <SettingsPage title="Your web address" text="Where students find your site and log in.">
      <Panel>
        <PanelHeader title="Your web address" />
        <div className="flex h-9 items-stretch overflow-hidden rounded-a-md border border-a-border bg-a-field">
          <span className="flex items-center border-r border-a-border px-3 t-body-m text-a-text-2">https://</span>
          <Input aria-label="Web address" defaultValue={handle} className="h-full flex-1 rounded-none border-0 bg-transparent" />
          <span className="flex items-center t-caption text-a-text-3">.traderhub.io</span>
          <div className="flex items-center px-1">
            <AdminButton hierarchy="secondary" size="sm" onClick={() => copy(`${handle}.traderhub.io`)}>
              Copy
            </AdminButton>
          </div>
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="Use your own domain" actions={<Tag>Optional</Tag>} />
        <Field label="Domain">
          <div className="flex h-9 items-stretch overflow-hidden rounded-a-md border border-a-border bg-a-field">
            <span className="flex items-center border-r border-a-border px-3 t-body-m text-a-text-2">https://</span>
            <Input aria-label="Domain" value={value} onChange={(e) => setValue(e.target.value.toLowerCase())} placeholder={`academy.${handle}.trading`} className="h-full flex-1 rounded-none border-0 bg-transparent" />
            {d.step === 0 && (
              <div className="flex items-center px-1">
                <AdminButton size="sm" disabled={!value.includes(".")} onClick={() => setD({ domain: value, step: 1 })}>
                  Connect
                </AdminButton>
              </div>
            )}
          </div>
        </Field>
        {d.step === 0 ? (
          <p className="t-caption text-a-text-2">Students see only your address, never ours. Tip: use a sub-address like academy.yourname.com, so your website keeps working.</p>
        ) : (
          <>
            <p className="flex items-center gap-1.5 t-caption text-a-text-2">
              <ShieldCheck className="size-3.5" /> Your domain is verified and secured with HTTPS automatically.
            </p>
            <p className="t-body-m text-a-text-2">Add these two records at your domain provider. We check every few minutes.</p>
            <DataCard className="bg-a-field">
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
                      <Tag tone={ok ? "success" : "warning"} dot>
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
                  size="sm"
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
                <AdminButton hierarchy="ghost" size="sm" onClick={() => setD({ domain: "", step: 0 })}>
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

function Emails() {
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
      .replaceAll("{link}", `${coach.slug}.tradestats.app/…`)
      .replaceAll("{lesson}", "Daily loss limits")
      .replaceAll("{amount}", "€49")
      .replaceAll("{event}", "Live trading · NY open")
      .replaceAll("{trade}", "NQ long")

  return (
    <SettingsPage title="Every e-mail students get" text="Turn e-mails on or off and change the words.">
      <DataCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>E-mail</TableHead>
            <TableHead>When</TableHead>
            <TableHead className="w-24">On</TableHead>
            <TableHead className="w-16" />
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
                <AdminButton hierarchy="ghost" size="sm" onClick={() => setSel(x.id)}>
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
                  <span className="t-mono-label-s text-a-text-3">Preview</span>
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

// ---------- ADM-48

const LEGAL_PAGES = [
  { id: "terms", name: "Terms of service", source: "Our template · edited", updated: "2 Oct", text: LEGAL.find((l) => l.id === "terms")!.text },
  { id: "privacy", name: "Privacy policy", source: "Our template", updated: "2 Oct", text: LEGAL.find((l) => l.id === "privacy")!.text },
  { id: "refund", name: "Refund policy", source: "Your own link", updated: "14 Sep", text: "https://kairofx.trading/refunds" },
  { id: "risk", name: "Risk disclaimer", source: "Our template", updated: "2 Oct", text: LEGAL.find((l) => l.id === "risk")!.text },
]

function Legal() {
  const { coach } = useCoach()
  const [sel, setSel] = useState<string | null>(null)
  const [texts, setTexts] = useCommunityData<Record<string, string>>(coach.slug, "legal-v2", {})
  const page = LEGAL_PAGES.find((l) => l.id === sel)
  return (
    <SettingsPage title="Legal pages" text="Linked in the footer of your site and at checkout.">
      <DataCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Page</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {LEGAL_PAGES.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.name}</TableCell>
              <TableCell className="text-a-text-2">{texts[l.id] !== undefined ? "Our template · edited" : l.source}</TableCell>
              <TableCell className="text-a-text-2">{l.updated}</TableCell>
              <TableCell className="text-right">
                <AdminButton hierarchy="ghost" size="sm" onClick={() => setSel(l.id)}>
                  Edit
                </AdminButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataCard>
      <div className="flex items-center gap-2 rounded-a-md border border-a-border bg-a-panel px-3 py-2.5 t-body-m">
        <Info className="size-4 shrink-0 text-a-icon" />
        Trading carries risk. The risk disclaimer is shown on every sales page and can&apos;t be turned off.
      </div>
      <AdminModal open={!!page} onOpenChange={(o) => !o && setSel(null)} title={page?.name} subtitle="We provide a starting text. You stay responsible for it; check it with a lawyer." className="sm:max-w-2xl" footer={<><AdminButton hierarchy="ghost" onClick={() => page && setTexts((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== page.id)))}>
                  Back to our template
                </AdminButton>
                <AdminButton onClick={() => setSel(null)}>Done</AdminButton></>}>
          {page && (
            <>
              
              <Textarea rows={12} value={texts[page.id] ?? page.text} onChange={(e) => setTexts((x) => ({ ...x, [page.id]: e.target.value }))} />
              
            </>
          )}
        
</AdminModal>
    </SettingsPage>
  )
}

// ---------- ADM-49

const AFTER = [["home", "Go to Home"], ["lesson", "Start the first lesson"], ["call", "Book a call"]] as const

const BUILT_IN = [
  { id: "experience", title: "How long have you traded?", meta: "Choice · 4 options", required: true },
  { id: "markets", title: "What do you trade?", meta: "Choice · Futures, Forex, Stocks, Crypto", required: true },
  { id: "goal", title: "Your account size", meta: "Choice · optional", required: false },
] as const

function useOnboarding() {
  const { coach } = useCoach()
  const s = useOnboardingSettings(coach.slug)
  const set = (p: Partial<OnboardingSettings>) => setStored(`${coach.slug}:student-onboarding`, { ...s, ...p })
  return { coach, s, set }
}

function StudentOnboarding() {
  const { coach, s, set } = useOnboarding()
  const [after, setAfter] = useCommunityData<(typeof AFTER)[number][0]>(coach.slug, "onboarding-after", "lesson")
  const custom = s.custom ?? NO_QUESTIONS
  const editQuestion = (id: string, patch: Partial<CustomQuestion>) => set({ custom: custom.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  return (
    <SettingsPage title="Onboarding questions" text="What new students answer before their first lesson.">
      <Panel>
        <PanelHeader title="Welcome" />
        <Field label="Message">
          <Textarea rows={2} value={s.message} onChange={(e) => set({ message: e.target.value })} />
        </Field>
        <div className="flex items-center gap-3">
          <div className="grid aspect-video w-24 shrink-0 place-items-center rounded-a-sm bg-gradient-to-br from-a-raised to-a-selected t-caption text-a-text-3">{s.video ? "" : "No video"}</div>
          <div className="grid flex-1 gap-0.5">
            <span className="t-body-m">Welcome video</span>
            <span className="t-caption text-a-text-2">{s.video ? "1:42 · plays once" : "Not added yet"}</span>
          </div>
          <AdminButton hierarchy="secondary" size="sm" onClick={() => set({ video: !s.video })}>
            {s.video ? "Change" : "Upload"}
          </AdminButton>
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="Short profile" />
        <div className="grid gap-2">
          {BUILT_IN.map((q) => {
            const on = s.questions[q.id]
            return (
              <div key={q.id} className={cn("flex items-center gap-2 rounded-a-md border border-a-border bg-a-field px-2 py-2", !on && "opacity-50")}>
                <GripVertical className="size-4 shrink-0 text-a-icon" />
                <div className="grid min-w-0 flex-1">
                  <span className="t-body-m">{q.title}</span>
                  <span className="t-caption text-a-text-2">{on ? q.meta : "Switched off"}</span>
                </div>
                {q.required && on && <Tag>Required</Tag>}
                <RowMenu label={`Options for ${q.title}`} items={[{ text: on ? "Turn off" : "Turn on", onClick: () => set({ questions: { ...s.questions, [q.id]: !on } }) }]} />
              </div>
            )
          })}
          {custom.map((c) => (
            <div key={c.id} className="grid gap-2 rounded-a-md border border-a-border bg-a-field px-2 py-2">
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 shrink-0 text-a-icon" />
                <Input aria-label="Question" value={c.text} placeholder="What do you want to get from this community?" onChange={(e) => editQuestion(c.id, { text: e.target.value })} className="h-8 flex-1" />
                <NativeSelect aria-label="Answer type" value={c.kind} onChange={(e) => editQuestion(c.id, { kind: e.target.value as CustomQuestion["kind"] })}>
                  <option value="short">Short answer</option>
                  <option value="choice">Choose one</option>
                </NativeSelect>
                <RowMenu label="Options for this question" items={[{ text: "Delete", onClick: () => set({ custom: custom.filter((x) => x.id !== c.id) }) }]} />
              </div>
              {c.kind === "choice" && (
                <Input aria-label="Choices, separated by commas" value={c.options.join(", ")} placeholder="Choices, separated by commas" onChange={(e) => editQuestion(c.id, { options: e.target.value.split(",").map((o) => o.trimStart()) })} className="h-8" />
              )}
            </div>
          ))}
          {custom.length < MAX_CUSTOM_QUESTIONS && (
            <AdminButton hierarchy="ghost" size="sm" className="justify-self-start" onClick={() => set({ custom: [...custom, { id: `q${Date.now()}`, text: "", kind: "short", options: [] }] })}>
              <Plus /> Add your own question
            </AdminButton>
          )}
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="After the profile" />
        <Segmented label="After the profile" value={after} onChange={setAfter} options={AFTER} />
      </Panel>
    </SettingsPage>
  )
}

function FirstWeek() {
  const { coach, s, set } = useOnboarding()
  const items = (Object.keys(FIRST_WEEK) as FirstWeekItem[]).filter((id) => {
    const m = FIRST_WEEK[id].module
    return !m || coach.modules[m]
  })
  return (
    <SettingsPage title="Home in the first week" text="New students see a Start here card and a short checklist on Home until they finish or close it.">
      <Panel className="gap-2">
        <PanelHeader title="Start here" className="pb-1" />
        <div className="divide-y divide-a-border-subtle">
          <SettingRow label="Start here card" text="First lesson, next live session, introduce yourself">
            <Switch checked={s.startHere} onCheckedChange={(v) => set({ startHere: v })} />
          </SettingRow>
          {items.map((id) => (
            <SettingRow key={id} label={FIRST_WEEK[id].label} text={FIRST_WEEK[id].text}>
              <Switch checked={s.firstWeek.includes(id)} onCheckedChange={(v) => set({ firstWeek: v ? items.filter((x) => x === id || s.firstWeek.includes(x)) : s.firstWeek.filter((x) => x !== id) })} aria-label={FIRST_WEEK[id].label} />
            </SettingRow>
          ))}
        </div>
      </Panel>
      <Panel className="gap-2">
        <PanelHeader
          title="Before Home"
          description="Every step can be skipped by the student."
          actions={
            <AdminButton
              hierarchy="secondary"
              size="sm"
              onClick={() => {
                resetAsNewStudent(coach.slug)
                window.open(`/site/${coach.slug}/start`, "_blank")
              }}
            >
              <Eye /> Try it as a new student
            </AdminButton>
          }
        />
        <div className="divide-y divide-a-border-subtle">
          <SettingRow label="Ask to link Discord" text="One click; the role follows their tier">
            <Switch checked={s.discord} onCheckedChange={(v) => set({ discord: v })} />
          </SettingRow>
          <SettingRow label="Short tour" text="Three tips over the menu">
            <Switch checked={s.tour} onCheckedChange={(v) => set({ tour: v })} />
          </SettingRow>
          <SettingRow label="How students log in">
            <NativeSelect aria-label="How students log in" value={s.login} onChange={(e) => set({ login: e.target.value as OnboardingSettings["login"] })}>
              <option value="code">E-mail code</option>
              <option value="password">Password</option>
              <option value="both">Both, and Discord</option>
            </NativeSelect>
          </SettingRow>
        </div>
      </Panel>
    </SettingsPage>
  )
}

// ---------- ADM-50

function Tax() {
  const { coach } = useCoach()
  const [vat, setVat] = useCommunityData<"included" | "added">(coach.slug, "vat-mode", "included")
  return (
    <SettingsPage title="Invoices and VAT" text="What appears on the invoices students get.">
      <Panel>
        <PanelHeader title="On your invoices" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal name">
            <Input defaultValue={`${coach.name} GmbH`} />
          </Field>
          <Field label="VAT number">
            <Input defaultValue="DE 312 456 789" />
          </Field>
        </div>
        <Field label="Address">
          <Input defaultValue="Bahnhofstrasse 1, 8001 Zürich" />
        </Field>
        <Field label="Invoice number starts at">
          <Input defaultValue="NT-2026-0001" />
        </Field>
      </Panel>
      <Panel>
        <PanelHeader title="VAT" />
        <Segmented label="VAT" value={vat} onChange={setVat} options={[["included", "Prices include VAT"], ["added", "VAT is added at checkout"]] as const} />
        <p className="t-caption text-a-text-2">We work out the right rate for each student&apos;s country.</p>
      </Panel>
    </SettingsPage>
  )
}

// ---------- ADM-51

type Member = { name: string; initials: string; email: string; role: "Owner" | "Coach" | "Moderator"; can: string; invited?: string }

const TEAM_V2: Member[] = [
  { name: "Kairo Fernandes", initials: "KF", email: "kairo@kairofx.trading", role: "Owner", can: "Everything" },
  { name: "Ana Ribeiro", initials: "AR", email: "ana@kairofx.trading", role: "Coach", can: "Content, Journal, Livestreams" },
  { name: "Leo Martins", initials: "LM", email: "leo@kairofx.trading", role: "Moderator", can: "Community, Journal" },
  { name: "Rui Costa", initials: "RC", email: "rui@gmail.com", role: "Moderator", can: "Moderator", invited: "sent 2 d ago" },
]

const ROLE_OPTIONS = [
  ["Coach", "Edits content, answers the journal, goes live"],
  ["Moderator", "Keeps the community and journal in order"],
] as const

const MATRIX = [
  ["Coach", "Edit", "Edit", "View", "—"],
  ["Moderator", "View", "Edit", "—", "—"],
]

function Team() {
  const { coach } = useCoach()
  const [team, setTeam] = useCommunityData<Member[]>(coach.slug, "team-v2", TEAM_V2)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"Coach" | "Moderator">("Moderator")
  // The header's "Invite to the team" button asks this page to open the dialog.
  useEffect(() => {
    const onInvite = () => setOpen(true)
    document.addEventListener("settings:invite", onInvite)
    return () => document.removeEventListener("settings:invite", onInvite)
  }, [])
  const send = () => {
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    setTeam((t) => [...t, { name, initials: name.slice(0, 2).toUpperCase(), email, role, can: role, invited: "sent just now" }])
    setOpen(false)
    setEmail("")
    toast(`Invite sent to ${email}`)
  }
  return (
    <SettingsPage title="Team and roles" text={`People who help you run ${coach.name}.`}>
      <DataCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Can do</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.map((m) => (
            <TableRow key={m.email}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid">
                    <span className="t-body-m">{m.name}</span>
                    <span className="t-caption text-a-text-2">{m.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {m.invited ? (
                  <Tag tone="warning" dot>Invited</Tag>
                ) : m.role === "Owner" ? (
                  <Tag tone="accent" dot>Owner</Tag>
                ) : (
                  <Tag>{m.role}</Tag>
                )}
              </TableCell>
              <TableCell className="text-a-text-2">{m.invited ? `${m.can} · ${m.invited}` : m.can}</TableCell>
              <TableCell className="text-right">
                {m.role !== "Owner" && (
                  <RowMenu
                    label={`Options for ${m.name}`}
                    items={[
                      ...(m.invited ? [{ text: "Resend invite", onClick: () => toast(`Invite sent again to ${m.email}`) }] : []),
                      { text: m.role === "Coach" ? "Make moderator" : "Make coach", onClick: () => setTeam((t) => t.map((x) => (x.email === m.email ? { ...x, role: m.role === "Coach" ? "Moderator" : "Coach" } : x))) },
                      { text: "Remove", onClick: () => setTeam((t) => t.filter((x) => x.email !== m.email)) },
                    ]}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataCard>
      <Panel>
        <PanelHeader title="Roles" />
        <DataCard className="bg-a-field">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Role</TableHead>
              {["Content", "Students", "Sales", "Settings"].map((h) => (
                <TableHead key={h} className="text-right">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MATRIX.map(([r, ...cells]) => (
              <TableRow key={r}>
                <TableCell>{r}</TableCell>
                {cells.map((c, i) => (
                  <TableCell key={i} className="text-right text-a-text-2">
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </DataCard>
      </Panel>
      <AdminModal open={open} onOpenChange={setOpen} title="Invite to the team" subtitle="They get an e-mail with a link to join." footer={<><AdminButton hierarchy="ghost" onClick={() => setOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton disabled={!email.includes("@")} onClick={send}>
              Send invite
            </AdminButton></>}>
          
          <div className="grid gap-4">
            <Field label="E-mail">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rui@gmail.com" />
            </Field>
            <div role="radiogroup" aria-label="Role" className="grid gap-2">
              <span className="t-caption-medium">Role</span>
              {ROLE_OPTIONS.map(([r, text]) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => setRole(r)}
                  className={cn("flex items-center gap-3 rounded-a-md border px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", role === r ? "border-a-accent-strong bg-a-raised" : "border-a-border hover:bg-a-hover")}
                >
                  <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", role === r ? "border-a-accent-strong" : "border-a-border-strong")}>
                    {role === r && <span className="size-2 rounded-full bg-a-accent-strong" />}
                  </span>
                  <span className="grid">
                    <span className="t-body-m">{r}</span>
                    <span className="t-caption text-a-text-2">{text}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          
        
</AdminModal>
    </SettingsPage>
  )
}

// ---------- ADM-52

const INVOICES = [
  ["November 2026", "€99.00"],
  ["October 2026", "€99.00"],
]

function Plan() {
  return (
    <SettingsPage title="Your plan with us" text="What you pay Traderhub.">
      <Panel>
        <PanelHeader title="Plan" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <span className="t-heading-l">Pro</span>
            <span className="t-body-m text-a-text-2">€99 / month + 5% of sales · renews 1 Dec</span>
          </div>
          <AdminButton hierarchy="secondary" onClick={() => toast("Change plan", { description: "Upgrades start now; downgrades at the end of the month." })}>
            Change plan
          </AdminButton>
        </div>
        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          {[["Students", "189 / 500"], ["Storage", "42 / 100 GB"], ["Team", "4 / 5"]].map(([l, v]) => (
            <div key={l} className="grid gap-1">
              <span className="t-mono-label text-a-text-3">{l}</span>
              <span className="t-heading-xl">{v}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="gap-3">
        <PanelHeader title="Design packages" />
        <div className="flex items-center justify-between gap-3">
          <div className="grid">
            <span className="t-body-m">Pro template pack</span>
            <span className="t-caption text-a-text-2">3 extra templates for your site</span>
          </div>
          <Tag tone="success" dot>Active</Tag>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="grid">
            <span className="t-body-m">Custom design</span>
            <span className="t-caption text-a-text-2">We design your site with you · one-time</span>
          </div>
          <AdminButton hierarchy="secondary" size="sm" onClick={() => toast("Custom design requested", { description: "We'll book a short call to start." })}>
            Learn more
          </AdminButton>
        </div>
      </Panel>
      <DataCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Invoice from us</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVOICES.map(([d, amount]) => (
            <TableRow key={d}>
              <TableCell>{d}</TableCell>
              <TableCell className="text-right text-a-text-2 tabular-nums">{amount}</TableCell>
              <TableCell>
                <Tag tone="success" dot>Paid</Tag>
              </TableCell>
              <TableCell className="text-right">
                <AdminButton hierarchy="ghost" size="sm" onClick={() => toast("Invoice downloaded")}>
                  <Download /> Download
                </AdminButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataCard>
    </SettingsPage>
  )
}
