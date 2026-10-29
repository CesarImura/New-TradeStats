"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Copy, Eye, Globe, Loader2, Mail, Plus, Upload, Wand2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FIRST_WEEK, resetAsNewStudent, useOnboardingSettings, type FirstWeekItem, type OnboardingSettings } from "@/lib/data/student-start"
import { setStored } from "@/lib/prototype-store"
import { EMAIL_TEMPLATES, LEGAL, ROLES, TEAM } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, Mono, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"

const TABS = [
  ["general", "General"],
  ["domain", "Domain"],
  ["email", "E-mails"],
  ["legal", "Legal pages"],
  ["onboarding", "Student onboarding"],
  ["tax", "Tax & invoices"],
  ["team", "Team & roles"],
  ["plan", "Our subscription"],
] as const

/** ADM-45 to ADM-52. */
export function SettingsAdmin() {
  const tab = useSearchParams().get("tab") ?? "general"
  return (
    <Page>
      <PageHeader title="Settings" text="Your platform's name, address, e-mails, legal pages and team." guide="Your own domain · 2 min" />
      <Tabs defaultValue={tab} orientation="vertical" className="gap-6 max-md:flex-col!">
        <TabsList variant="line" className="h-fit shrink-0 items-stretch max-md:w-full max-md:flex-row! max-md:overflow-x-auto max-md:[scrollbar-width:none] md:w-48">
          {TABS.map(([id, label]) => (
            <TabsTrigger key={id} value={id} className="justify-start">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-w-0 flex-1">
          <TabsContent value="general">
            <General />
          </TabsContent>
          <TabsContent value="domain">
            <Domain />
          </TabsContent>
          <TabsContent value="email">
            <Emails />
          </TabsContent>
          <TabsContent value="legal">
            <Legal />
          </TabsContent>
          <TabsContent value="onboarding">
            <StudentOnboarding />
          </TabsContent>
          <TabsContent value="tax">
            <Tax />
          </TabsContent>
          <TabsContent value="team">
            <Team />
          </TabsContent>
          <TabsContent value="plan">
            <Plan />
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  )
}

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <div className="grid gap-0.5">
        <h2 className="font-medium">{title}</h2>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      {children}
    </section>
  )
}

// ---------- ADM-45

function General() {
  const { coach } = useCoach()
  return (
    <div className="grid gap-6">
      <Section title="General" text="Name and logo are in Design, so you see them while you change them.">
        <div className="divide-y rounded-lg border bg-card px-3">
          <SettingRow label="Language" text="For menus, e-mails and the AI">
            <NativeSelect defaultValue="en" aria-label="Language">
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
            </NativeSelect>
          </SettingRow>
          <SettingRow label="Time zone" text="Students see events in their own time zone">
            <NativeSelect defaultValue="zurich" aria-label="Time zone">
              <option value="zurich">Zürich (CET)</option>
              <option value="london">London (GMT)</option>
              <option value="ny">New York (EST)</option>
              <option value="dubai">Dubai (GST)</option>
            </NativeSelect>
          </SettingRow>
          <SettingRow label="Currency" text="For your prices">
            <NativeSelect defaultValue="eur" aria-label="Currency">
              <option value="eur">Euro (€)</option>
              <option value="chf">Swiss franc (CHF)</option>
              <option value="usd">US dollar ($)</option>
              <option value="gbp">Pound (£)</option>
            </NativeSelect>
          </SettingRow>
          <SettingRow label="Support e-mail" text="Where students' replies go">
            <Input aria-label="Support e-mail" defaultValue={`hello@${coach.slug}.com`} className="h-8 w-56" />
          </SettingRow>
        </div>
      </Section>
    </div>
  )
}

// ---------- ADM-46

function Domain() {
  const { coach } = useCoach()
  const [d, setD] = useCommunityData(coach.slug, "domain", { domain: "", step: 0 as 0 | 1 | 2 })
  const [value, setValue] = useState(d.domain || `academy.${coach.slug}.com`)
  const [checking, setChecking] = useState(false)

  return (
    <div className="grid gap-6">
      <Section title="Your web address">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Globe className="size-5 text-muted-foreground" />
          <div className="grid flex-1">
            <span className="font-medium">{d.step === 2 ? d.domain : `${coach.slug}.tradestats.app`}</span>
            <span className="text-xs text-muted-foreground">{d.step === 2 ? `${coach.slug}.tradestats.app forwards here` : "Free address. Works now, forever."}</span>
          </div>
          <Badge variant="secondary">Live</Badge>
        </div>
      </Section>

      {d.step === 0 && (
        <Section title="Use your own domain" text="Students see only your address, never ours. Takes about 10 minutes, mostly waiting.">
          <div className="flex gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value.toLowerCase())} placeholder="academy.yourname.com" />
            <Button onClick={() => setD({ domain: value, step: 1 })} disabled={!value.includes(".")}>
              Connect
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Tip: use a sub-address like academy.yourname.com, so your website keeps working.</p>
        </Section>
      )}

      {d.step === 1 && (
        <Section title={`Connect ${d.domain}`} text="Where you bought your domain (GoDaddy, Namecheap, Hostpoint…), add one entry. Copy these two values:">
          <div className="grid gap-2 rounded-lg border bg-card p-4 text-sm">
            {[
              ["Type", "CNAME"],
              ["Name", d.domain.split(".")[0]],
              ["Points to", "coaches.tradestats.app"],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center gap-3">
                <span className="w-24 text-muted-foreground">{l}</span>
                <code className="flex-1 font-mono">{v}</code>
                <Button variant="ghost" size="icon-xs" onClick={() => toast(`${v} copied`)} aria-label={`Copy ${l}`}>
                  <Copy />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
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
              {checking ? <Loader2 className="animate-spin" /> : <Check />} {checking ? "Checking…" : "I've added it, check now"}
            </Button>
            <Button variant="outline" onClick={() => toast("Booked", { description: "We connect it with you on a 10-minute call." })}>
              Do it for me
            </Button>
            <Button variant="ghost" onClick={() => setD({ domain: "", step: 0 })}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">We check every few minutes and send you an e-mail when it works. It can take up to an hour.</p>
        </Section>
      )}

      {d.step === 2 && (
        <Button variant="ghost" className="justify-self-start" onClick={() => setD({ domain: "", step: 0 })}>
          Remove {d.domain}
        </Button>
      )}
    </div>
  )
}

// ---------- ADM-47

function Emails() {
  const { coach } = useCoach()
  const [sel, setSel] = useState(EMAIL_TEMPLATES[1].id)
  const [edits, setEdits] = useCommunityData<Record<string, { subject: string; body: string }>>(coach.slug, "emails", {})
  const t = EMAIL_TEMPLATES.find((x) => x.id === sel)!
  const cur = edits[sel] ?? { subject: t.subject, body: t.body }
  const fill = (s: string) =>
    s
      .replaceAll("{platform}", coach.name)
      .replaceAll("{first}", "Alex")
      .replaceAll("{coach}", coach.coachName)
      .replaceAll("{link}", `${coach.slug}.tradestats.app/…`)
      .replaceAll("{lesson}", "Daily loss limits")
      .replaceAll("{code}", "482 913")
      .replaceAll("{amount}", "€149")
      .replaceAll("{date}", "15 Oct")
      .replaceAll("{event}", "Live trading · NY open")
      .replaceAll("{trade}", "NQ long")

  return (
    <div className="grid gap-6">
      <Section title="Sender" text="Students get e-mails from you, never from us.">
        <div className="divide-y rounded-lg border bg-card px-3">
          <SettingRow label="From name">
            <Input defaultValue={coach.coachName + " · " + coach.name} className="h-8 w-60" />
          </SettingRow>
          <SettingRow label="From address" text="Your own domain needs one more entry, like the web address">
            <Input defaultValue={`hello@${coach.slug}.com`} className="h-8 w-60" />
          </SettingRow>
        </div>
      </Section>
      <Section title="Every e-mail students get" text="In your design. Words in {curly brackets} fill in for each student.">
        <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
          <div className="grid content-start gap-0.5">
            {EMAIL_TEMPLATES.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={cn("flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted", sel === x.id && "bg-muted font-medium")}>
                <Mail className="size-3.5 text-muted-foreground" /> {x.name}
                {edits[x.id] && <span className="ml-auto size-1.5 rounded-full bg-[var(--ts-cta)]" />}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            <Field label="Subject">
              <Input value={cur.subject} onChange={(e) => setEdits((x) => ({ ...x, [sel]: { ...cur, subject: e.target.value } }))} />
            </Field>
            <Field label="Text">
              <Textarea rows={6} value={cur.body} onChange={(e) => setEdits((x) => ({ ...x, [sel]: { ...cur, body: e.target.value } }))} />
            </Field>
            <div className="grid gap-2 rounded-lg border bg-white p-5 text-[#111]">
              <Mono className="text-neutral-500">Preview</Mono>
              <span className="font-semibold">{fill(cur.subject)}</span>
              <p className="text-sm whitespace-pre-line text-neutral-700">{fill(cur.body)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast("Test e-mail sent to you")}>
                Send me a test
              </Button>
              {edits[sel] && (
                <Button variant="ghost" size="sm" onClick={() => setEdits((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== sel)))}>
                  Back to our text
                </Button>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ---------- ADM-48

function Legal() {
  const { coach } = useCoach()
  const [sel, setSel] = useState(LEGAL[0].id)
  const [texts, setTexts] = useCommunityData<Record<string, string>>(coach.slug, "legal", {})
  const page = LEGAL.find((l) => l.id === sel)!
  return (
    <Section title="Legal pages" text="Linked in the footer of your platform, the checkout and every e-mail.">
      <Tabs value={sel} onValueChange={setSel} className="gap-3">
        <TabsList>
          {LEGAL.map((l) => (
            <TabsTrigger key={l.id} value={l.id}>
              {l.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Textarea rows={12} value={texts[sel] ?? page.text} onChange={(e) => setTexts((x) => ({ ...x, [sel]: e.target.value }))} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => toast("Template filled in", { description: "From your company details. Check it with a lawyer." })}>
          <Wand2 /> Fill in from our template
        </Button>
        <span className="text-xs text-muted-foreground">We provide a starting text. You stay responsible for it.</span>
      </div>
    </Section>
  )
}

// ---------- ADM-49

function StudentOnboarding() {
  const { coach } = useCoach()
  const s = useOnboardingSettings(coach.slug)
  const setS = (fn: (x: OnboardingSettings) => OnboardingSettings) => setStored(`${coach.slug}:student-onboarding`, fn(s))
  const set = (p: Partial<OnboardingSettings>) => setS((x) => ({ ...x, ...p }))
  const items = (Object.keys(FIRST_WEEK) as FirstWeekItem[]).filter((id) => {
    const m = FIRST_WEEK[id].module
    return !m || coach.modules[m]
  })
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">Account → welcome → profile → Discord → tour → Home. Every step can be skipped.</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            resetAsNewStudent(coach.slug)
            window.open(`/site/${coach.slug}/start`, "_blank")
          }}
        >
          <Eye /> Try it as a new student
        </Button>
      </div>
      <Section title="Welcome" text="The first thing a new student sees, before Home.">
        <div className="grid gap-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid aspect-video w-36 place-items-center rounded-md bg-muted text-xs text-muted-foreground">{s.video ? "welcome.mp4 · 1:12" : "No video"}</span>
            <div className="grid flex-1 gap-1">
              <span className="text-sm font-medium">Your welcome video</span>
              <span className="text-xs text-muted-foreground">One minute is enough: who you are, what to do first.</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => set({ video: true })}>
                  <Upload /> {s.video ? "Replace" : "Upload"}
                </Button>
                {s.video && (
                  <Button variant="ghost" size="sm" onClick={() => set({ video: false })}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Field label="Personal message">
            <Textarea rows={3} value={s.message} onChange={(e) => set({ message: e.target.value })} />
          </Field>
        </div>
      </Section>
      <Section title="Short profile" text="Every question can be skipped by the student.">
        <div className="divide-y rounded-lg border bg-card px-3">
          {(
            [
              ["nickname", "Nickname and picture", "Used in the ranking and community"],
              ["experience", "How long they've traded", "Beginner, 1–3 years, more"],
              ["markets", "Markets they trade", "Futures, forex, stocks, crypto"],
              ["goal", "Their goal", "Pass a challenge, a second income, full-time"],
              ["broker", "Connect the broker now", "Otherwise only when they open the journal"],
            ] as const
          ).map(([id, label, text]) => (
            <SettingRow key={id} label={label} text={text}>
              <Switch checked={s.questions[id]} onCheckedChange={(v) => set({ questions: { ...s.questions, [id]: v } })} />
            </SettingRow>
          ))}
        </div>
      </Section>
      <Section title="After the profile">
        <div className="divide-y rounded-lg border bg-card px-3">
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
      </Section>
      <Section title="Home in the first week" text="New students see a Start here card and a short checklist on Home until they finish or close it.">
        <div className="divide-y rounded-lg border bg-card px-3">
          <SettingRow label="Start here card" text="First lesson, next live session, introduce yourself">
            <Switch checked={s.startHere} onCheckedChange={(v) => set({ startHere: v })} />
          </SettingRow>
          {items.map((id) => (
            <SettingRow key={id} label={FIRST_WEEK[id].label} text={FIRST_WEEK[id].text}>
              <Switch
                checked={s.firstWeek.includes(id)}
                onCheckedChange={(v) => set({ firstWeek: v ? items.filter((x) => x === id || s.firstWeek.includes(x)) : s.firstWeek.filter((x) => x !== id) })}
                aria-label={FIRST_WEEK[id].label}
              />
            </SettingRow>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ---------- ADM-50

function Tax() {
  const { coach } = useCoach()
  return (
    <div className="grid gap-6">
      <Section title="On your invoices" text="Students get an invoice with every payment, sent by e-mail and in their profile.">
        <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <Field label="Company name">
            <Input defaultValue={`${coach.org} GmbH`} />
          </Field>
          <Field label="VAT number" hint="Optional">
            <Input defaultValue="CHE-123.456.789 MWST" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input defaultValue="Bahnhofstrasse 1, 8001 Zürich, Switzerland" />
          </Field>
        </div>
      </Section>
      <Section title="VAT">
        <div className="divide-y rounded-lg border bg-card px-3">
          <SettingRow label="Prices include VAT" text="Students see one price; VAT is taken out of it">
            <Switch defaultChecked />
          </SettingRow>
          <SettingRow label="VAT is handled for you" text="Collected at checkout and paid in each student's country">
            <Badge variant="secondary">On</Badge>
          </SettingRow>
        </div>
      </Section>
    </div>
  )
}

// ---------- ADM-51

function Team() {
  const { coach } = useCoach()
  const [team, setTeam] = useCommunityData(coach.slug, "team", TEAM)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("coach")
  return (
    <div className="grid gap-6">
      <Section title="Team" text="Everyone who helps you run the platform. They see only what their role allows.">
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus /> Invite
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Students</TableHead>
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
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.role === "Owner" ? (
                      <Badge variant="secondary">Owner</Badge>
                    ) : (
                      <NativeSelect
                        aria-label={`Role of ${m.name}`}
                        value={ROLES.find((r) => r.name === m.role)?.id}
                        onChange={(e) => setTeam((t) => t.map((x) => (x.email === m.email ? { ...x, role: ROLES.find((r) => r.id === e.target.value)!.name } : x)))}
                      >
                        {ROLES.filter((r) => r.id !== "owner").map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.students}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
      <Section title="Roles">
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r.id} className="grid gap-0.5 rounded-lg border bg-card p-3">
              <span className="text-sm font-medium">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.text}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Assign students to an assistant coach from the student&apos;s profile.</p>
      </Section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to the team</DialogTitle>
            <DialogDescription>They get an e-mail and set up their own login.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="E-mail">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jana@yourname.com" />
            </Field>
            <Field label="Role">
              <NativeSelect aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.filter((r) => r.id !== "owner").map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.text}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <DialogFooter>
            <Button
              disabled={!email.includes("@")}
              onClick={() => {
                const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                setTeam((t) => [...t, { name, initials: name.slice(0, 2).toUpperCase(), email, role: ROLES.find((r) => r.id === role)!.name, students: "Invited" }])
                setOpen(false)
                setEmail("")
                toast(`Invite sent to ${email}`)
              }}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- ADM-52

const PLANS = [
  { id: "starter", name: "Starter", price: "€49", share: "8%", text: "Up to 100 students" },
  { id: "growth", name: "Growth", price: "€149", share: "5%", text: "Up to 1,000 students · your domain" },
  { id: "scale", name: "Scale", price: "€399", share: "3%", text: "Unlimited · setup by us included" },
]

function Plan() {
  return (
    <div className="grid gap-6">
      <Section title="Your plan with us">
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card key={p.id} size="sm" className={cn(p.id === "growth" && "ring-[var(--ts-cta)]/60")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name} {p.id === "growth" && <Badge>Your plan</Badge>}
                </CardTitle>
                <CardDescription>{p.text}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <span className="text-2xl tabular-nums">
                  {p.price}
                  <span className="text-sm text-muted-foreground"> / month + {p.share} of sales</span>
                </span>
                {p.id !== "growth" && (
                  <Button variant="outline" size="sm" onClick={() => toast(`Switch to ${p.name}`, { description: "Upgrades start now; downgrades at the end of the month." })}>
                    {p.id === "scale" ? "Upgrade" : "Downgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      <Section title="Design packages" text="Our designers build your own look on top of the settings. Booked here, delivered in Design.">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Brand polish", "€690", "Colours, fonts, Home and sales page from your brand"],
            ["Fully custom", "€2,400", "A design made for you, like WCE and TradeX"],
          ].map(([n, p, t]) => (
            <div key={n} className="flex items-start gap-3 rounded-lg border bg-card p-4">
              <Wand2 className="mt-0.5 size-4 text-[var(--ts-cta)]" />
              <div className="grid flex-1 gap-0.5">
                <span className="font-medium">
                  {n} · {p}
                </span>
                <span className="text-sm text-muted-foreground">{t}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast(`${n} requested`, { description: "We'll book a short call to start." })}>
                Book
              </Button>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Invoices from us">
        <div className="divide-y rounded-lg border bg-card px-3 text-sm">
          {["1 Oct 2026", "1 Sep 2026", "1 Aug 2026"].map((d) => (
            <div key={d} className="flex items-center justify-between py-2.5">
              <span>{d}</span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums">€149.00</span>
                <Button variant="ghost" size="sm" onClick={() => toast("Invoice downloaded")}>
                  PDF
                </Button>
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
